// User Info Page JavaScript
class UserInfoManager {
    constructor() {
        this.currentUser = null;
        this.addAddressModalInstance = null;
        // Cache system cho tối ưu hiệu năng
        this.provincesCache = null;
        this.wardsCacheByProvince = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 phút
        this.cacheTimestamp = new Map();
        this.currentEditingAddressId = null;
        // Pagination for orders
        this.currentOrderPage = 0;
        this.orderPageSize = 5;
        this.totalOrderPages = 0;
        this.init();
    }

    init() {
        this.loadUserInfo();
        this.bindEvents();
        this.handleHashNavigation();
        // Dọn dẹp cache hết hạn mỗi 1 phút
        setInterval(() => this.clearExpiredCache(), 60000);
    }

    async loadUserInfo() {
        // Always display loading, but make it resilient with timeout and finally-hide
        this.showLoading();
        const hideLoadingSafely = () => { try { this.hideLoading(); } catch (_) { } };

        let timeoutId;
        const abortController = new AbortController();
        const MAX_WAIT_MS = 8000; // 8s timeout
        timeoutId = setTimeout(() => {
            try { abortController.abort(); } catch (_) { }
            hideLoadingSafely();
            this.showToast('Mạng chậm, vui lòng thử lại hoặc tải lại trang', 'info');
        }, MAX_WAIT_MS);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                hideLoadingSafely();
                this.showError('Vui lòng đăng nhập để xem thông tin cá nhân');
                try { window.location.href = '/home'; } catch (_) { }
                return;
            }

