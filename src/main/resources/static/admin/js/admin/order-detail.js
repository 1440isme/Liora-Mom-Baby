/**
 * Order Detail Management JavaScript
 * Chi tiết đơn hàng - Liora Admin
 */

class OrderDetailManager {
    constructor() {
        this.baseUrl = '/admin/api/orders';
        // Ưu tiên lấy orderId từ server trước, sau đó mới từ URL
        this.orderId = window.orderIdFromServer || this.getOrderIdFromUrl();
        this.orderData = null;
        this.init();
    }

    // Utility method để gửi request với authentication
    async fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return fetch(url, {
            ...options,
            headers
        });
    }

    init() {
        if (this.orderId) {
            this.loadOrderDetail();
            this.bindEvents();
        } else {
            this.showAlert('error', 'Lỗi', 'Không tìm thấy mã đơn hàng');
            setTimeout(() => {
                window.location.href = '/admin/orders';
            }, 2000);
        }
    }

    bindEvents() {
        // Update status button
        $('#btnUpdateStatus').on('click', () => {
            this.showUpdateStatusModal();
        });

        // Print order button
        $('#btnPrintOrder').on('click', () => {
            this.printOrder();
        });

        // Modal events
        $('#updateStatusModal').on('hidden.bs.modal', () => {
            this.clearModal();
        });
    }

    getOrderIdFromUrl() {
        // Lấy từ URL path parameter trước (ví dụ: /admin/orders/detail/123)
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart && !isNaN(lastPart)) {
                console.log('OrderId from path:', lastPart);
                return lastPart;
            }
        }

        // Nếu không có trong path, thử lấy từ query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const idFromQuery = urlParams.get('id');
        if (idFromQuery) {
            console.log('OrderId from query:', idFromQuery);
            return idFromQuery;
        }

        console.log('No orderId found in URL');
        return null;
    }

    async loadOrderDetail() {
        try {
            this.showLoading();

            console.log('Loading order detail for ID:', this.orderId);

            // Load specific order by ID
            const response = await this.fetchWithAuth(`${this.baseUrl}/${this.orderId}`);

            if (!response.ok) {
                throw new Error('Không thể tải thông tin đơn hàng');
            }

            this.orderData = await response.json();
            console.log('Loaded order:', this.orderData);

            console.log('Found order:', this.orderData);

            if (!this.orderData) {
                throw new Error('Không tìm thấy đơn hàng');
            }

            this.renderOrderDetail();
            this.updateTimeline();

        } catch (error) {
            console.error('Error loading order detail:', error);
            this.showAlert('error', 'Lỗi', error.message);
        } finally {
            this.hideLoading();
        }
    }

    renderOrderDetail() {
        const order = this.orderData;

        // Update page title - sử dụng idOrder
        document.title = `Chi tiết đơn hàng #${order.idOrder} - Liora Admin`;
        $('#pageOrderId').text(`#${order.idOrder}`);

        // Customer information - lấy trực tiếp từ Order
        $('#customerId').text(order.userId || 'N/A');
        $('#customerName').text(order.name || 'N/A');
        $('#customerEmail').text(order.email || 'N/A');
        $('#customerPhone').text(order.phone || 'N/A');
        $('#customerAddress').text(order.addressDetail || 'N/A');


        // Order information - sử dụng các trường đúng từ OrderResponse
        $('#orderIdDetail').text(`#${order.idOrder}`);

        // Gộp ngày và thời gian thành một dòng với xử lý lỗi
        try {
            const orderDateTime = new Date(order.orderDate);

            // Kiểm tra xem ngày có hợp lệ không
            if (isNaN(orderDateTime.getTime())) {
                $('#orderDateTime').text('Không có thông tin');
            } else {
                const fullDateTime = new Intl.DateTimeFormat('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }).format(orderDateTime);

                $('#orderDateTime').text(fullDateTime);
            }
        } catch (error) {
            console.error('Error formatting date:', error);
            $('#orderDateTime').text('Lỗi định dạng ngày');
        }

        // Payment method - đặt trước trạng thái
        $('#paymentMethod').text(order.paymentMethod || 'Tiền mặt');

        // Trạng thái đơn hàng
        $('#orderStatus').html(`<span class="badge ${this.getOrderStatusClass(order.orderStatus)}">${this.getOrderStatusText(order.orderStatus)}</span>`);

        // Trạng thái thanh toán
        $('#paymentStatus').html(`<span class="badge ${this.getPaymentStatusClass(order.paymentStatus)}">${this.getPaymentStatusText(order.paymentStatus)}</span>`);

        // Order details - sử dụng trường total thay vì totalAmount
        const formattedAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(order.total || 0).replace('₫', '₫');

        $('#totalAmount').text(formattedAmount);
        $('#summaryTotal').text(formattedAmount);

        // Shipping fee và discount
        const shippingFee = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(order.shippingFee || 0).replace('₫', '₫');
        $('#shippingFee').text(shippingFee);
        $('#summaryShippingFee').text(shippingFee);

        const discount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(order.totalDiscount || 0).replace('₫', '₫');
        $('#discount').text(discount);
        $('#summaryDiscount').text(`-${discount}`);

        // Calculate subtotal
        const subtotal = (order.total || 0) - (order.shippingFee || 0) + (order.totalDiscount || 0);
        $('#subtotal').text(new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(subtotal).replace('₫', '₫'));

        // Order notes - sử dụng trường note từ Order
        $('#orderNotes').text(order.note || 'Không có ghi chú');

        // Load order items - cần API riêng
        this.loadOrderItems(order.idOrder);

        // Hiển thị thông tin mã giảm giá và %
        if (order.discountId && order.discountName) {
            $('#discountCodeRow').show();
            $('#discountCode').text(order.discountName);

            // Hiển thị % giảm giá nếu có
            if (order.discountValue) {
                $('#discountPercentRow').show();
                $('#discountPercent').text(`${order.discountValue}%`);
            } else {
                $('#discountPercentRow').hide();
            }
        } else {
            $('#discountCodeRow').hide();
            $('#discountPercentRow').hide();
        }
    }

    async loadOrderItems(orderId) {
        try {
            const response = await fetch(`/api/orders/${orderId}/items`);
            if (response.ok) {
                const items = await response.json();
                console.log('Order items loaded:', items);

                if (items && items.length > 0) {
                    this.renderOrderItems(items);
                } else {
                    // Nếu không có sản phẩm nào
                    $('#orderItemsTable').html(`
                        <tr>
                            <td colspan="5" class="text-center py-4">
                                <i class="mdi mdi-package-variant-closed mdi-48px text-muted mb-3"></i>
                                <p class="text-muted">Không có sản phẩm nào trong đơn hàng</p>
                            </td>
                        </tr>
                    `);
                }
            } else if (response.status === 404) {
                $('#orderItemsTable').html(`
                    <tr>
                        <td colspan="5" class="text-center py-4">
                            <i class="mdi mdi-alert mdi-48px text-warning mb-3"></i>
                            <p class="text-muted">Không tìm thấy thông tin đơn hàng</p>
                        </td>
                    </tr>
                `);
            } else {
                throw new Error(`API Error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading order items:', error);
            $('#orderItemsTable').html(`
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <i class="mdi mdi-alert mdi-48px text-danger mb-3"></i>
                        <p class="text-muted">Không thể tải danh sách sản phẩm: ${error.message}</p>
                    </td>
                </tr>
            `);
        }
    }

    renderOrderItems(items) {
        const tbody = $('#orderItemsTable');
        tbody.empty();

        if (!items || items.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <i class="mdi mdi-package-variant-closed mdi-48px text-muted mb-3"></i>
                        <p class="text-muted">Không có sản phẩm nào trong đơn hàng</p>
                    </td>
                </tr>
            `);
            return;
        }

        let subtotalFromItems = 0;
        items.forEach((item, index) => {
            const itemTotal = item.totalPrice || 0;
            subtotalFromItems += itemTotal;

            // Hiển thị hình ảnh sản phẩm hoặc placeholder
            const imageHtml = item.mainImageUrl ?
                `<img src="${item.mainImageUrl}" alt="${item.productName || 'Sản phẩm'}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;">` :
                `<div class="d-flex align-items-center justify-content-center bg-light rounded" style="width: 60px; height: 60px;">
                    <i class="mdi mdi-package-variant mdi-24px text-muted"></i>
                </div>`;

            const row = `
                <tr>
                    <td>
                        ${imageHtml}
                    </td>
                    <td>
                        <h6 class="mb-1">${item.productName || `Sản phẩm #${item.idProduct}`}</h6>
                    </td>
                    <td class="text-center">
                        ${item.productPrice ?
                    new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        minimumFractionDigits: 0
                    }).format(item.productPrice).replace('₫', '₫') :
                    (item.totalPrice && item.quantity ?
                        new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                            minimumFractionDigits: 0
                        }).format(item.totalPrice / item.quantity).replace('₫', '₫') : 'N/A'
                    )
                }
                    </td>
                    <td class="text-center">
                        ${item.quantity || 0}
                    </td>
                    <td class="fw-bold text-primary text-end">
                        ${new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    minimumFractionDigits: 0
                }).format(itemTotal).replace('₫', '₫')}
                    </td>
                </tr>
            `;
            tbody.append(row);
        });

        // Update subtotal based on actual items if available
        if (subtotalFromItems > 0) {
            $('#subtotal').text(new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0
            }).format(subtotalFromItems).replace('₫', '₫'));
        }
    }

    updateTimeline() {
        const order = this.orderData;

        // Reset timeline
        $('.timeline-item').removeClass('active');

        // Always show ordered
        $('#timelineOrdered').addClass('active');
        $('#timelineOrderedDate').text(this.formatDate(order.orderDate));

        // Update based on order status
        if (order.orderStatus) {
            $('#timelineConfirmed').addClass('active');
            $('#timelineConfirmedDate').text('Đã xác nhận');

            if (order.paymentStatus) {
                $('#timelinePaid').addClass('active');
                $('#timelinePaidDate').text('Đã thanh toán');

                // If both confirmed and paid, assume shipped
                $('#timelineShipped').addClass('active');
                $('#timelineShippedDate').text('Đã giao hàng');
            }
        }
    }

    showUpdateStatusModal() {
        if (!this.orderData) return;

        $('#updateOrderId').val(this.orderData.idOrder);

        // Map trạng thái hiện tại sang format chuẩn
        const currentStatus = this.mapOrderStatusToStandard(this.orderData.orderStatus);
        $('#updateOrderStatus').val(currentStatus);

        $('#updateStatusModal').modal('show');
    }

    // Map trạng thái từ backend sang format chuẩn
    mapOrderStatusToStandard(status) {
        if (typeof status === 'boolean') {
            return status ? 'COMPLETED' : 'PENDING';
        }

        if (typeof status === 'string') {
            const upperStatus = status.toUpperCase();
            if (['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(upperStatus)) {
                return upperStatus;
            }
        }

        return 'PENDING'; // Default
    }

    async saveOrderStatus() {
        try {
            const orderId = $('#updateOrderId').val();
            const orderStatus = $('#updateOrderStatus').val();

            const response = await this.fetchWithAuth(`${this.baseUrl}/${orderId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    orderStatus: orderStatus
                })
            });

            if (!response.ok) {
                throw new Error('Không thể cập nhật trạng thái đơn hàng');
            }

            $('#updateStatusModal').modal('hide');
            this.showAlert('success', 'Thành công', 'Cập nhật trạng thái đơn hàng thành công');

            // Reload order detail
            await this.loadOrderDetail();

        } catch (error) {
            console.error('Error updating order status:', error);
            this.showAlert('error', 'Lỗi', 'Không thể cập nhật trạng thái đơn hàng');
        }
    }

    printOrder() {
        // Create a print-friendly version
        const printWindow = window.open('', '_blank');
        const order = this.orderData;

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Đơn hàng #${order.idOrder}</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .info-section { margin-bottom: 20px; }
                    .info-title { font-weight: bold; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .total { font-weight: bold; font-size: 18px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>LIORA FASHION</h1>
                    <h2>ĐơN HÀNG #${order.idOrder}</h2>
                    <p>Ngày: ${this.formatDate(order.orderDate)}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Thông tin khách hàng:</div>
                    <p><strong>Họ tên:</strong> ${$('#customerName').text() || 'N/A'}</p>
                    <p><strong>Email:</strong> ${$('#customerEmail').text() || 'N/A'}</p>
                    <p><strong>Điện thoại:</strong> ${$('#customerPhone').text() || 'N/A'}</p>
                    <p><strong>Địa chỉ giao hàng:</strong> ${$('#shippingAddress').text() || 'N/A'}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Thông tin đơn hàng:</div>
                    <p><strong>Tổng tiền:</strong> ${new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(order.total)}</p>
                    ${order.discountName ? `<p><strong>Mã giảm giá:</strong> ${order.discountName} (${order.discountValue || 0}%)</p>` : ''}
                    <p><strong>Trạng thái thanh toán:</strong> ${this.getPaymentStatusText(order.paymentStatus)}</p>
                    <p><strong>Trạng thái đơn hàng:</strong> ${this.getOrderStatusText(order.orderStatus)}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Ghi chú:</div>
                    <p>${$('#orderNotes').text() || 'Không có ghi chú'}</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }

    // Helper methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    getPaymentStatusClass(status) {
        return status ? 'bg-success' : 'bg-warning';
    }



    // Map text trạng thái để hiển thị
    getOrderStatusText(status) {
        const mappedStatus = this.mapOrderStatusToStandard(status);
        switch (mappedStatus) {
            case 'PENDING': return 'Chờ xử lý';
            case 'CONFIRMED': return 'Đã xác nhận';
            case 'COMPLETED': return 'Hoàn tất';
            case 'CANCELLED': return 'Đã hủy';
            default: return 'Chờ xử lý';
        }
    }

    // Map class cho badge trạng thái
    getOrderStatusClass(status) {
        const mappedStatus = this.mapOrderStatusToStandard(status);
        switch (mappedStatus) {
            case 'PENDING': return 'bg-warning';
            case 'CONFIRMED': return 'bg-info';
            case 'COMPLETED': return 'bg-success';
            case 'CANCELLED': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    // Map text trạng thái thanh toán để hiển thị
    getPaymentStatusText(status) {
        if (!status) return 'Chưa xác định';
        const upperStatus = status.toUpperCase();
        switch (upperStatus) {
            case 'PENDING': return 'Chờ thanh toán';
            case 'PAID': return 'Đã thanh toán';
            case 'CANCELLED': return 'Đã hủy';
            case 'FAILED': return 'Thanh toán thất bại';
            case 'REFUNDED': return 'Hoàn tiền';
            default: return status;
        }
    }

    // Map class cho badge trạng thái thanh toán
    getPaymentStatusClass(status) {
        if (!status) return 'bg-secondary';
        const upperStatus = status.toUpperCase();
        switch (upperStatus) {
            case 'PENDING': return 'bg-warning';
            case 'PAID': return 'bg-success';
            case 'CANCELLED': return 'bg-danger';
            case 'FAILED': return 'bg-danger';
            case 'REFUNDED': return 'bg-info';
            default: return 'bg-secondary';
        }
    }

    showLoading() {
        $('#loadingSpinner').removeClass('d-none');
    }

    hideLoading() {
        $('#loadingSpinner').addClass('d-none');
    }

    clearModal() {
        $('#updateStatusForm')[0].reset();
    }

    showAlert(type, title, message) {
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const alert = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <strong>${title}:</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        $('#alertContainer').html(alert);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            $('.alert').fadeOut();
        }, 5000);
    }
}

// Initialize when document is ready
$(document).ready(function () {
    window.orderDetailManager = new OrderDetailManager();
});

// Save order status function for modal - giống như trang quản lý đơn hàng
function saveOrderStatus() {
    if (window.orderDetailManager) {
        window.orderDetailManager.saveOrderStatus();
    }
}

