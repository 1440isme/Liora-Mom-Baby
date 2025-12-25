// Authentication Interceptor
// Tự động thêm token vào tất cả request và xử lý authentication

class AuthInterceptor {
    constructor() {
        this.init();
    }

    init() {
        // Intercept tất cả fetch requests
        this.interceptFetch();

        // Intercept tất cả XMLHttpRequest
        this.interceptXHR();

        // Intercept form submissions
        this.interceptForms();
    }

    interceptFetch() {
        const originalFetch = window.fetch;
        const self = this;

        window.fetch = function (...args) {
            const [url, options = {}] = args;

            // Chỉ thêm token vào headers nếu có token và chưa có Authorization header
            const token = localStorage.getItem('access_token');
            if (token && !options.headers?.['Authorization']) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                };
            }

            return originalFetch.apply(this, [url, options]);
        };
    }

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
            // Chỉ thêm token nếu có token và chưa có Authorization header
            const token = localStorage.getItem('access_token');
            if (token && !this.getRequestHeader('Authorization')) {
                this.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            return originalSend.apply(this, [data]);
        };
    }

    interceptForms() {
        // Intercept form submissions để thêm token (chỉ khi có token)
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                const token = localStorage.getItem('access_token');
                if (token) {
                    // Thêm token vào form nếu chưa có
                    let tokenInput = form.querySelector('input[name="token"]');
                    if (!tokenInput) {
                        tokenInput = document.createElement('input');
                        tokenInput.type = 'hidden';
                        tokenInput.name = 'token';
                        tokenInput.value = token;
                        form.appendChild(tokenInput);
                    }
                }
            }
        });
    }

    // Helper method để gửi request với token (chỉ khi có token)
    async requestWithAuth(url, options = {}) {
        const token = localStorage.getItem('access_token');
        if (token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };
        }
        return fetch(url, options);
    }

    // Helper method để navigate với token (chỉ khi có token)
    navigateWithAuth(url) {
        const token = localStorage.getItem('access_token');
        if (token) {
            // Sử dụng POST request thay vì GET với token trong URL
            this.requestWithAuth(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: token })
            }).then(response => {
                if (response.ok) {
                    // Redirect đến URL mới thay vì URL cũ
                    window.location.href = '/user/order-detail-view';
                } else {
                    console.error('Authentication failed');
                    window.location.href = url;
                }
            }).catch(error => {
                console.error('Error:', error);
                window.location.href = url;
            });
        } else {
            // Không có token - chuyển hướng bình thường
            window.location.href = url;
        }
    }
}

// Khởi tạo interceptor khi DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authInterceptor = new AuthInterceptor();
});

// Export cho sử dụng global
window.AuthInterceptor = AuthInterceptor;
