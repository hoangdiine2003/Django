import csv
import os
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from .models import CustomerSegment, ProductCategory, Product, Customer, Order, OrderItem


def import_csv_data(csv_filename):
    """
    Import dữ liệu từ file CSV vào database
    """
    csv_path = os.path.join(settings.BASE_DIR, csv_filename)
    
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"File {csv_filename} không tồn tại")
    
    imported_count = 0
    
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            try:
                # Bỏ qua dòng trống hoặc không đầy đủ dữ liệu
                if not row.get('Mã đơn hàng') or not row.get('Thời gian tạo đơn'):
                    continue
                    
                # Tạo hoặc lấy Customer Segment
                segment, _ = CustomerSegment.objects.get_or_create(
                    code=row['Mã PKKH'],
                    defaults={
                        'description': row['Mô tả Phân Khúc Khách hàng']
                    }
                )
                
                # Tạo hoặc lấy Product Category
                category, _ = ProductCategory.objects.get_or_create(
                    code=row['Mã nhóm hàng'],
                    defaults={
                        'name': row['Tên nhóm hàng']
                    }
                )
                
                # Tạo hoặc lấy Product
                try:
                    import_price = int(float(row['Giá Nhập']) if row['Giá Nhập'] else 0)
                except (ValueError, TypeError):
                    import_price = 0
                    
                product, _ = Product.objects.get_or_create(
                    code=row['Mã mặt hàng'],
                    defaults={
                        'name': row['Tên mặt hàng'],
                        'category': category,
                        'import_price': import_price
                    }
                )
                
                # Tạo hoặc lấy Customer
                customer, _ = Customer.objects.get_or_create(
                    code=row['Mã khách hàng'],
                    defaults={
                        'name': row['Tên khách hàng'],
                        'segment': segment
                    }
                )
                
                # Parse thời gian và chuyển đổi sang timezone-aware
                naive_datetime = datetime.strptime(row['Thời gian tạo đơn'], '%Y-%m-%d %H:%M:%S')
                created_at = timezone.make_aware(naive_datetime)
                
                # Tạo hoặc lấy Order
                order, _ = Order.objects.get_or_create(
                    code=row['Mã đơn hàng'],
                    defaults={
                        'customer': customer,
                        'created_at': created_at
                    }
                )
                
                # Parse các giá trị số an toàn
                try:
                    quantity = int(float(row['SL']) if row['SL'] else 1)
                    unit_price = int(float(row['Đơn giá']) if row['Đơn giá'] else 0)
                    total_amount = int(float(row['Thành tiền']) if row['Thành tiền'] else 0)
                except (ValueError, TypeError):
                    quantity = 1
                    unit_price = 0
                    total_amount = 0
                
                # Tạo OrderItem (có thể có nhiều item cùng order)
                order_item, created = OrderItem.objects.get_or_create(
                    order=order,
                    product=product,
                    defaults={
                        'quantity': quantity,
                        'unit_price': unit_price,
                        'total_amount': total_amount
                    }
                )
                
                if created:
                    imported_count += 1
                    
            except Exception as e:
                print(f"Lỗi khi import dòng: {row}, Error: {str(e)}")
                continue
    
    return imported_count


def export_data_to_json():
    """
    Export dữ liệu từ database ra JSON format
    """
    from django.db.models import Sum, Count
    
    # Dữ liệu tổng hợp
    data = {
        'orders': [],
        'customers': [],
        'products': [],
        'statistics': {}
    }
    
    # Orders với chi tiết
    orders = Order.objects.select_related('customer').prefetch_related('orderitem_set__product').all()
    for order in orders:
        order_data = {
            'code': order.code,
            'customer': {
                'code': order.customer.code,
                'name': order.customer.name,
                'segment': order.customer.segment.code
            },
            'created_at': order.created_at.isoformat(),
            'items': [],
            'total': float(order.get_total_amount())
        }
        
        for item in order.orderitem_set.all():
            order_data['items'].append({
                'product_code': item.product.code,
                'product_name': item.product.name,
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'total_amount': float(item.total_amount)
            })
        
        data['orders'].append(order_data)
    
    # Customers
    customers = Customer.objects.select_related('segment').all()
    for customer in customers:
        data['customers'].append({
            'code': customer.code,
            'name': customer.name,
            'segment': {
                'code': customer.segment.code,
                'description': customer.segment.description
            }
        })
    
    # Products
    products = Product.objects.select_related('category').all()
    for product in products:
        data['products'].append({
            'code': product.code,
            'name': product.name,
            'category': {
                'code': product.category.code,
                'name': product.category.name
            },
            'import_price': float(product.import_price)
        })
    
    # Statistics
    data['statistics'] = {
        'total_orders': Order.objects.count(),
        'total_customers': Customer.objects.count(),
        'total_products': Product.objects.count(),
        'total_revenue': float(OrderItem.objects.aggregate(total=Sum('total_amount'))['total'] or 0),
        'segments_count': CustomerSegment.objects.count(),
        'categories_count': ProductCategory.objects.count(),
    }
    
    return data