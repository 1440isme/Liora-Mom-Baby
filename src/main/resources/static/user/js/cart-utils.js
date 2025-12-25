/**
 * Cart Utility Functions
 * Shared functions for Cart and Checkout pages
 */

class CartUtils {
    /**
     * Get product status based on isActive and available
     * Used by both Cart and Checkout pages
     */
    static getProductStatus(item) {
        // Kiểm tra trạng thái sản phẩm
        // Ngừng kinh doanh nếu product.isActive = false
        if (!item.isActive) {
            return 'deactivated';
        }
        // Hết hàng nếu product.available = false
        if (!item.available) {
            return 'out_of_stock';
        }
        return 'available';
    }

    /**
     * Get product status tag HTML
     * Used by both Cart and Checkout pages
     */
    static getProductStatusTag(status) {
        switch (status) {
            case 'deactivated':
                return '<span class="product-status-tag status-deactivated">Ngừng kinh doanh</span>';
            case 'out_of_stock':
                return '<span class="product-status-tag status-out-of-stock">Hết hàng</span>';
            default:
                return '';
        }
    }

    /**
     * Handle quantity button clicks (+/-)
     * Used by both Cart and Checkout pages
     */
    static async handleQuantityChange(event, updateQuantityFn, showToastFn, afterUpdateFn = null) {
        const button = $(event.target).closest('.quantity-btn');
        const action = button.data('action');
        const input = button.siblings('.quantity-input');
        const cartItem = button.closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');
        let value = parseInt(input.val());

        // Get max stock from input attribute (already calculated min with 99)
        const maxStock = parseInt(input.attr('max')) || 99;
        
        // Get actual stock from data attribute if available
        const actualStock = parseInt(cartItem.data('stock')) || maxStock;
        const finalMaxStock = Math.min(actualStock, maxStock);

        if (action === 'increase') {
            if (value < finalMaxStock) {
                value++;
            } else {
                value = finalMaxStock;
                showToastFn(`Sản phẩm không đủ hàng (còn ${actualStock} sản phẩm)`, 'warning');
            }
        } else if (action === 'decrease') {
            if (value > 1) {
                value--;
            } else {
                showToastFn(`Số lượng tối thiểu là 1 sản phẩm`, 'warning');
            }
        }

        // Update UI immediately for instant feedback
        input.val(value);
        
        // Update quantity in background (don't wait for it to update price)
        updateQuantityFn(cartProductId, value).catch(err => {
            console.error('Error updating quantity:', err);
        });
        
        // Only update summary (which shows total price)
        if (afterUpdateFn && typeof afterUpdateFn === 'function') {
            afterUpdateFn();
        }
    }

    /**
     * Validate and handle quantity input changes
     * Used by both Cart and Checkout pages
     */
    static async handleQuantityInputChange(event, updateQuantityFn, showToastFn, afterUpdateFn = null) {
        const input = $(event.target);
        const cartItem = input.closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');
        let value = parseInt(input.val());

        // Get max stock from input attribute (already calculated min with 99)
        const maxStock = parseInt(input.attr('max')) || 99;
        
        // Get actual stock from data attribute if available
        const actualStock = parseInt(cartItem.data('stock')) || maxStock;
        const finalMaxStock = Math.min(actualStock, maxStock);

        console.log('Input validation:', { value, maxStock, inputVal: input.val(), cartProductId });

        // Force validation immediately
        if (isNaN(value) || value < 1) {
            value = 1;
            input.val(value);
            showToastFn(`Số lượng tối thiểu là 1 sản phẩm`, 'warning');
            console.log('Set to minimum: 1');
            
            // Update quantity in background
            updateQuantityFn(cartProductId, value).catch(err => {
                console.error('Error updating quantity:', err);
            });
        } else if (value > finalMaxStock) {
            // Auto update to max stock
            value = finalMaxStock;
            input.val(value);
            showToastFn(`Sản phẩm không đủ hàng (còn ${actualStock} sản phẩm)`, 'warning');
            console.log('Set to maximum:', finalMaxStock);
            
            // Update quantity in background
            updateQuantityFn(cartProductId, value).catch(err => {
                console.error('Error updating quantity:', err);
            });
        } else {
            // Valid quantity, update to cart
            console.log('Valid quantity, updating cart:', value);
            
            // Update quantity in background
            updateQuantityFn(cartProductId, value).catch(err => {
                console.error('Error updating quantity:', err);
                showToastFn('Có lỗi xảy ra khi cập nhật số lượng', 'error');
            });
        }

        // Update summary immediately (shows total price)
        if (afterUpdateFn && typeof afterUpdateFn === 'function') {
            afterUpdateFn();
        }
    }

