/**
 * Categories Management
 * Handles category CRUD operations and UI interactions
 */

class CategoriesManager {
    constructor() {
        this.ajax = window.adminAjax;
        console.log('CategoriesManager initialized, ajax:', this.ajax);
        this.currentPage = 0;
        this.currentSize = 12;
        this.currentFilters = {
            search: '',
            status: ''
        };
        this.init();
    }

    init() {
        this.bindEvents();
        
        // Chỉ load categories list nếu đang ở trang list
        if (document.querySelector('.categories-container')) {
            console.log('Loading categories list...');
            this.loadCategories();
        } else {
            console.log('No categories container found, skipping categories list load');
        }
        
        // Xử lý logic cho edit page
        if (this.isEditPage()) {
            if (!this.hasServerSideData()) {
                // Không có dữ liệu từ server-side, load từ API
                console.log('No server-side data, loading from API...');
                this.loadCategoryData();
            } else {
                // Có dữ liệu từ server-side, setup form
                console.log('Server-side data available, setting up form...');
                this.setupEditFormFromServerData();
            }
        } else {
            // Load parent categories cho các trang khác (add page)
            this.loadParentCategories();
        }
    }

    bindEvents() {
        // Form submission
        const categoryForm = document.getElementById('categoryForm');
        if (categoryForm) {
            categoryForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // Optimize hover events with passive listeners
        this.optimizeHoverEvents();

        // Delete buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="delete-category"]')) {
                e.preventDefault();
                e.stopPropagation();
                
                const btn = e.target.closest('[data-action="delete-category"]');
                if (btn.disabled) return;
                
                btn.disabled = true;
                this.handleDelete(btn.dataset.categoryId, btn.dataset.categoryName)
                    .finally(() => {
                        btn.disabled = false;
                    });
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
                e.preventDefault();
                e.stopPropagation();
                
                const btn = e.target.closest('[data-action="toggle-status"]');
                if (btn.disabled) return;
                
                btn.disabled = true;
                this.handleToggleStatus(btn.dataset.categoryId, btn.dataset.currentStatus)
                    .finally(() => {
                        btn.disabled = false;
                    });
            }
        });

        // Expand/Collapse buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.expand-btn')) {
                const btn = e.target.closest('.expand-btn');
                const categoryId = btn.dataset.categoryId;
                this.toggleCategory(categoryId);
            }
        });

        // Double click to toggle expand/collapse
        document.addEventListener('dblclick', (e) => {
            // Tránh toggle khi double click vào các nút action hoặc link
            if (e.target.closest('.btn-group') || e.target.closest('a') || e.target.closest('.expand-btn')) {
                return;
            }

            // Kiểm tra xem có phải double click vào hàng danh mục không
            const categoryRow = e.target.closest('.category-row');
            if (categoryRow) {
                const categoryId = categoryRow.dataset.categoryId;
                const expandBtn = categoryRow.querySelector('.expand-btn');
                
                // Chỉ toggle nếu danh mục có nút expand (có con)
                if (expandBtn) {
                    this.toggleCategory(categoryId);
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        });

        // Handle isParent checkbox change
        const isParentCheckbox = document.getElementById('isParent');
        if (isParentCheckbox) {
            isParentCheckbox.addEventListener('change', (e) => {
                const parentSelect = document.getElementById('parentCategoryId');
                if (e.target.checked) {
                    // Nếu tick "Là danh mục cha", KHÔNG xóa parent category
                    // Chỉ disable dropdown nếu muốn (hoặc không disable)
                    if (parentSelect) {
                        // parentSelect.value = ''; // BỎ dòng này
                        // parentSelect.disabled = true; // BỎ dòng này
                        console.log('Category can contain sub-categories but still has parent');
                    }
                } else {
                    // Nếu bỏ tick, enable parent category selection
                    if (parentSelect) {
                        parentSelect.disabled = false;
                    }
                }
            });
        }

        // Handle parent category change - reload child categories
        // Sử dụng event delegation để đảm bảo event được bind đúng
        document.addEventListener('change', (e) => {
            if (e.target.matches('#parentCategoryId')) {
                console.log('🎯 Parent category dropdown changed to:', e.target.value);
                console.log('🎯 Event target:', e.target);
                console.log('🎯 Event target ID:', e.target.id);
                this.handleParentCategoryChange(e.target.value);
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

    async loadCategories(page = 0, size = 12) {
        try {
            console.log('Loading categories...');
            // Sử dụng endpoint /tree để lấy cây thư mục
            const response = await this.ajax.get('/categories/tree');
            console.log('API Response:', response);
            console.log('Categories data:', response.result);
            
            // Cache the data for filtering
            this.cachedCategories = response.result;
            
            // Debug: Log all categories with their status
            console.log('All categories with status:');
            this.cachedCategories.forEach(cat => {
                console.log(`- ${cat.name}: isActive=${cat.isActive}`);
            });
            
            // Chỉ render nếu có container
            const container = document.querySelector('.categories-container');
            if (container) {
                this.renderCategories(response.result);
            } else {
                console.log('No categories container found, skipping render');
            }
            
            // Update statistics for list page
            this.updateCategoryStats(response.result);
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showNotification('Không thể tải danh sách danh mục', 'error');
        }
    }

    renderCategories(categories) {
        console.log('renderCategories called with:', categories);
        const container = document.querySelector('.categories-container');
        console.log('Container found:', container);
        if (!container) {
            console.error('Container .categories-container not found!');
            return;
        }

        // Apply filters
        const filteredCategories = this.applyFilters(categories);

        if (filteredCategories.length === 0) {
            console.log('No categories found after filtering, showing empty state');
            container.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-5">
                        <i class="mdi mdi-folder-outline mdi-48px mb-3"></i>
                        <p>Không tìm thấy danh mục nào</p>
                        <button type="button" class="btn btn-outline-secondary" onclick="window.categoriesManager.resetFilters()">
                            <i class="mdi mdi-refresh"></i> Xóa bộ lọc
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        console.log('Building category tree HTML...');
        const html = this.buildCategoryTreeHTML(filteredCategories, 0);
        console.log('Generated HTML:', html);
        container.innerHTML = html;
        
        // Update stats with original data (not filtered)
        if (this.cachedCategories) {
            this.updateCategoryStats(this.cachedCategories);
        }
    }

    createCategoryRow(category, level = 0, isLast = false, parentPrefix = '') {
        // Tạo ký hiệu cây thư mục
        const getTreeSymbol = (level, isLast) => {
            if (level === 0) return '';
            if (isLast) return '└─ ';
            return '├─ ';
        };

        const treeSymbol = getTreeSymbol(level, isLast);
        const fullPrefix = parentPrefix + treeSymbol;
        const hasChildren = category.children && category.children.length > 0;
        // Đánh dấu các hàng con (level > 0) là collapsed ban đầu
        const collapsedClass = level > 0 ? 'collapsed' : '';
        
        return `
            <tr class="category-row ${collapsedClass}" data-level="${level}" data-category-id="${category.categoryId}">
                <td>
                    <div class="d-flex align-items-center">
                        <span class="tree-prefix me-2 text-muted" style="font-family: monospace; font-size: 14px;">${fullPrefix}</span>
                        <div class="d-flex align-items-center">
                            ${hasChildren ? 
                                `<button class="btn btn-sm btn-link p-0 me-2 expand-btn" data-category-id="${category.categoryId}" title="Mở rộng/Thu gọn">
                                    <i class="mdi mdi-chevron-right expand-icon"></i>
                                </button>` : 
                                '<span class="me-3"></span>'
                            }
                            <i class="mdi ${category.isParent ? 'mdi-folder' : 'mdi-file-document'} me-2 text-primary"></i>
                            <strong class="category-name ${level > 0 ? 'text-secondary' : ''}" 
                                    style="cursor: ${hasChildren ? 'pointer' : 'default'}; user-select: none;"
                                    data-category-id="${category.categoryId}"
                                    data-has-children="${hasChildren}"
                                    title="${hasChildren ? 'Double click để mở/đóng' : ''}">${category.name}</strong>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${category.isParent ? 'bg-info' : 'bg-secondary'}">
                        <i class="mdi ${category.isParent ? 'mdi-folder' : 'mdi-file'} me-1"></i>
                        ${category.isParent ? 'Danh mục cha' : 'Danh mục con'}
                    </span>
                </td>
                <td>
                    <span class="badge ${category.isActive ? 'bg-success' : 'bg-danger'}">
                        <i class="mdi ${category.isActive ? 'mdi-check-circle' : 'mdi-close-circle'} me-1"></i>
                        ${category.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <a href="/admin/categories/${category.categoryId}/edit" 
                           class="btn btn-outline-primary" 
                           title="Chỉnh sửa">
                            <i class="mdi mdi-pencil"></i>
                        </a>
                        <button type="button" 
                                class="btn ${category.isActive ? 'btn-outline-warning' : 'btn-outline-success'}" 
                                data-action="toggle-status"
                                data-category-id="${category.categoryId}"
                                data-current-status="${category.isActive}"
                                title="${category.isActive ? 'Ngừng hoạt động' : 'Kích hoạt'}">
                            <i class="mdi ${category.isActive ? 'mdi-pause' : 'mdi-play'}"></i>
                        </button>
                        <button type="button" 
                                class="btn btn-outline-danger" 
                                data-action="delete-category"
                                data-category-id="${category.categoryId}"
                                data-category-name="${category.name}"
                                title="Xóa">
                            <i class="mdi mdi-delete"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Get category ID for edit mode
        const isEdit = form.dataset.categoryId;

        // Prepare data
        const parentCategoryId = formData.get('parentCategoryId');
        const data = {
            name: formData.get('name'),
            parentCategoryId: parentCategoryId && parentCategoryId !== '' ? parseInt(parentCategoryId) : null,
            isParent: formData.has('isParent'),
            isActive: formData.has('isActive')
        };

        // Validate required fields
        if (!data.name || data.name.trim() === '') {
            this.showNotification('Tên danh mục là bắt buộc', 'error');
            return;
        }

        // Validate name length
        if (data.name.length > 255) {
            this.showNotification('Tên danh mục không được vượt quá 255 ký tự', 'error');
            return;
        }

        // Validate circular reference (category cannot be parent of itself)
        if (isEdit && data.parentCategoryId && parseInt(data.parentCategoryId) === parseInt(isEdit)) {
            this.showNotification('Danh mục không thể là danh mục cha của chính nó', 'error');
            return;
        }

        // Validate business logic: Parent category cannot have parent
        // if (data.isParent && data.parentCategoryId) {
        //     this.showNotification('Danh mục cha không thể có danh mục cha. Vui lòng bỏ chọn "Là danh mục cha" hoặc xóa danh mục cha.', 'error');
        //     return;
        // }

        try {
            let response;
            
            console.log('Submitting category data:', { isEdit, data });
            
            if (isEdit) {
                response = await this.ajax.put(`/categories/${isEdit}`, data);
                this.showNotification('Cập nhật danh mục thành công', 'success');
            } else {
                response = await this.ajax.post('/categories', data);
                this.showNotification('Thêm danh mục thành công', 'success');
            }
            
            console.log('Category saved successfully:', response);
            
            // Redirect to list page
            setTimeout(() => {
                window.location.href = '/admin/categories';
            }, 1500);
            
        } catch (error) {
            console.error('Error saving category:', error);
            
            // Show detailed error message
            let errorMessage = 'Có lỗi xảy ra khi lưu danh mục';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showNotification(errorMessage, 'error');
        }
    }

    async handleDelete(categoryId, categoryName) {
        if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${categoryName}"?`)) {
            return;
        }

        try {
            await this.ajax.delete(`/categories/${categoryId}`);
            this.showNotification('Xóa danh mục thành công', 'success');
            this.loadCategories(); // Reload the list
        } catch (error) {
            console.error('Error deleting category:', error);
            this.showNotification('Có lỗi xảy ra khi xóa danh mục', 'error');
        }
    }

    async handleToggleStatus(categoryId, currentStatus) {
        const isActive = currentStatus === 'true';
        const action = isActive ? 'deactivate' : 'activate';
        
        try {
            const response = await this.ajax.put(`/categories/${categoryId}/${action}`);
            
            if (isActive) {
                this.showNotification('Ngừng hoạt động danh mục và tất cả danh mục con thành công', 'success');
            } else {
                this.showNotification('Kích hoạt danh mục và tất cả danh mục con thành công', 'success');
            }
            
            this.loadCategories(); // Reload the list
        } catch (error) {
            console.error('Error toggling category status:', error);
            
            // Xử lý lỗi cụ thể
            if (error.message && error.message.includes('parent category is inactive')) {
                this.showNotification('Không thể kích hoạt danh mục con khi danh mục cha đang bị ngừng hoạt động', 'error');
            } else {
                this.showNotification('Có lỗi xảy ra khi thay đổi trạng thái danh mục', 'error');
            }
        }
    }

    async handleSearch(e) {
        const query = e.target.value.trim();
        this.currentFilters.search = query;
        this.currentPage = 0; // Reset về trang đầu
        
        // If we have cached data, filter it; otherwise load from server
        if (this.cachedCategories) {
            this.renderCategories(this.cachedCategories);
        } else {
            await this.loadCategories(this.currentPage, this.currentSize);
        }
    }

    async handleStatusFilter(e) {
        const status = e.target.value;
        this.currentFilters.status = status;
        this.currentPage = 0; // Reset về trang đầu
        
        // If we have cached data, filter it; otherwise load from server
        if (this.cachedCategories) {
            this.renderCategories(this.cachedCategories);
        } else {
            await this.loadCategories(this.currentPage, this.currentSize);
        }
    }

    // Apply filters to categories (client-side filtering for tree structure)
    applyFilters(categories) {
        console.log('applyFilters called with:', { categories, filters: this.currentFilters });
        let filtered = categories;

        // Apply search filter
        if (this.currentFilters.search) {
            console.log('Applying search filter:', this.currentFilters.search);
            filtered = this.filterBySearch(filtered, this.currentFilters.search);
        }

        // Apply status filter
        if (this.currentFilters.status) {
            console.log('Applying status filter:', this.currentFilters.status);
            filtered = this.filterByStatus(filtered, this.currentFilters.status);
        }

        console.log('applyFilters result:', filtered);
        return filtered;
    }

    filterBySearch(categories, query) {
        const filtered = [];
        const searchQuery = query.toLowerCase();

        categories.forEach(category => {
            const matches = category.name.toLowerCase().includes(searchQuery);
            const children = category.children ? this.filterBySearch(category.children, query) : [];
            
            if (matches || children.length > 0) {
                filtered.push({
                    ...category,
                    children: children
                });
            }
        });

        return filtered;
    }

    filterByStatus(categories, status) {
        console.log('filterByStatus called with:', { categories, status });
        const filtered = [];
        
        // Fix: Check for both 'active' and 'inactive' values
        let isActive;
        if (status === 'active') {
            isActive = true;
        } else if (status === 'inactive') {
            isActive = false;
        } else {
            // No filter - return all
            return categories;
        }
        
        console.log('Looking for isActive:', isActive);

        categories.forEach(category => {
            console.log('Checking category:', { name: category.name, isActive: category.isActive });
            const matches = category.isActive === isActive;
            const children = category.children ? this.filterByStatus(category.children, status) : [];
            
            console.log('Category match result:', { matches, childrenCount: children.length });
            
            if (matches || children.length > 0) {
                filtered.push({
                    ...category,
                    children: children
                });
            }
        });

        console.log('filterByStatus result:', filtered);
        return filtered;
    }

    resetFilters() {
        console.log('Resetting filters...');
        this.currentFilters = {
            search: '',
            status: ''
        };
        
        // Reset form inputs
        const searchInput = document.getElementById('search');
        const statusFilter = document.getElementById('status');
        
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = '';
        
        // Re-render with cached data if available
        if (this.cachedCategories) {
            this.renderCategories(this.cachedCategories);
        } else {
            this.loadCategories();
        }
        this.showNotification('Đã xóa bộ lọc', 'info');
    }

    async handleSort(e) {
        const sortBy = e.target.value;
        this.currentFilters.sortBy = sortBy;
        this.currentPage = 0; // Reset về trang đầu
        await this.loadCategories(this.currentPage, this.currentSize);
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
                    this.loadCategories(page, this.currentSize);
                }
            }
        });

        // Update pagination info
        const infoContainer = document.querySelector('.text-muted');
        if (infoContainer) {
            const start = pageInfo.number * pageInfo.size + 1;
            const end = Math.min((pageInfo.number + 1) * pageInfo.size, pageInfo.totalElements);
            infoContainer.innerHTML = `
                Hiển thị ${start} đến ${end} trong tổng số ${pageInfo.totalElements} danh mục
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
        
        // Tạo toast HTML (không có icon)
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

    // Load parent categories for dropdown
    async loadParentCategories() {
        try {
            console.log('Loading parent categories for dropdown...');
            // Sử dụng API /all để lấy tất cả categories (không phân trang)
            const response = await this.ajax.get('/categories/all');
            console.log('Parent categories API response:', response);
            
            if (response.result) {
                // API /all trả về List<CategoryResponse> trực tiếp
                const allCategories = response.result;
                console.log('🔍 All categories from API:', allCategories);
                await this.populateParentDropdown(allCategories);
                return Promise.resolve();
            }
        } catch (error) {
            console.error('Error loading parent categories:', error);
            this.showNotification('Lỗi khi tải danh mục cha', 'error');
            return Promise.reject(error);
        }
    }

    // Load parent categories for edit page (không gọi loadCategories)
    async loadParentCategoriesForEdit() {
        try {
            console.log('Loading parent categories for edit page...');
            // Sử dụng API /all để lấy tất cả categories (không phân trang)
            const response = await this.ajax.get('/categories/all');
            console.log('Edit page parent categories API response:', response);
            
            if (response.result) {
                // API /all trả về List<CategoryResponse> trực tiếp
                const allCategories = response.result;
                console.log('All categories from API for edit:', allCategories);
                await this.populateParentDropdown(allCategories);
                return Promise.resolve();
            }
        } catch (error) {
            console.error('Error loading parent categories for edit:', error);
            this.showNotification('Lỗi khi tải danh mục cha', 'error');
            return Promise.reject(error);
        }
    }

    // Handle parent category change - reload child categories
    async handleParentCategoryChange(parentCategoryId) {
        console.log('🔧 handleParentCategoryChange called with:', parentCategoryId);
        console.log('🔧 Current URL:', window.location.pathname);
        console.log('🔧 isListPage():', this.isListPage());
        console.log('🔧 isEditPage():', this.isEditPage());
        
        // Nếu đang ở trang list, reload toàn bộ danh sách danh mục
        if (this.isListPage()) {
            console.log('🔄 Reloading categories list due to parent change');
            // Clear cache để force reload từ server
            this.cachedCategories = null;
            await this.loadCategories();
            this.showNotification('Đã cập nhật danh sách danh mục', 'success');
        }
        
        // Nếu đang ở trang edit và có danh mục con, reload danh mục con
        if (this.isEditPage() && parentCategoryId) {
            try {
                console.log('🔄 Loading child categories for parent:', parentCategoryId);
                const response = await this.ajax.get(`/categories/tree?parentId=${parentCategoryId}`);
                if (response.result) {
                    console.log('✅ Child categories loaded:', response.result);
                    // Có thể hiển thị danh mục con trong một container riêng nếu cần
                    this.displayChildCategories(response.result);
                }
            } catch (error) {
                console.error('❌ Error loading child categories:', error);
                this.showNotification('Lỗi khi tải danh mục con', 'error');
            }
        }
    }

    // Check if we're on list page
    isListPage() {
        return window.location.pathname.includes('/categories') && !window.location.pathname.includes('/edit') && !window.location.pathname.includes('/add');
    }

    // Check if we're on edit page
    isEditPage() {
        return window.location.pathname.includes('/edit');
    }

    // Check if we have server-side data (Thymeleaf binding)
    hasServerSideData() {
        const form = document.getElementById('categoryForm');
        if (!form) return false;
        
        // Check if form has data-category-id attribute (set by Thymeleaf)
        const categoryId = form.getAttribute('data-category-id');
        const nameInput = document.getElementById('name');
        const hasNameValue = nameInput && nameInput.value && nameInput.value.trim() !== '';
        
        return categoryId && hasNameValue;
    }

    // Setup edit form from server-side data
    setupEditFormFromServerData() {
        console.log('Setting up edit form from server-side data...');
        
        const form = document.getElementById('categoryForm');
        const nameInput = document.getElementById('name');
        const isParentCheckbox = document.getElementById('isParent');
        const isActiveCheckbox = document.getElementById('isActive');
        
        if (!form || !nameInput) {
            console.error('Form elements not found');
            return;
        }
        
        // Get category ID from form attribute
        const categoryId = form.getAttribute('data-category-id');
        if (!categoryId) {
            console.error('Category ID not found in form');
            return;
        }
        
        // Create category object from form data
        const category = {
            categoryId: parseInt(categoryId),
            name: nameInput.value,
            isParent: isParentCheckbox ? isParentCheckbox.checked : false,
            isActive: isActiveCheckbox ? isActiveCheckbox.checked : false,
            parentCategoryId: this.getCurrentParentCategoryId() // Get from server-side data
        };
        
        console.log('Category data from server-side:', category);
        
        // Set form category ID
        form.dataset.categoryId = categoryId;
        
        // Display current parent info (will be updated when dropdown loads)
        this.displayCurrentParentInfo(category);
        
        // Load parent categories and set up dropdown
        this.loadParentCategoriesForEdit().then(() => {
            console.log('Parent categories loaded for server-side data...');
            this.setupParentDropdownFromServerData(category);
        }).catch(error => {
            console.error('❌ Error loading parent categories for server-side data:', error);
        });
    }

    // Setup parent dropdown from server-side data
    setupParentDropdownFromServerData(category) {
        const parentSelect = document.getElementById('parentCategoryId');
        if (!parentSelect) return;
        
        // Use parent category ID from category object
        const currentParentId = category.parentCategoryId;
        if (currentParentId) {
            const optionExists = Array.from(parentSelect.options).some(option => 
                option.value == currentParentId
            );
            
            if (optionExists) {
                parentSelect.value = currentParentId;
                console.log('✅ Set parent category from server-side data:', currentParentId);
            } else {
                console.warn('❌ Parent category option not found in dropdown:', currentParentId);
                // Tạo option tạm thời nếu không tìm thấy
                const tempOption = document.createElement('option');
                tempOption.value = currentParentId;
                tempOption.textContent = 'Danh mục cha hiện tại (không khả dụng)';
                tempOption.disabled = true;
                parentSelect.appendChild(tempOption);
                parentSelect.value = currentParentId;
                console.log('✅ Added temporary option and set value');
            }
        } else {
            parentSelect.value = '';
            console.log('✅ No parent category from server-side data');
        }
        
        // Disable parent select if is parent category
        // const isParentCheckbox = document.getElementById('isParent');
        // if (isParentCheckbox && isParentCheckbox.checked && parentSelect) {
        //     parentSelect.disabled = true;
        //     console.log('✅ Disabled parent select because isParent is checked');
        // }
    }

    // Get current parent category ID from form or other sources
    getCurrentParentCategoryId() {
        const form = document.getElementById('categoryForm');
        if (!form) return null;
        
        // Get parent category ID from form data attribute
        const parentCategoryId = form.getAttribute('data-parent-category-id');
        return parentCategoryId ? parseInt(parentCategoryId) : null;
    }

    // Display child categories (optional - for showing available children)
    displayChildCategories(childCategories) {
        console.log('Displaying child categories:', childCategories);
        // Có thể thêm logic để hiển thị danh mục con trong UI nếu cần
        // Hiện tại chỉ log để debug
    }

    async populateParentDropdown(categories) {
        const parentSelect = document.getElementById('parentCategoryId');
        if (!parentSelect) return;

        console.log('populateParentDropdown called with categories:', categories);
        console.log('Total categories received:', categories.length);
        
        // Debug: Log all categories with their properties
        categories.forEach((cat, index) => {
            console.log(`Category ${index}: ${cat.name} (ID: ${cat.categoryId}, Active: ${cat.isActive}, IsParent: ${cat.isParent})`);
        });

        // Clear existing options except the first one
        parentSelect.innerHTML = '<option value="">-- Chọn danh mục cha (để trống nếu là danh mục gốc) --</option>';
        
        // Get current category ID for edit mode
        const currentCategoryId = this.getCurrentCategoryId();
        console.log('Current category ID for exclusion:', currentCategoryId);
        
        // Add categories recursively với logic cải thiện
        this.addCategoryOptions(parentSelect, categories, 0, currentCategoryId);
        
        // Thêm danh mục cha hiện tại nếu có và chưa được thêm
        if (currentCategoryId) {
            await this.addCurrentParentCategoryFromAPI(parentSelect, currentCategoryId);
        }
        
        // Debug: Log all options after adding
        console.log('Dropdown options after population:');
        Array.from(parentSelect.options).forEach((option, index) => {
            console.log(`Option ${index}: value="${option.value}", text="${option.textContent}"`);
        });
        
        console.log('Total options in dropdown:', parentSelect.options.length);
    }

    addCategoryOptions(select, categories, level, excludeCategoryId = null) {
        console.log(`addCategoryOptions: Processing ${categories.length} categories, level ${level}`);
        
        categories.forEach(category => {
            // Chỉ hiển thị danh mục cha (isParent = true) và danh mục cha hiện tại
            const isParent = category.isParent;
            const isCurrentParent = this.isCurrentParentCategory(category, excludeCategoryId);
            const shouldShow = isParent || isCurrentParent;
            
            console.log(`Category: ${category.name} (ID: ${category.categoryId})`);
            console.log(`  - isParent: ${isParent}`);
            console.log(`  - isCurrentParent: ${isCurrentParent}`);
            console.log(`  - shouldShow: ${shouldShow}`);
            
            if (shouldShow) {
                // Loại trừ danh mục hiện tại và các danh mục con của nó
                if (excludeCategoryId && this.shouldExcludeCategory(category, excludeCategoryId)) {
                    console.log(`Excluding ${category.name} - it's current category or its descendant`);
                    return;
                }
                
                console.log(`✅ Adding ${category.name} to dropdown`);
                
                const option = document.createElement('option');
                option.value = category.categoryId;
                const statusText = category.isActive ? '' : ' (Không hoạt động)';
                option.textContent = '  '.repeat(level) + category.name + statusText;
                select.appendChild(option);
                
                // Chỉ hiển thị danh mục con cấp 1 (level < 1) để tránh quá sâu
                // Điều này giúp UX tốt hơn vì không hiển thị quá nhiều cấp
                if (category.children && category.children.length > 0 && level < 1) {
                    this.addCategoryOptions(select, category.children, level + 1, excludeCategoryId);
                }
            } else {
                console.log(`❌ Skipping ${category.name} - not a parent category`);
            }
        });
    }

    // Helper method để kiểm tra xem category có phải là danh mục cha hiện tại không
    isCurrentParentCategory(category, currentCategoryId) {
        // Nếu không có currentCategoryId thì không phải
        if (!currentCategoryId) return false;
        
        // Kiểm tra xem category có phải là parent của currentCategoryId không
        return this.isAncestorOf(category, currentCategoryId);
    }

    // Helper method để kiểm tra xem category có phải là tổ tiên của targetCategoryId không
    isAncestorOf(category, targetCategoryId) {
        if (!category.children || category.children.length === 0) {
            return false;
        }
        
        for (const child of category.children) {
            if (child.categoryId == targetCategoryId) {
                return true;
            }
            if (this.isAncestorOf(child, targetCategoryId)) {
                return true;
            }
        }
        return false;
    }

    // Helper method để kiểm tra xem có nên loại trừ danh mục không
    shouldExcludeCategory(category, excludeCategoryId) {
        // Loại trừ chính danh mục đó
        if (category.categoryId == excludeCategoryId) {
            return true;
        }
        
        // KHÔNG loại trừ danh mục cha của danh mục hiện tại
        // Chỉ loại trừ danh mục con của danh mục hiện tại
        return this.isDescendantOf(category, excludeCategoryId);
    }

    // Helper method để kiểm tra xem category có phải là con của excludeCategoryId không
    isDescendantOf(category, excludeCategoryId) {
        if (!category.children || category.children.length === 0) {
            return false;
        }
        
        for (const child of category.children) {
            if (child.categoryId == excludeCategoryId) {
                return true;
            }
            if (this.isDescendantOf(child, excludeCategoryId)) {
                return true;
            }
        }
        return false;
    }

    // Helper method để lấy category ID hiện tại (trong edit mode)
    getCurrentCategoryId() {
        const form = document.getElementById('categoryForm');
        if (form && form.dataset.categoryId) {
            return form.dataset.categoryId;
        }
        return null;
    }

    // Hiển thị thông tin danh mục cha hiện tại
    async displayCurrentParentInfo(category) {
        const currentParentInfo = document.getElementById('currentParentInfo');
        const currentParentName = document.getElementById('currentParentName');
        const currentParentStatus = document.getElementById('currentParentStatus');
        
        if (!currentParentInfo || !currentParentName || !currentParentStatus) {
            console.log('Current parent info elements not found');
            return;
        }

        console.log('Displaying current parent info for category:', category);

        if (category.parentCategoryId) {
            // Hiển thị thông tin cơ bản trước
            currentParentName.textContent = `Danh mục cha ID: ${category.parentCategoryId}`;
            currentParentStatus.textContent = 'Đang tải thông tin...';
            currentParentStatus.className = 'badge bg-warning ms-2';
            
            console.log('✅ Displayed basic parent info, loading details...');
            
            // Load thông tin chi tiết trong background
            this.loadParentDetails(category.parentCategoryId, currentParentName, currentParentStatus);
        } else {
            // Không có danh mục cha
            currentParentName.textContent = 'Danh mục gốc';
            currentParentStatus.textContent = 'Không có';
            currentParentStatus.className = 'badge bg-secondary ms-2';
            
            console.log('✅ Category is root category');
        }
    }

    // Load thông tin chi tiết danh mục cha
    async loadParentDetails(parentCategoryId, nameElement, statusElement) {
        try {
            const parentResponse = await this.ajax.get(`/categories/${parentCategoryId}`);
            if (parentResponse.result) {
                const parentCategory = parentResponse.result;
                
                // Hiển thị thông tin chi tiết
                nameElement.textContent = parentCategory.name;
                statusElement.textContent = parentCategory.isActive ? 'Hoạt động' : 'Không hoạt động';
                statusElement.className = `badge ${parentCategory.isActive ? 'bg-success' : 'bg-danger'} ms-2`;
                
                console.log('✅ Loaded parent details:', parentCategory.name);
            }
        } catch (error) {
            console.error('Error loading parent details:', error);
            // Hiển thị thông tin lỗi
            nameElement.textContent = `Danh mục cha ID: ${parentCategoryId} (Không thể tải thông tin)`;
            statusElement.textContent = 'Lỗi';
            statusElement.className = 'badge bg-warning ms-2';
        }
    }

    // Thêm danh mục cha hiện tại vào dropdown từ API
    async addCurrentParentCategoryFromAPI(select, currentCategoryId) {
        try {
            // Lấy thông tin danh mục hiện tại từ API
            const response = await this.ajax.get(`/categories/${currentCategoryId}`);
            if (response.result && response.result.parentCategoryId) {
                const parentCategoryId = response.result.parentCategoryId;
                
                // Kiểm tra xem option đã tồn tại chưa
                const optionExists = Array.from(select.options).some(option => 
                    option.value == parentCategoryId
                );
                
                if (!optionExists) {
                    // Lấy thông tin danh mục cha
                    const parentResponse = await this.ajax.get(`/categories/${parentCategoryId}`);
                    if (parentResponse.result) {
                        const parentCategory = parentResponse.result;
                        const option = document.createElement('option');
                        option.value = parentCategory.categoryId;
                        const statusText = parentCategory.isActive ? '' : ' (Không hoạt động)';
                        option.textContent = parentCategory.name + statusText + ' (Danh mục cha hiện tại)';
                        option.style.fontWeight = 'bold';
                        option.style.color = '#007bff';
                        select.appendChild(option);
                        console.log('✅ Added current parent category from API:', parentCategory.name);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading current parent category:', error);
        }
    }

    // Tìm danh mục cha hiện tại trong cây danh mục
    findCurrentParentCategory(categories, currentCategoryId) {
        for (const category of categories) {
            // Kiểm tra xem category có phải là parent của currentCategoryId không
            if (this.isAncestorOf(category, currentCategoryId)) {
                return category;
            }
            
            // Tìm trong children
            if (category.children && category.children.length > 0) {
                const found = this.findCurrentParentCategory(category.children, currentCategoryId);
                if (found) return found;
            }
        }
        return null;
    }

    buildCategoryTreeHTML(categories, level, parentPrefix = '') {
        let html = '';
        console.log(`Building level ${level} with ${categories.length} categories`);
        
        categories.forEach((category, index) => {
            const isLast = index === categories.length - 1;
            const currentPrefix = isLast ? parentPrefix + '   ' : parentPrefix + '│  ';
            
            console.log(`Category: ${category.name}, Level: ${level}, Has children: ${category.children ? category.children.length : 0}`);
            
            html += this.createCategoryRow(category, level, isLast, parentPrefix);
            
            // Add children if they exist
            if (category.children && category.children.length > 0) {
                console.log(`Adding ${category.children.length} children for ${category.name}`);
                html += this.buildCategoryTreeHTML(category.children, level + 1, currentPrefix);
            }
        });
        return html;
    }

    // Load category data for edit page
    async loadCategoryData() {
        const path = window.location.pathname;
        if (path.includes('/edit')) {
            const categoryId = this.getCategoryIdFromPath();
            console.log('Category ID from path:', categoryId);
            if (categoryId) {
                try {
                    const response = await this.ajax.get(`/categories/${categoryId}`);
                    console.log('API Response:', response);
                    console.log('Category data:', response.result);
                    console.log('Parent Category ID:', response.result?.parentCategoryId);
                    console.log('Category name:', response.result?.name);
                    console.log('Is Parent:', response.result?.isParent);
                    console.log('Is Active:', response.result?.isActive);
                    if (response.result) {
                        this.populateEditForm(response.result);
                    }
                } catch (error) {
                    console.error('Error loading category data:', error);
                    this.showNotification('Không thể tải thông tin danh mục', 'error');
                }
            }
        }
    }

    getCategoryIdFromPath() {
        const path = window.location.pathname;
        // Sửa regex để match URL pattern: /admin/categories/{id}/edit
        const match = path.match(/\/categories\/(\d+)\/edit/);
        return match ? match[1] : null;
    }

    populateEditForm(category) {
        console.log('Populating edit form with category:', category);

        // Set form data với validation
        const nameInput = document.getElementById('name');
        const parentSelect = document.getElementById('parentCategoryId');
        const isParentCheckbox = document.getElementById('isParent');
        const isActiveCheckbox = document.getElementById('isActive');

        if (nameInput) nameInput.value = category.name || '';
        if (isParentCheckbox) isParentCheckbox.checked = Boolean(category.isParent);
        if (isActiveCheckbox) isActiveCheckbox.checked = Boolean(category.isActive);

        // Set form category ID trước khi load parent categories
        const form = document.getElementById('categoryForm');
        if (form) {
            form.dataset.categoryId = category.categoryId;
        }

        console.log('Form values set:', {
            name: category.name,
            parentCategoryId: category.parentCategoryId,
            isParent: Boolean(category.isParent),
            isActive: Boolean(category.isActive),
            categoryId: category.categoryId
        });

        // Hiển thị thông tin danh mục cha hiện tại
        this.displayCurrentParentInfo(category);

        // Load parent categories dropdown sau khi set category ID
        this.loadParentCategoriesForEdit().then(() => {
            console.log('Parent categories loaded, setting values...');
            
            // Set parent category value sau khi đã load dropdown
            if (parentSelect) {
                if (category.parentCategoryId) {
                    console.log('Category has parent ID:', category.parentCategoryId);
                    
                    // Kiểm tra xem option có tồn tại không
                    const optionExists = Array.from(parentSelect.options).some(option => 
                        option.value == category.parentCategoryId
                    );
                    
                    console.log('Option exists check:', optionExists);
                    console.log('Available options:', Array.from(parentSelect.options).map(opt => ({value: opt.value, text: opt.textContent})));
                    
                    if (optionExists) {
                        parentSelect.value = category.parentCategoryId;
                        console.log('✅ Set parent category value to:', category.parentCategoryId);
                    } else {
                        console.warn('❌ Parent category option not found in dropdown:', category.parentCategoryId);
                        // Tạo option tạm thời nếu không tìm thấy
                        const tempOption = document.createElement('option');
                        tempOption.value = category.parentCategoryId;
                        tempOption.textContent = 'Danh mục cha hiện tại (không khả dụng)';
                        tempOption.disabled = true;
                        parentSelect.appendChild(tempOption);
                        parentSelect.value = category.parentCategoryId;
                        console.log('✅ Added temporary option and set value');
                    }
                } else {
                    parentSelect.value = '';
                    console.log('✅ No parent category, set to empty');
                }
            }
            
            // Disable parent select nếu là parent category
            // if (isParentCheckbox && isParentCheckbox.checked && parentSelect) {
            //     parentSelect.disabled = true;
            //     console.log('✅ Disabled parent select because isParent is checked');
            // }
        }).catch(error => {
            console.error('❌ Error loading parent categories:', error);
        });
    }

    updateCategoryStats(categories) {
        console.log('updateCategoryStats called with:', categories);
        
        if (Array.isArray(categories)) {
            // Update stats for list page
            const totalCategories = this.countAllCategories(categories);
            const activeCategories = this.countActiveCategories(categories);
            const parentCategories = this.countParentCategories(categories);
            const childCategories = totalCategories - parentCategories;
            
            console.log('Stats calculation:', {
                total: totalCategories,
                active: activeCategories,
                parent: parentCategories,
                child: childCategories
            });
            
            // Update list page stats
            const totalEl = document.getElementById('totalCategories');
            const activeEl = document.getElementById('activeCategories');
            const parentEl = document.getElementById('parentCategories');
            const childEl = document.getElementById('childCategories');
            
            if (totalEl) totalEl.textContent = totalCategories;
            if (activeEl) activeEl.textContent = activeCategories;
            if (parentEl) parentEl.textContent = parentCategories;
            if (childEl) childEl.textContent = childCategories;
        }
    }

    countAllCategories(categories) {
        let count = categories.length;
        categories.forEach(category => {
            if (category.children && category.children.length > 0) {
                count += this.countAllCategories(category.children);
            }
        });
        return count;
    }

    countActiveCategories(categories) {
        let count = 0;
        categories.forEach(category => {
            if (category.isActive) count++;
            if (category.children && category.children.length > 0) {
                count += this.countActiveCategories(category.children);
            }
        });
        return count;
    }

    countParentCategories(categories) {
        let count = 0;
        categories.forEach(category => {
            if (category.isParent) count++;
            if (category.children && category.children.length > 0) {
                count += this.countParentCategories(category.children);
            }
        });
        return count;
    }

    exportToExcel() {
        try {
            // Flatten all categories from tree structure
            const flattenCategories = (categories, level = 0, parentName = '') => {
                let result = [];
                categories.forEach(category => {
                    const categoryData = {
                        id: category.categoryId,
                        name: category.name,
                        level: level,
                        parent: parentName,
                        type: category.isParent ? 'Danh mục cha' : 'Danh mục con',
                        status: category.isActive ? 'Hoạt động' : 'Ngừng hoạt động'
                    };
                    result.push(categoryData);
                    
                    if (category.children && category.children.length > 0) {
                        result = result.concat(flattenCategories(category.children, level + 1, category.name));
                    }
                });
                return result;
            };

            const categories = this.cachedCategories;
            if (!categories || categories.length === 0) {
                this.showNotification('Không có dữ liệu để xuất Excel', 'warning');
                return;
            }

            const flatCategories = flattenCategories(categories);

            // Create CSV content
            let csv = '\uFEFF'; // UTF-8 BOM for proper encoding in Excel
            csv += 'ID,Tên danh mục,Cấp độ,Danh mục cha,Loại,Trạng thái\n';

            flatCategories.forEach(cat => {
                const indent = '  '.repeat(cat.level);
                csv += `${cat.id},"${indent}${cat.name.replace(/"/g, '""')}",${cat.level},"${cat.parent}","${cat.type}","${cat.status}"\n`;
            });

            // Create blob and download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            link.setAttribute('href', url);
            link.setAttribute('download', `categories_${dateStr}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification('Xuất Excel thành công', 'success');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.showNotification('Có lỗi xảy ra khi xuất Excel', 'error');
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

    // Expand/Collapse functions
    expandAll() {
        console.log('Expanding all categories...');
        // Xóa class collapsed từ tất cả các hàng con
        const childRows = document.querySelectorAll('.category-row[data-level]');
        childRows.forEach(row => {
            const level = parseInt(row.dataset.level);
            if (level > 0) {
                row.classList.remove('collapsed');
            }
        });
        
        // Đánh dấu tất cả các nút expand là expanded
        const expandButtons = document.querySelectorAll('.expand-btn');
        expandButtons.forEach(btn => {
            btn.classList.add('expanded');
            const expandIcon = btn.querySelector('.expand-icon');
            if (expandIcon) {
                expandIcon.style.transform = 'rotate(90deg)';
            }
        });
        
        this.showNotification('Đã mở rộng tất cả danh mục', 'success');
    }

    collapseAll() {
        console.log('Collapsing all categories...');
        // Thu gọn tất cả các hàng con (level > 0)
        const childRows = document.querySelectorAll('.category-row[data-level]');
        childRows.forEach(row => {
            const level = parseInt(row.dataset.level);
            if (level > 0) {
                row.classList.add('collapsed');
            }
        });
        
        // Reset tất cả các nút expand về trạng thái chưa expanded
        const expandButtons = document.querySelectorAll('.expand-btn');
        expandButtons.forEach(btn => {
            btn.classList.remove('expanded');
            const expandIcon = btn.querySelector('.expand-icon');
            if (expandIcon) {
                expandIcon.style.transform = 'rotate(0deg)';
            }
        });
        
        this.showNotification('Đã thu gọn tất cả danh mục', 'success');
    }

    toggleCategory(categoryId, forceExpand = null) {
        const categoryRow = document.querySelector(`tr[data-category-id="${categoryId}"]`);
        const expandBtn = document.querySelector(`.expand-btn[data-category-id="${categoryId}"]`);
        
        if (!categoryRow || !expandBtn) return;

        const isExpanded = expandBtn.classList.contains('expanded');
        const shouldExpand = forceExpand !== null ? forceExpand : !isExpanded;

        if (shouldExpand) {
            // Expand: show children
            this.showCategoryChildren(categoryId);
            expandBtn.classList.add('expanded');
            expandBtn.querySelector('.expand-icon').style.transform = 'rotate(90deg)';
        } else {
            // Collapse: hide children
            this.hideCategoryChildren(categoryId);
            expandBtn.classList.remove('expanded');
            expandBtn.querySelector('.expand-icon').style.transform = 'rotate(0deg)';
        }
    }

    showCategoryChildren(parentId) {
        const parentRow = document.querySelector(`tr[data-category-id="${parentId}"]`);
        if (!parentRow) return;

        const level = parseInt(parentRow.dataset.level);
        let nextRow = parentRow.nextElementSibling;
        
        while (nextRow && nextRow.classList.contains('category-row')) {
            const nextLevel = parseInt(nextRow.dataset.level);
            // Dừng khi gặp hàng cùng level hoặc level cao hơn
            if (nextLevel <= level) break;
            
            // Hiển thị tất cả các hàng con (level > level hiện tại)
            nextRow.classList.remove('collapsed');
            nextRow = nextRow.nextElementSibling;
        }
    }

    hideCategoryChildren(parentId) {
        const parentRow = document.querySelector(`tr[data-category-id="${parentId}"]`);
        if (!parentRow) return;

        const level = parseInt(parentRow.dataset.level);
        let nextRow = parentRow.nextElementSibling;
        
        while (nextRow && nextRow.classList.contains('category-row')) {
            const nextLevel = parseInt(nextRow.dataset.level);
            // Dừng khi gặp hàng cùng level hoặc level cao hơn
            if (nextLevel <= level) break;
            
            // Ẩn tất cả các hàng con
            nextRow.classList.add('collapsed');
            
            // Nếu hàng này có nút expand và đang expanded, thu gọn nó trước
            const expandBtn = nextRow.querySelector('.expand-btn');
            if (expandBtn && expandBtn.classList.contains('expanded')) {
                const childCategoryId = expandBtn.dataset.categoryId;
                // Đệ quy thu gọn các con của nó
                this.hideCategoryChildren(childCategoryId);
                expandBtn.classList.remove('expanded');
                const expandIcon = expandBtn.querySelector('.expand-icon');
                if (expandIcon) {
                    expandIcon.style.transform = 'rotate(0deg)';
                }
            }
            
            nextRow = nextRow.nextElementSibling;
        }
    }

    // Optimize hover events for better performance
    optimizeHoverEvents() {
        // Use passive event listeners for better performance
        const tableRows = document.querySelectorAll('.categories-page .table tbody tr');
        
        tableRows.forEach(row => {
            // Add passive mouse events
            row.addEventListener('mouseenter', this.handleRowHover.bind(this), { passive: true });
            row.addEventListener('mouseleave', this.handleRowLeave.bind(this), { passive: true });
        });
    }

    // Handle row hover with throttling
    handleRowHover(e) {
        const row = e.currentTarget;
        // Use requestAnimationFrame for smooth animation
        requestAnimationFrame(() => {
            row.classList.add('table-row-hover');
        });
    }

    // Handle row leave
    handleRowLeave(e) {
        const row = e.currentTarget;
        requestAnimationFrame(() => {
            row.classList.remove('table-row-hover');
        });
    }
}

// Global functions for HTML buttons
window.expandAll = function() {
    if (window.categoriesManager) {
        window.categoriesManager.expandAll();
    }
};

window.collapseAll = function() {
    if (window.categoriesManager) {
        window.categoriesManager.collapseAll();
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.categories-page') || document.querySelector('#categoryForm')) {
        window.categoriesManager = new CategoriesManager();
        
        // Category data loading is handled in CategoriesManager.init()
    }
});


// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoriesManager;
}
