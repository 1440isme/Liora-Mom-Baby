/**
 * Permissions List Management
 * Handles listing, filtering, sorting, and deleting permissions
 */

class PermissionsManager {
    constructor() {
        this.permissions = [];
        this.currentFilters = {
            search: ''
        };
        this.currentSort = 'name';
        this.deleteModal = null;
        this.permissionToDelete = null;

        this.init();
    }

    init() {
        this.deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        this.attachEventListeners();
        this.loadPermissions();
    }

    attachEventListeners() {
        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }

        // Sort
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.applyFilters();
            });
        }

        // Delete actions
        document.addEventListener('click', (e) => {
            // Delete permission
            if (e.target.closest('[data-action="delete-permission"]')) {
                const btn = e.target.closest('[data-action="delete-permission"]');
                this.showDeleteModal(btn.dataset.permissionId, btn.dataset.permissionName);
            }
        });

        // Confirm delete
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.deletePermission());
        }
    }

    async loadPermissions() {
        try {
            const response = await adminAjax.get('/permissions');
            this.permissions = response.result || [];
            this.applyFilters();
        } catch (error) {
            console.error('Error loading permissions:', error);
            AdminUtils.showError('Không thể tải danh sách quyền hạn');
            this.renderEmptyState('Không thể tải danh sách quyền hạn. Vui lòng thử lại.');
        }
    }

    applyFilters() {
        let filtered = [...this.permissions];

        // Apply search filter
        if (this.currentFilters.search) {
            filtered = filtered.filter(permission => {
                const searchStr = this.currentFilters.search;
                return (
                    permission.name?.toLowerCase().includes(searchStr) ||
                    permission.description?.toLowerCase().includes(searchStr)
                );
            });
        }

        // Apply sorting
        filtered = this.sortPermissions(filtered, this.currentSort);

        // Render
        this.renderPermissions(filtered);
        this.updateStats();
    }

    sortPermissions(permissions, sortBy) {
        return permissions.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'name_desc':
                    return (b.name || '').localeCompare(a.name || '');
                default:
                    return 0;
            }
        });
    }

    renderPermissions(permissions) {
        const container = document.querySelector('.permissions-container');
        if (!container) return;

        if (permissions.length === 0) {
            this.renderEmptyState();
            return;
        }

        container.innerHTML = permissions.map(permission => this.createPermissionRow(permission)).join('');
    }

    createPermissionRow(permission) {
        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                                 style="width: 40px; height: 40px;">
                                <i class="mdi mdi-shield-key-outline mdi-24px"></i>
                            </div>
                        </div>
                        <div>
                            <h6 class="mb-0">${permission.name || 'N/A'}</h6>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="text-muted">${permission.description || '-'}</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" 
                                class="btn btn-outline-info" 
                                onclick="window.location.href='/admin/permissions/manage?id=${encodeURIComponent(permission.name)}'"
                                title="Chỉnh sửa">
                            <i class="mdi mdi-pencil-outline"></i>
                        </button>
                        <button type="button" 
                                class="btn btn-outline-danger" 
                                data-action="delete-permission"
                                data-permission-id="${permission.name}"
                                data-permission-name="${permission.name || ''}"
                                title="Xóa">
                            <i class="mdi mdi-delete-outline"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderEmptyState(message = null) {
        const container = document.querySelector('.permissions-container');
        if (!container) return;

        const displayMessage = message ||
            (this.currentFilters.search ?
                'Không tìm thấy quyền hạn nào phù hợp với tìm kiếm của bạn' :
                'Chưa có quyền hạn nào trong hệ thống');

        container.innerHTML = `
            <tr>
                <td colspan="3" class="text-center py-5">
                    <div class="empty-state">
                        <i class="mdi mdi-shield-key-outline text-muted mb-3" style="font-size: 3rem;"></i>
                        <h5 class="text-muted mb-3">${displayMessage}</h5>
                        ${!this.currentFilters.search && !message ? `
                            <a href="/admin/permissions/manage" class="btn btn-primary text-white">
                                <i class="mdi mdi-plus me-1"></i> Thêm quyền hạn đầu tiên
                            </a>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    updateStats() {
        const totalElement = document.getElementById('totalPermissions');
        if (totalElement) {
            totalElement.textContent = this.permissions.length;
        }
    }

    showDeleteModal(permissionId, permissionName) {
        this.permissionToDelete = permissionId;
        document.getElementById('deletePermissionName').textContent = permissionName;
        this.deleteModal.show();
    }

    async deletePermission() {
        if (!this.permissionToDelete) return;

        try {
            const confirmBtn = document.getElementById('confirmDeleteBtn');
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xóa...';
            confirmBtn.disabled = true;

            await adminAjax.delete(`/permissions/${this.permissionToDelete}`);

            AdminUtils.showSuccess('Đã xóa quyền hạn thành công');
            this.deleteModal.hide();
            this.loadPermissions(); // Reload list

        } catch (error) {
            console.error('Error deleting permission:', error);
            AdminUtils.showError(error.message || 'Không thể xóa quyền hạn');
        } finally {
            const confirmBtn = document.getElementById('confirmDeleteBtn');
            confirmBtn.innerHTML = '<i class="mdi mdi-delete"></i> Xóa quyền hạn';
            confirmBtn.disabled = false;
            this.permissionToDelete = null;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PermissionsManager();
});