    /**
     * Show toast notification
     * Used by both Cart and Checkout pages
     */
    static showToast(message, type = 'info') {
        // Remove any existing toasts with the same message to prevent duplicates
        $(`.toast .toast-body`).each(function() {
            if ($(this).text().trim() === message.trim()) {
                $(this).closest('.toast').remove();
            }
        });

        // Create toast container if not exists
        if (!$('#toast-container').length) {
            $('body').append('<div id="toast-container" class="position-fixed top-0 end-0 p-3" style="z-index: 9999;"></div>');
        }

        const toastId = 'toast-' + Date.now();
        const iconMap = {
            success: 'fas fa-check-circle text-success',
            error: 'fas fa-exclamation-circle text-danger',
            warning: 'fas fa-exclamation-triangle text-warning',
            info: 'fas fa-info-circle text-info'
        };

        const colorMap = {
            success: 'success',
            error: 'danger',
            warning: 'warning',
            info: 'info'
        };

        const toastHTML = `
            <div class="toast align-items-center text-bg-${colorMap[type]} border-0" id="${toastId}" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="${iconMap[type]} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        $('#toast-container').append(toastHTML);

        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Auto remove after hide
        toastElement.addEventListener('hidden.bs.toast', () => {
            $(toastElement).remove();
        });
    }

    /**
     * Format currency (VND)
     * Used by both Cart and Checkout pages
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    /**
     * API call helper
     * Used by both Cart and Checkout pages
     */
    static async apiCall(url, method = 'GET', data = null) {
        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        // Thêm Authorization header nếu có token
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method: method,
            headers: headers
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        // Với DELETE request, response có thể là empty body
        if (method === 'DELETE') {
            return { success: true };
        }

        return await response.json();
    }

    /**
     * Show loading overlay
     * Used by both Cart and Checkout pages
     * Supports both #loading-overlay and #loadingOverlay selectors
     */
    static showLoading(show) {
        const overlay = $('#loading-overlay').length ? $('#loading-overlay') : $('#loadingOverlay');
        
        if (show) {
            if (overlay.length) {
                overlay.fadeIn(200);
            } else {
                // Create overlay if it doesn't exist
                $('body').append('<div id="loading-overlay" class="loading-overlay"><div class="spinner-border text-primary" role="status"></div></div>');
                $('#loading-overlay').fadeIn(200);
            }
        } else {
            if (overlay.length) {
                overlay.fadeOut(200);
            }
        }
    }

    /**
     * Show confirm dialog
     * Used by both Cart and Checkout pages
     */
    static showConfirmDialog(title, message, onConfirm) {
        if (confirm(`${title}\n\n${message}`)) {
            onConfirm();
        }
    }

    /**
     * Validate product item
     * Returns error message if invalid, null if valid
     */
    static validateProductItem(item, showToastFn = null) {
        const status = this.getProductStatus(item);
        
        if (status === 'deactivated') {
            const errorMsg = `Sản phẩm "${item.productName || 'Sản phẩm'}" đã ngừng kinh doanh`;
            if (showToastFn) showToastFn(errorMsg, 'error');
            return errorMsg;
        }
        
        if (status === 'out_of_stock') {
            const errorMsg = `Sản phẩm "${item.productName || 'Sản phẩm'}" đã hết hàng`;
            if (showToastFn) showToastFn(errorMsg, 'error');
            return errorMsg;
        }
        
        // Check stock quantity
        if (item.quantity > item.stock) {
            const errorMsg = `Sản phẩm "${item.productName || 'Sản phẩm'}" không đủ hàng (còn ${item.stock} sản phẩm)`;
            if (showToastFn) showToastFn(errorMsg, 'error');
            return errorMsg;
        }
        
        return null; // Valid
    }

    /**
     * Validate selected products before checkout
     * @param {string} cartId - Cart ID
     * @param {function} showToastFn - Function to show toast messages
     * @param {function} updateItemsFn - Function to update items (for cart)
     * @param {function} onSuccessFn - Function to call on successful validation (for cart navigation)
     */
    static async validateSelectedProducts(cartId, showToastFn, updateItemsFn = null, onSuccessFn = null) {
        try {
            // Gọi API để lấy sản phẩm đã chọn
            const selectedItemsResponse = await this.apiCall(`/CartProduct/${cartId}/selected-products`, 'GET');
            
            // Tạo bản sao danh sách
            const clonedList = [...selectedItemsResponse];
            
            if (!clonedList || clonedList.length === 0) {
                if (showToastFn) showToastFn('Đơn hàng không hợp lệ vui lòng tải lại trang để xem danh sách sản phẩm có thể mua được', 'warning');
                return false;
            }
            
            // Validate each item (sử dụng bản sao)
            for (const item of clonedList) {
                const error = this.validateProductItem(item, showToastFn);
                if (error) {
                    return false;
                }
            }

            // Update items if needed (for cart page)
            if (updateItemsFn) {
                const allItemsResponse = await this.apiCall(`/cart/api/${cartId}/items`, 'GET');
                updateItemsFn(allItemsResponse);
            }

            // Call onSuccess callback if provided (for navigation)
            if (onSuccessFn) {
                onSuccessFn();
            }

            return true;
        } catch (error) {
            console.error('Error validating products:', error);
            if (showToastFn) showToastFn('Không thể kiểm tra trạng thái sản phẩm', 'error');
            return false;
        }
    }
}
