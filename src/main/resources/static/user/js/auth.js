// Authentication System
if (typeof AuthManager === 'undefined') {
    class AuthManager {
        constructor() {
            this.currentUser = null;
            this.isSignUp = false;
            this.isRefreshing = false; // Flag to prevent infinite loops

            this.init();
        }

        init() {
            this.bindEvents();
            // Kiểm tra trạng thái đăng nhập và tính hợp lệ của token ngay khi khởi tạo
            try { this.checkAuthState(); } catch (_) { }
            this.checkOAuth2Token();
        }

        checkOAuth2Token() {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            const authStatus = urlParams.get('auth');

            if (token && authStatus === 'success') {
                localStorage.setItem('access_token', token);
                localStorage.setItem('authenticated', 'true');

                // Decode token để lấy thông tin user
                const payload = this.parseJwt(token);
                const roles = this.extractRolesFromPayload(payload);
                const displayName = payload?.name || payload?.fullName || 'User';
                const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN') || roles.includes('MANAGER') || roles.includes('ROLE_MANAGER');

                let storedUser = {
                    username: payload?.sub,
                    name: displayName,
                    roles,
                    isAdmin
                };
                localStorage.setItem('liora_user', JSON.stringify(storedUser));

                // Redirect về trang chính và xóa params
                window.history.replaceState({}, document.title, window.location.pathname);

                // Check auth state instead of reloading
                this.checkAuthState();
            }
        }

        bindEvents() {
            // Auth form submission
            const authForm = document.getElementById('authForm');
            if (authForm) {
                authForm.addEventListener('submit', (e) => this.handleAuth(e));
            }

            // Forgot password form submission
            const forgotPasswordForm = document.getElementById('forgotPasswordForm');
            if (forgotPasswordForm) {
                forgotPasswordForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleForgotPassword();
                });
            }

            // Toggle between sign in and sign up
            const authToggle = document.getElementById('authToggle');
            if (authToggle) {
                authToggle.addEventListener('click', (e) => this.toggleAuthMode(e));
            }

            // Modal events
            const authModal = document.getElementById('authModal');
            if (authModal) {
                authModal.addEventListener('show.bs.modal', (e) => {
                    // If already authenticated, prevent opening modal and ensure header shows dropdown
                    if (window.app && window.app.currentUser) {
                        e.preventDefault();
                        window.app.updateUserDisplay();
                        return;
                    }
                    this.resetForm();
                });
                authModal.addEventListener('hidden.bs.modal', () => this.resetForm());

                // Thêm event listener cho nút gửi OTP
                const sendOtpBtn = document.getElementById('sendOtpBtn');
                if (sendOtpBtn) {
                    sendOtpBtn.addEventListener('click', () => this.handleSendOtp());
                }
            }
        }

        async handleAuth(e) {
            e.preventDefault();

            const submitBtn = document.getElementById('authSubmitBtn');
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const emailInput = document.getElementById('authEmail');
            const firstNameInput = document.getElementById('authFirstName');
            const lastNameInput = document.getElementById('authLastName');
            const otpCodeInput = document.getElementById('otpCode');
            const otpField = document.getElementById('otpField');

            const username = usernameInput ? usernameInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const firstname = firstNameInput ? firstNameInput.value.trim() : '';
            const lastname = lastNameInput ? lastNameInput.value.trim() : '';
            const otpCode = otpCodeInput ? otpCodeInput.value.trim() : '';

            // Basic validation
            if (!username || !password) {
                this.showError('Vui lòng nhập đầy đủ Username và Password');
                return;
            }

            // if (password.length < 6) {
            //     this.showError('Mật khẩu tối thiểu 6 ký tự');
            //     return;
            // }

            if (this.isSignUp) {
                if (!email) {
                    this.showError('Vui lòng nhập email');
                    return;
                }
                if (!firstname || !lastname) {
                    this.showError('Vui lòng nhập họ và tên');
                    return;
                }

                // Kiểm tra OTP nếu đang ở bước xác thực
                if (otpField && otpField.style.display !== 'none') {
                    if (!otpCode || otpCode.length !== 6) {
                        this.showError('Vui lòng nhập mã xác thực 6 chữ số');
                        return;
                    }
                }
            }

            try {
                this.setLoadingState(submitBtn, true);

                if (this.isSignUp) {
                    // Kiểm tra xem đã gửi OTP chưa
                    if (otpField && otpField.style.display !== 'none') {
                        // Bước 2: Xác thực OTP và đăng ký
                        await this.signUpWithOtp({ username, password, email, firstname, lastname, otpCode });
                    } else {
                        // Bước 1: Gửi OTP
                        await this.sendRegistrationOtp(email);
                        this.showOtpField();
                        this.showSuccess('Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra và nhập mã để hoàn tất đăng ký.');
                        return;
                    }
                } else {
                    await this.signIn(username, password);
                }

                // Close modal and reset form
                const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                if (authModal) {
                    // Show toast only after modal is fully hidden (consistent with logout UX)
                    const modalEl = document.getElementById('authModal');
                    const onHidden = () => {
                        modalEl.removeEventListener('hidden.bs.modal', onHidden);
                        if (window.app) {
                            window.app.showToast('Đăng nhập thành công! ✨', 'success');
                        }
                    };
                    modalEl.addEventListener('hidden.bs.modal', onHidden);
                    authModal.hide();
                }
                this.resetForm();

                // Force header re-render immediately without page reload
                if (window.app) {
                    window.app.currentUser = this.currentUser;
                    window.app.updateUserDisplay();
                    setTimeout(() => {
                        window.app.currentUser = this.currentUser;
                        window.app.updateUserDisplay();
                    }, 0);
                }

            } catch (error) {
                this.showError(error.message);
            } finally {
                this.setLoadingState(submitBtn, false);
            }
        }

        async sendRegistrationOtp(email) {
            try {
                const res = await fetch('/users/send-registration-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (!res.ok) {
                    let msg = 'Không thể gửi mã OTP';
                    try {
                        const err = await res.json();
                        // Xử lý các mã lỗi cụ thể
                        if (err.code === 1010) {
                            msg = 'Email đã được sử dụng cho tài khoản khác';
                        } else if (err.code === 1018) {
                            msg = 'Bạn đã gửi quá nhiều mã OTP. Vui lòng đợi 5 phút';
                        } else if (err.code === 1001) {
                            msg = 'Email không hợp lệ';
                        } else {
                            msg = err.message || 'Không thể gửi mã OTP';
                        }
                    } catch (parseError) {
                        console.error('Error parsing response:', parseError);
                        msg = `Lỗi kết nối: ${res.status}`;
                    }
                    throw new Error(msg);
                }

                const data = await res.json();
                return data;
            } catch (error) {
                console.error('sendRegistrationOtp error:', error);
                throw error;
            }
        }

        async verifyRegistrationOtp(email, otpCode) {
            try {
                const res = await fetch('/users/verify-registration-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otpCode })
                });

                if (!res.ok) {
                    let msg = 'Mã OTP không hợp lệ';
                    try {
                        const err = await res.json();
                        // Xử lý các mã lỗi cụ thể
                        if (err.code === 1017) {
                            msg = 'Mã OTP không đúng hoặc đã hết hạn';
                        } else if (err.code === 1003) {
                            msg = 'Email không tồn tại trong hệ thống';
                        } else {
                            msg = err.message || 'Mã OTP không hợp lệ';
                        }
                    } catch (parseError) {
                        console.error('Error parsing response:', parseError);
                        msg = `Lỗi kết nối: ${res.status}`;
                    }
                    throw new Error(msg);
                }

                const data = await res.json();
                return data;
            } catch (error) {
                console.error('verifyRegistrationOtp error:', error);
                throw error;
            }
        }

        async signUpWithOtp({ username, password, email, firstname, lastname, otpCode }) {
            try {
                const payload = {
                    username,
                    password,
                    email,
                    phone: null,
                    firstname,
                    lastname,
                    dob: null,
                    gender: null,
                    active: true,
                    avatar: null,
                    otpCode
                };

                const res = await fetch('/users/register-with-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    let msg = 'Không thể tạo tài khoản';
                    try {
                        const err = await res.json();
                        // Xử lý các mã lỗi cụ thể
                        if (err.code === 1017) {
                            msg = 'Mã OTP không đúng hoặc đã hết hạn';
                        } else if (err.code === 1010) {
                            msg = 'Email đã được sử dụng cho tài khoản khác';
                        } else if (err.code === 1002) {
                            msg = 'Tên đăng nhập đã tồn tại';
                        } else if (err.code === 1001) {
                            msg = 'Thông tin không hợp lệ';
                        } else {
                            msg = err.message || 'Không thể tạo tài khoản';
                        }
                    } catch (parseError) {
                        console.error('Error parsing response:', parseError);
                        msg = `Lỗi kết nối: ${res.status}`;
                    }
                    throw new Error(msg);
                }

                // Sử dụng token từ response đăng ký thay vì gọi signIn
                const data = await res.json();
                const result = data?.result;
                const token = result?.token;

                if (!token) {
                    throw new Error('Không nhận được token sau khi đăng ký');
                }

                // Lưu token và thông tin user
                localStorage.setItem('access_token', token);
                try {
                    document.cookie = `access_token=${token}; path=/; SameSite=Lax`;
                } catch (_) { }
                localStorage.setItem('authenticated', 'true');

                // Decode token để lấy thông tin user
                const tokenPayload = this.parseJwt(token);
                const roles = this.extractRolesFromPayload(tokenPayload);
                const displayName = tokenPayload?.name || tokenPayload?.fullName || username;
                const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');

                this.currentUser = {
                    username: result?.user?.username || username,
                    displayName,
                    roles,
                    isAdmin,
                    token
                };

                return this.currentUser;
            } catch (error) {
                console.error('signUpWithOtp error:', error);
                throw error;
            }
        }

        async signIn(username, password) {
            try {
                const response = await fetch('/auth/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                if (!response.ok) {
                    // Try to extract error message from API
                    let msg = 'Đăng nhập thất bại';
                    try {
                        const err = await response.json();
                        // Xử lý các mã lỗi cụ thể
                        if (err.code === 1001) {
                            msg = 'Sai tên đăng nhập hoặc mật khẩu';
                        } else if (err.code === 1003) {
                            msg = 'Tài khoản không tồn tại';
                        } else if (err.code === 1011) {
                            msg = 'Tài khoản đã bị khóa';
                        } else if (err.code === 1007) {
                            msg = 'Chưa đăng nhập';
                        } else if (err.code === 1015) {
                            msg = 'Mật khẩu không đúng';
                        } else {
                            msg = err.message || 'Đăng nhập thất bại';
                        }
                    } catch (_) { }
                    throw new Error(msg);
                }

                const data = await response.json();
                // Expecting ApiResponse with result { token, authenticated }
                const result = data?.result || data?.data?.result || data;
                const token = result?.token;
                const authenticated = Boolean(result?.authenticated ?? !!token);

                if (!authenticated || !token) {
                    throw new Error('Sai thông tin đăng nhập');
                }

                // Persist token for subsequent API calls
                localStorage.setItem('access_token', token);
                // Also set http cookie so server can read token on SSR pages like /info
                try {
                    document.cookie = `access_token=${token}; path=/; SameSite=Lax`;
                } catch (_) { }
                localStorage.setItem('authenticated', 'true');
                // Decode token to get display name and roles if available
                const payload = this.parseJwt(token);
                const roles = this.extractRolesFromPayload(payload);
                const displayName = payload?.name || payload?.fullName || username;
                const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN') || roles.includes('MANAGER') || roles.includes('ROLE_MANAGER');
                // Persist minimal user profile immediately for UI
                let storedUser = { username, name: displayName, roles, isAdmin };
                localStorage.setItem('liora_user', JSON.stringify(storedUser));

                // Try to enrich profile from /users/myInfo to get full name
                try {
                    const meRes = await fetch('/users/myInfo', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (meRes.ok) {
                        const meData = await meRes.json();
                        const me = meData.result || {};
                        const fullName = `${me.firstname || ''} ${me.lastname || ''}`.trim() || storedUser.name;
                        storedUser = { ...storedUser, name: fullName, username: me.username || storedUser.username };
                        localStorage.setItem('liora_user', JSON.stringify(storedUser));
                    }
                } catch (_) { }

                // Update runtime state and UI
                this.currentUser = storedUser;
                this.updateUserDisplay();
                if (window.app) {
                    window.app.showToast('Đăng nhập thành công! ✨', 'success');
                }

                // Broadcast login event so other modules can react immediately
                document.dispatchEvent(new CustomEvent('user:login', { detail: storedUser }));

                return { token, authenticated };
            } catch (error) {
                throw error;
            }
        }

        parseJwt(token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join(''));
                return JSON.parse(jsonPayload);
            } catch (_) {
                return {};
            }
        }

        extractRolesFromPayload(payload) {
            try {
                if (!payload) return [];
                if (Array.isArray(payload.roles)) return payload.roles.map(r => String(r).toUpperCase());
                if (Array.isArray(payload.authorities)) return payload.authorities.map(r => String(r).toUpperCase());
                if (typeof payload.scope === 'string') return payload.scope.split(' ').map(r => r.toUpperCase());
                if (payload.realm_access && Array.isArray(payload.realm_access.roles)) return payload.realm_access.roles.map(r => r.toUpperCase());
                return [];
            } catch (_) {
                return [];
            }
        }

        async signOut() {
            const token = localStorage.getItem('access_token');
            // Gọi API logout để revoke token ở server (nếu có)
            if (token) {
                try {
                    await fetch('/auth/logout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token })
                    });
                } catch (_) { }
            }

            // Xóa trạng thái cục bộ
            localStorage.removeItem('liora_user');
            localStorage.removeItem('access_token');
            localStorage.removeItem('authenticated');
            try { document.cookie = 'access_token=; Max-Age=0; path=/; SameSite=Lax'; } catch (_) { }

            this.currentUser = null;
            this.updateUserDisplay();

            if (window.app) {
                window.app.showToast('Đăng xuất thành công! ✨', 'success');
            }

            // Ensure redirect to /home from any route (e.g., /info)
            // Commented out to allow navigation to other pages
            // try {
            //     if (window && window.location && window.location.pathname !== '/home') {
            //         window.location.href = '/home';
            //         return;
            //     }
            // } catch (_) { }
        }

        toggleAuthMode(e) {
            e.preventDefault();

            this.isSignUp = !this.isSignUp;
            this.updateAuthModal();
        }

        updateAuthModal() {
            const modalTitle = document.getElementById('authModalTitle');
            const signupFields = document.getElementById('signupFields');
            const submitBtn = document.getElementById('authSubmitBtn');
            const toggleBtn = document.getElementById('authToggle');

            if (this.isSignUp) {
                modalTitle.textContent = 'Join Liora ✨';
                signupFields.style.display = 'block';
                submitBtn.textContent = 'Tạo tài khoản';
                toggleBtn.textContent = 'Đã có tài khoản? Đăng nhập';
            } else {
                modalTitle.textContent = 'Welcome Back! 💕';
                signupFields.style.display = 'none';
                this.hideOtpField();
                submitBtn.textContent = 'Đăng nhập';
                toggleBtn.textContent = "Chưa có tài khoản? Đăng ký";
            }
        }

        resetForm() {
            const form = document.getElementById('authForm');
            if (form) {
                form.reset();
            }

            this.isSignUp = false;
            this.hideOtpField();
            this.updateAuthModal();
            this.clearError();
        }

        showOtpField() {
            const otpField = document.getElementById('otpField');
            const submitBtn = document.getElementById('authSubmitBtn');
            if (otpField) {
                otpField.style.display = 'block';
            }
            if (submitBtn) {
                submitBtn.textContent = 'Hoàn tất đăng ký';
            }
        }

        hideOtpField() {
            const otpField = document.getElementById('otpField');
            const submitBtn = document.getElementById('authSubmitBtn');
            if (otpField) {
                otpField.style.display = 'none';
            }
            if (submitBtn) {
                submitBtn.textContent = this.isSignUp ? 'Đăng ký' : 'Đăng nhập';
            }
        }

        async handleSendOtp() {
            const emailInput = document.getElementById('authEmail');
            const sendOtpBtn = document.getElementById('sendOtpBtn');

            if (!emailInput || !emailInput.value.trim()) {
                this.showError('Vui lòng nhập email trước khi gửi mã OTP');
                return;
            }

            try {
                this.setLoadingState(sendOtpBtn, true);
                await this.sendRegistrationOtp(emailInput.value.trim());
                this.showSuccess('Mã OTP mới đã được gửi đến email của bạn');
            } catch (error) {
                this.showError(error.message);
            } finally {
                this.setLoadingState(sendOtpBtn, false);
            }
        }

        setLoadingState(button, loading) {
            if (loading) {
                button.disabled = true;
                button.innerHTML = `
                <span class="loading-spinner me-2"></span>
                ${this.isSignUp ? 'Tạo tài khoản...' : 'Đăng nhập...'}
            `;
            } else {
                button.disabled = false;
                button.textContent = this.isSignUp ? 'Tạo tài khoản' : 'Đăng nhập';
            }
        }

        showError(message) {
            // Remove any existing error
            this.clearError();

            // Create error element
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger mt-3 auth-error';
            errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
        `;

            // Add to form
            const form = document.getElementById('authForm');
            form.appendChild(errorDiv);

            // Auto-remove after 5 seconds
            setTimeout(() => this.clearError(), 5000);
        }

        clearError() {
            const existingError = document.querySelector('.auth-error');
            if (existingError) {
                existingError.remove();
            }
        }

        showSuccess(message) {
            // Remove any existing error
            this.clearError();

            // Create success element
            const successDiv = document.createElement('div');
            successDiv.className = 'alert alert-success mt-3 auth-success';
            successDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
        `;

            // Add to form
            const form = document.getElementById('authForm');
            form.appendChild(successDiv);

            // Auto-remove after 5 seconds
            setTimeout(() => this.clearSuccess(), 5000);
        }

        clearSuccess() {
            const existingSuccess = document.querySelector('.auth-success');
            if (existingSuccess) {
                existingSuccess.remove();
            }
        }

        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        async checkAndRefreshTokenIfNeeded() {
            if (!this.currentUser || !this.currentUser.username || this.isRefreshing) return;

            try {
                // Get current user info from server to check roles
                const response = await fetch('/users/myInfo', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const userInfo = await response.json();
                    const serverRoles = userInfo.result?.roles || [];
                    const currentRoles = this.currentUser.roles || [];

                    // Check if roles have changed
                    const rolesChanged = JSON.stringify(serverRoles.sort()) !== JSON.stringify(currentRoles.sort());

                    if (rolesChanged) {
                        await this.forceRefreshToken();
                    }
                }
            } catch (error) {
                console.warn('Failed to check user roles:', error);
            }
        }

        async forceRefreshToken() {
            if (!this.currentUser || !this.currentUser.username || this.isRefreshing) return;

            this.isRefreshing = true;

            try {
                const response = await fetch('/auth/force-refresh', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: this.currentUser.username
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const newToken = data.result?.token;

                    if (newToken) {

                        // Update token
                        localStorage.setItem('access_token', newToken);

                        // Update user data with new roles
                        const payload = this.parseJwt(newToken);
                        const roles = this.extractRolesFromPayload(payload);
                        const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN') || roles.includes('MANAGER') || roles.includes('ROLE_MANAGER');

                        this.currentUser = {
                            ...this.currentUser,
                            roles,
                            isAdmin
                        };

                        localStorage.setItem('liora_user', JSON.stringify(this.currentUser));

                        // Small delay to ensure token is properly updated
                        await new Promise(resolve => setTimeout(resolve, 100));

                        // Update user display with new roles
                        this.updateUserDisplay();
                    }
                } else {
                    console.error('Failed to refresh token:', response.status);
                }
            } catch (error) {
                console.error('Error refreshing token:', error);
            } finally {
                this.isRefreshing = false;
            }
        }

        showNotification(message, type = 'info') {
            // Create a simple notification
            const notification = document.createElement('div');
            notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show`;
            notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
            notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;

            document.body.appendChild(notification);

            // Auto remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }

        async checkAuthState() {
            const token = localStorage.getItem('access_token');
            const userData = localStorage.getItem('liora_user');

            if (!token) {
                if (userData) {
                    try { JSON.parse(userData); } catch { localStorage.removeItem('liora_user'); }
                }
                return;
            }

            try {
                const res = await fetch('/auth/introspect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                const data = await res.json().catch(() => ({}));
                const valid = Boolean(data?.result?.valid ?? data?.valid);

                if (!res.ok || !valid) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('authenticated');
                    localStorage.removeItem('liora_user');
                    try { document.cookie = 'access_token=; Max-Age=0; path=/; SameSite=Lax'; } catch (_) { }
                    this.currentUser = null;
                    this.updateUserDisplay();
                    return;
                }

                if (userData) {
                    try { this.currentUser = JSON.parse(userData); } catch { this.currentUser = null; }
                }

                // Check if user needs to refresh token due to role changes
                await this.checkAndRefreshTokenIfNeeded();

                // Get updated token after potential refresh
                const updatedToken = localStorage.getItem('access_token');

                try {
                    const meRes = await fetch('/users/myInfo', {
                        headers: {
                            'Authorization': `Bearer ${updatedToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (meRes.ok) {
                        const meData = await meRes.json();
                        const me = meData.result || {};
                        const fullName = `${me.firstname || ''} ${me.lastname || ''}`.trim();
                        const updated = {
                            username: me.username || this.currentUser?.username || me?.sub,
                            name: fullName || this.currentUser?.name || 'User',
                            roles: this.currentUser?.roles || [],
                            isAdmin: this.currentUser?.isAdmin || false
                        };
                        this.currentUser = updated;
                        localStorage.setItem('liora_user', JSON.stringify(updated));
                    }
                } catch (_) { }

                this.updateUserDisplay();
            } catch (_) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('authenticated');
                localStorage.removeItem('liora_user');
                try { document.cookie = 'access_token=; Max-Age=0; path=/; SameSite=Lax'; } catch (_) { }
                this.currentUser = null;
                this.updateUserDisplay();
            }
        }

        updateUserDisplay() {
            // This will be called by the main app
            if (window.app) {
                window.app.currentUser = this.currentUser;
                window.app.updateUserDisplay();
            }
        }

        getStoredUsers() {
            try {
                const users = localStorage.getItem('liora_users');
                return users ? JSON.parse(users) : this.getDefaultUsers();
            } catch (error) {
                console.error('Error parsing stored users:', error);
                return this.getDefaultUsers();
            }
        }

        // Get current user info
        getCurrentUser() {
            return this.currentUser;
        }

        // Check if user is authenticated
        isAuthenticated() {
            return !!this.currentUser;
        }

        // Check if user is admin
        isAdmin() {
            return this.currentUser && this.currentUser.isAdmin;
        }

        // Update user profile
        async updateProfile(userData) {
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    try {
                        const updatedUser = { ...this.currentUser, ...userData };

                        // Update in storage
                        localStorage.setItem('liora_user', JSON.stringify(updatedUser));

                        // Update in users list
                        const users = this.getStoredUsers();
                        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
                        if (userIndex !== -1) {
                            users[userIndex] = updatedUser;
                            localStorage.setItem('liora_users', JSON.stringify(users));
                        }

                        this.currentUser = updatedUser;
                        this.updateUserDisplay();

                        if (window.app) {
                            window.app.showToast('Cập nhật thông tin thành công! ✨', 'success');
                        }

                        resolve(updatedUser);
                    } catch (error) {
                        reject(error);
                    }
                }, 800);
            });
        }

        // Change password
        async changePassword(currentPassword, newPassword) {
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (newPassword.length < 6) {
                        reject(new Error('New password must be at least 6 characters long'));
                        return;
                    }

                    // In a real app, you'd verify the current password
                    // For demo purposes, we'll just accept any current password

                    if (window.app) {
                        window.app.showToast('Cập nhật mật khẩu thành công! ✨', 'success');
                    }

                    resolve();
                }, 1000);
            });
        }

        // Forgot Password - Send OTP
        async handleForgotPassword() {
            const email = document.getElementById('forgotEmail').value;

            if (!email) {
                this.showToast('Vui lòng nhập email', 'warning');
                return;
            }

            try {
                const response = await fetch('/users/send-password-reset-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: email })
                });

                const data = await response.json();

                if (data.code === 1000) {
                    this.showToast('Mã OTP đã được gửi đến email của bạn! Vui lòng kiểm tra hộp thư.', 'success');
                    // Close forgot password modal and show OTP verification modal
                    const forgotModal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
                    if (forgotModal) {
                        forgotModal.hide();
                    }
                    // Show OTP verification modal
                    this.showOtpVerificationModal(email);
                } else {
                    this.showToast(data.message || 'Có lỗi xảy ra', 'error');
                }
            } catch (error) {
                this.showToast('Có lỗi xảy ra khi gửi OTP', 'error');
            }
        }

        // Show OTP verification modal for password reset
        showOtpVerificationModal(email) {
            // Remove existing modal if it exists
            const existingModal = document.getElementById('otpVerificationModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Create new OTP verification modal
            const modalHtml = `
                <div class="modal fade" id="otpVerificationModal" tabindex="-1" data-email="${email}">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content border-0 shadow-lg">
                            <div class="modal-header border-0 text-center">
                                <h5 class="modal-title fw-bold fs-4 text-dark w-100">Xác thực OTP 🔐</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body px-4 pb-4">
                                <form id="otpVerificationForm">
                                    <div class="mb-3">
                                        <label class="form-label fw-medium text-dark">Mã OTP <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control rounded-pill" placeholder="Nhập mã 6 chữ số"
                                            id="resetOtpCode" maxlength="6" required pattern="[0-9]{6}" 
                                            title="Mã OTP phải có đúng 6 chữ số">
                                        <div class="form-text text-muted">
                                            Mã OTP đã được gửi đến: <strong>${email}</strong>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label fw-medium text-dark">Mật khẩu mới <span class="text-danger">*</span></label>
                                        <input type="password" class="form-control rounded-pill" placeholder="Nhập mật khẩu mới"
                                            id="newPassword" required minlength="6" maxlength="20">
                                        <div class="form-text text-muted">Mật khẩu phải có từ 6 đến 20 ký tự</div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label fw-medium text-dark">Xác nhận mật khẩu <span class="text-danger">*</span></label>
                                        <input type="password" class="form-control rounded-pill" placeholder="Nhập lại mật khẩu mới"
                                            id="confirmPassword" required minlength="6" maxlength="20">
                                    </div>
                                    <button type="submit" class="btn btn-pink-primary w-100 fw-semibold py-3 rounded-pill mb-3">
                                        Đặt lại mật khẩu
                                    </button>
                                    <div class="text-center">
                                        <button type="button" class="btn btn-link text-pink-primary fw-medium" id="resendOtpBtn">
                                            Gửi lại mã OTP
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Show the modal
            const otpModal = new bootstrap.Modal(document.getElementById('otpVerificationModal'));
            otpModal.show();

            // Focus on OTP input after modal is shown
            setTimeout(() => {
                const otpInput = document.getElementById('resetOtpCode');
                if (otpInput) {
                    otpInput.focus();
                }
            }, 500);

            // Bind events
            this.bindOtpVerificationEvents();
        }

        // Bind OTP verification events
        bindOtpVerificationEvents() {
            const otpForm = document.getElementById('otpVerificationForm');
            const resendBtn = document.getElementById('resendOtpBtn');

            if (otpForm) {
                // Remove existing event listeners to avoid duplicates
                otpForm.removeEventListener('submit', this.handleOtpVerification);
                otpForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleOtpVerification();
                });
            }

            if (resendBtn) {
                // Remove existing event listeners to avoid duplicates
                resendBtn.removeEventListener('click', this.resendPasswordResetOtp);
                resendBtn.addEventListener('click', () => {
                    this.resendPasswordResetOtp();
                });
            }

            // Add input event listeners for real-time validation
            const otpInput = document.getElementById('resetOtpCode');
            if (otpInput) {
                otpInput.addEventListener('input', (e) => {
                    // Only allow numbers
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    // Limit to 6 digits
                    if (e.target.value.length > 6) {
                        e.target.value = e.target.value.slice(0, 6);
                    }
                });
            }
        }

        // Handle OTP verification for password reset
        async handleOtpVerification() {
            const otpModal = document.getElementById('otpVerificationModal');
            const email = otpModal ? otpModal.getAttribute('data-email') : null;
            const otpCodeElement = document.getElementById('resetOtpCode');
            const newPasswordElement = document.getElementById('newPassword');
            const confirmPasswordElement = document.getElementById('confirmPassword');

            const otpCode = otpCodeElement ? otpCodeElement.value.trim() : '';
            const newPassword = newPasswordElement ? newPasswordElement.value.trim() : '';
            const confirmPassword = confirmPasswordElement ? confirmPasswordElement.value.trim() : '';

            if (!email) {
                this.showToast('Không tìm thấy email, vui lòng thử lại', 'error');
                return;
            }

            if (!otpCode) {
                this.showToast('Vui lòng nhập mã OTP', 'warning');
                if (otpCodeElement) otpCodeElement.focus();
                return;
            }

            if (otpCode.length !== 6) {
                this.showToast('Mã OTP phải có đúng 6 chữ số', 'warning');
                if (otpCodeElement) otpCodeElement.focus();
                return;
            }

            if (!newPassword) {
                this.showToast('Vui lòng nhập mật khẩu mới', 'warning');
                if (newPasswordElement) newPasswordElement.focus();
                return;
            }

            if (!confirmPassword) {
                this.showToast('Vui lòng xác nhận mật khẩu', 'warning');
                if (confirmPasswordElement) confirmPasswordElement.focus();
                return;
            }

            if (newPassword !== confirmPassword) {
                this.showToast('Mật khẩu xác nhận không khớp', 'warning');
                if (confirmPasswordElement) confirmPasswordElement.focus();
                return;
            }

            if (newPassword.length < 6) {
                this.showToast('Mật khẩu phải có ít nhất 6 ký tự', 'warning');
                if (newPasswordElement) newPasswordElement.focus();
                return;
            }

            if (newPassword.length > 20) {
                this.showToast('Mật khẩu không được quá 20 ký tự', 'warning');
                if (newPasswordElement) newPasswordElement.focus();
                return;
            }

            try {
                // First verify OTP
                const verifyResponse = await fetch('/users/verify-password-reset-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        otpCode: otpCode
                    })
                });

                const verifyData = await verifyResponse.json();

                if (verifyData.code === 1000) {
                    // OTP verified, now reset password
                    const resetResponse = await fetch('/users/reset-password-with-otp', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: email,
                            newPassword: newPassword,
                            confirmPassword: confirmPassword
                        })
                    });

                    const resetData = await resetResponse.json();

                    if (resetData.code === 1000) {
                        this.showToast('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.', 'success');
                        // Close OTP modal
                        const otpModal = bootstrap.Modal.getInstance(document.getElementById('otpVerificationModal'));
                        if (otpModal) {
                            otpModal.hide();
                        }
                        // Redirect to login
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 2000);
                    } else {
                        this.showToast(resetData.message || 'Có lỗi xảy ra khi đặt lại mật khẩu', 'error');
                    }
                } else {
                    this.showToast(verifyData.message || 'Mã OTP không hợp lệ', 'error');
                }
            } catch (error) {
                this.showToast('Có lỗi xảy ra khi xác thực OTP', 'error');
            }
        }

        // Resend password reset OTP
        async resendPasswordResetOtp() {
            const otpModal = document.getElementById('otpVerificationModal');
            const email = otpModal ? otpModal.getAttribute('data-email') : null;

            if (!email) {
                this.showToast('Không tìm thấy email, vui lòng thử lại', 'error');
                return;
            }

            try {
                const response = await fetch('/users/send-password-reset-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: email })
                });

                const data = await response.json();

                if (data.code === 1000) {
                    this.showToast('Mã OTP mới đã được gửi!', 'success');
                } else {
                    this.showToast(data.message || 'Có lỗi xảy ra', 'error');
                }
            } catch (error) {
                this.showToast('Có lỗi xảy ra khi gửi lại OTP', 'error');
            }
        }

        showToast(message, type = 'info') {
            // Create toast element
            const toastId = 'toast-' + Date.now();
            const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'info'} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

            // Add to toast container
            let toastContainer = document.getElementById('toastContainer');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.id = 'toastContainer';
                toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
                toastContainer.style.zIndex = '9999';
                document.body.appendChild(toastContainer);
            }

            toastContainer.insertAdjacentHTML('beforeend', toastHtml);

            // Show toast
            const toastElement = document.getElementById(toastId);
            const toast = new bootstrap.Toast(toastElement);
            toast.show();

            // Remove toast element after it's hidden
            toastElement.addEventListener('hidden.bs.toast', () => {
                toastElement.remove();
            });
        }
    }

    // Initialize auth manager when DOM is loaded
    let authManager;
    document.addEventListener('DOMContentLoaded', () => {
        authManager = new AuthManager();
    });

    // Export for use in other scripts
    window.AuthManager = AuthManager;
} // End of AuthManager class definition