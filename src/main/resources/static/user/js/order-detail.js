// Order Detail Page JavaScript
class OrderDetailManager {
    constructor() {
        this.init();
    }

    init() {
        // Initialize any necessary functionality
        console.log('Order Detail Manager initialized');
    }

    showToast(message, type = 'info') {
        const toastElement = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        const toastHeader = toastElement.querySelector('.toast-header i');

        // Set message
        toastMessage.textContent = message;

        // Set icon and color based on type - chỉ icon màu hồng
        toastHeader.className = 'fas me-2';
        switch (type) {
            case 'success':
                toastHeader.classList.add('fa-check-circle', 'text-success');
                break;
            case 'error':
                toastHeader.classList.add('fa-exclamation-circle', 'text-danger');
                break;
            case 'warning':
                toastHeader.classList.add('fa-exclamation-triangle', 'text-warning');
                break;
            default:
                toastHeader.classList.add('fa-info-circle');
                toastHeader.style.color = 'var(--pink-primary)';
        }

        // Show toast
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    }

    async reorderOrder(orderId) {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showToast('Bạn không thể thực hiện thao tác này', 'error');
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
                this.showToast('Đơn hàng không có sản phẩm nào', 'error');
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
                this.showToast('Tất cả sản phẩm trong đơn hàng đều không hợp lệ (hết hàng hoặc ngừng kinh doanh)', 'error');
                return;
            }

            // Nếu có cả sản phẩm hợp lệ và không hợp lệ, hiển thị modal
            console.log('About to show reorder modal with mixed items');
            this.showReorderModal(enrichedItems);

        } catch (error) {
            console.error('Error reordering:', error);
            this.showToast('Có lỗi xảy ra khi thực hiện mua lại', 'error');
        }
    }

    async cancelOrder(orderId) {
        try {
            if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
                this.showToast('Đang hủy đơn hàng...', 'info');

                const token = localStorage.getItem('access_token');
                if (!token) {
                    this.showToast('Bạn không thể thực hiện thao tác này', 'error');
                    return;
                }

                console.log('Cancelling order:', orderId);
                console.log('Token:', token ? 'Present' : 'Missing');

                const response = await fetch(`/order/${orderId}/cancel`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);

                if (response.ok) {
                    this.showToast('Hủy đơn hàng thành công', 'success');
                    // Reload trang để cập nhật trạng thái
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    const errorData = await response.json();
                    console.log('Error response:', errorData);
                    this.showToast(errorData.message || 'Không thể hủy đơn hàng', 'error');
                }
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            this.showToast('Có lỗi xảy ra khi hủy đơn hàng', 'error');
        }
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
            this.showToast(`Đã thêm ${successCount} sản phẩm vào giỏ hàng`, 'success');
            // Chuyển đến trang giỏ hàng sau 1.5 giây
            setTimeout(() => {
                window.location.href = '/cart';
            }, 1500);
        }

        if (failedItems.length > 0) {
            this.showToast(`Không thể thêm ${failedItems.length} sản phẩm vào giỏ hàng`, 'error');
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
        console.log('OrderDetailManager showReorderModal called with items:', orderItems);
        console.log('OrderDetailManager instance:', this);

        // Lưu orderItems để sử dụng trong addAllValidItemsToCart
        this.lastOrderItems = orderItems;

        // Tạo modal HTML
        const modalHTML = `
            <div class="modal fade" id="reorderModal" tabindex="-1" aria-labelledby="reorderModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="reorderModalLabel">
                                <i class="fas fa-shopping-cart me-2"></i>Mua lại đơn hàng
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
                            <button type="button" class="btn btn-success w-100" onclick="window.orderDetailManager.addAllValidItemsToCart()">
                                <i class="fas fa-shopping-cart me-1"></i>
                                Thêm (${orderItems.filter(item => this.getProductStatus(item) === 'available').length}) sản phẩm vào giỏ hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Thêm modal vào body
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
            this.showToast('Không thể tạo modal. Vui lòng thử lại.', 'error');
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
        console.log('OrderDetailManager addAllValidItemsToCart called');
        console.log('OrderDetailManager instance:', this);

        // Lấy tất cả sản phẩm hợp lệ từ lastOrderItems
        const orderItems = this.lastOrderItems || [];
        console.log('Last order items:', orderItems);
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
            this.showToast('Không có sản phẩm nào có thể thêm vào giỏ hàng', 'error');
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
            this.showToast(`Đã thêm ${successCount} sản phẩm vào giỏ hàng`, 'success');
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
            this.showToast(`Không thể thêm ${failedItems.length} sản phẩm vào giỏ hàng`, 'error');
        }
    }
}

// Initialize when DOM is loaded using jQuery
$(document).ready(function () {
    try {
        console.log('DOM loaded, initializing OrderDetailManager...');
        window.orderDetailManager = new OrderDetailManager();
        console.log('OrderDetailManager initialized:', window.orderDetailManager);
    } catch (error) {
        console.error('Error initializing OrderDetailManager:', error);
    }
});

// Global function for reorder button
function reorderOrder(orderId) {
    if (window.orderDetailManager) {
        window.orderDetailManager.reorderOrder(orderId);
    }
}

// Global function for cancel order button
function cancelOrder(orderId) {
    try {
        console.log('cancelOrder function called with orderId:', orderId);
        if (window.orderDetailManager) {
            console.log('orderDetailManager found, calling cancelOrder method');
            window.orderDetailManager.cancelOrder(orderId);
        } else {
            console.error('orderDetailManager not found!');
            alert('Lỗi: Không thể khởi tạo order detail manager');
        }
    } catch (error) {
        console.error('Error in cancelOrder function:', error);
        alert('Lỗi: ' + error.message);
    }
}
