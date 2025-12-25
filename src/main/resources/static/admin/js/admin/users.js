/**
 * Users List Management
 */
class UsersManager {
    constructor() {
        this.users = [];
        this.currentFilters = { search: '' };
        this.currentSort = 'createdAt_desc';
        this.deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        this.userToDelete = null;
        this.init();
    }

    init() {
        // Remove any existing date display elements that might have been created before
        const dateDisplay = document.getElementById('search-date-display');
        if (dateDisplay) {
            dateDisplay.remove();
        }

        this.attachEventListeners();
        this.loadUsers();
    }

    attachEventListeners() {
        // Global delete confirm button
        const confirmBtn = document.getElementById('confirmDeleteUser');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.deleteUser());
        }

        // Delegated actions
        document.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('[data-action="delete-user"]');
            if (deleteBtn) {
                const userId = deleteBtn.dataset.userId;
                const userName = deleteBtn.dataset.userName || '';
                this.showDeleteModal(userId, userName);
            }
        });

        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.currentFilters.search = e.target.value.toLowerCase().trim();
                this.applyFilters();
            }, 300));
        }

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Initialize datepickers
        this.initializeDatepickers();
    }

    async loadUsers() {
        try {
            const response = await adminAjax.get('/users');
            this.users = response.result || [];
            this.applyFilters();
        } catch (err) {
            console.error('Load users failed', err);
            AdminUtils.showError((err && err.status === 401) ? 'Bạn chưa đăng nhập hoặc không có quyền' : 'Không thể tải danh sách người dùng');
            this.renderEmptyState('Không thể tải danh sách người dùng');
        }
    }

    applyFilters() {
        let filtered = [...this.users];

        // search by name, username, email, phone
        if (this.currentFilters.search) {
            const q = this.currentFilters.search;
            filtered = filtered.filter(u =>
                (u.firstname + ' ' + u.lastname).toLowerCase().includes(q) ||
                (u.username || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.phone || '').toLowerCase().includes(q)
            );
        }

        // filter by role
        if (this.currentFilters.role) {
            filtered = filtered.filter(u =>
                (u.roles || []).some(r => r === this.currentFilters.role)
            );
        }

        // filter by status
        if (this.currentFilters.status) {
            if (this.currentFilters.status === 'ACTIVE') {
                filtered = filtered.filter(u => u.active === true);
            } else if (this.currentFilters.status === 'INACTIVE') {
                filtered = filtered.filter(u => u.active === false);
            }
        }

        // filter by date range (inclusive, normalize to start/end of day)
        if (this.currentFilters.dateFrom) {
            const fromDateRaw = this.parseDateFilter(this.currentFilters.dateFrom);
            if (fromDateRaw) {
                const fromDate = new Date(fromDateRaw.getFullYear(), fromDateRaw.getMonth(), fromDateRaw.getDate(), 0, 0, 0, 0);
                filtered = filtered.filter(u => {
                    if (!u.createdAt) return false;
                    const userDate = new Date(u.createdAt);
                    return userDate >= fromDate;
                });
            }
        }

        if (this.currentFilters.dateTo) {
            const toDateRaw = this.parseDateFilter(this.currentFilters.dateTo);
            if (toDateRaw) {
                const toDate = new Date(toDateRaw.getFullYear(), toDateRaw.getMonth(), toDateRaw.getDate(), 23, 59, 59, 999);
                filtered = filtered.filter(u => {
                    if (!u.createdAt) return false;
                    const userDate = new Date(u.createdAt);
                    return userDate <= toDate;
                });
            }
        }

        // sort
        filtered = this.sortUsers(filtered, this.currentSort);

        this.renderUsers(filtered);
    }

    sortUsers(users, sortBy) {
        return users.sort((a, b) => {
            switch (sortBy) {
                case 'createdAt_desc':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'createdAt_asc':
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                case 'name_asc':
                    return (a.firstname + ' ' + a.lastname).localeCompare(b.firstname + ' ' + b.lastname);
                case 'name_desc':
                    return (b.firstname + ' ' + b.lastname).localeCompare(a.firstname + ' ' + a.lastname);
                default:
                    return 0;
            }
        });
    }

    renderUsers(users) {
        const container = document.querySelector('.users-container');
        if (!container) return;
        if (!users || users.length === 0) {
            this.renderEmptyState();
            return;
        }
        container.innerHTML = users.map((u, index) => this.createRow(u, index)).join('');
    }

    createRow(u, index = 0) {
        const fullName = `${u.firstname || ''} ${u.lastname || ''}`.trim() || 'N/A';
        const rolesHtml = (u.roles && u.roles.length)
            ? u.roles.map(r => `<span class="badge bg-secondary">${r}</span>`).join(' ')
            : '<span class="text-muted">-</span>';
        const activeBadge = u.active ? '<span class="badge bg-success">Hoạt động</span>' : '<span class="badge bg-secondary">Không hoạt động</span>';
        const created = u.createdAt ? this.formatDate(u.createdAt) : '-';
        const avatar = u.avatar || 'https://placehold.co/40';

        return `
            <tr>
                <td class="text-center fw-bold">${index + 1}</td>
                <td>
                    <img src="${avatar}" alt="${fullName}" class="img-thumbnail rounded-circle" width="50" height="50" style="object-fit: cover;">
                </td>
                <td>
                    <div class="fw-bold">${fullName}</div>
                    <div><small class="text-muted me-2"><i class="mdi mdi-account-outline"></i> ${u.username || '-'}</small></div>
                    <div>
                        <small class="text-muted me-2"><i class="mdi mdi-email-outline"></i> ${u.email || '-'}</small>
                        ${u.phone ? `<small class="text-muted"><i class="mdi mdi-phone-outline"></i> ${u.phone}</small>` : ''}
                    </div>
                </td>
                <td>${rolesHtml}</td>
                <td>${activeBadge}</td>
                <td><div>${created}</div></td>
                <td>
                    <div class="btn-group" role="group">
                        <a href="/admin/users/${u.userId}/edit" class="btn btn-sm btn-outline-warning" title="Chỉnh sửa"><i class="mdi mdi-pencil-outline"></i></a>
                        <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-user" data-user-id="${u.userId}" data-user-name="${fullName}" title="Xóa"><i class="mdi mdi-delete-outline"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderEmptyState(message = null) {
        const container = document.querySelector('.users-container');
        if (!container) return;
        const text = message || 'Chưa có người dùng nào';
        container.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="mdi mdi-account-group-outline mdi-48px text-muted"></i>
                    <p class="mt-2 text-muted">${text}</p>
                    <a href="/admin/users/add" class="btn btn-primary text-white">Thêm người dùng đầu tiên</a>
                </td>
            </tr>
        `;
    }

    showDeleteModal(id, name) {
        this.userToDelete = id;
        const el = document.getElementById('deleteUserName');
        if (el) el.textContent = name;
        this.deleteModal.show();
    }

    async deleteUser() {
        if (!this.userToDelete) return;
        const btn = document.getElementById('confirmDeleteUser');
        const original = btn.innerHTML;
        try {
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xóa...';
            btn.disabled = true;
            await adminAjax.delete(`/users/${this.userToDelete}`);
            AdminUtils.showSuccess('Đã xóa người dùng');
            this.deleteModal.hide();
            this.loadUsers();
        } catch (e) {
            console.error(e);
            AdminUtils.showError('Xóa thất bại');
        } finally {
            btn.innerHTML = original;
            btn.disabled = false;
            this.userToDelete = null;
        }
    }

    formatDate(iso) {
        try {
            const d = new Date(iso);
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        } catch { return '-'; }
    }

    debounce(fn, wait) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    clearFilters() {
        // Clear all filter inputs
        const inputs = ['search', 'role', 'status', 'dateFrom', 'dateTo'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        // Remove any existing date display elements
        const dateDisplay = document.getElementById('search-date-display');
        if (dateDisplay) {
            dateDisplay.remove();
        }

        // Also remove any date overlays that might exist
        const dateOverlays = document.querySelectorAll('[class*="date-display-"]');
        dateOverlays.forEach(overlay => overlay.remove());

        // Reset filters and reapply
        this.currentFilters = { search: '' };
        this.applyFilters();

        // Update URL without filters
        const url = new URL(window.location);
        inputs.forEach(param => url.searchParams.delete(param));
        window.history.replaceState({}, '', url);
    }

    initializeDatepickers() {
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');

        console.log('Initializing datepickers:', { dateFrom: !!dateFrom, dateTo: !!dateTo });

        if (dateFrom) {
            this.setupDateInput(dateFrom, 'dateFrom');
        }

        if (dateTo) {
            this.setupDateInput(dateTo, 'dateTo');
        }
    }

    setupDateInput(element, fieldName) {
        if (!element) return;

        console.log('Setting up date input for:', fieldName);

        // Convert dd/mm/yyyy to yyyy-mm-dd for date input
        const toDateInput = (value) => {
            if (!value || !value.includes('/')) return value;
            const parts = value.split('/');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                return `${year}-${month}-${day}`;
            }
            return value;
        };

        // Initialize with proper format if value exists
        if (element.value) {
            element.value = toDateInput(element.value);
        }

        // Add change event listener for filtering
        element.addEventListener('change', () => {
            console.log('Date input changed:', fieldName, 'value:', element.value);

            // Update filter and apply
            this.currentFilters[fieldName] = element.value;
            this.applyFilters();
        });
    }

    formatDateForFilter(date) {
        if (!date) return null;
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    parseDateFilter(dateStr) {
        if (!dateStr) return null;

        // Handle yyyy-mm-dd format (from date input) safely in local time (avoid TZ shift)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [y, m, d] = dateStr.split('-').map(Number);
            const dt = new Date(y, m - 1, d);
            if (!isNaN(dt.getTime())) return dt;
        }

        // Handle dd/mm/yyyy format (fallback)
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                const year = parseInt(parts[2], 10);

                // Validate date
                if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
                    const dt = new Date(year, month, day);
                    if (!isNaN(dt.getTime())) {
                        return dt;
                    }
                }
            }
        }

        return null;
    }
}

