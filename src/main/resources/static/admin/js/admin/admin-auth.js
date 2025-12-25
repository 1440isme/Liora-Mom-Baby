// Admin Authentication Manager
class AdminAuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadUserInfo();
    }

    async loadUserInfo() {
        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('access_token');
            if (!token) {
                console.log('No token found, using fallback display');
                this.updateNavbarWithFallback();
                return;
            }

            // Gọi API để lấy thông tin user
            const response = await fetch('/users/myInfo', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token hết hạn hoặc không hợp lệ
                    console.log('Token invalid, using fallback display');
                    this.updateNavbarWithFallback();
                    return;
                }
                throw new Error('Failed to load user info');
            }

            const data = await response.json();
            this.currentUser = data.result;
            this.updateNavbar();
        } catch (error) {
            console.error('Error loading user info:', error);
            this.updateNavbarWithFallback();
        }
    }

    updateNavbar() {
        if (!this.currentUser) return;

        // Cập nhật tên user
        const usernameElement = document.getElementById('admin-username');
        if (usernameElement) {
            usernameElement.textContent = this.currentUser.fullName || this.currentUser.username || 'Admin';
        }

        // Cập nhật avatar
        const avatarElement = document.getElementById('admin-avatar');
        if (avatarElement) {
            if (this.currentUser.avatar && this.currentUser.avatar.trim() !== '') {
                // Nếu có avatar, sử dụng avatar
                avatarElement.src = this.currentUser.avatar;
            } else {
                // Nếu không có avatar, sử dụng placeholder với tên user
                const initials = this.getInitials(this.currentUser.fullName || this.currentUser.username);
                avatarElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=30`;
            }
        }
    }

    updateNavbarWithFallback() {
        // Cập nhật tên user với fallback
        const usernameElement = document.getElementById('admin-username');
        if (usernameElement) {
            // Giữ nguyên text hiện tại hoặc sử dụng 'Admin'
            if (!usernameElement.textContent || usernameElement.textContent === 'Admin') {
                usernameElement.textContent = 'Admin';
            }
        }

        // Cập nhật avatar với placeholder mặc định
        const avatarElement = document.getElementById('admin-avatar');
        if (avatarElement) {
            avatarElement.src = 'https://ui-avatars.com/api/?name=A&background=007bff&color=fff&size=30';
        }
    }

    getInitials(name) {
        if (!name) return 'A';
        return name.split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    clearAuthData() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('authenticated');
        localStorage.removeItem('liora_user');
    }

    redirectToLogin() {
        window.location.href = '/admin/login';
    }

    logout() {
        this.clearAuthData();
        window.location.href = '/auth/logout';
    }
}

// Khởi tạo khi DOM đã load
document.addEventListener('DOMContentLoaded', function () {
    window.adminAuthManager = new AdminAuthManager();
});
