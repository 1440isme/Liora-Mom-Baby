/**
 * Roles Management
 * Handles role CRUD operations and UI interactions
 */

class RolesManager {
    constructor() {
        this.ajax = window.adminAjax;
        this.currentPage = 0;
        this.currentSize = 10;
        this.currentFilters = {
            search: '',
            sortBy: 'name'
        };
        this.currentRoleId = null; // For view/edit/delete
        this.selectedRole = null; // For permission management
        this.permissionsByCategory = {}; // Cache for permissions by category
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadRoles();
        this.loadStats();
    }

    bindEvents() {
        // Search input with debounce
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 500));
        }

        // Sort options
        const sortSelect = document.getElementById('sortBy');
        if (sortSelect) {
            sortSelect.addEventListener('change', this.handleSort.bind(this));
        }

        // Refresh button
        const refreshBtn = document.querySelector('[onclick="location.reload()"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetFilters();
            });
        }

        // Delete confirmation
        const confirmDeleteBtn = document.getElementById('confirmDelete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', this.confirmDelete.bind(this));
        }

        // Permission management modal
        const managePermissionsBtn = document.getElementById('managePermissionsBtn');
        if (managePermissionsBtn) {
            managePermissionsBtn.addEventListener('click', this.showPermissionModal.bind(this));
        }

        const savePermissionsBtn = document.getElementById('savePermissions');
        if (savePermissionsBtn) {
            savePermissionsBtn.addEventListener('click', this.savePermissions.bind(this));
        }

        // Event delegation for action buttons
        document.addEventListener('click', (e) => {
            // View/Edit role - redirect to manage page
            if (e.target.closest('[data-action="view-role"]')) {
                const btn = e.target.closest('[data-action="view-role"]');
                window.location.href = `/admin/roles/manage?id=${btn.dataset.roleId}`;
            }

            // Delete role
            if (e.target.closest('[data-action="delete-role"]')) {
                const btn = e.target.closest('[data-action="delete-role"]');
                this.showDeleteModal(btn.dataset.roleId, btn.dataset.roleName);
            }
        });
    }

    async loadRoles(page = 0, size = 10) {
        try {
            const params = {
                page: page,
                size: size,
                ...this.currentFilters
            };

            const response = await this.ajax.get('/roles', params);

            if (response && response.result) {
                const rolesData = response.result.content || response.result;
                this.renderRoles(rolesData);

                // Update pagination if result is paginated
                if (response.result.totalPages !== undefined) {
                    this.updatePagination(response.result);
                }
            }
        } catch (error) {
            console.error('Error loading roles:', error);
            this.showNotification('Không thể tải danh sách vai trò', 'error');
            this.renderEmptyState();
        }
    }

    async loadStats() {
        try {
            // Gọi song song: roles, permissions (tất cả), users (tất cả)
            const [rolesRes, permsRes, usersRes] = await Promise.all([
                this.ajax.get('/roles'),
                this.ajax.get('/permissions'),
                this.ajax.get('/users')
            ]);

            // Tổng vai trò
            const roles = rolesRes && rolesRes.result ? (rolesRes.result.content || rolesRes.result) : [];
            const totalRoles = Array.isArray(roles) ? roles.length : 0;

            // Tổng quyền hạn (unique toàn hệ thống)
            const permissions = permsRes && permsRes.result ? (permsRes.result.content || permsRes.result) : [];
            const totalPermissions = Array.isArray(permissions) ? permissions.length : 0;

            // Tổng người dùng
            const users = usersRes && usersRes.result ? (usersRes.result.content || usersRes.result) : [];
            const totalUsers = Array.isArray(users) ? users.length : 0;

            // Cập nhật UI
            this.updateStats(totalRoles, totalPermissions, totalUsers);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStats(total, permissions, users) {
        const totalEl = document.getElementById('totalRoles');
        const permissionsEl = document.getElementById('totalPermissions');
        const usersEl = document.getElementById('totalUsers');

        if (totalEl) totalEl.textContent = total || 0;
        if (permissionsEl) permissionsEl.textContent = permissions || 0;
        if (usersEl) usersEl.textContent = users || 0;
    }

    renderRoles(roles) {
        const container = document.querySelector('.roles-container');
        if (!container) return;

        if (!roles || roles.length === 0) {
            this.renderEmptyState();
            return;
        }

        const html = roles.map(role => this.createRoleRow(role)).join('');
        container.innerHTML = html;
    }

    createRoleRow(role) {
        const permissionCount = role.permissions ? role.permissions.length : 0;

        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                                 style="width: 40px; height: 40px;">
                                <i class="mdi mdi-account-check-outline mdi-24px"></i>
                            </div>
                        </div>
                        <div>
                            <h6 class="mb-0">${role.name || 'N/A'}</h6>
                            ${role.description ? `<small class="text-muted">${role.description}</small>` : ''}
                        </div>
                    </div>
                </td>
                <td>
                    <span class="text-muted">${role.description || '-'}</span>
                </td>
                <td>
                    <span class="badge bg-info">
                        <i class="mdi mdi-shield-key-outline me-1"></i>
                        ${permissionCount} quyền
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" 
                                class="btn btn-outline-info" 
                                data-action="view-role"
                                data-role-id="${role.name}"
                                title="Xem chi tiết">
                            <i class="mdi mdi-eye-outline"></i>
                        </button>
                    
                        <button type="button" 
                                class="btn btn-outline-danger" 
                                data-action="delete-role"
                                data-role-id="${role.name}"
                                data-role-name="${role.name || ''}"
                                title="Xóa">
                            <i class="mdi mdi-delete-outline"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderEmptyState() {
        const container = document.querySelector('.roles-container');
        if (!container) return;

        container.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-5">
                    <div class="mb-3">
                        <i class="mdi mdi-account-check-outline mdi-48px text-muted"></i>
                    </div>
                    <h5 class="text-muted mb-3">Chưa có vai trò nào</h5>
                    <p class="text-muted mb-4">Bắt đầu bằng cách tạo vai trò đầu tiên cho hệ thống</p>
                    <button type="button" class="btn btn-primary text-white" onclick="window.location.href='/admin/roles/manage'">
                        <i class="mdi mdi-plus"></i> Thêm vai trò đầu tiên
                    </button>
                </td>
            </tr>
        `;
    }

    showDeleteModal(roleId, roleName) {
        this.currentRoleId = roleId;

        document.getElementById('deleteRoleName').textContent = roleName || 'vai trò này';
        document.getElementById('deleteRoleUserCount').textContent = '0'; // TODO: Get actual count

        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }

    async confirmDelete() {
        if (!this.currentRoleId) return;

        try {
            await this.ajax.delete(`/roles/${this.currentRoleId}`);
            this.showNotification('Xóa vai trò thành công', 'success');

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            if (modal) modal.hide();

            // Reload list
            this.loadRoles();
            this.loadStats();
        } catch (error) {
            console.error('Error deleting role:', error);
            this.showNotification('Không thể xóa vai trò. Có thể vai trò đang được sử dụng.', 'error');
        }
    }

    async handleSearch(e) {
        const query = e.target.value.trim();
        this.currentFilters.search = query;
        this.currentPage = 0;
        await this.loadRoles(this.currentPage, this.currentSize);
    }

    async handleSort(e) {
        const sortBy = e.target.value;
        this.currentFilters.sortBy = sortBy;
        this.currentPage = 0;
        await this.loadRoles(this.currentPage, this.currentSize);
    }

    resetFilters() {
        // Reset form values
        const searchInput = document.getElementById('search');
        const sortSelect = document.getElementById('sortBy');

        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'name';

        // Reset filters
        this.currentFilters = {
            search: '',
            sortBy: 'name'
        };
        this.currentPage = 0;

        // Reload data
        this.loadRoles();
        this.loadStats();

        this.showNotification('Đã làm mới dữ liệu', 'info');
    }

    updatePagination(pageInfo) {
        const paginationContainer = document.querySelector('#pagination');
        const paginationInfoContainer = document.querySelector('#paginationInfo');

        if (!paginationContainer) return;

        // Update pagination info
        if (paginationInfoContainer) {
            const start = pageInfo.number * pageInfo.size + 1;
            const end = Math.min((pageInfo.number + 1) * pageInfo.size, pageInfo.totalElements);
            paginationInfoContainer.innerHTML = `
                Hiển thị ${start} đến ${end} trong tổng số ${pageInfo.totalElements} vai trò
            `;
        }

        // Hide pagination if only one page
        if (pageInfo.totalPages <= 1) {
            paginationContainer.innerHTML = '';
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
        paginationContainer.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.closest('.page-link').dataset.page);
                if (page >= 0 && page < pageInfo.totalPages) {
                    this.currentPage = page;
                    this.loadRoles(page, this.currentSize);
                }
            });
        });
    }

    showNotification(message, type = 'info') {
        // Create toast container if not exists
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // Create unique toast ID
        const toastId = 'toast-' + Date.now();

        // Create toast HTML
        const toastHtml = `
            <div id="${toastId}" class="toast admin-toast admin-toast-${type} show" role="alert">
                <div class="toast-header">
                    <strong class="me-auto">
                        ${type === 'success' ? 'Thành công!' :
                type === 'error' ? 'Lỗi!' :
                    type === 'warning' ? 'Cảnh báo!' : 'Thông báo'}
                    </strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast">&times;</button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        // Add toast to container
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        // Auto remove after 4 seconds
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

    // Permission Management Methods
    async showPermissionModal() {
        try {
            // Load roles and permissions
            await this.loadRolesForPermissionModal();
            await this.loadPermissionsByCategory();

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('permissionModal'));
            modal.show();
        } catch (error) {
            console.error('Error showing permission modal:', error);
            this.showNotification('Không thể tải dữ liệu quyền hạn', 'error');
        }
    }

    async loadRolesForPermissionModal() {
        try {
            const response = await this.ajax.get('/roles');
            if (response && response.result) {
                const roles = response.result.content || response.result;
                this.renderRoleList(roles);
            }
        } catch (error) {
            console.error('Error loading roles for modal:', error);
            throw error;
        }
    }

    async loadPermissionsByCategory() {
        try {
            const response = await this.ajax.get('/roles/permissions/by-category');
            if (response && response.result) {
                this.permissionsByCategory = response.result;
                this.renderPermissionCategories();
            }
        } catch (error) {
            console.error('Error loading permissions by category:', error);
            throw error;
        }
    }

    renderRoleList(roles) {
        const container = document.getElementById('roleList');
        if (!container) return;

        const html = roles.map(role => `
            <a href="#" class="list-group-item list-group-item-action role-item" 
               data-role-name="${role.name}">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${role.name}</h6>
                    <small class="text-muted">${role.permissions ? role.permissions.length : 0} quyền</small>
                </div>
                <p class="mb-1 text-muted">${role.description || ''}</p>
            </a>
        `).join('');

        container.innerHTML = html;

        // Bind role selection events
        container.querySelectorAll('.role-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectRole(item.dataset.roleName);
            });
        });
    }

    renderPermissionCategories() {
        const container = document.getElementById('permissionCategories');
        if (!container) return;

        const html = Object.entries(this.permissionsByCategory).map(([category, permissions]) => `
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="mdi mdi-folder-outline me-2"></i>
                        ${this.getCategoryDisplayName(category)}
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${permissions.map(permission => `
                            <div class="col-md-6 mb-2">
                                <div class="form-check">
                                    <input class="form-check-input permission-checkbox" 
                                           type="checkbox" 
                                           value="${permission.name}"
                                           id="perm_${permission.name}">
                                    <label class="form-check-label" for="perm_${permission.name}">
                                        ${permission.description}
                                    </label>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    getCategoryDisplayName(category) {
        const categoryNames = {
            'PRODUCTS': 'Sản phẩm',
            'CATEGORIES': 'Danh mục',
            'BRANDS': 'Thương hiệu',
            'ORDERS': 'Đơn hàng',
            'REVIEWS': 'Đánh giá',
            'USERS': 'Người dùng',
            'ROLES': 'Vai trò',
            'PERMISSIONS': 'Quyền hạn',
            'BANNERS': 'Banner',
            'STATIC_PAGES': 'Trang tĩnh',
            'HEADER_FOOTER': 'Header & Footer',
            'DISCOUNTS': 'Mã giảm giá',
            'SYSTEM': 'Hệ thống'
        };
        return categoryNames[category] || category;
    }

    async selectRole(roleName) {
        try {
            // Update selected role
            this.selectedRole = roleName;

            // Update UI
            document.querySelectorAll('.role-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-role-name="${roleName}"]`).classList.add('active');

            // Load role permissions
            const response = await this.ajax.get(`/roles/${roleName}/permissions`);
            if (response && response.result) {
                const rolePermissions = response.result.map(p => p.name);
                this.updatePermissionCheckboxes(rolePermissions);
            }
        } catch (error) {
            console.error('Error selecting role:', error);
            this.showNotification('Không thể tải quyền hạn của vai trò', 'error');
        }
    }

    updatePermissionCheckboxes(rolePermissions) {
        document.querySelectorAll('.permission-checkbox').forEach(checkbox => {
            checkbox.checked = rolePermissions.includes(checkbox.value);
        });
    }

    async savePermissions() {
        if (!this.selectedRole) {
            this.showNotification('Vui lòng chọn vai trò', 'warning');
            return;
        }

        try {
            // Get selected permissions
            const selectedPermissions = Array.from(document.querySelectorAll('.permission-checkbox:checked'))
                .map(checkbox => checkbox.value);

            // Save permissions
            await this.ajax.put(`/roles/${this.selectedRole}/permissions`, selectedPermissions);

            this.showNotification('Cập nhật quyền hạn thành công', 'success');

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('permissionModal'));
            if (modal) modal.hide();

            // Reload data
            this.loadRoles();
            this.loadStats();
        } catch (error) {
            console.error('Error saving permissions:', error);
            this.showNotification('Không thể cập nhật quyền hạn', 'error');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.roles-page')) {
        window.rolesManager = new RolesManager();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RolesManager;
}