/**
 * Users Add/Edit Form Management (AJAX)
 */
class UserFormManager {
    constructor() {
        this.form = document.querySelector('#userAddForm') || document.querySelector('#userEditForm') || document.querySelector('.user-form') || document.querySelector('form#roleFormDoesNotMatch');
        this.isAddPage = !!document.querySelector('#userAddForm');
        const pathMatch = window.location.pathname.match(/\/admin\/users\/(\d+)\/edit/);
        const qs = new URLSearchParams(window.location.search);
        const idFromQuery = qs.get('id');
        const idFromPathFallback = (() => {
            const parts = window.location.pathname.split('/').filter(Boolean);
            for (let i = parts.length - 1; i >= 0; i--) {
                if (/^\d+$/.test(parts[i])) return parts[i];
            }
            return null;
        })();
        this.isEditPage = !!document.querySelector('#userEditForm') || !!pathMatch || !!idFromQuery || !!idFromPathFallback;
        this.userId = (pathMatch && pathMatch[1]) || idFromQuery || idFromPathFallback || null;
        this.submitBtn = this.form ? this.form.querySelector('button[type="submit"]') : null;
        if (this.form) this.init();
    }

    async init() {
        console.log('[UserFormManager] init', { path: window.location.pathname, isAdd: this.isAddPage, isEdit: this.isEditPage, userId: this.userId });
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Avatar preview
        const avatarInput = document.getElementById('avatar');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => this.handleAvatarPreview(e));
        }

        // Password confirmation validation
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', (e) => this.handlePasswordConfirmation(e));
        }

        // Load roles for role selection
        await this.loadRoles();

        if (this.isEditPage && this.userId) {
            await this.loadUser(this.userId);
        }
    }

    async loadRoles() {
        try {
            const res = await adminAjax.get('/roles');
            const roles = res.result;

            // Load roles for single select (add user form)
            const roleSelect = document.getElementById('role');
            if (roleSelect) {
                roleSelect.innerHTML = '<option value="">Chọn vai trò</option>';
                roles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.name;
                    option.textContent = role.description || role.name;
                    roleSelect.appendChild(option);
                });
            }

            // Load roles for multiple select (edit user form)
            const rolesSelect = document.getElementById('roles');
            if (rolesSelect) {
                rolesSelect.innerHTML = '';
                roles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.name;
                    option.textContent = role.description || role.name;
                    rolesSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
        }
    }

    async loadUser(userId) {
        try {
            const res = await adminAjax.get(`/users/${userId}`);
            const u = res.result;
            const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = (val ?? ''); };
            set('username', u.username);
            const usernameInput = document.getElementById('username'); if (usernameInput) { usernameInput.disabled = true; usernameInput.classList.add('bg-light'); }
            set('firstName', u.firstname);
            set('lastName', u.lastname);
            set('email', u.email);
            set('phone', u.phone);
            // DOB formatting to yyyy-MM-dd
            const dobInput = document.getElementById('dob');
            if (dobInput) {
                let dobVal = '';
                if (u.dob) {
                    if (typeof u.dob === 'string') {
                        // Accept 'yyyy-MM-dd' or ISO 'yyyy-MM-ddTHH:mm:ss'
                        dobVal = u.dob.includes('T') ? u.dob.split('T')[0] : u.dob;
                    }
                }
                dobInput.value = dobVal;
            }
            const gender = document.getElementById('gender'); if (gender) gender.value = (u.gender === true ? 'MALE' : (u.gender === false ? 'FEMALE' : ''));
            const status = document.getElementById('status'); if (status) status.checked = !!u.active;
            const preview = document.getElementById('previewImg'); if (preview && u.avatar) preview.src = u.avatar;

            // Set roles for multiple select
            const rolesSelect = document.getElementById('roles');
            if (rolesSelect && u.roles) {
                // Clear all selections first
                Array.from(rolesSelect.options).forEach(option => option.selected = false);
                // Select user's roles
                u.roles.forEach(roleName => {
                    const option = Array.from(rolesSelect.options).find(opt => opt.value === roleName);
                    if (option) option.selected = true;
                });
            }
        } catch (e) {
            console.error('Failed to load user', e);
            AdminUtils.showError('Không thể tải thông tin người dùng');
        }
    }

    handleAvatarPreview(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const previewImg = document.getElementById('previewImg');
                if (previewImg) {
                    previewImg.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    handlePasswordConfirmation(e) {
        const password = document.getElementById('password')?.value || '';
        const confirmPassword = e.target.value;

        if (password !== confirmPassword) {
            e.target.setCustomValidity('Mật khẩu xác nhận không khớp');
            e.target.classList.add('is-invalid');
        } else {
            e.target.setCustomValidity('');
            e.target.classList.remove('is-invalid');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (!this.submitBtn) return;
        const originalHtml = this.submitBtn.innerHTML;
        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...';

        try {
            if (this.isAddPage) {
                await this.createUser();
                AdminUtils.showSuccess('Thêm người dùng thành công');
            } else if (this.isEditPage && this.userId) {
                await this.updateUser(this.userId);
                AdminUtils.showSuccess('Cập nhật người dùng thành công');
            }
            setTimeout(() => window.location.href = '/admin/users', 1200);
        } catch (err) {
            console.error('User form submit failed', err);
            AdminUtils.showError(err?.message || 'Không thể lưu người dùng');
        } finally {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = originalHtml;
        }
    }

    getValue(id) {
        return (document.getElementById(id)?.value || '').trim();
    }

    getCheckbox(id) {
        return !!document.getElementById(id)?.checked;
    }

    async createUser() {
        const username = this.getValue('username');
        const password = this.getValue('password');
        const confirmPassword = this.getValue('confirmPassword');
        const email = this.getValue('email');
        const phone = this.getValue('phone') || null;
        const firstname = this.getValue('firstName');
        const lastname = this.getValue('lastName');
        const dob = this.getValue('dob');
        const genderRaw = this.getValue('gender');
        const role = this.getValue('role');
        const active = this.getCheckbox('status');
        const avatarFile = document.getElementById('avatar')?.files?.[0] || null;

        if (!username) throw new Error('Vui lòng nhập tên đăng nhập');
        if (!password || password.length < 8) throw new Error('Mật khẩu tối thiểu 8 ký tự');
        if (!confirmPassword || confirmPassword !== password) throw new Error('Mật khẩu xác nhận không khớp');
        if (!email) throw new Error('Vui lòng nhập email');
        if (!firstname || !lastname) throw new Error('Vui lòng nhập họ và tên');
        if (!role) throw new Error('Vui lòng chọn vai trò');

        const payload = {
            username,
            password,
            email,
            phone,
            firstname,
            lastname,
            dob: dob || null,
            gender: this.mapGenderToBoolean(genderRaw),
            role: role,
            active: active,
            avatar: null
        };

        if (avatarFile) {
            try {
                const avatarUrl = await this.uploadAvatar(avatarFile);
                payload.avatar = avatarUrl;
            } catch (e) {
                console.warn('Upload avatar failed, continue without avatar', e);
                throw new Error('Lỗi khi upload ảnh đại diện: ' + e.message);
            }
        }

        await adminAjax.post('/users', payload);
    }

    async updateUser(userId) {
        const password = this.getValue('password');
        const confirmPassword = this.getValue('confirmPassword');
        const email = this.getValue('email');
        const phone = this.getValue('phone') || null;
        const firstname = this.getValue('firstName');
        const lastname = this.getValue('lastName');
        const dob = this.getValue('dob') || this.getValue('dateOfBirth');
        const genderRaw = this.getValue('gender');
        const active = this.getCheckbox('status');
        const avatarFile = document.getElementById('avatar')?.files?.[0] || null;

        // Get selected roles
        const rolesSelect = document.getElementById('roles');
        const selectedRoles = rolesSelect ? Array.from(rolesSelect.selectedOptions).map(option => option.value) : [];

        if (password || confirmPassword) {
            if (password.length < 8) throw new Error('Mật khẩu tối thiểu 8 ký tự');
            if (password !== confirmPassword) throw new Error('Mật khẩu xác nhận không khớp');
        }

        const payload = {
            password: password || null,
            email: email || null,
            phone,
            firstname,
            lastname,
            dob: dob || null,
            gender: this.mapGenderToBoolean(genderRaw),
            active: typeof active === 'boolean' ? active : null,
            roles: selectedRoles,
            avatar: null
        };

        if (avatarFile) {
            try {
                const avatarUrl = await this.uploadAvatar(avatarFile);
                payload.avatar = avatarUrl;
            } catch (e) {
                console.warn('Upload avatar failed, continue without avatar', e);
                throw new Error('Lỗi khi upload ảnh đại diện: ' + e.message);
            }
        }

        await adminAjax.put(`/users/${userId}`, payload);
    }

    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log('Starting avatar upload for file:', file.name, 'Size:', file.size, 'Type:', file.type);

            const response = await fetch('/admin/api/upload/users/avatar', {
                method: 'POST',
                body: formData
            });

            console.log('Avatar upload response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Avatar upload failed:', response.status, errorText);
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('Avatar upload response:', result);

            // Kiểm tra cấu trúc response và xử lý lỗi
            if (result && result.result && result.result.avatarUrl) {
                return result.result.avatarUrl;
            } else if (result && result.avatarUrl) {
                return result.avatarUrl;
            } else {
                console.error('Unexpected avatar upload response structure:', result);
                throw new Error('Unexpected response structure from avatar upload API');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            throw error;
        }
    }

    mapGenderToBoolean(g) {
        if (!g) return null;
        const val = g.toUpperCase();
        if (val === 'MALE' || val === 'M' || val === 'TRUE') return true;
        if (val === 'FEMALE' || val === 'F' || val === 'FALSE') return false;
        return null;
    }
}

// Stats and Filters for Users list
class UsersFilters {
    static getFiltersFromDOM() {
        const search = (document.getElementById('search')?.value || '').trim().toLowerCase();
        const role = (document.getElementById('role')?.value || '').trim();
        const status = (document.getElementById('status')?.value || '').trim();
        const dateFrom = (document.getElementById('dateFrom')?.value || '').trim();
        const dateTo = (document.getElementById('dateTo')?.value || '').trim();
        return { search, role, status, dateFrom, dateTo };
    }

    static apply(users, filters) {
        let result = [...users];
        if (filters.search) {
            const q = filters.search;
            result = result.filter(u =>
                (u.firstname + ' ' + u.lastname).toLowerCase().includes(q) ||
                (u.username || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.phone || '').toLowerCase().includes(q)
            );
        }
        if (filters.role) {
            result = result.filter(u => (u.roles || []).some(r => r === filters.role));
        }
        if (filters.status) {
            if (filters.status === 'ACTIVE') result = result.filter(u => u.active === true);
            else if (filters.status === 'INACTIVE') result = result.filter(u => u.active === false);
            else if (filters.status === 'BANNED') result = result.filter(() => false); // no banned flag in entity
        }
        if (filters.dateFrom) {
            const from = new Date(filters.dateFrom);
            result = result.filter(u => u.createdAt && new Date(u.createdAt) >= from);
        }
        if (filters.dateTo) {
            const to = new Date(filters.dateTo);
            result = result.filter(u => u.createdAt && new Date(u.createdAt) <= to);
        }
        return result;
    }

    static updateStats(allUsers) {
        const total = allUsers.length;
        const active = allUsers.filter(u => u.active === true).length;
        const admins = allUsers.filter(u => (u.roles || []).some(r => r === 'ADMIN')).length;
        // New users (7 days)
        const now = new Date();
        const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        const newUsers = allUsers.filter(u => u.createdAt && new Date(u.createdAt) >= sevenDaysAgo).length;
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
        set('totalUsers', total);
        set('activeUsers', active);
        set('adminUsers', admins);
        set('newUsers', newUsers);
    }
}

// Hook into UsersManager
(function () {
    if (typeof UsersManager === 'undefined') return;
    const origLoad = UsersManager.prototype.loadUsers;
    UsersManager.prototype.loadUsers = async function (page = 0, size = 10) {
        await origLoad.call(this, page, size);
        // After load, keep a copy of all users for filters/stats
        const list = this.users || []; // this.users populated in loadUsers
        UsersFilters.updateStats(list);
        this.applyFilters = () => {
            // Get filters from DOM
            this.currentFilters = {
                search: document.getElementById('search')?.value?.toLowerCase().trim() || '',
                role: document.getElementById('role')?.value || '',
                status: document.getElementById('status')?.value || '',
                dateFrom: document.getElementById('dateFrom')?.value || '',
                dateTo: document.getElementById('dateTo')?.value || ''
            };

            // Apply filters using the main logic
            let filtered = [...list];

            // search by name, username, email, phone
            if (this.currentFilters.search) {
                const q = this.currentFilters.search;
                filtered = filtered.filter(u =>
                    (u.firstname + ' ' + u.lastname).toLowerCase().includes(q) ||
                    (u.username || '').toLowerCase().includes(q) ||
                    (u.email || '').toLowerCase().includes(q) ||
                    (u.phone || '').toLowerCase().includes(q)
                );
            }

            // filter by role
            if (this.currentFilters.role) {
                filtered = filtered.filter(u =>
                    (u.roles || []).some(r => r === this.currentFilters.role)
                );
            }

            // filter by status
            if (this.currentFilters.status) {
                if (this.currentFilters.status === 'ACTIVE') {
                    filtered = filtered.filter(u => u.active === true);
                } else if (this.currentFilters.status === 'INACTIVE') {
                    filtered = filtered.filter(u => u.active === false);
                }
            }

            // filter by date range
            if (this.currentFilters.dateFrom) {
                const fromDate = this.parseDateFilter(this.currentFilters.dateFrom);
                if (fromDate) {
                    filtered = filtered.filter(u => {
                        if (!u.createdAt) return false;
                        const userDate = new Date(u.createdAt);
                        return userDate >= fromDate;
                    });
                }
            }

            if (this.currentFilters.dateTo) {
                const toDate = this.parseDateFilter(this.currentFilters.dateTo);
                if (toDate) {
                    filtered = filtered.filter(u => {
                        if (!u.createdAt) return false;
                        const userDate = new Date(u.createdAt);
                        return userDate <= toDate;
                    });
                }
            }

            // sort
            filtered = this.sortUsers(filtered, this.currentSort);

            this.renderUsers(filtered);
        };
        // bind filter events
        const ids = ['search', 'role', 'status', 'dateFrom', 'dateTo'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const evt = (id === 'search') ? 'input' : 'change';
            el.addEventListener(evt, () => this.applyFilters());
        });
        // initial apply
        this.applyFilters();
    };
})();

