// Product Edit Page Manager
class ProductEditManager {
    constructor() {
        this.productId = this.getProductIdFromUrl();
        this.currentProduct = null;
        this.hasInvalidFiles = false;
        this.init();
        this.setupFormIntegration();
    }

    init() {
        this.setupEventListeners();
        this.setupAutoResize();
        this.loadProductData();
    }

    getProductIdFromUrl() {
        const path = window.location.pathname;
        const matches = path.match(/\/admin\/products\/(\d+)\/edit/);
        return matches ? matches[1] : null;
    }

    // Setup auto-resize for textarea
    setupAutoResize() {
        const descriptionTextarea = document.getElementById('description');

        if (descriptionTextarea) {
            // Auto-resize on input
            descriptionTextarea.addEventListener('input', () => {
                this.autoResizeTextarea(descriptionTextarea);
            });

            // Auto-resize on paste
            descriptionTextarea.addEventListener('paste', () => {
                setTimeout(() => {
                    this.autoResizeTextarea(descriptionTextarea);
                }, 10);
            });

            // Initial resize
            this.autoResizeTextarea(descriptionTextarea);
        }
    }

    // Auto-resize textarea function
    autoResizeTextarea(textarea) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';

        // Calculate new height based on content
        const newHeight = Math.min(textarea.scrollHeight, 300); // Max height 300px
        const minHeight = 100; // Min height 100px

