// Product Detail Manager
class ProductDetailManager {
    constructor() {
        this.productId = this.getProductIdFromUrl();
        this.currentProduct = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProductDetail();
    }

    getProductIdFromUrl() {
        const path = window.location.pathname;
        const matches = path.match(/\/admin\/products\/(\d+)/);
        return matches ? parseInt(matches[1]) : null;
    }

    setupEventListeners() {
        // Edit button
        const editBtn = document.getElementById('editProductBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editProduct());
        }

        // Toggle status button
        const toggleBtn = document.getElementById('toggleStatusBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleStatus());
        }

        // Delete button
        const deleteBtn = document.getElementById('deleteProductBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteProduct());
        }

        // Confirm delete
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
        }
    }

    async loadProductDetail() {
        if (!this.productId) {
            this.showError('Không tìm thấy ID sản phẩm');
            return;
        }

        try {
            this.showLoadingState();

            // Load product info and images in parallel
            const [productResponse, imagesResponse] = await Promise.all([
                fetch(`/admin/api/products/${this.productId}`),
                fetch(`/admin/api/products/${this.productId}/images`)
            ]);

            const productData = await productResponse.json();
            const imagesData = await imagesResponse.json();

            console.log('Product data:', productData);
            console.log('Images data:', imagesData);

            if (productData.result) {
                this.currentProduct = productData.result;
                // Add images to product data
                this.currentProduct.images = imagesData.result || [];
                console.log('Final product with images:', this.currentProduct);
                this.populateProductDetail(this.currentProduct);
            } else {
                this.showError('Không thể tải thông tin sản phẩm');
            }
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Lỗi khi tải thông tin sản phẩm');
        }
    }

    populateProductDetail(product) {
        // Basic information
        document.getElementById('productName').textContent = product.name || 'N/A';
        // Hiển thị mô tả dạng HTML an toàn (đã được hệ thống tạo ra)
        const descEl = document.getElementById('productDescription');
        if (descEl) {
            descEl.innerHTML = this.sanitizeMinimal(product.description || '');
        }
        document.getElementById('productPrice').textContent = this.formatCurrency(product.price);
        document.getElementById('productStock').textContent = `${product.stock || 0} sản phẩm`;

        // Category and brand
        document.getElementById('productCategory').textContent = product.categoryName || 'N/A';
        document.getElementById('productBrand').textContent = product.brandName || 'N/A';

        // Status
        document.getElementById('productStatus').innerHTML = this.renderStatus(product.isActive);

        // Dates
        document.getElementById('productCreatedDate').textContent = this.formatDate(product.createdDate);

        // Stock details
        document.getElementById('productStockDetail').textContent = `${product.stock || 0} sản phẩm`;
        document.getElementById('productSoldCount').textContent = product.soldCount || 0;
        document.getElementById('productAvailable').innerHTML = product.available ?
            '<span class="text-success">Có sẵn</span>' :
            '<span class="text-danger">Không có sẵn</span>';

        // Images
        this.renderProductImages(product.images || []);

        // Update action buttons based on status
        this.updateActionButtons(product.isActive);
    }

    // Sanitize tối thiểu: loại bỏ script và inline event handlers
    sanitizeMinimal(html) {
        if (!html) return '';
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        // Remove script/style tags
        wrapper.querySelectorAll('script, style').forEach(el => el.remove());
        // Remove on* attributes and javascript: links
        wrapper.querySelectorAll('*').forEach(el => {
            [...el.attributes].forEach(attr => {
                const name = attr.name.toLowerCase();
                const value = attr.value.toLowerCase();
                if (name.startsWith('on') || value.startsWith('javascript:')) {
                    el.removeAttribute(attr.name);
                }
            });
        });
        return wrapper.innerHTML;
    }

    renderProductImages(images) {
        const container = document.getElementById('productImages');

        if (!images || images.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="mdi mdi-image mdi-48px mb-3 text-muted"></i>
                    <p class="mb-0">Không có hình ảnh</p>
                    <small class="text-muted">Sản phẩm chưa có hình ảnh nào</small>
                </div>
            `;
            return;
        }

        // Show main image first, then others
        const mainImage = images.find(img => img.isMain) || images[0];
        const otherImages = images.filter(img => img !== mainImage);

        let html = `
            <div class="product-images-container">
                <!-- Main Image -->
                <div class="main-image mb-3 position-relative">
                    <img src="${mainImage.imageUrl}" 
                         class="img-fluid rounded shadow-sm" 
                         style="width: 100%; aspect-ratio: 4/3; object-fit: contain; cursor: pointer;"
                         alt="Hình ảnh chính"
                         onclick="this.style.transform = this.style.transform ? '' : 'scale(1.1)'; this.style.transition = 'transform 0.3s ease';"
                         onerror="this.src='https://placehold.co/300x300'">
                    ${mainImage.isMain ? '<div class="badge bg-primary position-absolute top-0 start-0 m-2">Chính</div>' : ''}
                </div>
        `;

        // Other images in grid
        if (otherImages.length > 0) {
            html += `
                <div class="other-images">
                    <h6 class="text-muted mb-2">Hình ảnh khác (${otherImages.length})</h6>
                    <div class="row g-2">
            `;

            otherImages.forEach((image, index) => {
                html += `
                    <div class="col-6">
                        <img src="${image.imageUrl}" 
                             class="img-fluid rounded" 
                             style="width: 100%; aspect-ratio: 1; object-fit: contain; cursor: pointer;"
                             alt="Hình ảnh ${index + 2}"
                             onclick="this.style.transform = this.style.transform ? '' : 'scale(1.1)'; this.style.transition = 'transform 0.3s ease';"
                             onerror="this.src='https://placehold.co/300x300'">
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
    }

    renderStatus(isActive) {
        return isActive
            ? '<span class="badge bg-success">Hoạt động</span>'
            : '<span class="badge bg-danger">Tạm dừng</span>';
    }

    updateActionButtons(isActive) {
        const toggleBtn = document.getElementById('toggleStatusBtn');

        if (toggleBtn) {
            if (isActive) {
                toggleBtn.innerHTML = '<i class="mdi mdi-pause"></i> Tạm dừng';
                toggleBtn.className = 'btn btn-warning';
            } else {
                toggleBtn.innerHTML = '<i class="mdi mdi-play"></i> Kích hoạt';
                toggleBtn.className = 'btn btn-success';
            }
        }
    }

    showLoadingState() {
        // Show loading for main content
        const elements = [
            'productName', 'productDescription', 'productPrice', 'productStock',
            'productCategory', 'productBrand', 'productStatus', 'productCreatedDate',
            'productStockDetail', 'productSoldCount', 'productAvailable'
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'Đang tải...';
            }
        });
    }

    editProduct() {
        if (this.productId) {
            window.location.href = `/admin/products/${this.productId}/edit`;
        }
    }

    async toggleStatus() {
        if (!this.productId) return;

        try {
            const response = await fetch(`/admin/api/products/${this.productId}/toggle-status`, {
                method: 'PUT'
            });

            if (response.ok) {
                this.showNotification('Cập nhật trạng thái thành công', 'success');
                // Reload product data
                this.loadProductDetail();
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            this.showNotification('Có lỗi xảy ra khi cập nhật trạng thái', 'error');
        }
    }

    deleteProduct() {
        // Show confirmation modal
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }

    async confirmDelete() {
        if (!this.productId) return;

        try {
            const response = await fetch(`/admin/api/products/${this.productId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Xóa sản phẩm thành công', 'success');
                // Redirect to products list after 2 seconds
                setTimeout(() => {
                    window.location.href = '/admin/products';
                }, 2000);
            } else {
                const error = await response.json();
                if (error.message && (error.message.includes('đã có lịch sử bán hàng') || error.message.includes('has been sold'))) {
                    this.showNotification(error.message || 'Không thể xóa sản phẩm đã có lịch sử bán hàng. Vui lòng tạm dừng sản phẩm thay vì xóa.', 'error');
                } else {
                    this.showNotification(error.message || 'Có lỗi xảy ra', 'error');
                }
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showNotification('Có lỗi xảy ra khi xóa sản phẩm', 'error');
        } finally {
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
        }
    }

    showError(message) {
        const container = document.getElementById('productImages');
        container.innerHTML = `
            <div class="text-center text-danger">
                <i class="mdi mdi-alert-circle mdi-48px mb-3"></i>
                <p>${message}</p>
            </div>
        `;
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productDetailManager = new ProductDetailManager();
});
