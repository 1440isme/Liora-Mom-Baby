/**
 * Order Management JavaScript
 * Quản lý đơn hàng - Liora Admin
 */

class OrderManager {
    constructor() {
        this.baseUrl = '/admin/api/orders';
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 0;
        this.orders = [];
        this.filteredOrders = [];
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
        this.setDefaultDateRange();
        this.bindEvents();
        this.loadOrders();
    }

    setDefaultDateRange() {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-based (0 = January)

        // Đầu tháng hiện tại
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        // Cuối tháng hiện tại
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

        // Format thành YYYY-MM-DD cho input date
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Set giá trị mặc định
        $('#filterDateFrom').val(formatDate(startOfMonth));
        $('#filterDateTo').val(formatDate(endOfMonth));
    }

    bindEvents() {
        // Search functionality
        $('#searchOrder').on('keyup', (e) => {
            if (e.key === 'Enter') {
                this.searchOrders();
            }
        });

        $('#btnSearch').on('click', () => {
            this.searchOrders();
        });

        // Filter events
        $('#filterOrderStatus').on('change', () => {
            this.filterOrders();
        });

        $('#filterPaymentStatus').on('change', () => {
            this.filterOrders();
        });

        $('#filterDateFrom, #filterDateTo').on('change', () => {
            this.filterOrders();
        });

        // Refresh button
        $('#btnRefresh').on('click', () => {
            this.refreshData();
        });

        // Export buttons
        $('#btnExportExcel').on('click', () => {
            this.exportToExcel();
        });

        $('#btnPrintReport').on('click', () => {
            this.printReport();
        });

        // Modal events
        $('#orderDetailModal').on('hidden.bs.modal', () => {
            this.clearModal();
        });
    }

    async loadOrders() {
        try {
            this.showLoading();
            const response = await this.fetchWithAuth(this.baseUrl);

            if (!response.ok) {
                throw new Error('Không thể tải danh sách đơn hàng');
            }

            this.orders = await response.json();
            this.filteredOrders = [...this.orders];

            // Áp dụng filter theo thời gian mặc định ngay sau khi load
            this.filterOrders();

            this.renderOrderTable();
            // Không gọi updatePagination() ở đây vì filterOrders() đã gọi rồi
            
            // Thêm delay nhỏ để đảm bảo DOM đã sẵn sàng
            setTimeout(() => {
                this.updatePagination();
            }, 100);

            // Load statistics sau khi đã có dữ liệu
            this.loadStatistics();

        } catch (error) {
            console.error('Error loading orders:', error);
            this.showAlert('error', 'Lỗi', 'Không thể tải danh sách đơn hàng');
        } finally {
            this.hideLoading();
        }
    }

