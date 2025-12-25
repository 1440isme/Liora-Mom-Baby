/**
 * Permission Error Interceptor
 * Handles 403 Forbidden errors globally across admin panel
 */

class PermissionInterceptor {
    constructor() {
        this.init();
    }

    init() {
        // Intercept fetch requests
        this.interceptFetch();

        // Intercept XMLHttpRequest
        this.interceptXHR();
    }

    /**
     * Intercept fetch requests
     */
    interceptFetch() {
        const originalFetch = window.fetch;
        const self = this;

        window.fetch = async function (...args) {
            try {
                const response = await originalFetch.apply(this, args);

                // Check for permission errors
                if (response.status === 403) {
                    const errorData = await response.json().catch(() => ({}));
                    self.handlePermissionError(errorData.message || 'Bạn không có quyền thực hiện thao tác này');
                } else if (response.status === 401) {
                    const errorData = await response.json().catch(() => ({}));
                    self.handleAuthError(errorData.message || 'Phiên đăng nhập đã hết hạn');
                }

                return response;
            } catch (error) {
                console.error('Fetch error:', error);
                throw error;
            }
        };
    }

    /**
     * Intercept XMLHttpRequest
     */
    interceptXHR() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        const self = this;

        XMLHttpRequest.prototype.open = function (method, url, ...args) {
            this._url = url;
            this._method = method;
            return originalOpen.apply(this, [method, url, ...args]);
        };

        XMLHttpRequest.prototype.send = function (data) {
            this.addEventListener('load', function () {
                if (this.status === 403) {
                    try {
                        const responseData = JSON.parse(this.responseText);
                        self.handlePermissionError(responseData.message || 'Bạn không có quyền thực hiện thao tác này');
                    } catch (e) {
                        self.handlePermissionError('Bạn không có quyền thực hiện thao tác này');
                    }
                } else if (this.status === 401) {
                    try {
                        const responseData = JSON.parse(this.responseText);
                        self.handleAuthError(responseData.message || 'Phiên đăng nhập đã hết hạn');
                    } catch (e) {
                        self.handleAuthError('Phiên đăng nhập đã hết hạn');
                    }
                }
            });

            return originalSend.apply(this, [data]);
        };
    }

    /**
     * Handle permission error
     */
    handlePermissionError(message) {
        console.warn('Permission denied:', message);

        // Show permission error notification
        this.showNotification(
            `🚫 ${message}`,
            'permission-error'
        );

        // Disable action buttons temporarily
        this.disableActionButtons();
    }

    /**
     * Handle authentication error
     */
    handleAuthError(message) {
        console.warn('Authentication error:', message);

        // Show auth error notification
        this.showNotification(
            `🔐 ${message}`,
            'auth-error'
        );

        // Redirect to login after delay
        setTimeout(() => {
            window.location.href = '/admin/login';
        }, 3000);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `admin-notification admin-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    /**
     * Get notification icon
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            'permission-error': 'ban',
            'auth-error': 'sign-out-alt'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Disable action buttons temporarily
     */
    disableActionButtons() {
        const actionButtons = document.querySelectorAll('button[type="submit"], .btn-primary, .btn-danger, .btn-warning');

        actionButtons.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');

            // Re-enable after 3 seconds
            setTimeout(() => {
                button.disabled = false;
                button.classList.remove('disabled');
            }, 3000);
        });
    }
}

// Initialize permission interceptor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PermissionInterceptor();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PermissionInterceptor();
    });
} else {
    new PermissionInterceptor();
}
