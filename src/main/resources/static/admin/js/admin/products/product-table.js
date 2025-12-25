// Product Table Manager
class ProductTableManager {
    constructor() {
        this.currentPage = 0;
        this.pageSize = 10;
        this.totalPages = 0;
        this.totalElements = 0;
        this.currentProductId = null;
        this.searchParams = {
            search: '',
            category: '',
            brand: '',
            status: '',
            sortBy: 'createdDate',
            sortDir: 'desc'
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCategoriesAndBrands();
        this.loadProducts();
    }

    setupEventListeners() {
        // Delete confirmation
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
        }

        // Export Excel button
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => this.exportToExcel());
        }

        // Search and filter events
        this.setupSearchAndFilter();
    }

    setupSearchAndFilter() {
        // Search input
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.searchParams.search = searchInput.value;
                this.currentPage = 0;
                this.loadProducts();
            }, 500));
        }

        // Category filter
        const categoryFilter = document.getElementById('category');
        if (categoryFilter) {
            console.log('Category filter found:', categoryFilter);
            categoryFilter.addEventListener('change', () => {
                console.log('Category changed to:', categoryFilter.value);
                this.searchParams.category = categoryFilter.value;
                this.currentPage = 0;
                this.loadProducts();
            });
        }

        // Brand filter
        const brandFilter = document.getElementById('brand');
        if (brandFilter) {
            console.log('Brand filter found:', brandFilter);
            brandFilter.addEventListener('change', () => {
                console.log('Brand changed to:', brandFilter.value);
                this.searchParams.brand = brandFilter.value;
                this.currentPage = 0;
                this.loadProducts();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('status');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                const statusValue = statusFilter.value;
                if (statusValue === 'ACTIVE') {
                    this.searchParams.status = 'active';
                } else if (statusValue === 'INACTIVE') {
                    this.searchParams.status = 'inactive';
                } else {
                    this.searchParams.status = '';
                }
                this.currentPage = 0;
                this.loadProducts();
            });
        }

        // Stock status filter
        const stockStatusFilter = document.getElementById('stockStatus');
        if (stockStatusFilter) {
            console.log('Stock status filter found:', stockStatusFilter);
            stockStatusFilter.addEventListener('change', () => {
                const stockStatusValue = stockStatusFilter.value;
                console.log('Stock status changed to:', stockStatusValue);
                this.searchParams.stockStatus = stockStatusValue;
                this.currentPage = 0;
                this.loadProducts();
            });
        } else {
            console.log('Stock status filter NOT found');
        }

        // Date filter - handled by inline script in HTML
        // But we need to update searchParams when form submits
        const filterForm = document.querySelector('form[action="/admin/products"]');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(filterForm);
                const dateFilter = formData.get('dateFilter');
                const startDate = formData.get('startDate');
                const endDate = formData.get('endDate');
                
                // Update search params
                if (dateFilter && dateFilter !== '') {
                    this.searchParams.dateFilter = dateFilter;
                } else {
                    delete this.searchParams.dateFilter;
                }
                
                if (startDate) {
                    this.searchParams.startDate = startDate;
                } else {
                    delete this.searchParams.startDate;
                }
                
                if (endDate) {
                    this.searchParams.endDate = endDate;
                } else {
                    delete this.searchParams.endDate;
                }
                
                this.currentPage = 0;
                this.loadProducts();
            });
        }
    }

    // Load products from API
    async loadProducts() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                size: this.pageSize,
                search: this.searchParams.search,
                brandId: this.searchParams.brand,      // Đổi từ 'brand' thành 'brandId'
                categoryId: this.searchParams.category, // Đổi từ 'category' thành 'categoryId'
                status: this.searchParams.status,
                stockStatus: this.searchParams.stockStatus
            });
            
            // Add date filter params
            if (this.searchParams.dateFilter) {
                params.append('dateFilter', this.searchParams.dateFilter);
            }
            if (this.searchParams.startDate) {
                params.append('startDate', this.searchParams.startDate);
            }
            if (this.searchParams.endDate) {
                params.append('endDate', this.searchParams.endDate);
            }

            console.log('Loading products with params:', params.toString());
            console.log('Search params:', this.searchParams);

            const response = await fetch(`/admin/api/products?${params}`);
            const data = await response.json();

            console.log('API response:', data);

            if (data.result) {
                this.renderProducts(data.result.content);
                this.updatePagination(data.result);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification('Không thể tải danh sách sản phẩm', 'error');
        }
    }

    async loadCategoriesAndBrands() {
        try {
            // Load categories
            const categoriesResponse = await fetch('/admin/api/categories/all');
            const categoriesData = await categoriesResponse.json();

            if (categoriesData.result) {
                const categorySelect = document.getElementById('category');
                categorySelect.innerHTML = '<option value="">Tất cả danh mục</option>';

                categoriesData.result.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.categoryId;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }

            // Load brands
            const brandsResponse = await fetch('/admin/api/brands/all');
            const brandsData = await brandsResponse.json();

            if (brandsData.result) {
                const brandSelect = document.getElementById('brand');
                brandSelect.innerHTML = '<option value="">Tất cả thương hiệu</option>';

                brandsData.result.forEach(brand => {
                    const option = document.createElement('option');
                    option.value = brand.brandId;
                    option.textContent = brand.name;
                    brandSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading categories/brands:', error);
        }
    }

    // Render products table
    renderProducts(products) {
        const tbody = document.getElementById('productsTableBody');

        if (!products || products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="text-center text-muted py-4">
                        <i class="mdi mdi-package-variant mdi-48px mb-3"></i>
                        <p>Không có sản phẩm nào</p>
                        <a href="/admin/products/add" class="btn btn-primary">Thêm sản phẩm đầu tiên</a>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = products.map((product, index) => this.renderProduct(product, index)).join('');

        // Initialize tooltips for stock warning icons
        this.initializeTooltips();
    }

    // Render single product row
    renderProduct(product, index) {
        // Lấy mô tả rút gọn dạng text (loại bỏ HTML) để không làm vỡ bảng
        const shortDescription = this.truncateText(this.stripHtml(product.description || ''), 80);
        // Tính STT dựa trên trang hiện tại và vị trí trong trang
        const stt = this.currentPage * this.pageSize + index + 1;
        return `
            <tr>
                <td class="text-center">${stt}</td>
                <td>
                    <div class="d-flex align-items-center justify-content-center">
                        <img src="${product.mainImageUrl || 'https://placehold.co/300x300'}" 
                            class="rounded product-image-clickable" 
                            style="width: 50px; height: 50px; object-fit: cover; cursor: pointer;"
                            alt="${product.name}"
                            onclick="productTableManager.viewProduct(${product.productId})"
                            onerror="this.src='https://placehold.co/300x300'"
                            title="Click để xem chi tiết">
                    </div>
                </td>
                <td>
                    <div>
                        <h6 class="mb-1 product-name-clickable" 
                            style="cursor: pointer;"
                            onclick="productTableManager.viewProduct(${product.productId})"
                            title="Click để xem chi tiết">
                            ${product.name}
                        </h6>
                        <small class="text-muted">${shortDescription}</small>
                    </div>
                </td>
                <td>${product.categoryName || 'N/A'}</td>
                <td>${product.brandName || 'N/A'}</td>
                <td>${this.formatCurrency(product.price)}</td>
                <td>
                    <div class="d-flex align-items-center gap-1">
                        <span class="${(product.stock || 0) <= 10 ? '' : 'text-start'}">${product.stock || 0}</span>
                        ${(product.stock || 0) > 0 && (product.stock || 0) <= 10 ? '<i class="mdi mdi-alert-circle text-warning" title="Sắp hết hàng" data-bs-toggle="tooltip"></i>' : ''}
                    </div>
                </td>
                <td class="text-start">${product.soldCount || 0}</td>
                <td>${this.renderStockStatus(product.stock)}</td>
                <td>${this.renderStatus(product.isActive)}</td>
                <td>${this.formatDate(product.createdDate)}</td>
                <td>${this.renderActions(product.productId, product.isActive)}</td>
            </tr>
        `;
    }

    // Loại bỏ toàn bộ thẻ HTML để render dạng text an toàn trong bảng
    stripHtml(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const text = temp.textContent || temp.innerText || '';
        return text.replace(/\s+/g, ' ').trim();
    }

    // Cắt ngắn chuỗi có hậu tố ...
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength).trim() + '...';
    }

    // Render stock status
    renderStockStatus(stock) {
        if (stock > 0) {
            return '<span class="text-success">Còn hàng</span>';
        } else {
            return '<span class="text-danger">Hết hàng</span>';
        }
    }

    // Render status - basic style
    renderStatus(isActive) {
        console.log('renderStatus called with isActive:', isActive); // Debug log
        return isActive
            ? '<span class="text-success">Hoạt động</span>'
            : '<span class="text-danger">Tạm dừng</span>';
    }

    // Render action buttons (3 actions: View, Toggle Status, Delete)
    renderActions(productId, isActive) {
        return `
            <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline-info" 
                        onclick="productTableManager.viewProduct(${productId})" 
                        title="Xem chi tiết">
                    <i class="mdi mdi-eye"></i>
                </button>
                <button class="btn btn-sm ${isActive ? 'btn-outline-warning' : 'btn-outline-success'}" 
                        onclick="productTableManager.toggleStatus(${productId})" 
                        title="${isActive ? 'Tạm dừng' : 'Kích hoạt'}">
                    <i class="mdi mdi-${isActive ? 'pause' : 'play'}"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" 
                        onclick="productTableManager.deleteProduct(${productId})" 
                        title="Xóa">
                    <i class="mdi mdi-delete"></i>
                </button>
            </div>
        `;
    }

    // Update pagination
    updatePagination(pageData) {
        this.totalPages = pageData.totalPages;
        this.totalElements = pageData.totalElements;

        const paginationContainer = document.getElementById('paginationContainer');
        const paginationInfo = document.getElementById('paginationInfo');
        const paginationNav = document.getElementById('paginationNav');

        if (paginationContainer) {
            paginationContainer.style.display = 'flex';
        }

        if (paginationInfo) {
            const start = this.currentPage * this.pageSize + 1;
            const end = Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
            paginationInfo.textContent = `Hiển thị ${start}-${end} trong ${this.totalElements} sản phẩm`;
        }

        if (paginationNav) {
            paginationNav.innerHTML = this.generatePaginationLinks();
        }
    }

    // Generate pagination links
    generatePaginationLinks() {
        let links = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(0, endPage - maxVisiblePages + 1);
        }

        // Previous button
        links += `
            <li class="page-item ${this.currentPage === 0 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="productTableManager.goToPage(${this.currentPage - 1})">
                    <i class="mdi mdi-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            links += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="productTableManager.goToPage(${i})">${i + 1}</a>
                </li>
            `;
        }

        // Next button
        links += `
            <li class="page-item ${this.currentPage === this.totalPages - 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="productTableManager.goToPage(${this.currentPage + 1})">
                    <i class="mdi mdi-chevron-right"></i>
                </a>
            </li>
        `;

        return links;
    }

    // Go to specific page
    goToPage(page) {
        if (page >= 0 && page < this.totalPages) {
            this.currentPage = page;
            this.loadProducts();
        }
    }

    // Action methods
    viewProduct(productId) {
        // Navigate to product detail page
        window.location.href = `/admin/products/${productId}`;
    }


    async toggleStatus(productId) {
        try {
            const response = await fetch(`/admin/api/products/${productId}/toggle-status`, {
                method: 'PUT'
            });

            if (response.ok) {
                this.showNotification('Cập nhật trạng thái thành công', 'success');
                this.loadProducts();
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            this.showNotification('Có lỗi xảy ra khi cập nhật trạng thái', 'error');
        }
    }

    deleteProduct(productId) {
        this.currentProductId = productId;

        // Show confirmation modal
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }

    async confirmDelete() {
        if (!this.currentProductId) return;

        try {
            const response = await fetch(`/admin/api/products/${this.currentProductId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Xóa sản phẩm thành công', 'success');
                this.loadProducts();
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
            this.currentProductId = null;
        }
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
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    // Initialize Bootstrap tooltips
    initializeTooltips() {
        // Initialize tooltips for stock warning icons
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    // Export to Excel
    async exportToExcel() {
        try {
            this.showNotification('Đang tải dữ liệu để xuất Excel...', 'success');
            
            // Lấy tất cả sản phẩm với các filter hiện tại
            const params = new URLSearchParams({
                page: 0,
                size: 10000, // Lấy nhiều nhất có thể
                search: this.searchParams.search,
                brandId: this.searchParams.brand,
                categoryId: this.searchParams.category,
                status: this.searchParams.status,
                stockStatus: this.searchParams.stockStatus
            });
            
            // Add date filter params
            if (this.searchParams.dateFilter) {
                params.append('dateFilter', this.searchParams.dateFilter);
            }
            if (this.searchParams.startDate) {
                params.append('startDate', this.searchParams.startDate);
            }
            if (this.searchParams.endDate) {
                params.append('endDate', this.searchParams.endDate);
            }

            const response = await fetch(`/admin/api/products?${params}`);
            const data = await response.json();

            if (data.result && data.result.content) {
                const products = data.result.content;
                this.downloadExcel(products);
                this.showNotification('Xuất Excel thành công!', 'success');
            } else {
                this.showNotification('Không có dữ liệu để xuất', 'error');
            }
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.showNotification('Có lỗi xảy ra khi xuất Excel', 'error');
        }
    }

    // Download Excel file
    downloadExcel(products) {
        // Tạo CSV content
        const headers = [
            'STT',
            'ID Sản phẩm',
            'Tên sản phẩm',
            'Danh mục',
            'Thương hiệu',
            'Giá (VND)',
            'Tồn kho',
            'Đã bán',
            'Trạng thái',
            'Tình trạng hàng',
            'Ngày tạo'
        ];

        let csvContent = '\uFEFF'; // BOM để hỗ trợ UTF-8
        csvContent += headers.join(',') + '\n';

        products.forEach((product, index) => {
            const row = [
                index + 1,
                product.productId || '',
                `"${this.escapeCSV(product.name || '')}"`,
                `"${this.escapeCSV(product.categoryName || 'N/A')}"`,
                `"${this.escapeCSV(product.brandName || 'N/A')}"`,
                product.price || 0,
                product.stock || 0,
                product.soldCount || 0,
                product.isActive ? 'Hoạt động' : 'Tạm dừng',
                (product.stock || 0) > 0 ? 'Còn hàng' : 'Hết hàng',
                `"${this.formatDate(product.createdDate)}"`
            ];
            csvContent += row.join(',') + '\n';
        });

        // Tạo blob và download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.setAttribute('href', url);
        link.setAttribute('download', `danh_sach_san_pham_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Escape CSV special characters
    escapeCSV(text) {
        if (!text) return '';
        // Thay thế dấu nháy kép bằng hai dấu nháy kép
        return String(text).replace(/"/g, '""');
    }

    // Debounce function for search
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
    window.productTableManager = new ProductTableManager();
});