from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class CustomerSegment(models.Model):
    """Phân khúc khách hàng - để tránh nhập mô tả dài nhiều lần"""
    code = models.CharField(max_length=10, unique=True, verbose_name="Mã PKKH")
    description = models.TextField(verbose_name="Mô tả Phân Khúc Khách hàng")
    
    class Meta:
        verbose_name = "Phân khúc khách hàng"
        verbose_name_plural = "Phân khúc khách hàng"
    
    def __str__(self):
        return f"{self.code} - {self.description[:50]}..."


class ProductCategory(models.Model):
    """Nhóm hàng - để tránh nhập tên nhóm nhiều lần"""
    code = models.CharField(max_length=10, unique=True, verbose_name="Mã nhóm hàng")
    name = models.CharField(max_length=100, verbose_name="Tên nhóm hàng")
    
    class Meta:
        verbose_name = "Nhóm hàng"
        verbose_name_plural = "Nhóm hàng"
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Product(models.Model):
    """Sản phẩm - lưu thông tin cơ bản về sản phẩm"""
    code = models.CharField(max_length=20, unique=True, verbose_name="Mã mặt hàng")
    name = models.CharField(max_length=200, verbose_name="Tên mặt hàng")
    category = models.ForeignKey(ProductCategory, on_delete=models.CASCADE, verbose_name="Nhóm hàng")
    import_price = models.DecimalField(max_digits=15, decimal_places=0, verbose_name="Giá Nhập")
    
    class Meta:
        verbose_name = "Sản phẩm"
        verbose_name_plural = "Sản phẩm"
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Customer(models.Model):
    """Khách hàng - lưu thông tin khách hàng"""
    code = models.CharField(max_length=20, unique=True, verbose_name="Mã khách hàng")
    name = models.CharField(max_length=200, verbose_name="Tên khách hàng")
    segment = models.ForeignKey(CustomerSegment, on_delete=models.CASCADE, verbose_name="Phân khúc")
    
    class Meta:
        verbose_name = "Khách hàng"
        verbose_name_plural = "Khách hàng"
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Order(models.Model):
    """Đơn hàng - thông tin header của đơn hàng"""
    code = models.CharField(max_length=20, unique=True, verbose_name="Mã đơn hàng")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, verbose_name="Khách hàng")
    created_at = models.DateTimeField(verbose_name="Thời gian tạo đơn")
    
    class Meta:
        verbose_name = "Đơn hàng"
        verbose_name_plural = "Đơn hàng"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.customer.name}"
    
    def get_total_amount(self):
        """Tính tổng tiền đơn hàng"""
        return sum(item.total_amount for item in self.orderitem_set.all())


class OrderItem(models.Model):
    """Chi tiết đơn hàng - từng dòng sản phẩm trong đơn hàng"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, verbose_name="Đơn hàng")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name="Sản phẩm")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)], verbose_name="Số lượng")
    unit_price = models.DecimalField(max_digits=15, decimal_places=0, verbose_name="Đơn giá")
    total_amount = models.DecimalField(max_digits=15, decimal_places=0, verbose_name="Thành tiền")
    
    class Meta:
        verbose_name = "Chi tiết đơn hàng"
        verbose_name_plural = "Chi tiết đơn hàng"
        unique_together = ['order', 'product']  # Mỗi sản phẩm chỉ có 1 dòng trong 1 đơn hàng
    
    def __str__(self):
        return f"{self.order.code} - {self.product.name}"
    
    def save(self, *args, **kwargs):
        """Tự động tính thành tiền khi lưu"""
        self.total_amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)