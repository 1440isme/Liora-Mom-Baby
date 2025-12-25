// Notification Utility
class NotificationManager {
    constructor() {
        this.notifications = [];
    }

    // Show success notification
    showSuccess(message, duration = 5000) {
        this.showNotification(message, 'success', duration);
    }

    // Show error notification
    showError(message, duration = 5000) {
        this.showNotification(message, 'danger', duration);
    }

    // Show warning notification
    showWarning(message, duration = 5000) {
        this.showNotification(message, 'warning', duration);
    }

    // Show info notification
    showInfo(message, duration = 5000) {
        this.showNotification(message, 'info', duration);
    }

    // Main notification method
    showNotification(message, type = 'info', duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        
        // Add icon based on type
        const icons = {
            'success': '✅',
            'danger': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="me-2">${icons[type] || 'ℹ️'}</span>
                <span class="flex-grow-1">${message}</span>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Store reference for cleanup
        this.notifications.push(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
        
        return notification;
    }

    // Remove specific notification
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.remove();
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }
    }

    // Clear all notifications
    clearAll() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
        this.notifications = [];
    }

    // Custom confirm dialog
    showConfirm(message, onConfirm, onCancel = null) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Xác nhận</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                        <button type="button" class="btn btn-primary" id="confirmBtn">Xác nhận</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(modal);
        
        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Handle confirm
        const confirmBtn = modal.querySelector('#confirmBtn');
        confirmBtn.addEventListener('click', () => {
            bsModal.hide();
            if (onConfirm) onConfirm();
            modal.remove();
        });
        
        // Handle cancel
        modal.addEventListener('hidden.bs.modal', () => {
            if (onCancel) onCancel();
            modal.remove();
        });
        
        return modal;
    }
}

// Create global instance
window.notificationManager = new NotificationManager();

// Global helper functions
window.showSuccess = (message, duration) => window.notificationManager.showSuccess(message, duration);
window.showError = (message, duration) => window.notificationManager.showError(message, duration);
window.showWarning = (message, duration) => window.notificationManager.showWarning(message, duration);
window.showInfo = (message, duration) => window.notificationManager.showInfo(message, duration);
window.showConfirm = (message, onConfirm, onCancel) => window.notificationManager.showConfirm(message, onConfirm, onCancel);
