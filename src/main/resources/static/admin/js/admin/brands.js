/**
 * Brands Management
 * Handles brand CRUD operations and UI interactions
 */

class BrandsManager {
    constructor() {
        this.ajax = window.adminAjax;
        this.currentPage = 0;
        this.currentSize = 12;
        this.currentFilters = {
            search: '',
            status: '',
            sortBy: 'name'
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadBrands();
    }

    bindEvents() {
        // Form submission
        const brandForm = document.getElementById('brandForm');
        if (brandForm) {
            brandForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // File upload preview
        const logoFile = document.getElementById('logoFile');
        if (logoFile) {
            logoFile.addEventListener('change', this.handleLogoPreview.bind(this));
        }

        // Remove logo
        const removeLogoBtn = document.getElementById('removeLogo');
        if (removeLogoBtn) {
            removeLogoBtn.addEventListener('click', this.handleRemoveLogo.bind(this));
        }

        // Delete buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="delete-brand"]')) {
                this.handleDelete(e.target.dataset.brandId, e.target.dataset.brandName);
            }
        });

        // Search input với debounce
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 500));
        }

        // Status filter
        const statusFilter = document.getElementById('status');
        if (statusFilter) {
            statusFilter.addEventListener('change', this.handleStatusFilter.bind(this));
        }

        // Sort options
        const sortSelect = document.getElementById('sortBy');
        if (sortSelect) {
            sortSelect.addEventListener('change', this.handleSort.bind(this));
        }

        // Toggle status buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="toggle-status"]')) {
                this.handleToggleStatus(e.target.dataset.brandId, e.target.dataset.currentStatus);
            }
        });

        // Refresh button
        const refreshBtn = document.querySelector('[onclick="location.reload()"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetFilters();
            });
        }

        // Export Excel button
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => this.exportToExcel());
        }
    }

    async loadBrands(page = 0, size = 12) {
        try {
            const params = {
                page: page,
                size: size,
                ...this.currentFilters
            };

            const response = await this.ajax.get('/brands', params);
            this.brands = response.result.content; // Cache brands for export
            this.renderBrands(this.brands);
            this.updatePagination(response.result);
        } catch (error) {
            console.error('Error loading brands:', error);
            this.showNotification('Không thể tải danh sách thương hiệu', 'error');
        }
    }

    renderBrands(brands) {
        const container = document.querySelector('.brands-container');
        if (!container) return;

        if (brands.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="mdi mdi-seal-variant mdi-48px mb-3"></i>
                    <p>Chưa có thương hiệu nào</p>
                    <a href="/admin/brands/add" class="btn btn-primary text-white">Thêm thương hiệu đầu tiên</a>
                </div>
            `;
            return;
        }

        const html = brands.map(brand => this.createBrandCard(brand)).join('');
        container.innerHTML = html;
    }

    createBrandCard(brand) {
        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card h-100 brand-card">
                    <div class="card-body text-center">
                        <!-- Brand Logo -->
                        <div class="mb-3">
                            <img src="${brand.logoUrl || 'https://placehold.co/300x300'}" 
                                 alt="${brand.name}" 
                                 class="img-fluid rounded-circle" 
                                 style="width: 60px; height: 60px; object-fit: cover; border: 2px solid #e9ecef;">
                        </div>

                        <!-- Brand Name -->
                        <h5 class="card-title">${brand.name}</h5>

                        <!-- Brand Status -->
                        <div class="mb-3">
                            <span class="badge ${brand.isActive ? 'bg-success' : 'bg-secondary'}">
                                ${brand.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                            </span>
                        </div>

                        <!-- Actions -->
                        <div class="btn-group w-100" role="group">
                            <a href="/admin/brands/${brand.brandId}/edit" 
                               class="btn btn-sm btn-outline-warning" 
                               title="Chỉnh sửa">
                                <i class="mdi mdi-pencil-outline"></i>
                            </a>
                            <button type="button" 
                                    class="btn btn-sm ${brand.isActive ? 'btn-outline-warning' : 'btn-outline-success'}" 
                                    data-action="toggle-status"
                                    data-brand-id="${brand.brandId}"
                                    data-current-status="${brand.isActive}"
                                    title="${brand.isActive ? 'Ngừng hoạt động' : 'Kích hoạt'}">
                                <i class="mdi ${brand.isActive ? 'mdi-pause' : 'mdi-play'}"></i>
                            </button>
                            <button type="button" 
                                    class="btn btn-sm btn-outline-danger" 
                                    data-action="delete-brand"
                                    data-brand-id="${brand.brandId}"
                                    data-brand-name="${brand.name}"
                                    title="Xóa">
                                <i class="mdi mdi-delete-outline"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);

        // Upload logo first if file is selected
        let logoUrl = null;
        const logoFile = document.getElementById('logoFile');
        if (logoFile && logoFile.files.length > 0) {
            try {
                logoUrl = await this.uploadLogo(logoFile.files[0]);
            } catch (error) {
                console.error('Error uploading logo:', error);
                this.showNotification('Lỗi khi upload logo', 'error');
                return;
            }
        }

        // Prepare data
        const data = {
            name: formData.get('name'),
            isActive: formData.has('isActive'),
            logoUrl: logoUrl
        };

        try {
            const isEdit = form.dataset.brandId;
            let response;

            if (isEdit) {
                response = await this.ajax.put(`/brands/${isEdit}`, data);
                this.showNotification('Cập nhật thương hiệu thành công', 'success');
            } else {
                response = await this.ajax.post('/brands', data);
                this.showNotification('Thêm thương hiệu thành công', 'success');
            }

            // Redirect to list page
            setTimeout(() => {
                window.location.href = '/admin/brands';
            }, 1500);

        } catch (error) {
            console.error('Error saving brand:', error);
            this.showNotification('Có lỗi xảy ra khi lưu thương hiệu', 'error');
        }
    }

    async handleDelete(brandId, brandName) {
        if (!confirm(`Bạn có chắc chắn muốn xóa thương hiệu "${brandName}"?`)) {
            return;
        }

        try {
            await this.ajax.delete(`/brands/${brandId}`);
            this.showNotification('Xóa thương hiệu thành công', 'success');
            this.loadBrands(); // Reload the list
        } catch (error) {
            console.error('Error deleting brand:', error);
            this.showNotification('Có lỗi xảy ra khi xóa thương hiệu', 'error');
        }
    }

    async handleToggleStatus(brandId, currentStatus) {
        const isActive = currentStatus === 'true';
        const action = isActive ? 'deactivate' : 'activate';

        try {
            await this.ajax.put(`/brands/${brandId}/${action}`);
            this.showNotification(
                isActive ? 'Ngừng hoạt động thương hiệu thành công' : 'Kích hoạt thương hiệu thành công',
                'success'
            );
            this.loadBrands(); // Reload the list
        } catch (error) {
            console.error('Error toggling brand status:', error);
            this.showNotification('Có lỗi xảy ra khi thay đổi trạng thái thương hiệu', 'error');
        }
    }

    async handleSearch(e) {
        const query = e.target.value.trim();
        this.currentFilters.search = query;
        this.currentPage = 0; // Reset về trang đầu
        await this.loadBrands(this.currentPage, this.currentSize);
    }

    async handleStatusFilter(e) {
        const status = e.target.value;
        this.currentFilters.status = status;
        this.currentPage = 0; // Reset về trang đầu
        await this.loadBrands(this.currentPage, this.currentSize);
    }

    async handleSort(e) {
        const sortBy = e.target.value;
        this.currentFilters.sortBy = sortBy;
        this.currentPage = 0; // Reset về trang đầu
        await this.loadBrands(this.currentPage, this.currentSize);
    }

    resetFilters() {
        // Reset form values
        document.getElementById('search').value = '';
        document.getElementById('status').value = '';
        document.getElementById('sortBy').value = 'name';

        // Reset filters
        this.currentFilters = {
            search: '',
            status: '',
            sortBy: 'name'
        };
        this.currentPage = 0;

        // Reload data
        this.loadBrands();
    }

    updatePagination(pageInfo) {
        const paginationContainer = document.querySelector('#pagination');
        if (!paginationContainer || pageInfo.totalPages <= 1) {
            return;
        }

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${pageInfo.number === 0 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${pageInfo.number - 1}">
                    <i class="mdi mdi-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(0, pageInfo.number - 2);
        const endPage = Math.min(pageInfo.totalPages - 1, pageInfo.number + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === pageInfo.number ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${pageInfo.number === pageInfo.totalPages - 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${pageInfo.number + 1}">
                    <i class="mdi mdi-chevron-right"></i>
                </a>
            </li>
        `;

        paginationContainer.innerHTML = paginationHTML;

        // Bind pagination events
        paginationContainer.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.matches('.page-link')) {
                const page = parseInt(e.target.dataset.page);
                if (page >= 0 && page < pageInfo.totalPages) {
                    this.currentPage = page;
                    this.loadBrands(page, this.currentSize);
                }
            }
        });

        // Update pagination info
        const infoContainer = document.querySelector('.text-muted');
        if (infoContainer) {
            const start = pageInfo.number * pageInfo.size + 1;
            const end = Math.min((pageInfo.number + 1) * pageInfo.size, pageInfo.totalElements);
            infoContainer.innerHTML = `
                Hiển thị ${start} đến ${end} trong tổng số ${pageInfo.totalElements} thương hiệu
            `;
        }
    }

    showNotification(message, type = 'info') {
        // Tạo toast container nếu chưa có
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // Tạo toast ID unique
        const toastId = 'toast-' + Date.now();

        // Tạo toast HTML (KHÔNG CÓ ICON)
        const toastHtml = `
        <div id="${toastId}" class="toast admin-toast admin-toast-${type} show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">
                    ${type === 'success' ? 'Thành công!' :
                type === 'error' ? 'Lỗi!' :
                    type === 'warning' ? 'Cảnh báo!' : 'Thông báo'}
                </strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close">&times;</button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

        // Thêm toast vào container
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        // Auto remove sau 4 giây
        setTimeout(() => {
            const toast = document.getElementById(toastId);
            if (toast) {
                toast.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 4000);

        // Close button event
        const closeBtn = document.querySelector(`#${toastId} .btn-close`);
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const toast = document.getElementById(toastId);
                if (toast) {
                    toast.style.animation = 'slideOutRight 0.3s ease-in';
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 300);
                }
            });
        }
    }

    async uploadLogo(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log('Starting upload for file:', file.name, 'Size:', file.size, 'Type:', file.type);

            const response = await fetch('/admin/api/upload/brands', {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload failed:', response.status, errorText);
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('Upload response:', result);

            // Kiểm tra cấu trúc response và xử lý lỗi
            if (result && result.result && result.result.originalUrl) {
                return result.result.originalUrl;
            } else if (result && result.originalUrl) {
                return result.originalUrl;
            } else {
                console.error('Unexpected response structure:', result);
                throw new Error('Unexpected response structure from upload API');
            }
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    handleLogoPreview(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showNotification('Chỉ được chọn file ảnh', 'error');
                e.target.value = '';
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showNotification('File quá lớn, tối đa 5MB', 'error');
                e.target.value = '';
                return;
            }

            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('logoPreview');
                const previewImage = document.getElementById('previewImage');
                previewImage.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    handleRemoveLogo() {
        const logoFile = document.getElementById('logoFile');
        const preview = document.getElementById('logoPreview');

        logoFile.value = '';
        preview.style.display = 'none';
    }

    async exportToExcel() {
        try {
            // Load all brands without pagination
            const response = await this.ajax.get('/brands', { page: 0, size: 1000 });
            const allBrands = response.result.content;
            
            if (!allBrands || allBrands.length === 0) {
                this.showNotification('Không có dữ liệu để xuất Excel', 'warning');
                return;
            }

            // Create CSV content
            let csv = '\uFEFF'; // UTF-8 BOM for proper encoding in Excel
            csv += 'ID,Tên thương hiệu,Mã thương hiệu,Trạng thái\n';

            // Use API data instead of DOM
            allBrands.forEach(brand => {
                const id = brand.brandId || '';
                const name = (brand.name || '').replace(/"/g, '""'); // Escape quotes
                const slug = brand.slug || '';
                const status = brand.isActive ? 'Hoạt động' : 'Ngừng hoạt động';
                csv += `${id},"${name}",${slug},"${status}"\n`;
            });

            // Create blob and download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            link.setAttribute('href', url);
            link.setAttribute('download', `brands_${dateStr}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification('Xuất Excel thành công', 'success');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.showNotification('Có lỗi xảy ra khi xuất Excel: ' + error.message, 'error');
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.brands-page') || document.querySelector('#brandForm')) {
        new BrandsManager();

        // Load brand data if on edit page
        const path = window.location.pathname;
        if (path.includes('/edit')) {
            loadBrandForEdit();
        }
    }
});

async function loadBrandForEdit() {
    try {
        // Extract brand ID from URL
        const pathParts = window.location.pathname.split('/');
        const brandId = pathParts[pathParts.length - 2]; // /admin/brands/1/edit -> 1

        const response = await fetch(`/admin/api/brands/${brandId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const brand = data.result;

            // Populate form
            document.getElementById('name').value = brand.name;
            document.getElementById('isActive').checked = brand.isActive;

            // Set form as edit mode
            document.getElementById('brandForm').dataset.brandId = brand.brandId;
        }
    } catch (error) {
        console.error('Error loading brand data:', error);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrandsManager;
}