    async loadStatistics() {
        try {
            // Lấy thời gian filter hiện tại
            const dateFrom = $('#filterDateFrom').val();
            const dateTo = $('#filterDateTo').val();

            // Tạo query parameters cho API với thời gian filter
            const queryParams = new URLSearchParams();
            if (dateFrom) queryParams.append('dateFrom', dateFrom);
            if (dateTo) queryParams.append('dateTo', dateTo);

            // Load statistics với filter thời gian
            const statsResponse = await this.fetchWithAuth(`${this.baseUrl}/statistics?${queryParams.toString()}`);

            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                this.updateStatistics(stats);
            } else {
                // Fallback: tính toán từ dữ liệu đã load và filter theo thời gian
                this.calculateStatisticsFromFilteredData();
            }

        } catch (error) {
            console.error('Error loading statistics:', error);
            // Fallback: tính toán từ dữ liệu đã load
            this.calculateStatisticsFromFilteredData();
        }
    }

    calculateStatisticsFromFilteredData() {
        try {
            // Lấy thời gian filter hiện tại
            const dateFrom = $('#filterDateFrom').val();
            const dateTo = $('#filterDateTo').val();

            // Filter orders theo thời gian
            let filteredOrdersForStats = this.orders;

            if (dateFrom || dateTo) {
                filteredOrdersForStats = this.orders.filter(order => {
                    const orderDate = new Date(order.orderDate);
                    let matches = true;

                    if (dateFrom) {
                        const fromDate = new Date(dateFrom);
                        matches = matches && (orderDate >= fromDate);
                    }

                    if (dateTo) {
                        const toDate = new Date(dateTo);
                        toDate.setHours(23, 59, 59, 999);
                        matches = matches && (orderDate <= toDate);
                    }

                    return matches;
                });
            }

            // Tính toán thống kê từ dữ liệu đã filter
            const totalOrders = filteredOrdersForStats.length;
            const cancelledOrders = filteredOrdersForStats.filter(order => order.orderStatus === 'CANCELLED').length;
            const pendingOrders = filteredOrdersForStats.filter(order => order.orderStatus === 'PENDING').length;
            const totalRevenue = filteredOrdersForStats
                .filter(order => order.orderStatus === 'COMPLETED')
                .reduce((sum, order) => sum + (order.total || 0), 0);

            this.updateStatistics({
                total: totalOrders,
                cancelled: cancelledOrders,
                pending: pendingOrders,
                revenue: totalRevenue
            });

        } catch (error) {
            console.error('Error calculating statistics:', error);
            // Set default values nếu có lỗi
            this.updateStatistics({
                total: 0,
                cancelled: 0,
                pending: 0,
                revenue: 0
            });
        }
    }

    updateStatistics(stats) {
        $('#totalOrders').text(stats.total.toLocaleString());
        $('#paidOrders').text((stats.cancelled || 0).toLocaleString());
        $('#pendingOrders').text(stats.pending.toLocaleString());
        $('#totalRevenue').text(new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(stats.revenue));
    }

    renderOrderTable() {
        const tbody = $('#orderTableBody');
        tbody.empty();

        if (this.filteredOrders.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <i class="mdi mdi-cart-off mdi-48px text-muted mb-3"></i>
                        <p class="text-muted">Không có đơn hàng nào</p>
                    </td>
                </tr>
            `);
            return;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageOrders = this.filteredOrders.slice(startIndex, endIndex);

        pageOrders.forEach((order, index) => {
            const orderDateTime = new Date(order.orderDate);
            const dateString = new Intl.DateTimeFormat('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(orderDateTime);
            const timeString = new Intl.DateTimeFormat('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            }).format(orderDateTime);

            // Xử lý hiển thị thông tin khách hàng
            let customerDisplay = '';
            if (order.customerName && order.customerName.trim() !== '') {
                // Nếu có customerName thì hiển thị tên và ID
                customerDisplay = `
                    <div>
                        <span class="fw-bold text-dark">${order.customerName}</span>
                        <br>
                        <small class="text-muted">ID: ${order.userId || 'N/A'}</small>
                    </div>
                `;
            } else if (order.userId) {
                // Nếu chỉ có userId thì hiển thị ID và tải tên
                customerDisplay = `
                    <div>
                        <span class="fw-bold text-primary">ID: ${order.userId}</span>
                        <br>
                        <small class="text-muted" id="customerName-${order.idOrder}">Đang tải...</small>
                    </div>
                `;
            } else {
                // Nếu không có thông tin gì thì hiển thị Khách
                customerDisplay = `
                    <div>
                        <span class="fw-bold text-secondary">Khách</span>
                        <br>
                        <small class="text-muted">ID: N/A</small>
                    </div>
                `;
            }

            const row = `
                <tr>
                    <td>${startIndex + index + 1}</td>
                    <td>
                        <span class="fw-bold text-primary">#${order.idOrder}</span>
                    </td>
                    <td>
                        <div>
                            <span class="fw-medium">${dateString}</span>
                            <br>
                            <small class="text-muted">${timeString}</small>
                        </div>
                    </td>
                    <td>
                        ${customerDisplay}
                    </td>
                    <td>
                        <span class="fw-bold text-success">
                            ${new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(order.total || 0)}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${this.getPaymentStatusClass(order.paymentStatus)}">
                            ${this.getPaymentStatusText(order.paymentStatus)}
                        </span>
                        <br>
                        <small class="text-muted">${this.getPaymentMethodText(order.paymentMethod)}</small>
                    </td>
                    <td>
                        <span class="badge ${this.getOrderStatusClass(order.orderStatus)}">
                            ${this.getOrderStatusText(order.orderStatus)}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-sm btn-outline-primary" 
                                    onclick="orderManager.viewOrderDetail(${order.idOrder})"
                                    title="Xem chi tiết">
                                <i class="mdi mdi-eye"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-success" 
                                    onclick="orderManager.updateOrderStatus(${order.idOrder})"
                                    title="Cập nhật trạng thái">
                                <i class="mdi mdi-pencil"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.append(row);

            // Chỉ tải tên khách hàng nếu chưa có customerName và có userId
            if ((!order.customerName || order.customerName.trim() === '') && order.userId) {
                this.loadCustomerName(order.userId, order.idOrder);
            }
        });
    }

    async loadCustomerName(userId, orderId) {
        try {
            // Nếu userId null/undefined/0 thì là khách
            if (!userId || userId === 0) {
                $(`#customerName-${orderId}`).text('Khách');
                return;
            }

            const response = await fetch(`/admin/api/users/${userId}`);
            if (response.ok) {
                const user = await response.json();
                console.log('User data:', user); // Debug log

                // Thử các cách khác nhau để lấy tên
                let customerName = 'Khách';

                if (user.fullName && user.fullName !== 'null' && user.fullName.trim() !== '') {
                    customerName = user.fullName;
                } else if (user.firstName || user.lastName) {
                    // Kiểm tra xem có firstName hoặc lastName không
                    const firstName = (user.firstName && user.firstName !== 'null' && user.firstName !== 'undefined') ? user.firstName : '';
                    const lastName = (user.lastName && user.lastName !== 'null' && user.lastName !== 'undefined') ? user.lastName : '';

                    if (firstName || lastName) {
                        customerName = `${firstName} ${lastName}`.trim();
                    } else {
                        customerName = 'Khách';
                    }
                } else if (user.username && user.username !== 'guest') {
                    customerName = user.username;
                } else {
                    customerName = 'Khách';
                }

                $(`#customerName-${orderId}`).text(customerName);
            } else {
                console.error('API response not ok:', response.status);
                $(`#customerName-${orderId}`).text('Khách');
            }
        } catch (error) {
            console.error('Error loading customer name:', error);
            // Nếu API không hoạt động hoặc lỗi, hiển thị "Khách"
            $(`#customerName-${orderId}`).text('Khách');
        }
    }

    async viewOrderDetail(orderId) {
        // Chuyển hướng đến trang chi tiết đơn hàng thay vì mở modal
        window.location.href = `/admin/orders/detail/${orderId}`;
    }

    async updateOrderStatus(orderId) {
        try {
            const order = this.orders.find(o => o.idOrder === orderId);
            if (!order) {
                this.showAlert('error', 'Lỗi', 'Không tìm thấy đơn hàng');
                return;
            }

            // Show update status modal với string values
            $('#updateOrderId').val(orderId);
            $('#updateOrderStatus').val(order.orderStatus || 'PENDING'); // Set string value
            $('#updatePaymentStatus').val(order.paymentStatus || 'PENDING'); // Set payment status
            
            // Bind event để tự động cập nhật trạng thái thanh toán khi thay đổi trạng thái đơn hàng
            $('#updateOrderStatus').off('change').on('change', function() {
                const selectedOrderStatus = $(this).val();
                const currentPaymentStatus = $('#updatePaymentStatus').val();
                const currentOrderStatus = order.orderStatus;
                
                if (selectedOrderStatus === 'COMPLETED' && currentPaymentStatus === 'PENDING') {
                    $('#updatePaymentStatus').val('PAID');
                } else if (selectedOrderStatus === 'CANCELLED' && currentPaymentStatus === 'PAID') {
                    $('#updatePaymentStatus').val('REFUNDED');
                } else if (selectedOrderStatus === 'PENDING' && currentPaymentStatus === 'REFUNDED' && currentOrderStatus === 'COMPLETED') {
                    $('#updatePaymentStatus').val('PAID');
                }
            });
            
            $('#updateStatusModal').modal('show');

        } catch (error) {
            console.error('Error preparing status update:', error);
            this.showAlert('error', 'Lỗi', 'Không thể cập nhật trạng thái đơn hàng');
        }
    }

    async saveOrderStatus() {
        try {
            const orderId = $('#updateOrderId').val();
            const orderStatus = $('#updateOrderStatus').val(); // Keep as string
            const paymentStatus = $('#updatePaymentStatus').val(); // Get payment status

            // Tự động cập nhật trạng thái thanh toán dựa trên trạng thái đơn hàng
            let finalPaymentStatus = paymentStatus;
            const order = this.orders.find(o => o.idOrder == orderId);
            const currentOrderStatus = order ? order.orderStatus : '';
            
            if (orderStatus === 'COMPLETED') {
                // Nếu đơn hàng hoàn tất, tự động đặt thanh toán thành "Đã thanh toán" nếu đang "Chờ thanh toán"
                if (paymentStatus === 'PENDING') {
                    finalPaymentStatus = 'PAID';
                }
            } else if (orderStatus === 'CANCELLED') {
                // Nếu đơn hàng hủy và đã thanh toán, chuyển thành "Hoàn tiền"
                if (paymentStatus === 'PAID') {
                    finalPaymentStatus = 'REFUNDED';
                }
            } else if (orderStatus === 'PENDING') {
                // Nếu đơn hàng từ COMPLETED chuyển về PENDING và đã hoàn tiền, chuyển về "Đã thanh toán"
                if (paymentStatus === 'REFUNDED' && currentOrderStatus === 'COMPLETED') {
                    finalPaymentStatus = 'PAID';
                }
            }

            const response = await this.fetchWithAuth(`${this.baseUrl}/${orderId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    orderStatus: orderStatus,
                    paymentStatus: finalPaymentStatus
                })
            });

            if (!response.ok) {
                throw new Error('Không thể cập nhật trạng thái đơn hàng');
            }

            $('#updateStatusModal').modal('hide');
            this.showAlert('success', 'Thành công', 'Cập nhật trạng thái đơn hàng thành công');
            await this.loadOrders();
            await this.loadStatistics();

        } catch (error) {
            console.error('Error updating order status:', error);
            this.showAlert('error', 'Lỗi', 'Không thể cập nhật trạng thái đơn hàng');
        }
    }

    searchOrders() {
        const searchTerm = $('#searchOrder').val().toLowerCase().trim();

        if (!searchTerm) {
            this.filteredOrders = [...this.orders];
        } else {
            this.filteredOrders = this.orders.filter(order => {
                // Tìm theo mã đơn hàng (hỗ trợ cả #1 và 1)
                const orderIdMatch = order.idOrder.toString().includes(searchTerm) ||
                    order.idOrder.toString().includes(searchTerm.replace('#')) ||
                    (`#${order.idOrder}`).toLowerCase().includes(searchTerm);

                // Tìm theo ID khách hàng
                const userIdMatch = order.userId && order.userId.toString().includes(searchTerm);

                // Tìm theo tên khách hàng
                const customerNameMatch = order.customerName &&
                    order.customerName.toLowerCase().includes(searchTerm);


                return orderIdMatch || userIdMatch || customerNameMatch;
            });
        }

        this.currentPage = 1;
        this.renderOrderTable();
        this.updatePagination();
    }

    filterOrders() {
        const orderStatus = $('#filterOrderStatus').val();
        const paymentStatus = $('#filterPaymentStatus').val();
        const dateFrom = $('#filterDateFrom').val();
        const dateTo = $('#filterDateTo').val();


        this.filteredOrders = this.orders.filter(order => {
            let matches = true;

            // Filter by order status - now supports string values
            if (orderStatus !== '') {
                matches = matches && (order.orderStatus === orderStatus);
            }

            // Filter by payment status
            if (paymentStatus !== '') {
                matches = matches && (order.paymentStatus === paymentStatus);
            }

            // Filter by date range
            if (dateFrom) {
                const orderDate = new Date(order.orderDate);
                const fromDate = new Date(dateFrom);
                matches = matches && (orderDate >= fromDate);
            }

            if (dateTo) {
                const orderDate = new Date(order.orderDate);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999); // End of day
                matches = matches && (orderDate <= toDate);
            }

            return matches;
        });


        this.currentPage = 1;
        this.renderOrderTable();
        this.updatePagination();

        // Cập nhật statistics theo filter hiện tại
        this.calculateStatisticsFromFilteredData();
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.filteredOrders.length / this.pageSize);

        const pagination = $('#pagination');
        pagination.empty();

        if (this.totalPages <= 1) {
            // Vẫn cần update pagination info ngay cả khi không có pagination
            this.updatePaginationInfo();
            return;
        }

        // Previous button
        pagination.append(`
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="orderManager.goToPage(${this.currentPage - 1})">Trước</a>
            </li>
        `);

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            pagination.append(`
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="orderManager.goToPage(${i})">${i}</a>
                </li>
            `);
        }

        // Next button
        pagination.append(`
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="orderManager.goToPage(${this.currentPage + 1})">Sau</a>
            </li>
        `);

        // Update pagination info
        this.updatePaginationInfo();
    }

    updatePaginationInfo() {
        const paginationInfoElement = $('#paginationInfo');
        
        if (this.filteredOrders.length === 0) {
            paginationInfoElement.html('Hiển thị 0-0 trong tổng số 0 đơn hàng');
        } else {
            const start = (this.currentPage - 1) * this.pageSize + 1;
            const end = Math.min(this.currentPage * this.pageSize, this.filteredOrders.length);
            const displayText = `Hiển thị ${start}-${end} trong tổng số ${this.filteredOrders.length} đơn hàng`;
            paginationInfoElement.html(displayText);
        }
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.renderOrderTable();
            this.updatePagination();
        }
    }

    async refreshData() {
        this.currentPage = 1;
        $('#searchOrder').val('');
        $('#filterOrderStatus').val('');
        $('#filterPaymentStatus').val('');

        // Thiết lập lại thời gian mặc định thay vì xóa trống
        this.setDefaultDateRange();

        await this.loadOrders();
        await this.loadStatistics();
        this.showAlert('success', 'Thành công', 'Dữ liệu đã được làm mới');
    }

    exportToExcel() {
        try {
            // Lấy danh sách đơn hàng hiện tại
            const orders = this.filteredOrders.length > 0 ? this.filteredOrders : this.orders;
            
            if (!orders || orders.length === 0) {
                this.showAlert('warning', 'Cảnh báo', 'Không có dữ liệu để xuất Excel');
                return;
            }

            // Tạo CSV content
            let csv = '\uFEFF'; // UTF-8 BOM for proper encoding in Excel
            csv += 'Mã đơn hàng,Thời gian đặt,Khách hàng,Tổng tiền,Trạng thái đơn hàng,Trạng thái thanh toán,Phương thức thanh toán\n';

            orders.forEach(order => {
                const orderId = order.idOrder || '';
                const orderDate = this.formatDate(order.orderDate || '');
                const customerName = (order.customerName || '').replace(/,/g, ';');
                const totalAmount = (order.total || 0).toLocaleString('vi-VN');
                const orderStatus = this.getOrderStatusText(order.orderStatus || '');
                const paymentStatus = this.getPaymentStatusText(order.paymentStatus || '');
                const paymentMethod = (order.paymentMethod || '').replace(/,/g, ';');

                csv += `${orderId},"${orderDate}","${customerName}","${totalAmount} ₫","${orderStatus}","${paymentStatus}","${paymentMethod}"\n`;
            });

            // Create blob and download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            link.setAttribute('href', url);
            link.setAttribute('download', `danh_sach_don_hang_${dateStr}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showAlert('success', 'Thành công', 'Xuất Excel thành công!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.showAlert('error', 'Lỗi', 'Có lỗi xảy ra khi xuất Excel');
        }
    }

    printReport() {
        try {
            // Chuẩn bị dữ liệu để in
            const orders = this.filteredOrders.length > 0 ? this.filteredOrders : this.orders;
            const dateFrom = $('#filterDateFrom').val();
            const dateTo = $('#filterDateTo').val();

            if (!orders || orders.length === 0) {
                this.showAlert('warning', 'Cảnh báo', 'Không có dữ liệu để in');
                return;
            }

            // Tạo cửa sổ in
            const printWindow = window.open('', '_blank');
            
            // Lấy thông tin thống kê
            // Chỉ tính các đơn đã hoàn tất để phù hợp với thống kê trên trang
            const completedOrders = orders.filter(order => order.orderStatus === 'COMPLETED');
            const totalOrders = orders.length;
            const totalRevenue = completedOrders.reduce((sum, order) => {
                const amount = typeof order.total === 'number' ? order.total : parseFloat(order.total || 0);
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Báo cáo đơn hàng</title>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { text-align: center; color: #333; }
                        .header-info { margin-bottom: 20px; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #4e73df; color: white; }
                        .summary { margin-top: 20px; text-align: right; }
                        .summary-row { padding: 5px 0; }
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>BÁO CÁO ĐƠN HÀNG</h1>
                    <div class="header-info">
                        <p><strong>Thời gian:</strong> ${dateFrom} đến ${dateTo}</p>
                        <p><strong>Ngày in:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Mã đơn hàng</th>
                                <th>Thời gian đặt</th>
                                <th>Khách hàng</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(order => `
                                <tr>
                                    <td>${order.idOrder || ''}</td>
                                    <td>${this.formatDate(order.orderDate || '')}</td>
                                    <td>${order.customerName || ''}</td>
                                    <td>${(order.total || 0).toLocaleString('vi-VN')} ₫</td>
                                    <td>${this.getOrderStatusText(order.orderStatus || '')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="summary">
                        <div class="summary-row"><strong>Tổng đơn hàng:</strong> ${totalOrders}</div>
                        <div class="summary-row"><strong>Đơn hàng đã hoàn tất:</strong> ${completedOrders.length}</div>
                        <div class="summary-row"><strong>Tổng doanh thu (đã hoàn tất):</strong> ${totalRevenue.toLocaleString('vi-VN')} ₫</div>
                    </div>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            
            // Đợi nội dung load xong rồi mới in
            setTimeout(() => {
                printWindow.print();
            }, 500);
        } catch (error) {
            console.error('Error printing report:', error);
            this.showAlert('error', 'Lỗi', 'Có lỗi xảy ra khi in báo cáo');
        }
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

    getOrderStatusClass(status) {
        switch (status) {
            case 'PENDING':
                return 'bg-warning';
            case 'CONFIRMED':
                return 'bg-info';
            case 'CANCELLED':
                return 'bg-danger';
            case 'COMPLETED':
                return 'bg-success';
            default:
                return 'bg-secondary';
        }
    }

    getOrderStatusText(status) {
        switch (status) {
            case 'PENDING':
                return 'Chờ xử lý';
            case 'CONFIRMED':
                return 'Đã xác nhận';
            case 'CANCELLED':
                return 'Đã hủy';
            case 'COMPLETED':
                return 'Hoàn tất';
            default:
                return 'Không xác định';
        }
    }

    getPaymentStatusClass(status) {
        switch (status) {
            case 'PAID':
                return 'bg-success';
            case 'PENDING':
                return 'bg-warning';
            case 'FAILED':
                return 'bg-danger';
            case 'CANCELLED':
                return 'bg-secondary';
            case 'REFUNDED':
                return 'bg-info';
            default:
                return 'bg-info';
        }
    }

    getPaymentStatusText(status) {
        switch (status) {
            case 'PAID':
                return 'Đã thanh toán';
            case 'PENDING':
                return 'Chờ thanh toán';
            case 'FAILED':
                return 'Thất bại';
            case 'CANCELLED':
                return 'Đã hủy';
            case 'REFUNDED':
                return 'Hoàn tiền';
            default:
                return 'Không xác định';
        }
    }

    getPaymentMethodText(method) {
        switch (method) {
            case 'CASH':
                return 'Tiền mặt';
            case 'BANK_TRANSFER':
                return 'Chuyển khoản';
            case 'VNPAY':
                return 'VNPay';
            case 'COD':
                return 'Thanh toán khi nhận hàng';
            default:
                return method || 'Không xác định';
        }
    }

    showLoading() {
        $('#loadingSpinner').removeClass('d-none');
    }

    hideLoading() {
        $('#loadingSpinner').addClass('d-none');
    }

    clearModal() {
        // Clear modal content when closed
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
    window.orderManager = new OrderManager();
});

// Save order status function for modal
function saveOrderStatus() {
    orderManager.saveOrderStatus();
}
