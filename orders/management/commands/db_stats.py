from django.core.management.base import BaseCommand
from django.db import models
from orders.models import Order, OrderItem, Customer, Product, CustomerSegment, ProductCategory


class Command(BaseCommand):
    help = 'Display database statistics'

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('=== DATABASE STATISTICS ===')
        )
        
        # Thống kê cơ bản
        total_orders = Order.objects.count()
        total_customers = Customer.objects.count()
        total_products = Product.objects.count()
        total_segments = CustomerSegment.objects.count()
        total_categories = ProductCategory.objects.count()
        total_order_items = OrderItem.objects.count()
        
        self.stdout.write(f'Total Orders: {total_orders}')
        self.stdout.write(f'Total Customers: {total_customers}')
        self.stdout.write(f'Total Products: {total_products}')
        self.stdout.write(f'Total Customer Segments: {total_segments}')
        self.stdout.write(f'Total Product Categories: {total_categories}')
        self.stdout.write(f'Total Order Items: {total_order_items}')
        
        # Thống kê doanh thu
        from django.db.models import Sum, Avg, Max, Min
        revenue_stats = OrderItem.objects.aggregate(
            total_revenue=Sum('total_amount'),
            avg_order_value=Avg('total_amount'),
            max_order_value=Max('total_amount'),
            min_order_value=Min('total_amount')
        )
        
        self.stdout.write('\n=== REVENUE STATISTICS ===')
        self.stdout.write(f'Total Revenue: {revenue_stats["total_revenue"]:,.0f} VNĐ')
        self.stdout.write(f'Average Order Value: {revenue_stats["avg_order_value"]:,.0f} VNĐ')
        self.stdout.write(f'Max Order Value: {revenue_stats["max_order_value"]:,.0f} VNĐ')
        self.stdout.write(f'Min Order Value: {revenue_stats["min_order_value"]:,.0f} VNĐ')
        
        # Top customer segments
        self.stdout.write('\n=== TOP CUSTOMER SEGMENTS ===')
        segments = Customer.objects.values('segment__code', 'segment__description').annotate(
            count=models.Count('id')
        ).order_by('-count')[:5]
        
        for segment in segments:
            self.stdout.write(f'{segment["segment__code"]}: {segment["count"]} customers')
        
        # Top product categories
        self.stdout.write('\n=== TOP PRODUCT CATEGORIES ===')
        categories = ProductCategory.objects.values('name').annotate(
            total_revenue=Sum('product__orderitem__total_amount')
        ).order_by('-total_revenue')[:5]
        
        for category in categories:
            if category['total_revenue']:
                self.stdout.write(f'{category["name"]}: {category["total_revenue"]:,.0f} VNĐ')