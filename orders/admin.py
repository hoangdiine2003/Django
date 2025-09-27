from django.contrib import admin
from .models import CustomerSegment, ProductCategory, Product, Customer, Order, OrderItem


@admin.register(CustomerSegment)
class CustomerSegmentAdmin(admin.ModelAdmin):
    list_display = ['code', 'description']
    search_fields = ['code', 'description']


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ['code', 'name']
    search_fields = ['code', 'name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'category', 'import_price']
    list_filter = ['category']
    search_fields = ['code', 'name']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'segment']
    list_filter = ['segment']
    search_fields = ['code', 'name']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['total_amount']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['code', 'customer', 'created_at', 'get_total_amount']
    list_filter = ['created_at', 'customer__segment']
    search_fields = ['code', 'customer__name']
    inlines = [OrderItemInline]
    
    def get_total_amount(self, obj):
        return obj.get_total_amount()
    get_total_amount.short_description = 'Tổng tiền'


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'unit_price', 'total_amount']
    list_filter = ['order__created_at', 'product__category']
    search_fields = ['order__code', 'product__name']