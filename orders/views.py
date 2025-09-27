from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Sum, Count
from django.db.models.functions import ExtractMonth, TruncDate, TruncHour
from django.conf import settings
from .models import OrderItem, Product, ProductCategory, Order
import json


def dashboard(request):
    """Dashboard mới: chỉ render template chứa các tab Q1..Q12, dữ liệu lấy qua JS."""
    return render(request, 'dashboard.html', {
        'static_version': getattr(settings, 'STATIC_VERSION', '1')
    })


def api_data(request):
    """API cung cấp dữ liệu cho Q1 (sản phẩm) và Q2 (nhóm hàng)."""
    q = request.GET.get('q')
    if q == 'Q1':
        # Doanh số bán hàng theo mặt hàng (descending)
        items = (OrderItem.objects
                 .values('product__code', 'product__name', 'product__category__name')
                 .annotate(total_revenue=Sum('total_amount'), total_quantity=Sum('quantity'))
                 .order_by('-total_revenue'))
        data = [
            {
                'product_code': it['product__code'],
                'product_name': it['product__name'],
                'category_name': it['product__category__name'],
                'total_revenue': float(it['total_revenue'] or 0),
                'total_quantity': it['total_quantity'] or 0
            } for it in items
        ]
    elif q == 'Q2':
        # Doanh số theo nhóm hàng (descending)
        cats = (ProductCategory.objects
                .values('name')
                .annotate(total_revenue=Sum('product__orderitem__total_amount'),
                          total_quantity=Sum('product__orderitem__quantity'))
                .order_by('-total_revenue'))
        data = [
            {
                'category_name': c['name'],
                'total_revenue': float(c['total_revenue'] or 0),
                'total_quantity': c['total_quantity'] or 0
            } for c in cats if c['total_revenue']
        ]
    elif q == 'Q3':
        # Doanh số theo tháng (descending theo doanh thu)
        monthly = (OrderItem.objects
                   .annotate(month=ExtractMonth('order__created_at'))
                   .values('month')
                   .annotate(total_revenue=Sum('total_amount'), total_quantity=Sum('quantity'))
                   .filter(month__isnull=False))

        # Sắp xếp theo doanh thu giảm dần như yêu cầu phân tích
        monthly = sorted(monthly, key=lambda m: m['total_revenue'] or 0, reverse=True)

        data = []
        for record in monthly:
            month = record['month'] or 0
            data.append({
                'month': month,
                'month_label': f"T{month:02d}" if month else 'N/A',
                'total_revenue': float(record['total_revenue'] or 0),
                'total_quantity': record['total_quantity'] or 0
            })
    elif q == 'Q4':
        # Doanh số trung bình theo ngày trong tuần
        weekday_data = (OrderItem.objects
                        .annotate(order_date=TruncDate('order__created_at'))
                        .values('order_date')
                        .annotate(total_revenue=Sum('total_amount'), total_quantity=Sum('quantity'))
                        .order_by('order_date'))

        aggregates = {}
        for record in weekday_data:
            order_date = record['order_date']
            if not order_date:
                continue
            weekday = order_date.weekday()
            agg = aggregates.setdefault(weekday, {
                'weekday': weekday,
                'total_revenue': 0,
                'total_quantity': 0,
                'count': 0,
            })
            agg['total_revenue'] += float(record['total_revenue'] or 0)
            agg['total_quantity'] += record['total_quantity'] or 0
            agg['count'] += 1

        weekday_labels = {
            0: 'Thứ 2',
            1: 'Thứ 3',
            2: 'Thứ 4',
            3: 'Thứ 5',
            4: 'Thứ 6',
            5: 'Thứ 7',
            6: 'Chủ nhật',
        }

        data = []
        for weekday in range(7):
            agg = aggregates.get(weekday)
            if not agg or agg['count'] == 0:
                continue
            count = agg['count']
            data.append({
                'weekday': weekday,
                'weekday_label': weekday_labels.get(weekday, str(weekday)),
                'avg_revenue': agg['total_revenue'] / count,
                'avg_quantity': agg['total_quantity'] / count,
                'days_sampled': count,
            })

        data.sort(key=lambda x: x['weekday'])
    elif q == 'Q5':
        # Doanh số trung bình theo ngày trong tháng
        daily_data = (OrderItem.objects
                      .annotate(order_date=TruncDate('order__created_at'))
                      .values('order_date')
                      .annotate(total_revenue=Sum('total_amount'), total_quantity=Sum('quantity'))
                      .filter(order_date__isnull=False)
                      .order_by('order_date'))

        day_stats = {}
        for record in daily_data:
            order_date = record['order_date']
            if not order_date:
                continue
            day = order_date.day
            agg = day_stats.setdefault(day, {
                'day': day,
                'total_revenue': 0,
                'total_quantity': 0,
                'count': 0,
            })
            agg['total_revenue'] += float(record['total_revenue'] or 0)
            agg['total_quantity'] += record['total_quantity'] or 0
            agg['count'] += 1

        data = []
        for day in sorted(day_stats.keys()):
            stat = day_stats[day]
            if stat['count'] == 0:
                continue
            count = stat['count']
            data.append({
                'day': day,
                'day_label': f"Ngày {day:02d}",
                'avg_revenue': stat['total_revenue'] / count,
                'avg_quantity': stat['total_quantity'] / count,
                'days_sampled': count,
            })
    elif q == 'Q6':
        hourly_data = (OrderItem.objects
                       .annotate(order_hour=TruncHour('order__created_at'))
                       .values('order_hour')
                       .annotate(total_revenue=Sum('total_amount'), total_quantity=Sum('quantity'))
                       .filter(order_hour__isnull=False)
                       .order_by('order_hour'))

        hourly_stats = {}
        for record in hourly_data:
            order_hour = record['order_hour']
            if not order_hour:
                continue
            hour = order_hour.hour
            agg = hourly_stats.setdefault(hour, {
                'hour': hour,
                'total_revenue': 0,
                'total_quantity': 0,
                'count': 0,
            })
            agg['total_revenue'] += float(record['total_revenue'] or 0)
            agg['total_quantity'] += record['total_quantity'] or 0
            agg['count'] += 1

        data = []
        for hour in sorted(hourly_stats.keys()):
            stat = hourly_stats[hour]
            if stat['count'] == 0:
                continue
            count = stat['count']
            data.append({
                'hour': hour,
                'hour_label': f"{hour:02d}:00-{hour:02d}:59",
                'avg_revenue': stat['total_revenue'] / count,
                'avg_quantity': stat['total_quantity'] / count,
                'slots_sampled': count,
            })
    elif q == 'Q7':
        total_orders = Order.objects.count()
        categories = (ProductCategory.objects
                      .annotate(unique_orders=Count('product__orderitem__order', distinct=True))
                      .order_by('name'))

        data = []
        for category in categories:
            orders_count = category.unique_orders or 0
            probability = (orders_count / total_orders * 100) if total_orders else 0
            data.append({
                'category_name': category.name,
                'order_count': orders_count,
                'probability': probability,
            })

        data.sort(key=lambda c: c['probability'], reverse=True)

    elif q == 'Q8':
        monthly_totals = (Order.objects
                          .annotate(month=ExtractMonth('created_at'))
                          .values('month')
                          .annotate(total_orders=Count('id', distinct=True))
                          .filter(month__isnull=False))

        totals_by_month = {entry['month']: entry['total_orders'] or 0 for entry in monthly_totals}

        category_month = (OrderItem.objects
                          .annotate(month=ExtractMonth('order__created_at'))
                          .values('month', 'product__category__name')
                          .annotate(order_count=Count('order_id', distinct=True))
                          .filter(month__isnull=False, product__category__name__isnull=False))

        data = []
        for entry in category_month:
            month = entry['month']
            category_name = entry['product__category__name']
            total_orders = totals_by_month.get(month, 0)
            order_count = entry['order_count'] or 0
            probability = (order_count / total_orders * 100) if total_orders else 0
            data.append({
                'month': month,
                'month_label': f"T{int(month):02d}" if month else 'N/A',
                'category_name': category_name,
                'order_count': order_count,
                'total_orders': total_orders,
                'probability': probability,
            })

        data.sort(key=lambda record: (record['month'], record['category_name']))


    elif q == 'Q9':
        category_totals = (OrderItem.objects
                           .values('product__category__id', 'product__category__name')
                           .annotate(total_orders=Count('order_id', distinct=True))
                           .filter(product__category__id__isnull=False))

        totals_by_category = {entry['product__category__id']: entry['total_orders'] or 0
                              for entry in category_totals}

        product_orders = (OrderItem.objects
                          .values('product__category__id', 'product__category__name',
                                  'product__id', 'product__code', 'product__name')
                          .annotate(order_count=Count('order_id', distinct=True))
                          .filter(product__category__id__isnull=False,
                                  product__id__isnull=False)
                          .order_by('product__category__name', 'product__name'))

        data = []
        for item in product_orders:
            category_id = item['product__category__id']
            total_orders = totals_by_category.get(category_id, 0)
            order_count = item['order_count'] or 0
            probability = (order_count / total_orders * 100) if total_orders else 0
            data.append({
                'category_id': category_id,
                'category_name': item['product__category__name'] or 'Khong xac dinh',
                'product_id': item['product__id'],
                'product_code': item['product__code'],
                'product_name': item['product__name'],
                'order_count': order_count,
                'total_orders': total_orders,
                'probability': probability,
            })

        data.sort(key=lambda record: ((record['category_name'] or ''), record['probability']))


    elif q == 'Q10':
        category_totals = (OrderItem.objects
                           .annotate(month=ExtractMonth('order__created_at'))
                           .values('month', 'product__category__id', 'product__category__name')
                           .annotate(total_orders=Count('order_id', distinct=True))
                           .filter(month__isnull=False,
                                   product__category__id__isnull=False))

        totals_by_key = {
            (entry['month'], entry['product__category__id']): entry['total_orders'] or 0
            for entry in category_totals
        }

        product_orders = (OrderItem.objects
                          .annotate(month=ExtractMonth('order__created_at'))
                          .values('month', 'product__category__id', 'product__category__name',
                                  'product__id', 'product__code', 'product__name')
                          .annotate(order_count=Count('order_id', distinct=True))
                          .filter(month__isnull=False,
                                  product__category__id__isnull=False,
                                  product__id__isnull=False)
                          .order_by('product__category__name', 'product__name', 'month'))

        data = []
        for item in product_orders:
            month = item['month']
            category_id = item['product__category__id']
            key = (month, category_id)
            total_orders = totals_by_key.get(key, 0)
            order_count = item['order_count'] or 0
            probability = (order_count / total_orders * 100) if total_orders else 0
            data.append({
                'month': month,
                'month_label': f"T{int(month):02d}" if month else 'N/A',
                'category_id': category_id,
                'category_name': item['product__category__name'] or 'Khong xac dinh',
                'product_id': item['product__id'],
                'product_code': item['product__code'],
                'product_name': item['product__name'],
                'order_count': order_count,
                'total_orders': total_orders,
                'probability': probability,
            })

        data.sort(key=lambda record: ((record['category_name'] or ''), record['month'] or 0, -record['probability']))


    elif q == 'Q11':
        customers = (Order.objects
                     .values('customer_id')
                     .annotate(order_count=Count('id', distinct=True))
                     .filter(customer_id__isnull=False))

        distribution = {}
        total_customers = 0
        for entry in customers:
            order_count = entry['order_count'] or 0
            if order_count <= 0:
                continue
            distribution[order_count] = distribution.get(order_count, 0) + 1
            total_customers += 1

        if total_customers == 0:
            data = []
        else:
            min_count = min(distribution.keys())
            max_count = max(distribution.keys())
            cumulative = 0
            data = []
            for purchase_count in range(min_count, max_count + 1):
                freq = distribution.get(purchase_count, 0)
                cumulative += freq
                share = (freq / total_customers * 100) if total_customers else 0
                cumulative_share = (cumulative / total_customers * 100) if total_customers else 0
                data.append({
                    'purchase_count': purchase_count,
                    'customer_count': freq,
                    'total_customers': total_customers,
                    'share': share,
                    'cumulative_share': cumulative_share,
                })

    elif q == 'Q12':
        customer_totals = (OrderItem.objects
                           .values('order__customer__id', 'order__customer__code', 'order__customer__name')
                           .annotate(total_spent=Sum('total_amount'))
                           .filter(order__customer__id__isnull=False))

        data = []
        for entry in customer_totals:
            total_spent = float(entry['total_spent'] or 0)
            data.append({
                'customer_id': entry['order__customer__id'],
                'customer_code': entry['order__customer__code'] or '',
                'customer_name': entry['order__customer__name'] or 'Khong xac dinh',
                'total_spent': total_spent,
            })

        data.sort(key=lambda record: record['total_spent'], reverse=True)

    else:
        data = {'error': 'Invalid or missing q param (expected Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11 or Q12)'}
    return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})