// Fallback adminAjax if global not present
(function () {
    if (typeof window.adminAjax === 'undefined') {
        const baseURL = '/admin/api';
        const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
        const request = async (method, url, body, extraHeaders) => {
            const qs = (params) => params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
            const isGet = method === 'GET';
            const res = await fetch(baseURL + url + (isGet && body ? qs(body) : ''), {
                method,
                headers: { ...headers, ...(extraHeaders || {}) },
                body: isGet ? undefined : (body ? JSON.stringify(body) : undefined)
            });
            const ct = res.headers.get('content-type') || '';
            const data = ct.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) {
                throw new Error((data && data.message) || 'Request failed');
            }
            return data;
        };
        window.adminAjax = {
            get: (url, params = {}) => request('GET', url, params),
            post: (url, data = {}) => request('POST', url, data),
            put: (url, data = {}) => request('PUT', url, data),
            delete: (url) => request('DELETE', url),
            uploadFile: async (file, type = 'image') => {
                const fd = new FormData(); fd.append('file', file); fd.append('type', type);
                const res = await fetch(baseURL + '/upload', { method: 'POST', body: fd });
                const ct = res.headers.get('content-type') || '';
                const data = ct.includes('application/json') ? await res.json() : await res.text();
                if (!res.ok) throw new Error((data && data.message) || 'Upload failed');
                return data;
            }
        };
        console.log('[users.js] Fallback adminAjax initialized');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // Remove any existing date display elements immediately
    const dateDisplay = document.getElementById('search-date-display');
    if (dateDisplay) {
        dateDisplay.remove();
    }

    // Remove any date overlays
    const dateOverlays = document.querySelectorAll('[class*="date-display-"]');
    dateOverlays.forEach(overlay => overlay.remove());

    // Initialize list page manager if container present
    if (document.querySelector('.users-container')) {
        new UsersManager();
    }
    // Initialize form manager on add/edit pages
    const isEditPath = !!window.location.pathname.match(/\/admin\/users\/(\d+)\/edit/);
    if (document.querySelector('#userAddForm') || document.querySelector('#userEditForm') || isEditPath) {
        new UserFormManager();
    }
});
