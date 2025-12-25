/**
 * Admin AJAX Utilities
 * Handles all AJAX requests for admin panel
 */

class AdminAjax {
    constructor() {
        this.baseURL = '/admin/api';
        this.csrfToken = this.getCSRFToken();
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        if (this.csrfToken) {
            this.defaultHeaders['X-CSRF-TOKEN'] = this.csrfToken;
        }
    }

    /**
     * Get CSRF token from meta tag
     */
    getCSRFToken() {
        const meta = document.querySelector('meta[name="_csrf"]');
        return meta ? meta.getAttribute('content') : null;
    }

    /**
     * Make GET request
     */
    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullURL = queryString ? `${this.baseURL}${url}?${queryString}` : `${this.baseURL}${url}`;

        try {
            const response = await fetch(fullURL, {
                method: 'GET',
                headers: this.defaultHeaders
            });

            return await this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Make POST request
     */
    async post(url, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                method: 'POST',
                headers: this.defaultHeaders,
                body: JSON.stringify(data)
            });

            return await this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Make PUT request
     */
    async put(url, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                method: 'PUT',
                headers: this.defaultHeaders,
                body: JSON.stringify(data)
            });

            return await this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Make DELETE request
     */
    async delete(url) {
        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                method: 'DELETE',
                headers: this.defaultHeaders
            });

            return await this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Make PATCH request
     */
    async patch(url, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                method: 'PATCH',
                headers: this.defaultHeaders,
                body: JSON.stringify(data)
            });

            return await this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Handle response
     */
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Handle specific error types
            if (response.status === 403) {
                this.showPermissionError(errorData.message || 'Bạn không có quyền thực hiện thao tác này');
                throw new AdminAjaxError(
                    'Không có quyền thực hiện thao tác này',
                    response.status,
                    errorData
                );
            } else if (response.status === 401) {
                this.showAuthError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                throw new AdminAjaxError(
                    'Phiên đăng nhập đã hết hạn',
                    response.status,
                    errorData
                );
            }

            throw new AdminAjaxError(
                errorData.message || 'Request failed',
                response.status,
                errorData
            );
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }

        return await response.text();
    }

    /**
     * Handle error
     */
    handleError(error) {
        console.error('AJAX Error:', error);
        this.showNotification('Có lỗi xảy ra khi thực hiện yêu cầu', 'error');
    }

    /**
     * Show permission error with special styling
     */
    showPermissionError(message) {
        this.showNotification(message, 'permission-error');
    }

    /**
     * Show authentication error with redirect
     */
    showAuthError(message) {
        this.showNotification(message, 'auth-error');
        // Redirect to login after 3 seconds
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

    // Product Management API
    async getProducts(params = {}) {
        return await this.get('/products', params);
    }

    async getProduct(id) {
        return await this.get(`/products/${id}`);
    }

    async createProduct(data) {
        return await this.post('/products', data);
    }

    async updateProduct(id, data) {
        return await this.put(`/products/${id}`, data);
    }

    async deleteProduct(id) {
        return await this.delete(`/products/${id}`);
    }

    async updateProductStatus(id, status) {
        return await this.patch(`/products/${id}/status`, { status });
    }

    // Order Management API
    async getOrders(params = {}) {
        return await this.get('/orders', params);
    }

    async getOrder(id) {
        return await this.get(`/orders/${id}`);
    }

    async updateOrderStatus(id, status) {
        return await this.patch(`/orders/${id}/status`, { status });
    }

    async cancelOrder(id, reason) {
        return await this.patch(`/orders/${id}/cancel`, { reason });
    }

    // User Management API
    async getUsers(params = {}) {
        return await this.get('/users', params);
    }

    async getUser(id) {
        return await this.get(`/users/${id}`);
    }

    async updateUser(id, data) {
        return await this.put(`/users/${id}`, data);
    }

    async deleteUser(id) {
        return await this.delete(`/users/${id}`);
    }

    async updateUserStatus(id, status) {
        return await this.patch(`/users/${id}/status`, { status });
    }

    async resetUserPassword(id) {
        return await this.post(`/users/${id}/reset-password`);
    }

    // Category Management API
    async getCategories() {
        return await this.get('/categories');
    }

    async createCategory(data) {
        return await this.post('/categories', data);
    }

    async updateCategory(id, data) {
        return await this.put(`/categories/${id}`, data);
    }

    async deleteCategory(id) {
        return await this.delete(`/categories/${id}`);
    }

    // Brand Management API
    async getBrands() {
        return await this.get('/brands');
    }

    async createBrand(data) {
        return await this.post('/brands', data);
    }

    async updateBrand(id, data) {
        return await this.put(`/brands/${id}`, data);
    }

    async deleteBrand(id) {
        return await this.delete(`/brands/${id}`);
    }

    // Dashboard API
    async getDashboardStats() {
        return await this.get('/dashboard/stats');
    }

    async getDashboardCharts(period = '7d') {
        return await this.get('/dashboard/charts', { period });
    }

    // File Upload API
    async uploadFile(file, type = 'image') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        try {
            const response = await fetch(`${this.baseURL}/upload`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': this.csrfToken
                },
                body: formData
            });

            return await this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    // Bulk Operations API
    async bulkUpdateProducts(ids, data) {
        return await this.patch('/products/bulk', { ids, data });
    }

    async bulkDeleteProducts(ids) {
        return await this.delete('/products/bulk', ids);
    }

    async bulkUpdateOrders(ids, data) {
        return await this.patch('/orders/bulk', { ids, data });
    }

    async bulkUpdateUsers(ids, data) {
        return await this.patch('/users/bulk', { ids, data });
    }

    // Search API
    async searchProducts(query, filters = {}) {
        return await this.get('/search/products', { q: query, ...filters });
    }

    async searchOrders(query, filters = {}) {
        return await this.get('/search/orders', { q: query, ...filters });
    }

    async searchUsers(query, filters = {}) {
        return await this.get('/search/users', { q: query, ...filters });
    }

    // Export API
    async exportProducts(format = 'excel', filters = {}) {
        const params = new URLSearchParams({ format, ...filters });
        window.open(`${this.baseURL}/export/products?${params}`);
    }

    async exportOrders(format = 'excel', filters = {}) {
        const params = new URLSearchParams({ format, ...filters });
        window.open(`${this.baseURL}/export/orders?${params}`);
    }

    async exportUsers(format = 'excel', filters = {}) {
        const params = new URLSearchParams({ format, ...filters });
        window.open(`${this.baseURL}/export/users?${params}`);
    }

    // Settings API
    async getSettings() {
        return await this.get('/settings');
    }

    async updateSettings(data) {
        return await this.put('/settings', data);
    }

    // Analytics API
    async getAnalytics(period = '30d') {
        return await this.get('/analytics', { period });
    }

    async getSalesReport(startDate, endDate) {
        return await this.get('/reports/sales', { startDate, endDate });
    }
}

/**
 * Custom error class for AJAX errors
 */
class AdminAjaxError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'AdminAjaxError';
        this.status = status;
        this.data = data;
    }
}

// Initialize AJAX utilities
window.adminAjax = new AdminAjax();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminAjax, AdminAjaxError };
}
