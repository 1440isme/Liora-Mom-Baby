// Return Requests Management JavaScript

class ReturnRequestManager {
    constructor() {
        this.baseUrl = '/admin/api/return-requests';
        this.requests = [];
        this.filteredRequests = [];
        this.init();
    }

    init() {
        // Set default date range (2 days ago to today)
        this.setDefaultDateRange();

        // Load data
        this.loadStatistics();
        this.loadReturnRequests();

        // Event listeners
        this.setupEventListeners();
    }

    setDefaultDateRange() {
        const today = new Date();
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        $('#filterDateFrom').val(this.formatDateForInput(twoDaysAgo));
        $('#filterDateTo').val(this.formatDateForInput(today));
    }

    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    setupEventListeners() {
        // Filter change
        $('#filterDateFrom, #filterDateTo, #filterStatus').on('change', () => {
            this.loadReturnRequests();
        });

        // Refresh button
        $('#btnRefresh').on('click', () => {
            this.setDefaultDateRange();
            $('#filterStatus').val('');
            this.loadStatistics();
            this.loadReturnRequests();
        });

        // Submit update button
        $('#btnSubmitUpdate').on('click', () => {
            this.submitUpdate();
        });
    }

    async loadStatistics() {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${this.baseUrl}/statistics`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const stats = await response.json();
                $('#pendingCount').text(stats.pending || 0);
                $('#acceptedCount').text(stats.accepted || 0);
                $('#rejectedCount').text(stats.rejected || 0);
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    async loadReturnRequests() {
        try {
            const dateFrom = $('#filterDateFrom').val();
            const dateTo = $('#filterDateTo').val();
            const status = $('#filterStatus').val();

            const params = new URLSearchParams();
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            if (status) params.append('status', status);

            const token = localStorage.getItem('access_token');
            const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.requests = await response.json();
                this.filteredRequests = [...this.requests];
                this.renderTable();
                this.updatePaginationInfo();
            } else {
                this.showError('Không thể tải danh sách yêu cầu trả hàng');
            }
        } catch (error) {
            console.error('Error loading return requests:', error);
            this.showError('Có lỗi xảy ra khi tải dữ liệu');
        }
    }

    renderTable() {
        const tbody = $('#returnRequestTableBody');
        tbody.empty();

        if (this.filteredRequests.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <i class="mdi mdi-inbox-outline mdi-48px text-muted mb-3"></i>
                        <p class="text-muted">Không có yêu cầu trả hàng nào</p>
                    </td>
                </tr>
            `);
            return;
        }

        this.filteredRequests.forEach((request, index) => {
            const statusClass = this.getStatusClass(request.status);
            const statusText = this.getStatusText(request.status);
            const createdDate = new Date(request.createdDate);
            const dateString = createdDate.toLocaleDateString('vi-VN');
            const timeString = createdDate.toLocaleTimeString('vi-VN');

            // Extract text from HTML for preview, limit to 100 chars
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = request.reason;
            const reasonText = tempDiv.textContent || tempDiv.innerText || '';
            const reasonPreview = reasonText.length > 100 ? reasonText.substring(0, 100) + '...' : reasonText;

            const row = `
                <tr>
                    <td>${request.idReturnRequest}</td>
                    <td>
                        <span class="font-weight-bold text-primary">${request.orderNumber}</span>
                    </td>
                    <td>
                        <div>${request.customerName}</div>
                        <small class="text-muted">${request.customerEmail}</small>
                    </td>
                    <td>
                        <div class="reason-cell" title="${this.escapeHtml(reasonText)}">
                            ${this.escapeHtml(reasonPreview)}
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                    <td>
                        <div>${dateString}</div>
                        <small class="text-muted">${timeString}</small>
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-info" 
                                onclick="returnRequestManager.viewDetails(${request.idReturnRequest})" 
                                title="Xem chi tiết">
                                <i class="mdi mdi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary" 
                                onclick="returnRequestManager.openUpdateModal(${request.idReturnRequest})" 
                                title="Xử lý"
                                ${request.status !== 'PENDING' ? 'disabled' : ''}>
                                <i class="mdi mdi-pencil"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    viewDetails(requestId) {
        const request = this.requests.find(r => r.idReturnRequest === requestId);
        if (!request) return;

        // Fill order info
        $('#viewOrderNumber').text(request.orderNumber);
        $('#viewOrderTotal').text(this.formatCurrency(request.orderTotal));
        $('#viewOrderStatus').html(this.getOrderStatusBadge(request.orderStatus));

        // Fill customer info
        $('#viewCustomerName').text(request.customerName);
        $('#viewCustomerEmail').text(request.customerEmail);

        // Fill reason (with HTML content including images)
        if (request.reason) {
            // Debug: Log the reason content to see what we're getting
            console.log('Return request reason content:', request.reason);

            // Display HTML content directly - CKEditor content includes <figure> tags with images
            $('#viewReason').html(request.reason);

            // Ensure images are loaded properly - handle both <img> and <figure><img> structures
            setTimeout(() => {
                // Handle images in figure tags (CKEditor format)
                $('#viewReason figure img').each(function () {
                    const img = $(this);
                    let src = img.attr('src');
                    if (src) {
                        // Ensure absolute path
                        if (!src.startsWith('http') && !src.startsWith('//') && !src.startsWith('/')) {
                            src = '/' + src;
                            img.attr('src', src);
                        }
                        // Add error handler
                        img.on('error', function () {
                            console.error('Failed to load image:', src);
                            $(this).closest('figure').replaceWith('<div class="text-danger"><i class="mdi mdi-alert-circle"></i> Không thể tải hình ảnh: ' + src + '</div>');
                        });
                    }
                });

                // Handle standalone img tags
                $('#viewReason img').not('figure img').each(function () {
                    const img = $(this);
                    let src = img.attr('src');
                    if (src) {
                        // Ensure absolute path
                        if (!src.startsWith('http') && !src.startsWith('//') && !src.startsWith('/')) {
                            src = '/' + src;
                            img.attr('src', src);
                        }
                        // Add error handler
                        img.on('error', function () {
                            console.error('Failed to load image:', src);
                            $(this).replaceWith('<div class="text-danger"><i class="mdi mdi-alert-circle"></i> Không thể tải hình ảnh: ' + src + '</div>');
                        });
                    }
                });
            }, 100);
        } else {
            $('#viewReason').html('<span class="text-muted">Không có lý do</span>');
        }

        // Fill status
        const statusClass = this.getStatusClass(request.status);
        const statusText = this.getStatusText(request.status);
        $('#viewStatus').html(`<span class="status-badge ${statusClass}">${statusText}</span>`);

        // Fill dates
        $('#viewCreatedDate').text(new Date(request.createdDate).toLocaleString('vi-VN'));

        if (request.processedDate) {
            $('#viewProcessedDate').text(new Date(request.processedDate).toLocaleString('vi-VN'));
            $('#viewProcessedBy').text(request.processedByName || 'N/A');
        } else {
            $('#viewProcessedDate').text('Chưa xử lý');
            $('#viewProcessedBy').text('Chưa xử lý');
        }

        // Fill admin note
        if (request.adminNote) {
            $('#viewAdminNote').text(request.adminNote);
            $('#viewAdminNoteContainer').show();
        } else {
            $('#viewAdminNoteContainer').hide();
        }

        // Show edit button only for PENDING status
        if (request.status === 'PENDING') {
            $('#btnEditFromView').show().off('click').on('click', () => {
                $('#viewDetailModal').modal('hide');
                this.openUpdateModal(requestId);
            });
        } else {
            $('#btnEditFromView').hide();
        }

        $('#viewDetailModal').modal('show');
    }

    openUpdateModal(requestId) {
        const request = this.requests.find(r => r.idReturnRequest === requestId);
        if (!request) return;

        $('#updateRequestId').val(request.idReturnRequest);
        $('#updateOrderNumber').text(request.orderNumber);
        $('#updateCustomerName').text(request.customerName);
        $('#updateReason').html(request.reason);
        $('#updateStatus').val('');
        $('#updateAdminNote').val('');

        $('#updateStatusModal').modal('show');
    }

    async submitUpdate() {
        const requestId = $('#updateRequestId').val();
        const status = $('#updateStatus').val();
        const adminNote = $('#updateAdminNote').val();

        if (!status) {
            alert('Vui lòng chọn quyết định');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${this.baseUrl}/${requestId}/process`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: status,
                    adminNote: adminNote
                })
            });

            if (response.ok) {
                $('#updateStatusModal').modal('hide');
                this.showSuccess('Xử lý yêu cầu trả hàng thành công');
                this.loadStatistics();
                this.loadReturnRequests();
            } else {
                const error = await response.json();
                this.showError(error.message || 'Không thể xử lý yêu cầu');
            }
        } catch (error) {
            console.error('Error processing return request:', error);
            this.showError('Có lỗi xảy ra khi xử lý yêu cầu');
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    getOrderStatusBadge(status) {
        const statusMap = {
            'PENDING': '<span class="badge bg-warning">Chờ xử lý</span>',
            'CONFIRMED': '<span class="badge bg-info">Đã xác nhận</span>',
            'SHIPPING': '<span class="badge bg-primary">Đang giao</span>',
            'DELIVERED': '<span class="badge bg-success">Đã giao</span>',
            'COMPLETED': '<span class="badge bg-success">Hoàn thành</span>',
            'CANCELLED': '<span class="badge bg-danger">Đã hủy</span>',
            'RETURNED': '<span class="badge bg-secondary">Đã trả hàng</span>'
        };
        return statusMap[status] || status;
    }

    openProcessModal(requestId) {
        // Deprecated - use openUpdateModal instead
        this.openUpdateModal(requestId);
    }

    async submitProcess() {
        // Deprecated - use submitUpdate instead
        await this.submitUpdate();
    }

    getStatusClass(status) {
        const statusMap = {
            'PENDING': 'status-pending',
            'ACCEPTED': 'status-accepted',
            'REJECTED': 'status-rejected'
        };
        return statusMap[status] || 'status-pending';
    }

    getStatusText(status) {
        const statusMap = {
            'PENDING': 'Chờ xử lý',
            'ACCEPTED': 'Đã chấp nhận',
            'REJECTED': 'Đã từ chối'
        };
        return statusMap[status] || status;
    }

    updatePaginationInfo() {
        const count = this.filteredRequests.length;
        $('#paginationInfo').text(`Hiển thị 1-${count} trong tổng số ${count} yêu cầu`);
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    showSuccess(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: message,
                timer: 2000
            });
        } else {
            alert(message);
        }
    }

    showError(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: message
            });
        } else {
            alert('Lỗi: ' + message);
        }
    }
}

// Initialize when document is ready
$(document).ready(function () {
    window.returnRequestManager = new ReturnRequestManager();
});