        // Set the new height
        textarea.style.height = Math.max(newHeight, minHeight) + 'px';
    }

    setupEventListeners() {
        // Delete confirmation
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.confirmDelete());

        // Upload new images button
        document.getElementById('uploadNewImagesBtn').addEventListener('click', () => {
            this.uploadNewImages();
        });

        // Preview new images on file change
        document.getElementById('newImages').addEventListener('change', () => {
            this.previewNewImages();
        });
    }

    setupFormIntegration() {
        // Set edit mode for ProductFormManager
        if (window.productFormManager) {
            window.productFormManager.setEditMode(this.productId);
        }
    }
    // Load product data from API
    async loadProductData() {
        console.log('=== Starting loadProductData ===');
        console.log('Product ID:', this.productId);

        if (!this.productId) {
            this.showError('Không tìm thấy ID sản phẩm');
            return;
        }

        try {
            console.log('Fetching product data...');
            const response = await fetch(`/admin/api/products/${this.productId}`);
            const data = await response.json();
            console.log('Product edit data:', data);

            if (data.result) {
                console.log('Product data received, populating form...');
                this.currentProduct = data.result;
                this.populateForm(data.result);

                console.log('Form populated, loading images...');
                this.loadCurrentImages(data.result);

                console.log('Loading product info...');
                this.loadProductInfo(data.result);
                this.updateDeleteModal(data.result);

                console.log('=== loadProductData completed ===');
            } else {
                this.showError('Không thể tải thông tin sản phẩm');
            }
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Lỗi khi tải thông tin sản phẩm');
        }
    }

    // Populate form with product data
    populateForm(product) {
        console.log('Populating form with product:', product); // Debug log

        // Basic info - với null check
        const nameEl = document.getElementById('name');
        if (nameEl) nameEl.value = product.name || '';

        const descEl = document.getElementById('description');
        if (window.productDescriptionEditor && typeof window.productDescriptionEditor.setData === 'function') {
            try {
                window.productDescriptionEditor.setData(product.description || '');
            } catch (e) {
                if (descEl) descEl.value = product.description || '';
            }
        } else {
            if (descEl) descEl.value = product.description || '';
        }

        const priceEl = document.getElementById('price');
        if (priceEl) priceEl.value = product.price || '';

        const stockEl = document.getElementById('stock');
        if (stockEl) stockEl.value = product.stock || 0;

        const soldCountEl = document.getElementById('soldCount');
        if (soldCountEl) soldCountEl.value = product.soldCount || 0;

        // Status checkboxes
        const isActiveEl = document.getElementById('isActive');
        if (isActiveEl) isActiveEl.checked = product.isActive || false;

        const availableEl = document.getElementById('available');
        if (availableEl) availableEl.checked = product.available || false;

        // Load categories and brands, then set values
        this.loadCategoriesAndBrands().then(() => {
            const categoryEl = document.getElementById('categoryId');
            if (categoryEl) categoryEl.value = product.categoryId || '';

            const brandEl = document.getElementById('brandId');
            if (brandEl) brandEl.value = product.brandId || '';
        });
    }

    // Load categories and brands for dropdowns
    async loadCategoriesAndBrands() {
        try {
            // Load categories
            const categoriesResponse = await fetch('/admin/api/categories/all');
            const categoriesData = await categoriesResponse.json();

            if (categoriesData.result) {
                const categorySelect = document.getElementById('categoryId');
                categorySelect.innerHTML = '<option value="">Chọn danh mục</option>';

                categoriesData.result.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.categoryId;
                    // Hiển thị rõ ràng nếu category inactive
                    option.textContent = category.name + (category.isActive === false ? ' (Tạm dừng)' : '');
                    option.style.color = category.isActive === false ? '#999' : '';
                    categorySelect.appendChild(option);
                });
            }

            // Load brands
            const brandsResponse = await fetch('/admin/api/brands/all');
            const brandsData = await brandsResponse.json();

            if (brandsData.result) {
                const brandSelect = document.getElementById('brandId');
                brandSelect.innerHTML = '<option value="">Chọn thương hiệu</option>';

                brandsData.result.forEach(brand => {
                    const option = document.createElement('option');
                    option.value = brand.brandId;
                    // Hiển thị rõ ràng nếu brand inactive
                    option.textContent = brand.name + (brand.isActive === false ? ' (Tạm dừng)' : '');
                    option.style.color = brand.isActive === false ? '#999' : '';
                    brandSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading categories/brands:', error);
        }
    }


    // Load current images with management features
    async loadCurrentImages(product) {
        const container = document.getElementById('currentImages');

        if (!container) {
            console.log('currentImages container not found');
            return;
        }

        // Reset container trước
        container.innerHTML = '';
        container.style.overflow = 'auto';
        container.style.maxHeight = '400px';

        try {
            const response = await fetch(`/admin/api/products/${this.productId}/images`);
            const data = await response.json();

            if (data.result && data.result.length > 0) {
                let imagesHTML = '<div class="row g-2">';
                data.result.forEach((image, index) => {
                    imagesHTML += `
                        <div class="col-6">
                            <div class="image-item position-relative">
                                <img src="${image.imageUrl}" alt="Product image" 
                                    class="img-thumbnail" style="width: 100%; height: 120px; object-fit: contain;">
                                
                                <!-- Image actions -->
                                <div class="image-actions position-absolute top-0 end-0 p-1">
                                    ${image.isMain ?
                            '<span class="badge bg-primary">Chính</span>' :
                            '<button class="btn btn-sm btn-outline-primary" onclick="window.productEditManager.setAsMain(' + image.imageId + ')">Đặt làm chính</button>'
                        }
                                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="window.productEditManager.deleteImage(${image.imageId})">
                                        <i class="mdi mdi-delete"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                imagesHTML += '</div>';
                container.innerHTML = imagesHTML;
            } else {
                container.innerHTML = '<p class="text-muted">Chưa có hình ảnh</p>';
            }
        } catch (error) {
            console.error('Error loading images:', error);
            container.innerHTML = '<p class="text-danger">Lỗi khi tải hình ảnh</p>';
        }
    }

    // Set image as main
    async setAsMain(imageId) {
        try {
            const response = await fetch(`/admin/api/products/${this.productId}/images/${imageId}/set-main`, {
                method: 'PUT'
            });

            if (response.ok) {
                this.showNotification('Đặt làm ảnh chính thành công', 'success');
                this.loadCurrentImages(); // Reload images
            } else {
                this.showNotification('Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error setting main image:', error);
            this.showNotification('Có lỗi xảy ra', 'error');
        }
    }

    // Delete image
    async deleteImage(imageId) {
        // Use custom confirm dialog
        if (window.notificationManager) {
            window.notificationManager.showConfirm(
                'Bạn có chắc chắn muốn xóa hình ảnh này?',
                () => this.confirmDeleteImage(imageId),
                () => console.log('Delete image cancelled')
            );
        } else {
            // Fallback to native confirm
            if (!confirm('Bạn có chắc chắn muốn xóa hình ảnh này?')) {
                return;
            }
            this.confirmDeleteImage(imageId);
        }
    }

    async confirmDeleteImage(imageId) {

        try {
            const response = await fetch(`/admin/api/products/${this.productId}/images/${imageId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Xóa hình ảnh thành công', 'success');
                this.loadCurrentImages(); // Reload images
            } else {
                this.showNotification('Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            this.showNotification('Có lỗi xảy ra', 'error');
        }
    }

    // Upload new images function
    async uploadNewImages() {
        const fileInput = document.getElementById('newImages');
        const files = fileInput.files;

        if (!files || files.length === 0) {
            this.showNotification('Vui lòng chọn hình ảnh', 'warning');
            return;
        }

        // Validate files before processing
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        for (let file of files) {
            // Check file size
            if (file.size > maxSize) {
                this.showNotification(`File quá lớn: ${file.name}. Kích thước tối đa là 5MB.`, 'error');
                fileInput.value = ''; // Clear input
                this.hasInvalidFiles = true;
                return;
            }
            
            // Check file type
            if (!allowedTypes.includes(file.type)) {
                this.showNotification(`Loại file không hợp lệ: ${file.name}. Chỉ được chọn file ảnh (JPG, PNG, GIF, WebP).`, 'error');
                fileInput.value = ''; // Clear input
                this.hasInvalidFiles = true;
                return;
            }
        }

        // If we reach here, all files are valid
        this.hasInvalidFiles = false;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        formData.append('productId', this.productId);

        try {
            const response = await fetch('/admin/api/upload/products', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.result) {
                this.showNotification('Upload hình ảnh thành công', 'success');
                this.loadCurrentImages(); // Reload current images
                fileInput.value = ''; // Clear file input
                this.clearImagePreview(); // Clear preview
            } else {
                this.showNotification('Có lỗi xảy ra khi upload', 'error');
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            this.showNotification('Có lỗi xảy ra khi upload', 'error');
        }
    }
    // Clear image preview
    clearImagePreview() {
        const preview = document.getElementById('newImagePreview');
        preview.innerHTML = '<p class="text-muted">Chọn hình ảnh mới để xem trước</p>';
    }

    // Preview new images
    previewNewImages() {
        const fileInput = document.getElementById('newImages');
        const files = fileInput.files;
        const preview = document.getElementById('newImagePreview');

        if (!files || files.length === 0) {
            preview.innerHTML = '<p class="text-muted">Chọn hình ảnh mới để xem trước</p>';
            return;
        }

        let html = '<div class="row">';
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = function (e) {
                html += `
                    <div class="col-md-4 mb-2">
                        <img src="${e.target.result}" class="img-fluid rounded" style="aspect-ratio: 4/3; object-fit: cover;">
                    </div>
                `;
                preview.innerHTML = html + '</div>';
            };

            reader.readAsDataURL(file);
        }
    }

    // Load product info
    loadProductInfo(product) {
        const container = document.getElementById('productInfo');
        container.innerHTML = `
            <p><strong>Ngày tạo:</strong> ${this.formatDate(product.createdDate)}</p>
            <p><strong>Cập nhật lần cuối:</strong> ${this.formatDate(product.updatedDate)}</p>
            <p><strong>Đã bán:</strong> ${product.soldCount || 0}</p>
            <p><strong>Đánh giá:</strong> ${product.averageRating || 0}/5</p>
        `;
    }

    // Update delete product name in modal
    updateDeleteModal(product) {
        const deleteProductName = document.getElementById('deleteProductName');
        if (deleteProductName) {
            deleteProductName.textContent = product.name || 'Tên sản phẩm';
        }
    }

    // Confirm delete
    async confirmDelete() {
        if (!this.productId) return;

        try {
            const response = await fetch(`/admin/api/products/${this.productId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
                this.showSuccess('Xóa sản phẩm thành công!');
                // Redirect to products list
                setTimeout(() => {
                    window.location.href = '/admin/products';
                }, 1000);
            } else {
                if (result.message && result.message.includes('has been sold')) {
                    this.showError('Không thể xóa sản phẩm đã có đơn hàng. Vui lòng tạm dừng sản phẩm thay vì xóa.');
                } else {
                    this.showError(result.message || 'Có lỗi xảy ra khi xóa');
                }
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showError('Không thể xóa sản phẩm');
        }
    }

    // Utility functions
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

    showError(message) {
        // Use global notification manager
        if (window.notificationManager) {
            window.notificationManager.showError(message);
        } else {
            // Fallback to alert if notification manager not loaded
            alert('❌ ' + message);
        }
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

    showNotification(message, type) {
        // Use global notification manager
        if (window.notificationManager) {
            window.notificationManager.showNotification(message, type);
        } else {
            // Fallback to alert if notification manager not loaded
            if (type === 'success') {
                alert('✅ ' + message);
            } else if (type === 'error') {
                alert('❌ ' + message);
            } else if (type === 'warning') {
                alert('⚠️ ' + message);
            }
        }
    }
    // Update product timestamp
    async updateProductTimestamp() {
        try {
            const response = await fetch(`/admin/api/products/${this.productId}/update-timestamp`, {
                method: 'PUT'
            });

            if (response.ok) {
                // Reload product info to show updated timestamp
                this.loadProductInfo(this.currentProduct);
            }
        } catch (error) {
            console.error('Error updating timestamp:', error);
        }
    }

    refreshProduct() {
        console.log('Refreshing product data...');
        this.loadProductData();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productEditManager = new ProductEditManager();
});