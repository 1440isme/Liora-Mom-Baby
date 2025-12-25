// Product Modal Manager
class ProductModalManager {
    constructor() {
        this.currentProductId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Quick edit save button
        document.getElementById('saveQuickEditBtn').addEventListener('click', () => this.saveQuickEdit());
        
        // Delete button
        document.getElementById('deleteProductBtn').addEventListener('click', () => this.deleteProduct());
    }

    // Show product detail modal
    async showProductModal(productId) {
        this.currentProductId = productId;
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Load product data via AJAX
            const response = await fetch(`/admin/api/products/${productId}`);
            const data = await response.json();
            
            if (data.result) {
                this.populateProductModal(data.result);
                // Show modal
                new bootstrap.Modal(document.getElementById('productModal')).show();
            } else {
                this.showError('Không thể tải thông tin sản phẩm');
            }
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Lỗi khi tải thông tin sản phẩm');
        }
    }

    // Show quick edit modal
    async showQuickEditModal(productId) {
        this.currentProductId = productId;
        
        try {
            // Load product data for quick edit
            const response = await fetch(`/admin/api/products/${productId}`);
            const data = await response.json();
            
            if (data.result) {
                this.populateQuickEditForm(data.result);
                // Show modal
                new bootstrap.Modal(document.getElementById('quickEditModal')).show();
            } else {
                this.showError('Không thể tải thông tin sản phẩm');
            }
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Lỗi khi tải thông tin sản phẩm');
        }
    }

    // Populate product detail modal
    populateProductModal(product) {
        document.getElementById('productName').textContent = product.name;
        document.getElementById('productPrice').textContent = this.formatCurrency(product.price);
        document.getElementById('productCategory').textContent = product.categoryName || 'N/A';
        document.getElementById('productBrand').textContent = product.brandName || 'N/A';
        document.getElementById('productStock').textContent = product.stock || 0;
        document.getElementById('productSoldCount').textContent = product.soldCount || 0;
        document.getElementById('productRating').textContent = `${product.averageRating || 0}/5`;
        document.getElementById('productCreatedDate').textContent = this.formatDate(product.createdDate);
        document.getElementById('productUpdatedDate').textContent = this.formatDate(product.updatedDate);
        document.getElementById('productDescription').textContent = product.description || 'Không có mô tả';
        
        // Status
        document.getElementById('productStatus').textContent = product.isActive ? 'Hoạt động' : 'Ngừng hoạt động';
        document.getElementById('productAvailable').textContent = product.available ? 'Có' : 'Không';

        // Set edit button href
        document.getElementById('editProductBtn').href = `/admin/products/${product.productId}/edit`;
    }

    // Populate quick edit form
    populateQuickEditForm(product) {
        document.getElementById('quickEditProductId').value = product.productId;
        document.getElementById('quickEditName').value = product.name;
        document.getElementById('quickEditPrice').value = product.price;
        document.getElementById('quickEditStock').value = product.stock;
        document.getElementById('quickEditAvailable').checked = product.available;
        document.getElementById('quickEditIsActive').checked = product.isActive;
    }

    // Save quick edit
    async saveQuickEdit() {
        const productId = document.getElementById('quickEditProductId').value;
        const formData = {
            name: document.getElementById('quickEditName').value,
            price: parseFloat(document.getElementById('quickEditPrice').value),
            stock: parseInt(document.getElementById('quickEditStock').value),
            available: document.getElementById('quickEditAvailable').checked,
            isActive: document.getElementById('quickEditIsActive').checked
        };

        try {
            const response = await fetch(`/admin/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.result) {
                // Close modal and reload page
                bootstrap.Modal.getInstance(document.getElementById('quickEditModal')).hide();
                this.showSuccess('Cập nhật sản phẩm thành công!');
                // Reload page to refresh data
                setTimeout(() => location.reload(), 1000);
            } else {
                this.showError(result.message || 'Có lỗi xảy ra khi cập nhật');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            this.showError('Không thể cập nhật sản phẩm');
        }
    }

    // Delete product
    async deleteProduct() {
        if (!this.currentProductId) return;
        
        // Use custom confirm dialog
        if (window.notificationManager) {
            window.notificationManager.showConfirm(
                'Bạn có chắc chắn muốn xóa sản phẩm này?',
                () => this.confirmDelete(),
                () => console.log('Delete cancelled')
            );
        } else {
            // Fallback to native confirm
            if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
                return;
            }
            this.confirmDelete();
        }
    }

    async confirmDelete() {

        try {
            const response = await fetch(`/admin/api/products/${this.currentProductId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                // Close modal and reload page
                bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
                this.showSuccess('Xóa sản phẩm thành công!');
                // Reload page to refresh data
                setTimeout(() => location.reload(), 1000);
            } else {
                if (result.message && (result.message.includes('đã có lịch sử bán hàng') || result.message.includes('has been sold'))) {
                    this.showError(result.message || 'Không thể xóa sản phẩm đã có lịch sử bán hàng. Vui lòng tạm dừng sản phẩm thay vì xóa.');
                } else {
                    this.showError(result.message || 'Có lỗi xảy ra khi xóa');
                }
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showError('Không thể xóa sản phẩm');
        }
    }

    // Show loading state
    showLoadingState() {
        const loadingTexts = [
            'productName', 'productPrice', 'productCategory', 'productBrand',
            'productStatus', 'productStock', 'productAvailable', 'productSoldCount',
            'productRating', 'productCreatedDate', 'productUpdatedDate', 'productDescription'
        ];
        
        loadingTexts.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'Đang tải...';
            }
        });
    }

    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    }

    showSuccess(message) {
        // Use global notification manager
        if (window.notificationManager) {
            window.notificationManager.showSuccess(message);
        } else {
            // Fallback to alert if notification manager not loaded
            alert('✅ ' + message);
        }
    }

    showError(message) {
        // Use global notification manager
        if (window.notificationManager) {
            window.notificationManager.showError(message);
        } else {
            // Fallback to alert if notification manager not loaded
            alert('❌ ' + message);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productModalManager = new ProductModalManager();
});

// Global functions for external use
function showProductModal(productId) {
    if (window.productModalManager) {
        window.productModalManager.showProductModal(productId);
    }
}

function showQuickEditModal(productId) {
    if (window.productModalManager) {
        window.productModalManager.showQuickEditModal(productId);
    }
}