            const response = await fetch('/users/myInfo', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: abortController.signal
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    hideLoadingSafely();
                    this.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    try { window.location.href = '/home'; } catch (_) { }
                    return;
                }
                throw new Error('Failed to load user info');
            }

            const data = await response.json();
            this.currentUser = data.result;
            // Sync lightweight user to localStorage for header rendering
            try {
                const existing = (() => { try { return JSON.parse(localStorage.getItem('liora_user')) || {}; } catch (_) { return {}; } })();
                const liteUser = {
                    username: this.currentUser.username,
                    name: `${this.currentUser.firstname || ''} ${this.currentUser.lastname || ''}`.trim(),
                    roles: existing.roles,
                    isAdmin: existing.isAdmin === true || (Array.isArray(existing.roles) && (existing.roles.includes('ADMIN') || existing.roles.includes('MANAGER')))
                };
                localStorage.setItem('liora_user', JSON.stringify(liteUser));
                if (window.app && typeof window.app.updateUserDisplay === 'function') {
                    window.app.updateUserDisplay();
                }
            } catch (_) { }

            this.populateUserData();
            this.loadOrderStats();
        } catch (error) {
            console.error('Error loading user info:', error);
            this.showError('Không thể tải thông tin người dùng');
        }
        finally {
            if (timeoutId) { try { clearTimeout(timeoutId); } catch (_) { } }
            hideLoadingSafely();
        }
    }

    populateUserData() {
        if (!this.currentUser) return;


        // Update profile header
        this.updateElement('profileName', this.getFullName());
        this.updateElement('profileEmail', this.currentUser.email || 'Chưa cập nhật');

        // Update profile avatar
        const avatar = document.getElementById('profileAvatar');
        if (this.currentUser.avatar) {
            avatar.src = this.currentUser.avatar;
        } else {
            avatar.src = 'https://placehold.co/300x300';
        }

        // Update profile stats (mock data for now)
        this.updateElement('totalOrders', '0');
        this.updateElement('totalSpent', '0');
        this.updateElement('memberSince', this.formatDate(this.currentUser.createdAt || this.currentUser.createdDate));
        this.updateElement('memberSinceText', this.formatDate(this.currentUser.createdAt || this.currentUser.createdDate));

        // Update personal information
        this.updateElement('displayName', this.getFullName());
        this.updateElement('displayEmail', this.currentUser.email || 'Chưa cập nhật');
        this.updateElement('displayPhone', this.currentUser.phone || 'Chưa cập nhật');
        this.updateElement('displayDob', this.formatDate(this.currentUser.dateOfBirth || this.currentUser.dob));
        this.updateElement('displayGender', this.getGenderText());
    }

    getFullName() {
        const firstname = this.currentUser.firstname || '';
        const lastname = this.currentUser.lastname || '';
        return `${firstname} ${lastname}`.trim() || this.currentUser.username || 'Chưa cập nhật';
    }

    getGenderText() {
        if (this.currentUser.gender === null || this.currentUser.gender === undefined) {
            return 'Chưa cập nhật';
        }
        if (this.currentUser.gender === true) {
            return 'Nam';
        } else if (this.currentUser.gender === false) {
            return 'Nữ';
        } else if (this.currentUser.gender === 'Nam') {
            return 'Nam';
        } else if (this.currentUser.gender === 'Nữ') {
            return 'Nữ';
        } else {
            return 'Chưa cập nhật';
        }
    }

    formatDate(date) {
        if (!date) return 'Chưa cập nhật';
        return new Date(date).toLocaleDateString('vi-VN');
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    bindEvents() {
        // Edit form submission
        const editForm = document.getElementById('profileEditForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        }

        // Tab switching
        const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleTabSwitch(e));
        });

        // Hash change event
        window.addEventListener('hashchange', () => {
            this.handleHashNavigation();
        });

        // Add Address modal events - Custom modal không cần Bootstrap events
        const addAddressModalEl = document.getElementById('addAddressModal');
        if (addAddressModalEl) {
            // Click outside để đóng modal
            addAddressModalEl.addEventListener('click', (e) => {
                if (e.target === addAddressModalEl) {
                    closeAddressModal();
                }
            });
        }

        // Edit Address modal events
        const editAddressModalEl = document.getElementById('editAddressModal');
        if (editAddressModalEl) {
            // Click outside để đóng modal
            editAddressModalEl.addEventListener('click', (e) => {
                if (e.target === editAddressModalEl) {
                    this.closeEditAddressModal();
                }
            });
        }

        // Province change -> load districts then wards
        const provinceSelect = document.getElementById('addrProvince');
        if (provinceSelect) {
            provinceSelect.addEventListener('change', (e) => {
                const provinceId = parseInt(e.target.value, 10);
                this.loadDistricts(provinceId);
                const wardSelect = document.getElementById('addrWard');
                if (wardSelect) {
                    wardSelect.innerHTML = '<option value="">Chọn Quận/Huyện trước</option>';
                    wardSelect.disabled = true;
                }
            });
        }

        // Edit Province change -> load districts (then wards when district changes)
        const editProvinceSelect = document.getElementById('editAddrProvince');
        if (editProvinceSelect) {
            editProvinceSelect.addEventListener('change', (e) => {
                const provinceId = parseInt(e.target.value, 10);
                this.loadEditDistricts(provinceId);
                const editWardSelect = document.getElementById('editAddrWard');
                if (editWardSelect) {
                    editWardSelect.innerHTML = '<option value="">Chọn Quận/Huyện trước</option>';
                    editWardSelect.disabled = true;
                }
            });
        }
        // Edit District change -> load wards
        const editDistrictSelect = document.getElementById('editAddrDistrict');
        if (editDistrictSelect) {
            editDistrictSelect.addEventListener('change', (e) => {
                const districtId = parseInt(e.target.value, 10);
                this.loadEditWards(districtId);
            });
        }

        // Submit add address
        const submitAddBtn = document.getElementById('btnSubmitAddAddress');
        if (submitAddBtn) {
            submitAddBtn.addEventListener('click', () => this.submitAddAddress());
        }

        // Submit edit address
        const submitEditBtn = document.getElementById('btnSubmitEditAddress');
        if (submitEditBtn) {
            submitEditBtn.addEventListener('click', () => this.submitEditAddress());
        }

        // Submit change password
        const submitChangePasswordBtn = document.getElementById('btnSubmitChangePassword');
        if (submitChangePasswordBtn) {
            submitChangePasswordBtn.addEventListener('click', () => this.submitChangePassword());
        }

        // Submit delete account
        const submitDeleteAccountBtn = document.getElementById('btnConfirmDeleteAccount');
        if (submitDeleteAccountBtn) {
            submitDeleteAccountBtn.addEventListener('click', () => this.submitDeleteAccount());
        }

        // Enable/disable delete account button based on checkbox
        const confirmDeleteCheckbox = document.getElementById('confirmDeleteAccount');
        if (confirmDeleteCheckbox) {
            confirmDeleteCheckbox.addEventListener('change', (e) => {
                const submitBtn = document.getElementById('btnConfirmDeleteAccount');
                if (submitBtn) {
                    submitBtn.disabled = !e.target.checked;
                }
            });
        }

        // Change Password modal events
        const changePasswordModalEl = document.getElementById('changePasswordModal');
        if (changePasswordModalEl) {
            // Click outside để đóng modal
            changePasswordModalEl.addEventListener('click', (e) => {
                if (e.target === changePasswordModalEl) {
                    this.closeChangePasswordModal();
                }
            });
        }

        // Delete Account modal events
        const deleteAccountModalEl = document.getElementById('deleteAccountModal');
        if (deleteAccountModalEl) {
            // Click outside để đóng modal
            deleteAccountModalEl.addEventListener('click', (e) => {
                if (e.target === deleteAccountModalEl) {
                    this.closeDeleteAccountModal();
                }
            });
        }
    }

    handleEditSubmit(e) {
        e.preventDefault();

        if (!this.currentUser) {
            this.showError('Không thể cập nhật thông tin');
            return;
        }

        // Validation
        const name = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const dob = document.getElementById('editDob').value;
        const gender = document.getElementById('editGender').value;

        // Validate required fields
        if (!name) {
            this.showError('Vui lòng nhập họ và tên');
            document.getElementById('editName').focus();
            return;
        }

        if (!email) {
            this.showError('Vui lòng nhập email');
            document.getElementById('editEmail').focus();
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('Email không hợp lệ');
            document.getElementById('editEmail').focus();
            return;
        }

        // Validate phone format (Vietnamese phone number)
        if (phone && !/^(\+84|84|0)[1-9][0-9]{8,9}$/.test(phone.replace(/\s/g, ''))) {
            this.showError('Số điện thoại không hợp lệ');
            document.getElementById('editPhone').focus();
            return;
        }

        // Validate date of birth
        if (dob) {
            const dobDate = new Date(dob);
            const today = new Date();
            const age = today.getFullYear() - dobDate.getFullYear();
            if (age < 6 || age > 120) {
                this.showError('Tuổi phải từ 6 đến 120');
                document.getElementById('editDob').focus();
                return;
            }
        }

        const formData = {
            firstname: name.split(' ')[0] || '',
            lastname: name.split(' ').slice(1).join(' ') || '',
            email: email,
            phone: phone || null,
            dob: dob ? new Date(dob).toISOString().split('T')[0] : null,
            gender: gender === 'Nam' ? true : gender === 'Nữ' ? false : null
        };

        this.updateUserInfo(formData);
    }

    async updateUserInfo(formData) {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showError('Vui lòng đăng nhập để cập nhật thông tin');
                return;
            }

            // Show loading state
            const submitBtn = document.querySelector('#profileEditForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang cập nhật...';
            }

            const response = await fetch('/users/myInfo', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || 'Không thể cập nhật thông tin';

                if (response.status === 400) {
                    this.showError(errorMessage);
                } else if (response.status === 401 || response.status === 403) {
                    this.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    setTimeout(() => {
                        window.location.href = '/home';
                    }, 2000);
                } else {
                    this.showError(errorMessage);
                }
                return;
            }

            const data = await response.json();
            this.currentUser = data.result;

            // Re-sync header display after update
            try {
                const existing = (() => { try { return JSON.parse(localStorage.getItem('liora_user')) || {}; } catch (_) { return {}; } })();
                const liteUser = {
                    username: this.currentUser.username,
                    name: `${this.currentUser.firstname || ''} ${this.currentUser.lastname || ''}`.trim(),
                    roles: existing.roles,
                    isAdmin: existing.isAdmin === true || (Array.isArray(existing.roles) && (existing.roles.includes('ADMIN') || existing.roles.includes('MANAGER')))
                };
                localStorage.setItem('liora_user', JSON.stringify(liteUser));
                if (window.app && typeof window.app.updateUserDisplay === 'function') {
                    window.app.updateUserDisplay();
                }
                // Also broadcast login to ensure any listeners update their state on this page
                document.dispatchEvent(new CustomEvent('user:login', { detail: liteUser }));
            } catch (_) { }

            this.populateUserData();
            this.cancelEdit();
            this.showToast('Thông tin đã được cập nhật thành công!', 'success');
        } catch (error) {
            console.error('Error updating user info:', error);
            this.showError('Không thể cập nhật thông tin. Vui lòng thử lại sau.');
        } finally {
            // Re-enable submit button
            const submitBtn = document.querySelector('#profileEditForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';
            }
        }
    }

    handleTabSwitch(e) {
        const tabId = e.target.getAttribute('data-bs-target');

        // Load data for specific tabs
        if (tabId === '#orders') {
            this.loadOrders();
        } else if (tabId === '#address') {
            this.loadAddresses();
        }
    }

    handleHashNavigation() {
        const hash = window.location.hash;
        if (hash === '#orders') {
            // Tìm và click vào tab orders
            const ordersTab = document.querySelector('[data-bs-target="#orders"]');
            if (ordersTab) {
                ordersTab.click();
            }
        } else if (hash === '#address') {
            // Tìm và click vào tab address
            const addressTab = document.querySelector('[data-bs-target="#address"]');
            if (addressTab) {
                addressTab.click();
            }
        }
    }

    async loadOrders(page = 0) {
        const ordersContainer = document.getElementById('ordersList');
        if (!ordersContainer) return;

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showError('Vui lòng đăng nhập để xem lịch sử đơn hàng');
                return;
            }

            // Show loading state
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="mdi mdi-loading mdi-spin"></i>
                    <h5>Đang tải đơn hàng...</h5>
                    <p>Vui lòng chờ trong giây lát</p>
                </div>
            `;

            const response = await fetch(`/users/myOrdersWithProducts?page=${page}&size=${this.orderPageSize}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    this.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    return;
                }
                throw new Error('Failed to load orders');
            }

            const data = await response.json();
            console.log('Orders API response:', data);
            const paginatedData = data.result;
            const ordersWithProducts = paginatedData.content || [];

            // Update pagination info
            this.currentOrderPage = paginatedData.currentPage;
            this.totalOrderPages = paginatedData.totalPages;

            if (ordersWithProducts.length === 0 && page === 0) {
                ordersContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="mdi mdi-shopping"></i>
                        <h5>Chưa có đơn hàng nào</h5>
                        <p>Hãy mua sắm để xem lịch sử đơn hàng của bạn</p>
                        <a href="/" class="btn btn-primary">Mua sắm ngay</a>
                    </div>
                `;
            } else {
                const ordersHTML = await Promise.all(
                    ordersWithProducts.map(async orderWithProduct =>
                        await this.createCompactOrderCard(orderWithProduct)
                    )
                );
                const paginationHTML = this.createPaginationHTML(paginatedData);
                ordersContainer.innerHTML = ordersHTML.join('') + paginationHTML;
            }

        } catch (error) {
            this.showToast('Không thể tải lịch sử đơn hàng', 'error');
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="mdi mdi-alert"></i>
                    <h5>Lỗi tải đơn hàng</h5>
                    <p>Vui lòng thử lại sau</p>
                    <button class="btn btn-primary" onclick="userInfoManager.loadOrders()">Thử lại</button>
                </div>
            `;
        }
    }

    async createCompactOrderCard(orderWithProduct) {
        const order = orderWithProduct.order;
        const firstProduct = orderWithProduct.firstProduct;
        const totalProducts = orderWithProduct.totalProducts;

        const orderDate = new Date(order.orderDate).toLocaleDateString('vi-VN');
        const totalAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(order.total);

        const statusClass = this.getOrderStatusClass(order.orderStatus);
        const statusText = this.getOrderStatusText(order.orderStatus);
        const reviewStatus = await this.checkOrderReviewStatus(order.idOrder);

        return `
            <div class="compact-order-card clickable-order" data-order-id="${order.idOrder}" onclick="userInfoManager.viewOrderDetail(${order.idOrder})">
                <div class="compact-order-header">
                    <div class="order-basic-info">
                        <h5 class="order-id">Đơn hàng #${order.idOrder}</h5>
                        <p class="order-date">
                            <i class="mdi mdi-calendar"></i>
                            ${orderDate}
                        </p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
                
                <div class="compact-order-content">
                    <div class="product-preview">
                        ${firstProduct ? `
                        <div class="product-sample">
                            <img src="${firstProduct.mainImageUrl || 'https://placehold.co/60x60'}" 
                                 alt="${firstProduct.productName}" 
                                 class="product-image">
                            <div class="product-info">
                                <h6 class="product-name">${firstProduct.productName}</h6>
                                <p class="product-quantity">Số lượng: ${firstProduct.quantity}</p>
                            </div>
                        </div>
                        ` : `
                        <div class="no-product">
                            <i class="mdi mdi-package-variant"></i>
                            <span>Không có sản phẩm</span>
                        </div>
                        `}
                    </div>
                    
                    <div class="order-summary-compact">
                        <div class="total-info">
                            <span class="total-amount">${totalAmount}</span>
                            <span class="product-count">(${totalProducts} sản phẩm)</span>
                        </div>
                    </div>
                </div>
                
                <div class="compact-order-actions">
                    <div class="click-hint">
                        <i class="mdi mdi-cursor-pointer"></i>
                        <span>Xem chi tiết</span>
                    </div>
                    ${order.orderStatus === 'COMPLETED' ? `
                        ${reviewStatus.allReviewed ? `
                        <button class="btn btn-success btn-sm" disabled>
                            <i class="mdi mdi-check"></i> Đã đánh giá
                        </button>
                        ` : reviewStatus.hasAnyReview ? `
                        <button class="btn btn-warning btn-sm text-white" onclick="event.stopPropagation(); userInfoManager.openReviewModal(${order.idOrder})">
                            <i class="mdi mdi-star"></i> Xem đánh giá
                        </button>
                        ` : `
                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); userInfoManager.openReviewModal(${order.idOrder})">
                            <i class="mdi mdi-star"></i> Đánh giá
                        </button>
                        `}
                        ` : ''}
                    ${order.orderStatus === 'COMPLETED' || order.orderStatus === 'CANCELLED' ? `
                    <button class="btn btn-outline-success btn-sm" onclick="event.stopPropagation(); userInfoManager.reorder(${order.idOrder})">
                        <i class="mdi mdi-redo"></i> Mua lại
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createPaginationHTML(paginatedData) {
        if (paginatedData.totalPages <= 1) {
            return '';
        }

        const currentPage = paginatedData.currentPage;
        const totalPages = paginatedData.totalPages;
        const hasNext = paginatedData.hasNext;
        const hasPrevious = paginatedData.hasPrevious;

        let paginationHTML = `
            <div class="pagination-container mt-4">
                <nav aria-label="Phân trang đơn hàng">
                    <ul class="pagination justify-content-center">
        `;

        // Previous button
        if (hasPrevious) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="userInfoManager.loadOrders(${currentPage - 1})">
                        <i class="mdi mdi-chevron-left"></i> Trước
                    </button>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">
                        <i class="mdi mdi-chevron-left"></i> Trước
                    </span>
                </li>
            `;
        }

        // Page numbers
        const startPage = Math.max(0, currentPage - 2);
        const endPage = Math.min(totalPages - 1, currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                paginationHTML += `
                    <li class="page-item active">
                        <span class="page-link">${i + 1}</span>
                    </li>
                `;
            } else {
                paginationHTML += `
                    <li class="page-item">
                        <button class="page-link" onclick="userInfoManager.loadOrders(${i})">${i + 1}</button>
                    </li>
                `;
            }
        }

        // Next button
        if (hasNext) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="userInfoManager.loadOrders(${currentPage + 1})">
                        Sau <i class="mdi mdi-chevron-right"></i>
                    </button>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">
                        Sau <i class="mdi mdi-chevron-right"></i>
                    </span>
                </li>
            `;
        }

        paginationHTML += `
                    </ul>
                </nav>
                <div class="pagination-info text-center mt-2">
                    <small class="text-muted">
                        Trang ${currentPage + 1} / ${totalPages} 
                        (${paginatedData.totalElements} đơn hàng)
                    </small>
                </div>
            </div>
        `;

        return paginationHTML;
    }

    createOrderCard(order) {
        const orderDate = new Date(order.orderDate).toLocaleDateString('vi-VN');
        const totalAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(order.total);

        const statusClass = this.getOrderStatusClass(order.orderStatus);
        const statusText = this.getOrderStatusText(order.orderStatus);

        return `
            <div class="order-card" data-order-id="${order.idOrder}">
                <div class="order-header">
                    <div class="order-info">
                        <h5 class="order-id">Đơn hàng #${order.idOrder}</h5>
                        <p class="order-date">
                            <i class="mdi mdi-calendar"></i>
                            ${orderDate}
                        </p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
                
                <div class="order-details">
                    <div class="order-summary">
                        <div class="summary-item">
                            <span class="label">Phương thức thanh toán:</span>
                            <span class="value">${order.paymentMethod}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Địa chỉ giao hàng:</span>
                            <span class="value">${order.addressDetail}</span>
                        </div>
                        ${order.note ? `
                        <div class="summary-item">
                            <span class="label">Ghi chú:</span>
                            <span class="value">${order.note}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="order-total">
                        <span class="total-label">Tổng tiền:</span>
                        <span class="total-amount">${totalAmount}</span>
                    </div>
                </div>
                
                <div class="order-actions">
                    <button class="btn btn-outline-primary btn-sm" onclick="userInfoManager.viewOrderDetail(${order.idOrder})">
                        <i class="mdi mdi-eye"></i> Xem chi tiết
                    </button>
                    ${order.orderStatus === 'COMPLETED' || order.orderStatus === 'CANCELLED' ? `
                    <button class="btn btn-outline-success btn-sm" onclick="userInfoManager.reorder(${order.idOrder})">
                        <i class="mdi mdi-redo"></i> Mua lại
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getOrderStatusClass(status) {
        const statusMap = {
            'PENDING': 'status-pending',
            'CONFIRMED': 'status-confirmed',
            'COMPLETED': 'status-completed',
            'CANCELLED': 'status-cancelled'
        };
        return statusMap[status] || 'status-pending';
    }

    getOrderStatusText(status) {
        const statusMap = {
            'PENDING': 'Chờ xử lý',
            'CONFIRMED': 'Đã xác nhận',
            'COMPLETED': 'Hoàn tất',
            'CANCELLED': 'Đã hủy'
        };
        return statusMap[status] || status;
    }

    async viewOrderDetail(orderId) {
        // Chỉ user đã đăng nhập mới có thể xem chi tiết đơn hàng
        const token = localStorage.getItem('access_token');
        if (token) {
            // User đã đăng nhập - lưu orderId và token vào session và redirect trực tiếp
            fetch('/user/order-detail/set-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId: orderId, token: token })
            }).then(() => {
                // Redirect trực tiếp đến URL mới
                window.location.href = `/user/order-detail-view?orderId=${orderId}`;
            }).catch(error => {
                console.error('Error setting session:', error);
                // Fallback: gửi token qua URL parameter
                window.location.href = `/user/order-detail/${orderId}?token=${encodeURIComponent(token)}`;
            });
        } else {
            // Guest không thể xem chi tiết đơn hàng
            this.showToast('Vui lòng đăng nhập để xem chi tiết đơn hàng', 'warning');
        }
    }

    async reorder(orderId) {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showError('Bạn không thể thực hiện thao tác này');
                return;
            }

            // Lấy danh sách sản phẩm từ đơn hàng
            const orderItemsResponse = await fetch(`/api/orders/${orderId}/items`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!orderItemsResponse.ok) {
                throw new Error('Không thể lấy thông tin sản phẩm từ đơn hàng');
            }

            const orderItems = await orderItemsResponse.json();
            console.log('Order items:', orderItems);
            if (!orderItems || orderItems.length === 0) {
                this.showError('Đơn hàng không có sản phẩm nào');
                return;
            }

            // Lấy thông tin trạng thái sản phẩm hiện tại
            const enrichedItems = await this.enrichOrderItemsWithCurrentStatus(orderItems, token);

            // Phân loại sản phẩm
            const validItems = [];
            const invalidItems = [];

            enrichedItems.forEach(item => {
                const productStatus = this.getProductStatus(item);
                if (productStatus === 'available') {
                    validItems.push(item);
                } else {
                    invalidItems.push(item);
                }
            });

            console.log('Valid items:', validItems.length, 'Invalid items:', invalidItems.length);

            // Nếu tất cả sản phẩm đều hợp lệ
            if (validItems.length === enrichedItems.length && validItems.length > 0) {
                // Thêm tất cả vào giỏ hàng và chuyển đến cart
                await this.addItemsToCartDirectly(validItems);
                return;
            }

            // Nếu tất cả sản phẩm đều không hợp lệ
            if (invalidItems.length === enrichedItems.length) {
                this.showError('Tất cả sản phẩm trong đơn hàng đều không hợp lệ (hết hàng hoặc ngừng kinh doanh)');
                return;
            }

            // Nếu có cả sản phẩm hợp lệ và không hợp lệ, hiển thị modal
            console.log('About to show reorder modal with mixed items');
            this.showReorderModal(enrichedItems);

        } catch (error) {
            console.error('Error reordering:', error);
            this.showError('Có lỗi xảy ra khi thực hiện mua lại');
        }
    }

    async openReviewModal(orderId) {
        // Chuyển đến trang chi tiết đơn hàng với modal đánh giá
        window.location.href = `/user/order-detail/${orderId}#review`;
    }

    async enrichOrderItemsWithCurrentStatus(orderItems, token) {
        const enrichedItems = [];

        for (const item of orderItems) {
            try {
                // Gọi API lấy thông tin sản phẩm hiện tại
                const productResponse = await fetch(`/api/products/${item.idProduct}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (productResponse.ok) {
                    const productData = await productResponse.json();
                    const product = productData.result;

                    // Kết hợp thông tin từ order và thông tin sản phẩm hiện tại
                    enrichedItems.push({
                        ...item,
                        isActive: product.isActive,
                        available: product.available,
                        stock: product.stock
                    });
                } else {
                    // Nếu không lấy được thông tin sản phẩm, giữ nguyên
                    enrichedItems.push(item);
                }
            } catch (error) {
                console.error('Error fetching product info for:', item.idProduct, error);
                // Nếu có lỗi, giữ nguyên thông tin cũ
                enrichedItems.push(item);
            }
        }

        return enrichedItems;
    }

    async addItemsToCartDirectly(items) {
        console.log('Adding items directly to cart:', items);
        let successCount = 0;
        let failedItems = [];

        for (const item of items) {
            try {
                if (window.app && typeof window.app.addProductToCartBackend === 'function') {
                    await window.app.addProductToCartBackend(item.idProduct, item.quantity, true, false);
                    successCount++;
                    console.log(`Successfully added product ${item.idProduct} with quantity ${item.quantity}`);
                }
            } catch (error) {
                console.error('Error adding product to cart:', error);
                failedItems.push({
                    productId: item.idProduct,
                    quantity: item.quantity,
                    error: error.message || 'Không thể thêm vào giỏ hàng'
                });
            }
        }

        if (successCount > 0) {
            this.showToast(`Đã thêm ${successCount} sản phẩm vào giỏ hàng và đã được chọn sẵn`, 'success');
            // Chuyển đến trang giỏ hàng sau 1.5 giây
            setTimeout(() => {
                window.location.href = '/cart';
            }, 1500);
        }

        if (failedItems.length > 0) {
            this.showError(`Không thể thêm ${failedItems.length} sản phẩm vào giỏ hàng`);
        }
    }

    getProductStatus(item) {
        // Debug: Log dữ liệu để kiểm tra
        console.log('Product status check:', {
            productName: item.productName,
            isActive: item.isActive,
            available: item.available,
            stock: item.stock,
            isActiveType: typeof item.isActive,
            availableType: typeof item.available,
            stockType: typeof item.stock
        });

        // Nếu không có thông tin trạng thái (chưa được enrich), coi như available
        if (item.isActive === undefined && item.available === undefined && item.stock === undefined) {
            console.log('Status: available (no status info)');
            return 'available';
        }

        // Kiểm tra trạng thái sản phẩm - hết hàng trước
        if (item.stock !== undefined && item.stock <= 0) {
            console.log('Status: out_of_stock (stock <= 0)');
            return 'out_of_stock';
        }
        if ((item.available !== undefined && !item.available) || (item.isActive !== undefined && !item.isActive)) {
            console.log('Status: deactivated (!available || !isActive)');
            return 'deactivated';
        }
        console.log('Status: available');
        return 'available';
    }

    getProductStatusText(status) {
        switch (status) {
            case 'deactivated':
                return 'Ngừng kinh doanh';
            case 'out_of_stock':
                return 'Hết hàng';
            case 'available':
                return 'Có thể thêm';
            default:
                return 'Có thể thêm';
        }
    }

    getProductStatusBadgeClass(status) {
        switch (status) {
            case 'deactivated':
                return 'bg-danger';
            case 'out_of_stock':
                return 'bg-secondary';
            case 'available':
                return 'bg-success';
            default:
                return 'bg-success';
        }
    }

    showReorderModal(orderItems) {
        console.log('showReorderModal called with items:', orderItems);

        // Lưu orderItems để sử dụng trong addAllValidItemsToCart
        this.lastOrderItems = orderItems;

        // Tạo modal HTML
        const modalHTML = `
            <div class="modal fade" id="reorderModal" tabindex="-1" aria-labelledby="reorderModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="reorderModalLabel">
                               Thêm sản phẩm có sẵn vào giỏ hàng
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            
                            
                            <div class="reorder-items-list">
                                        ${orderItems.map((item, index) => {
            // Sử dụng logic giống như trong cart.js
            const productStatus = this.getProductStatus(item);
            const isProductValid = productStatus === 'available';

            return `
                                        <div class="card mb-3 ${!isProductValid ? 'opacity-50' : ''}" id="reorder-item-${index}">
                                            <div class="card-body">
                                                <div class="row align-items-center">
                                                    <div class="col-auto">
                                                        <img src="${item.mainImageUrl || '/user/img/default-product.jpg'}" 
                                                             class="img-thumbnail" 
                                                             alt="${item.productName}"
                                                             style="width: 60px; height: 60px; object-fit: cover;"
                                                             onerror="this.src='https://placehold.co/60x60'">
                                                    </div>
                                                    <div class="col">
                                                        <h6 class="mb-1">${item.productName || 'Sản phẩm không xác định'}</h6>
                                                        <small class="text-muted">${item.brandName || ''}</small>
                                                        ${productStatus !== 'available' ? `
                                                            <div class="mt-1">
                                                                <span class="badge ${this.getProductStatusBadgeClass(productStatus)}">${this.getProductStatusText(productStatus)}</span>
                                                            </div>
                                                        ` : ''}
                                                    </div>
                                                    <div class="col-auto text-end">
                                                        <span class="text-muted">x${item.quantity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
        }).join('')}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success w-100" onclick="userInfoManager.addAllValidItemsToCart()">
                                <i class="fas fa-shopping-cart me-1"></i>
                                Thêm (${orderItems.filter(item => this.getProductStatus(item) === 'available').length}) sản phẩm vào giỏ hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Xóa modal cũ nếu có
        const existingModal = document.getElementById('reorderModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Thêm modal mới vào body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        console.log('Modal HTML added to body');

        // Hiển thị modal
        const modalElement = document.getElementById('reorderModal');
        console.log('Modal element found:', modalElement);

        if (modalElement) {
            // Kiểm tra Bootstrap có sẵn không
            if (typeof bootstrap !== 'undefined') {
                const modal = new bootstrap.Modal(modalElement);
                console.log('Bootstrap modal created:', modal);
                modal.show();
                console.log('Modal show() called');
            } else {
                // Fallback: hiển thị modal bằng CSS
                console.log('Bootstrap not available, using CSS fallback');
                modalElement.style.display = 'block';
                modalElement.classList.add('show');
                modalElement.setAttribute('aria-modal', 'true');
                modalElement.setAttribute('role', 'dialog');

                // Thêm backdrop
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                backdrop.id = 'reorderModalBackdrop';
                document.body.appendChild(backdrop);
            }
        } else {
            console.error('Modal element not found');
            this.showError('Không thể tạo modal. Vui lòng thử lại.');
        }

        // Xóa modal khi đóng
        const closeModal = () => {
            const modal = document.getElementById('reorderModal');
            const backdrop = document.getElementById('reorderModalBackdrop');
            if (modal) modal.remove();
            if (backdrop) backdrop.remove();
        };

        // Xử lý đóng modal
        modalElement.addEventListener('hidden.bs.modal', closeModal);

        // Thêm event listener cho nút đóng
        const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"], .btn-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', closeModal);
        });

        // Thêm event listener cho backdrop
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) {
                closeModal();
            }
        });
    }

    async addAllValidItemsToCart() {
        // Lấy tất cả sản phẩm hợp lệ từ lastOrderItems
        const orderItems = this.lastOrderItems || [];
        const validItems = [];

        orderItems.forEach((item, index) => {
            const productStatus = this.getProductStatus(item);
            if (productStatus === 'available') {
                validItems.push({
                    productId: item.idProduct,
                    quantity: item.quantity,
                    index: index
                });
            }
        });

        if (validItems.length === 0) {
            this.showError('Không có sản phẩm nào có thể thêm vào giỏ hàng');
            return;
        }

        console.log('Adding valid items to cart:', validItems);
        let successCount = 0;
        let failedItems = [];

        for (const item of validItems) {
            try {
                if (window.app && typeof window.app.addProductToCartBackend === 'function') {
                    await window.app.addProductToCartBackend(item.productId, item.quantity, true, false);
                    successCount++;

                    console.log(`Successfully added product ${item.productId} with quantity ${item.quantity}`);
                }
            } catch (error) {
                console.error('Error adding product to cart:', error);
                failedItems.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    error: error.message || 'Không thể thêm vào giỏ hàng'
                });
            }
        }

        if (successCount > 0) {
            this.showToast(`Đã thêm ${successCount} sản phẩm vào giỏ hàng và đã được chọn sẵn`, 'success');
            // Tự động đóng modal sau khi thêm thành công
            setTimeout(() => {
                const modal = document.getElementById('reorderModal');
                if (modal) {
                    const backdrop = document.getElementById('reorderModalBackdrop');
                    if (backdrop) backdrop.remove();
                    modal.remove();
                }
                // Chuyển đến trang giỏ hàng
                window.location.href = '/cart';
            }, 1500);
        }

        if (failedItems.length > 0) {
            this.showError(`Không thể thêm ${failedItems.length} sản phẩm vào giỏ hàng`);
        }
    }

    showFailedItemsModal(failedItems, successCount) {
        // Tạo modal HTML
        const modalHTML = `
            <div class="modal fade" id="failedItemsModal" tabindex="-1" aria-labelledby="failedItemsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="failedItemsModalLabel">
                                <i class="fas fa-exclamation-triangle text-warning me-2"></i>
                                Mua lại đơn hàng
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${successCount > 0 ? `
                                <div class="alert alert-success">
                                    <i class="fas fa-check-circle me-2"></i>
                                    Đã thêm ${successCount} sản phẩm vào giỏ hàng thành công!
                                </div>
                            ` : ''}
                            
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Có ${failedItems.length} sản phẩm không thể thêm vào giỏ hàng:
                            </div>
                            
                            <div class="failed-items-list">
                                ${failedItems.map((item, index) => `
                                    <div class="card mb-3">
                                        <div class="card-body">
                                            <div class="row align-items-center">
                                                <div class="col-md-2">
                                                    <img src="${item.mainImageUrl || '/user/img/default-product.jpg'}" 
                                                         class="img-fluid rounded" 
                                                         alt="${item.productName}"
                                                         style="max-height: 60px;">
                                                </div>
                                                <div class="col-md-6">
                                                    <h6 class="mb-1">${item.productName || 'Sản phẩm không xác định'}</h6>
                                                    <p class="text-muted mb-1">Số lượng: ${item.quantity}</p>
                                                    <small class="text-danger">${item.error}</small>
                                                </div>
                                                <div class="col-md-4 text-end">
                                                    <button class="btn btn-primary btn-sm" 
                                                            onclick="userInfoManager.addSingleItemToCart(${item.idProduct}, ${item.quantity}, ${index})">
                                                        <i class="fas fa-shopping-cart me-1"></i>
                                                        Thêm vào giỏ hàng (${item.quantity})
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                            <button type="button" class="btn btn-primary" onclick="window.location.href='/cart'">
                                <i class="fas fa-shopping-cart me-1"></i>
                                Xem giỏ hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Xóa modal cũ nếu có
        const existingModal = document.getElementById('failedItemsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Thêm modal mới vào body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Hiển thị modal
        const modal = new bootstrap.Modal(document.getElementById('failedItemsModal'));
        modal.show();

        // Xóa modal khi đóng
        document.getElementById('failedItemsModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    async addSingleItemToCart(productId, quantity, index) {
        try {
            if (window.app && typeof window.app.addProductToCartBackend === 'function') {
                await window.app.addProductToCartBackend(productId, quantity, true);

                // Ẩn item đã thêm thành công
                const failedItemsList = document.querySelector('.failed-items-list');
                const itemCard = failedItemsList.children[index];
                if (itemCard) {
                    itemCard.style.opacity = '0.5';
                    itemCard.querySelector('button').innerHTML = '<i class="fas fa-check me-1"></i>Đã thêm';
                    itemCard.querySelector('button').disabled = true;
                    itemCard.querySelector('button').classList.remove('btn-primary');
                    itemCard.querySelector('button').classList.add('btn-success');
                }
            }
        } catch (error) {
            console.error('Error adding single item to cart:', error);
            this.showError('Không thể thêm sản phẩm vào giỏ hàng');
        }
    }


    async loadOrderStats() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch('/users/orderStats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return;

            const data = await response.json();
            console.log('Order stats API response:', data);
            const stats = data.result;

            // Update profile stats
            const totalOrdersElement = document.getElementById('totalOrders');
            const totalSpentElement = document.getElementById('totalSpent');
            const memberSinceElement = document.getElementById('memberSince');

            if (totalOrdersElement) {
                totalOrdersElement.textContent = stats.totalOrders || 0;
            }

            if (totalSpentElement) {
                const totalSpent = stats.totalSpent || 0;
                totalSpentElement.textContent = new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    minimumFractionDigits: 0
                }).format(totalSpent);
            }

            if (memberSinceElement && this.currentUser?.createdDate) {
                const createdDate = new Date(this.currentUser.createdDate);
                memberSinceElement.textContent = createdDate.toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long'
                });
            }

        } catch (error) {
            // Silently fail for stats - not critical
            console.log('Could not load order stats:', error);
        }
    }

    async loadAddresses() {
        const addressContainer = document.getElementById('addressList');
        if (!addressContainer) return;

        // Loading placeholder
        addressContainer.innerHTML = `
			<div class="empty-state">
				<i class="mdi mdi-loading mdi-spin"></i>
				<h5>Đang tải địa chỉ...</h5>
				<p>Vui lòng chờ trong giây lát</p>
			</div>
		`;

        try {
            const token = localStorage.getItem('access_token');
            if (!token || !this.currentUser?.userId) {
                addressContainer.innerHTML = `
					<div class="empty-state">
						<i class="mdi mdi-map-marker"></i>
						<h5>Chưa đăng nhập</h5>
						<p>Vui lòng đăng nhập để quản lý địa chỉ</p>
					</div>
				`;
                return;
            }

            const res = await fetch(`/addresses/${this.currentUser.userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) throw new Error('Không thể tải địa chỉ');
            const addresses = await res.json();

            if (!Array.isArray(addresses) || addresses.length === 0) {
                addressContainer.innerHTML = `
					<div class="empty-state">
						<i class="mdi mdi-map-marker"></i>
						<h5>Chưa có địa chỉ nào</h5>
						<p>Hãy thêm địa chỉ giao hàng để mua sắm dễ dàng hơn</p>
					</div>
				`;
                return;
            }

            // Resolve admin names for display
            const cards = await Promise.all(addresses.map(async (addr) => {
                const provinceName = await this.getProvinceName(addr?.provinceId);
                const districtName = await this.getDistrictName(addr?.provinceId, addr?.districtId);
                const wardName = await this.getWardName(addr?.districtId, addr?.wardCode);
                return this.renderAddressCard(addr, { provinceName, districtName, wardName });
            }));
            addressContainer.innerHTML = cards.join('');
        } catch (e) {
            console.error(e);
            addressContainer.innerHTML = `
				<div class="empty-state">
					<i class="mdi mdi-alert"></i>
					<h5>Lỗi khi tải địa chỉ</h5>
					<p>Vui lòng thử lại sau</p>
				</div>
			`;
        }
    }

    renderAddressCard(addr, names = {}) {
        const isDefault = addr?.isDefault ? '<span class="badge bg-success ms-2">Mặc định</span>' : '';
        const fullAddress = [
            addr?.addressDetail,
            names?.wardName,
            names?.districtName,
            names?.provinceName
        ].filter(Boolean).join(', ');
        return `
			<div class="card mb-3">
				<div class="card-body d-flex justify-content-between align-items-start flex-wrap">
					<div class="me-3">
						<h6 class="mb-1">${this.escapeHtml(addr?.name || '')} ${isDefault}</h6>
						<div class="text-muted small mb-1"><i class="mdi mdi-phone me-1"></i>${this.escapeHtml(addr?.phone || '')}</div>
						<div><i class="mdi mdi-map-marker me-1"></i>${this.escapeHtml(fullAddress)}</div>
					</div>
					<div class="d-flex gap-2 mt-2 mt-md-0">
						<button class="btn btn-sm btn-outline-primary" onclick="editAddress(${addr?.idAddress})"><i class="mdi mdi-pencil"></i></button>
						<button class="btn btn-sm btn-outline-danger" onclick="deleteAddress(${addr?.idAddress})"><i class="mdi mdi-delete"></i></button>
					</div>
				</div>
			</div>
		`;
    }

    escapeHtml(str) {
        try {
            return String(str)
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        } catch (_) { return ''; }
    }

    // UI Helper Methods
    editField(field) {
        const editForm = document.getElementById('editForm');
        if (!editForm) return;

        editForm.style.display = 'block';

        // Populate form with current values
        document.getElementById('editName').value = this.getFullName();
        document.getElementById('editEmail').value = this.currentUser.email || '';
        document.getElementById('editPhone').value = this.currentUser.phone || '';

        if (this.currentUser.dob) {
            const dob = new Date(this.currentUser.dob);
            document.getElementById('editDob').value = dob.toISOString().split('T')[0];
        }

        document.getElementById('editGender').value = this.currentUser.gender === true ? 'Nam' :
            this.currentUser.gender === false ? 'Nữ' : '';

        // Scroll to form
        editForm.scrollIntoView({ behavior: 'smooth' });
    }

    cancelEdit() {
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.style.display = 'none';
        }
    }

    async addNewAddress() {
        const el = document.getElementById('addAddressModal');
        if (!el) return;

        // Reset form
        this.resetAddAddressForm();

        // Hiển thị modal ngay lập tức (zero flicker)
        el.classList.add('show');
        try { document.body.style.overflow = 'hidden'; } catch (_) { }

        // Tải dữ liệu tỉnh/thành từ cache hoặc API
        await this.loadProvinces();

        // Focus vào input đầu tiên
        setTimeout(() => {
            const firstInput = el.querySelector('input, select');
            if (firstInput) firstInput.focus();
        }, 50);
    }

    async loadProvinces() {
        const provinceSelect = document.getElementById('addrProvince');
        if (!provinceSelect) return;

        // Kiểm tra cache trước
        if (this.isCacheValid('provinces') && this.provincesCache) {
            this.populateSelect(
                provinceSelect,
                this.provincesCache.map(p => ({ value: (p.ProvinceID || p.provinceId || p.code), label: (p.ProvinceName || p.name) })),
                'Chọn Tỉnh/Thành phố'
            );
            return;
        }

        provinceSelect.innerHTML = '<option value="">Đang tải tỉnh/thành...</option>';

        try {
            const res = await fetch(`/api/ghn/provinces`);
            if (!res.ok) throw new Error('Không thể tải tỉnh/thành');
            const provinces = await res.json();

            if (Array.isArray(provinces) && provinces.length > 0) {
                // Lưu vào cache
                this.provincesCache = provinces;
                this.cacheTimestamp.set('provinces', Date.now());

                this.populateSelect(
                    provinceSelect,
                    provinces.map(p => ({ value: (p.ProvinceID || p.provinceId || p.code), label: (p.ProvinceName || p.name) })),
                    'Chọn Tỉnh/Thành phố'
                );
            } else {
                throw new Error('Dữ liệu tỉnh/thành không hợp lệ');
            }
        } catch (e) {
            console.error('Lỗi tải tỉnh/thành:', e);
            provinceSelect.innerHTML = '<option value="">Không có dữ liệu tỉnh/thành</option>';
        }
    }

    // Helpers to resolve names from ids using GHN endpoints (with simple in-memory caches)
    async getProvinceName(provinceId) {
        try {
            if (!provinceId) return '';
            if (this.provincesCache && Array.isArray(this.provincesCache)) {
                const found = this.provincesCache.find(p => (p.ProvinceID || p.provinceId || p.code) == provinceId);
                if (found) return (found.ProvinceName || found.name) || '';
            }
            const res = await fetch('/api/ghn/provinces');
            if (!res.ok) return '';
            const provinces = await res.json();
            this.provincesCache = provinces;
            const found = provinces.find(p => (p.ProvinceID || p.provinceId || p.code) == provinceId);
            return found ? ((found.ProvinceName || found.name) || '') : '';
        } catch (_) { return ''; }
    }

    async getDistrictName(provinceId, districtId) {
        try {
            if (!provinceId || !districtId) return '';
            this._districtCache = this._districtCache || new Map();
            const key = String(provinceId);
            let list = this._districtCache.get(key);
            if (!list) {
                const res = await fetch(`/api/ghn/districts/${provinceId}`);
                if (!res.ok) return '';
                list = await res.json();
                this._districtCache.set(key, list);
            }
            const found = (list || []).find(d => (d.DistrictID || d.districtId) == districtId);
            return found ? ((found.DistrictName || found.name) || '') : '';
        } catch (_) { return ''; }
    }

    async getWardName(districtId, wardCode) {
        try {
            if (!districtId || !wardCode) return '';
            this._wardCache = this._wardCache || new Map();
            const key = String(districtId);
            let list = this._wardCache.get(key);
            if (!list) {
                const res = await fetch(`/api/ghn/wards/${districtId}`);
                if (!res.ok) return '';
                list = await res.json();
                this._wardCache.set(key, list);
            }
            const found = (list || []).find(w => (w.WardCode || w.wardCode) == wardCode);
            return found ? ((found.WardName || found.name) || '') : '';
        } catch (_) { return ''; }
    }

    async editAddress(id) {
        if (!id) return;

        try {
            const token = localStorage.getItem('access_token');
            if (!token || !this.currentUser?.userId) {
                this.showError('Vui lòng đăng nhập');
                return;
            }

            // Load address details
            const res = await fetch(`/addresses/${this.currentUser.userId}/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Không thể tải thông tin địa chỉ');
            const address = await res.json();

            // Store current editing address ID
            this.currentEditingAddressId = id;

            // Populate edit form
            this.populateEditForm(address);

            // Show edit modal
            this.showEditAddressModal();

        } catch (e) {
            console.error('Lỗi tải địa chỉ:', e);
            this.showError('Không thể tải thông tin địa chỉ');
        }
    }

    async deleteAddress(id) {
        if (!id) return;
        if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
        try {
            const token = localStorage.getItem('access_token');
            if (!token || !this.currentUser?.userId) {
                this.showError('Vui lòng đăng nhập');
                return;
            }

            const res = await fetch(`/addresses/${this.currentUser.userId}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 204) {
                this.showToast('Đã xóa địa chỉ', 'success');
                this.loadAddresses();
            } else if (res.status === 400) {
                const errorData = await res.json().catch(() => ({}));
                if (errorData.message && errorData.message.includes('default address')) {
                    this.showError('Không thể xóa địa chỉ mặc định. Vui lòng chọn địa chỉ khác làm mặc định trước.');
                } else {
                    this.showError('Không thể xóa địa chỉ này');
                }
            } else if (res.status === 404) {
                this.showError('Địa chỉ không tồn tại');
            } else {
                this.showError('Xóa địa chỉ thất bại');
            }
        } catch (e) {
            console.error('Lỗi xóa địa chỉ:', e);
            this.showError('Không thể xóa địa chỉ');
        }
    }

    resetAddAddressForm() {
        const form = document.getElementById('addAddressForm');
        if (form) form.reset();
        const wardSelect = document.getElementById('addrWard');
        if (wardSelect) {
            wardSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố trước</option>';
            wardSelect.disabled = true;
        }
        const provinceSelect = document.getElementById('addrProvince');
        if (provinceSelect) {
            provinceSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố</option>';
        }
    }

    closeAddressModal() {
        const el = document.getElementById('addAddressModal');
        if (!el) return;
        el.classList.remove('show');
        try { document.body.style.overflow = ''; } catch (_) { }
    }

    populateEditForm(address) {
        document.getElementById('editAddrName').value = address?.name || '';
        document.getElementById('editAddrPhone').value = address?.phone || '';
        document.getElementById('editAddrDetail').value = address?.addressDetail || '';
        document.getElementById('editAddrDefault').checked = address?.isDefault || false;

        // Load provinces then set provinceId -> load districts and wards
        this.loadEditProvinces(address?.provinceId, address?.districtId, address?.wardCode);
    }

    // removed legacy mapping by names

    async loadEditProvinces(selectedProvinceId = null, selectedDistrictId = null, selectedWardCode = null) {
        const provinceSelect = document.getElementById('editAddrProvince');
        if (!provinceSelect) return;

        // Kiểm tra cache trước
        if (this.isCacheValid('provinces') && this.provincesCache) {
            this.populateSelect(
                provinceSelect,
                this.provincesCache.map(p => ({ value: (p.ProvinceID || p.provinceId || p.code), label: (p.ProvinceName || p.name) })),
                'Chọn Tỉnh/Thành phố'
            );

            if (selectedProvinceId) {
                provinceSelect.value = selectedProvinceId;
                if (selectedDistrictId) {
                    await this.loadEditDistricts(selectedProvinceId, selectedDistrictId, selectedWardCode);
                } else {
                    const dSel = document.getElementById('editAddrDistrict');
                    const wSel = document.getElementById('editAddrWard');
                    if (dSel) { dSel.innerHTML = '<option value="">Chọn Quận/Huyện</option>'; dSel.disabled = false; }
                    if (wSel) { wSel.innerHTML = '<option value="">Chọn Quận/Huyện trước</option>'; wSel.disabled = true; }
                }
            }
            return;
        }

        provinceSelect.innerHTML = '<option value="">Đang tải tỉnh/thành...</option>';

        try {
            const res = await fetch(`/api/ghn/provinces`);
            if (!res.ok) throw new Error('Không thể tải tỉnh/thành');
            const provinces = await res.json();

            if (Array.isArray(provinces) && provinces.length > 0) {
                this.provincesCache = provinces;
                this.cacheTimestamp.set('provinces', Date.now());

                this.populateSelect(
                    provinceSelect,
                    provinces.map(p => ({ value: (p.ProvinceID || p.provinceId || p.code), label: (p.ProvinceName || p.name) })),
                    'Chọn Tỉnh/Thành phố'
                );

                if (selectedProvinceId) {
                    provinceSelect.value = selectedProvinceId;
                    if (selectedDistrictId) {
                        await this.loadEditDistricts(selectedProvinceId, selectedDistrictId, selectedWardCode);
                    } else {
                        const dSel = document.getElementById('editAddrDistrict');
                        const wSel = document.getElementById('editAddrWard');
                        if (dSel) { dSel.innerHTML = '<option value="">Chọn Quận/Huyện</option>'; dSel.disabled = false; }
                        if (wSel) { wSel.innerHTML = '<option value="">Chọn Quận/Huyện trước</option>'; wSel.disabled = true; }
                    }
                }
            } else {
                throw new Error('Dữ liệu tỉnh/thành không hợp lệ');
            }
        } catch (e) {
            console.error('Lỗi tải tỉnh/thành:', e);
            provinceSelect.innerHTML = '<option value="">Không có dữ liệu tỉnh/thành</option>';
        }
    }

    async loadEditWards(districtId, selectedWardCode = null) {
        const wardSelect = document.getElementById('editAddrWard');
        if (!wardSelect) return;
        if (!districtId) {
            wardSelect.innerHTML = '<option value="">Chọn Quận/Huyện trước</option>';
            wardSelect.disabled = true;
            return;
        }

        wardSelect.disabled = true;
        wardSelect.innerHTML = '<option value="">Đang tải Phường/Xã...</option>';

        try {
            const res = await fetch(`/api/ghn/wards/${encodeURIComponent(districtId)}`);
            if (!res.ok) throw new Error('Không thể tải phường/xã');
            const wards = await res.json();

            if (Array.isArray(wards) && wards.length > 0) {
                this.populateSelect(wardSelect, wards.map(w => ({ value: (w.WardCode || w.wardCode), label: (w.WardName || w.name) })), 'Chọn Phường/Xã');
                if (selectedWardCode) {
                    wardSelect.value = selectedWardCode;
                }
            } else {
                throw new Error('Dữ liệu phường/xã không hợp lệ');
            }
            wardSelect.disabled = false;
        } catch (e) {
            console.error('Lỗi tải phường/xã:', e);
            wardSelect.innerHTML = '<option value="">Không có dữ liệu phường/xã</option>';
        }
    }

    async loadEditDistricts(provinceId, selectedDistrictId = null, selectedWardCode = null) {
        const districtSelect = document.getElementById('editAddrDistrict');
        if (!districtSelect) return;
        if (!provinceId) {
            districtSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố</option>';
            districtSelect.disabled = true;
            return;
        }

        districtSelect.disabled = true;
        districtSelect.innerHTML = '<option value="">Đang tải Quận/Huyện...</option>';

        try {
            const res = await fetch(`/api/ghn/districts/${encodeURIComponent(provinceId)}`);
            if (!res.ok) throw new Error('Không thể tải quận/huyện');
            const districts = await res.json();
            this.populateSelect(districtSelect, districts.map(d => ({ value: (d.DistrictID || d.districtId), label: (d.DistrictName || d.name) })), 'Chọn Quận/Huyện');
            districtSelect.disabled = false;

            if (selectedDistrictId) {
                districtSelect.value = selectedDistrictId;
                await this.loadEditWards(selectedDistrictId, selectedWardCode);
            }
        } catch (e) {
            console.error('Lỗi tải quận/huyện:', e);
            districtSelect.innerHTML = '<option value="">Không có dữ liệu quận/huyện</option>';
        }
    }

    showEditAddressModal() {
        const modal = document.getElementById('editAddressModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';

            // Focus vào input đầu tiên
            setTimeout(() => {
                const firstInput = modal.querySelector('input');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }

    closeEditAddressModal() {
        const modal = document.getElementById('editAddressModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            this.resetEditAddressForm();
        }
    }

    resetEditAddressForm() {
        const form = document.getElementById('editAddressForm');
        if (form) form.reset();
        const wardSelect = document.getElementById('editAddrWard');
        if (wardSelect) {
            wardSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố trước</option>';
            wardSelect.disabled = true;
        }
        const provinceSelect = document.getElementById('editAddrProvince');
        if (provinceSelect) {
            provinceSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố</option>';
        }
    }

    async submitEditAddress() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token || !this.currentUser?.userId) {
                this.showError('Vui lòng đăng nhập');
                return;
            }

            const form = document.getElementById('editAddressForm');
            if (!form) return;

            const provinceId = parseInt(document.getElementById('editAddrProvince').value, 10);
            const districtId = parseInt(document.getElementById('editAddrDistrict').value, 10);
            const wardCode = document.getElementById('editAddrWard').value.trim();

            // Validation theo id/mã GHN
            if (!document.getElementById('editAddrName').value.trim() ||
                !document.getElementById('editAddrPhone').value.trim() ||
                !document.getElementById('editAddrDetail').value.trim() ||
                !provinceId || !districtId || !wardCode) {
                this.showError('Vui lòng điền đầy đủ thông tin');
                return;
            }

            const addressData = {
                name: document.getElementById('editAddrName').value.trim(),
                phone: document.getElementById('editAddrPhone').value.trim(),
                addressDetail: document.getElementById('editAddrDetail').value.trim(),
                provinceId,
                districtId,
                wardCode,
                isDefault: document.getElementById('editAddrDefault').checked
            };

            // Get address ID from current editing address
            const currentAddressId = this.currentEditingAddressId;
            if (!currentAddressId) {
                this.showError('Không tìm thấy ID địa chỉ');
                return;
            }

            const res = await fetch(`/addresses/${this.currentUser.userId}/${currentAddressId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addressData)
            });

            if (res.ok) {
                this.showToast('Cập nhật địa chỉ thành công', 'success');
                this.closeEditAddressModal();
                await this.loadAddresses();
            } else {
                const errorData = await res.json().catch(() => ({}));
                this.showError(errorData.message || 'Cập nhật địa chỉ thất bại');
            }
        } catch (e) {
            console.error('Lỗi cập nhật địa chỉ:', e);
            this.showError('Không thể cập nhật địa chỉ');
        }
    }

    async submitAddAddress() {
        // Prevent double submission
        const submitBtn = document.getElementById('btnSubmitAddAddress');
        if (submitBtn.disabled) return;

        try {
            // Disable submit button to prevent double submission
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="mdi mdi-loading mdi-spin"></i> Đang lưu...';

            const token = localStorage.getItem('access_token');
            if (!token || !this.currentUser?.userId) {
                this.showError('Vui lòng đăng nhập');
                return;
            }
            const name = document.getElementById('addrName')?.value?.trim();
            const phone = document.getElementById('addrPhone')?.value?.trim();
            const addressDetail = document.getElementById('addrDetail')?.value?.trim();
            const provinceId = parseInt(document.getElementById('addrProvince')?.value, 10);
            const districtId = parseInt(document.getElementById('addrDistrict')?.value, 10);
            const wardCode = document.getElementById('addrWard')?.value;
            const isDefault = document.getElementById('addrDefault')?.checked || false;

            if (!name || !phone || !addressDetail || !provinceId || !districtId || !wardCode) {
                this.showError('Vui lòng điền đầy đủ thông tin địa chỉ');
                return;
            }

            // Province text for storage
            const payload = {
                name,
                phone,
                addressDetail,
                provinceId,
                districtId,
                wardCode,
                isDefault
            };

            const res = await fetch(`/addresses/${this.currentUser.userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                let msg = 'Không thể lưu địa chỉ';
                try { const err = await res.json(); msg = err?.message || msg; } catch (_) { }
                throw new Error(msg);
            }

            this.showToast('Đã lưu địa chỉ thành công', 'success');

            // Close modal properly using CSS class
            this.closeAddressModal();

            // Reset form
            this.resetAddAddressForm();

            // Reload addresses
            this.loadAddresses();
        } catch (e) {
            console.error(e);
            this.showError(e?.message || 'Không thể lưu địa chỉ');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="mdi mdi-content-save"></i> Lưu địa chỉ';
        }
    }


    // Kiểm tra cache có còn hiệu lực không
    isCacheValid(key) {
        const timestamp = this.cacheTimestamp.get(key);
        if (!timestamp) return false;
        return (Date.now() - timestamp) < this.cacheExpiry;
    }

    // Xóa cache hết hạn
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, timestamp] of this.cacheTimestamp.entries()) {
            if (now - timestamp >= this.cacheExpiry) {
                this.cacheTimestamp.delete(key);
                if (key === 'provinces') {
                    this.provincesCache = null;
                } else if (key.startsWith('wards_')) {
                    const provinceCode = key.replace('wards_', '');
                    this.wardsCacheByProvince.delete(provinceCode);
                }
            }
        }
    }

    async loadWards(districtId) {
        const wardSelect = document.getElementById('addrWard');
        if (!wardSelect) return;
        if (!districtId) {
            wardSelect.innerHTML = '<option value="">Chọn Quận/Huyện trước</option>';
            wardSelect.disabled = true;
            return;
        }

        try {
            wardSelect.disabled = true;
            wardSelect.innerHTML = '<option value="">Đang tải Phường/Xã...</option>';

            const res = await fetch(`/api/ghn/wards/${encodeURIComponent(districtId)}`);
            if (!res.ok) throw new Error('Không thể tải phường/xã');
            const wards = await res.json();

            if (Array.isArray(wards) && wards.length > 0) {
                this.populateSelect(wardSelect, wards.map(w => ({ value: (w.WardCode || w.wardCode), label: (w.WardName || w.name) })), 'Chọn Phường/Xã');
            } else {
                throw new Error('Dữ liệu phường/xã không hợp lệ');
            }
            wardSelect.disabled = false;
        } catch (e) {
            console.error('Lỗi tải phường/xã:', e);
            wardSelect.innerHTML = '<option value="">Không có dữ liệu phường/xã</option>';
            wardSelect.disabled = true;
        }
    }

    async loadDistricts(provinceId) {
        const districtSelect = document.getElementById('addrDistrict');
        if (!districtSelect) return;
        if (!provinceId) {
            districtSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố</option>';
            districtSelect.disabled = true;
            return;
        }

        try {
            districtSelect.disabled = true;
            districtSelect.innerHTML = '<option value="">Đang tải Quận/Huyện...</option>';

            const res = await fetch(`/api/ghn/districts/${encodeURIComponent(provinceId)}`);
            if (!res.ok) throw new Error('Không thể tải quận/huyện');
            const districts = await res.json();
            this.populateSelect(districtSelect, districts.map(d => ({ value: (d.DistrictID || d.districtId), label: (d.DistrictName || d.name) })), 'Chọn Quận/Huyện');
            districtSelect.disabled = false;

            districtSelect.onchange = (e) => {
                const districtId = parseInt(e.target.value, 10);
                this.loadWards(districtId);
            };
        } catch (e) {
            console.error('Lỗi tải quận/huyện:', e);
            districtSelect.innerHTML = '<option value="">Không có dữ liệu quận/huyện</option>';
            districtSelect.disabled = true;
        }
    }

    populateSelect(selectEl, options, placeholder) {
        const opts = [`<option value="">${this.escapeHtml(placeholder || 'Chọn')}</option>`]
            .concat(options.map(o => `<option value="${this.escapeHtml(o.value)}">${this.escapeHtml(o.label)}</option>`));
        selectEl.innerHTML = opts.join('');
    }

    changePassword() {
        this.showChangePasswordModal();
    }

    showChangePasswordModal() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';

            // Reset form
            this.resetChangePasswordForm();

            // Focus vào input đầu tiên
            setTimeout(() => {
                const firstInput = modal.querySelector('input');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }

    closeChangePasswordModal() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            this.resetChangePasswordForm();
        }
    }

    resetChangePasswordForm() {
        const form = document.getElementById('changePasswordForm');
        if (form) {
            form.reset();
            // Remove validation classes
            const inputs = form.querySelectorAll('.form-control');
            inputs.forEach(input => {
                input.classList.remove('is-valid', 'is-invalid');
            });
        }
    }

    async submitChangePassword() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showError('Vui lòng đăng nhập');
                return;
            }

            const form = document.getElementById('changePasswordForm');
            if (!form) return;

            const currentPassword = document.getElementById('currentPassword').value.trim();
            const newPassword = document.getElementById('newPassword').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();

            // Validation
            if (!currentPassword) {
                this.showError('Vui lòng nhập mật khẩu hiện tại');
                document.getElementById('currentPassword').focus();
                return;
            }

            if (!newPassword) {
                this.showError('Vui lòng nhập mật khẩu mới');
                document.getElementById('newPassword').focus();
                return;
            }

            if (newPassword.length < 8 || newPassword.length > 20) {
                this.showError('Mật khẩu mới phải có từ 8 đến 20 ký tự');
                document.getElementById('newPassword').focus();
                return;
            }

            if (!confirmPassword) {
                this.showError('Vui lòng xác nhận mật khẩu mới');
                document.getElementById('confirmPassword').focus();
                return;
            }

            if (newPassword !== confirmPassword) {
                this.showError('Mật khẩu xác nhận không khớp');
                document.getElementById('confirmPassword').focus();
                return;
            }

            if (currentPassword === newPassword) {
                this.showError('Mật khẩu mới phải khác mật khẩu hiện tại');
                document.getElementById('newPassword').focus();
                return;
            }

            // Disable submit button
            const submitBtn = document.getElementById('btnSubmitChangePassword');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="mdi mdi-loading mdi-spin"></i> Đang xử lý...';
            }

            const requestData = {
                currentPassword: currentPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            };

            const response = await fetch('/users/changePassword', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || 'Không thể đổi mật khẩu';

                if (response.status === 400) {
                    this.showError(errorMessage);
                } else if (response.status === 401 || response.status === 403) {
                    this.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    setTimeout(() => {
                        window.location.href = '/home';
                    }, 2000);
                } else {
                    this.showError(errorMessage);
                }
                return;
            }

            const data = await response.json();
            this.showToast('Đổi mật khẩu thành công!', 'success');
            this.closeChangePasswordModal();

        } catch (error) {
            console.error('Error changing password:', error);
            this.showError('Không thể đổi mật khẩu. Vui lòng thử lại sau.');
        } finally {
            // Re-enable submit button
            const submitBtn = document.getElementById('btnSubmitChangePassword');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="mdi mdi-content-save"></i> Đổi mật khẩu';
            }
        }
    }



    deleteAccount() {
        this.showDeleteAccountModal();
    }

    showDeleteAccountModal() {
        const modal = document.getElementById('deleteAccountModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';

            // Reset form
            this.resetDeleteAccountForm();

            // Focus vào checkbox
            setTimeout(() => {
                const checkbox = modal.querySelector('#confirmDeleteAccount');
                if (checkbox) checkbox.focus();
            }, 100);
        }
    }

    closeDeleteAccountModal() {
        const modal = document.getElementById('deleteAccountModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            this.resetDeleteAccountForm();
        }
    }

    resetDeleteAccountForm() {
        const checkbox = document.getElementById('confirmDeleteAccount');
        const submitBtn = document.getElementById('btnConfirmDeleteAccount');

        if (checkbox) {
            checkbox.checked = false;
        }
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }

    async submitDeleteAccount() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showError('Vui lòng đăng nhập');
                return;
            }

            const confirmCheckbox = document.getElementById('confirmDeleteAccount');
            if (!confirmCheckbox || !confirmCheckbox.checked) {
                this.showError('Vui lòng xác nhận rằng bạn hiểu hậu quả của việc xóa tài khoản');
                return;
            }

            // Disable submit button
            const submitBtn = document.getElementById('btnConfirmDeleteAccount');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="mdi mdi-loading mdi-spin"></i> Đang xử lý...';
            }

            const response = await fetch('/users/deactivateAccount', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || 'Không thể xóa tài khoản';

                if (response.status === 400) {
                    this.showError(errorMessage);
                } else if (response.status === 401 || response.status === 403) {
                    this.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    setTimeout(() => {
                        window.location.href = '/home';
                    }, 2000);
                } else {
                    this.showError(errorMessage);
                }
                return;
            }

            const data = await response.json();
            this.showToast('Tài khoản đã được vô hiệu hóa thành công!', 'success');

            // Clear local storage and redirect to home
            setTimeout(() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('liora_user');
                window.location.href = '/home';
            }, 2000);

        } catch (error) {
            console.error('Error deleting account:', error);
            this.showError('Không thể xóa tài khoản. Vui lòng thử lại sau.');
        } finally {
            // Re-enable submit button
            const submitBtn = document.getElementById('btnConfirmDeleteAccount');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="mdi mdi-delete"></i> Xóa tài khoản';
            }
        }
    }

    async uploadAvatarFile(file) {
        try {
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showError('Vui lòng chọn file ảnh hợp lệ');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showError('Kích thước file không được vượt quá 5MB');
                return;
            }

            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showError('Vui lòng đăng nhập để cập nhật avatar');
                return;
            }

            // Show loading state
            const avatarImg = document.getElementById('profileAvatar');
            if (avatarImg) {
                avatarImg.style.opacity = '0.5';
            }

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/users/uploadAvatar', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Upload avatar thất bại');
            }

            const data = await response.json();
            const avatarUrl = data?.result?.avatarUrl;
            if (!avatarUrl) throw new Error('Không nhận được URL avatar');

            // Update UI immediately
            if (avatarImg) {
                avatarImg.src = avatarUrl;
                avatarImg.style.opacity = '1';
            }

            // Update current user object
            this.currentUser.avatar = avatarUrl;

            this.showToast('Cập nhật avatar thành công!', 'success');
        } catch (e) {
            console.error(e);
            this.showError(e.message || 'Không thể cập nhật avatar');

            // Restore avatar opacity
            const avatarImg = document.getElementById('profileAvatar');
            if (avatarImg) {
                avatarImg.style.opacity = '1';
            }
        }
    }

    showLoading() {
        if (document.getElementById('loadingOverlay')) return; // avoid duplicates
        const loadingElement = document.createElement('div');
        loadingElement.id = 'loadingOverlay';
        loadingElement.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
        loadingElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        loadingElement.style.zIndex = '9999';
        loadingElement.innerHTML = `
            <div class="text-center">
                <i class="mdi mdi-loading mdi-spin" style="font-size: 2rem;"></i>
                <p class="mt-3">Đang tải thông tin...</p>
            </div>
        `;
        document.body.appendChild(loadingElement);
    }

    hideLoading() {
        const loadingElement = document.getElementById('loadingOverlay');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="toast-header">
                <i class="mdi mdi-${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'information'} text-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} me-2"></i>
                <strong class="me-auto">Thông báo</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

        toastContainer.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Remove toast element after it's hidden
        toast.addEventListener('hidden.bs.toast', function () {
            toast.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
        return container;
    }

    async checkOrderReviewStatus(orderId) {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return { allReviewed: false, hasAnyReview: false };

            const response = await fetch(`/api/orders/${orderId}/items`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const products = await response.json();
                let allReviewed = true;
                let hasAnyReview = false;

                // Kiểm tra trạng thái review của tất cả sản phẩm
                for (let product of products) {
                    const reviewCheckResponse = await fetch(`/api/reviews/check/${product.idOrderProduct}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (reviewCheckResponse.ok) {
                        const reviewData = await reviewCheckResponse.json();
                        if (reviewData.exists) {
                            hasAnyReview = true;
                        } else {
                            allReviewed = false;
                        }
                    } else {
                        allReviewed = false;
                    }
                }
                return { allReviewed, hasAnyReview };
            }
            return { allReviewed: false, hasAnyReview: false };
        } catch (error) {
            console.error('Error checking review status:', error);
            return { allReviewed: false, hasAnyReview: false };
        }
    }
}

// Global functions for HTML onclick events
function editField(field) {
    if (window.userInfoManager) {
        window.userInfoManager.editField(field);
    }
}

function cancelEdit() {
    if (window.userInfoManager) {
        window.userInfoManager.cancelEdit();
    }
}

function addNewAddress() {
    if (window.userInfoManager) {
        window.userInfoManager.addNewAddress();
    }
}

function editAddress(id) {
    if (window.userInfoManager) {
        window.userInfoManager.editAddress(id);
    }
}

function deleteAddress(id) {
    if (window.userInfoManager) {
        window.userInfoManager.deleteAddress(id);
    }
}

function closeEditAddressModal() {
    if (window.userInfoManager) {
        window.userInfoManager.closeEditAddressModal();
    }
}

function changePassword() {
    if (window.userInfoManager) {
        window.userInfoManager.changePassword();
    }
}

function enable2FA() {
    if (window.userInfoManager) {
        window.userInfoManager.enable2FA();
    }
}

function toggleNotifications() {
    if (window.userInfoManager) {
        window.userInfoManager.toggleNotifications();
    }
}

function deleteAccount() {
    if (window.userInfoManager) {
        window.userInfoManager.deleteAccount();
    }
}

function closeChangePasswordModal() {
    if (window.userInfoManager) {
        window.userInfoManager.closeChangePasswordModal();
    }
}

function closeDeleteAccountModal() {
    if (window.userInfoManager) {
        window.userInfoManager.closeDeleteAccountModal();
    }
}

function uploadAvatar(e) {
    const file = e && e.target && e.target.files && e.target.files[0];
    if (window.userInfoManager && file) {
        window.userInfoManager.uploadAvatarFile(file);
    }
}

// Đóng modal địa chỉ - CSS only (zero flicker)
function closeAddressModal() {
    if (window.userInfoManager) {
        window.userInfoManager.closeAddressModal();
    } else {
        const el = document.getElementById('addAddressModal');
        if (!el) return;
        el.classList.remove('show');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    window.userInfoManager = new UserInfoManager();
});
