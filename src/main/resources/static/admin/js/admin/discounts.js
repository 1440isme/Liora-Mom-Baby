/**
 * Discount Management JavaScript
 * Quản lý mã giảm giá - Liora Admin
 */

class DiscountManager {
    constructor() {
        this.baseUrl = '/admin/api/discounts';
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 0;
        this.discounts = [];
        this.filteredDiscounts = [];
        this.init();
    }

    init() {
        // Chỉ chạy các function cần thiết dựa trên trang hiện tại
        if (document.getElementById('discountTableBody')) {
            // Trang list
            console.log('Initializing list page...');
            this.setDefaultDateRange();
            this.bindListEvents();
            this.loadDiscounts();
        } else if (document.getElementById('discountForm')) {
            // Trang add/edit
            this.setDefaultValues();
            this.bindFormEvents();
            this.updatePreview();

            // ✅ THÊM: Load dữ liệu nếu là trang edit
            if (this.isEditPage()) {
                this.loadDiscountData();
            }
        }
    }

    isEditPage() {
        return window.location.pathname.includes('/edit');
    }

    getDiscountIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        const editIndex = pathParts.indexOf('edit');
        if (editIndex > 0) {
            return pathParts[editIndex - 1];
        }
        return null;
    }

    // ✅ THÊM: Load dữ liệu discount để edit
    async loadDiscountData() {
        try {
            const discountId = this.getDiscountIdFromUrl();
            if (!discountId) {
                this.showAlert('error', 'Lỗi', 'Không tìm thấy ID mã giảm giá');
                return;
            }

            console.log('Loading discount data for ID:', discountId);
            this.showLoading();

            const response = await fetch(`${this.baseUrl}/${discountId}`);

            if (!response.ok) {
                throw new Error('Không thể tải thông tin mã giảm giá');
            }

            const data = await response.json();
            const discount = data.result;

            // Fill form với dữ liệu hiện tại
            this.fillFormWithData(discount);
            this.updatePreview();

        } catch (error) {
            console.error('Error loading discount data:', error);
            this.showAlert('error', 'Lỗi', 'Không thể tải thông tin mã giảm giá');
        } finally {
            this.hideLoading();
        }
    }

    // ✅ THÊM: Fill form với dữ liệu
    fillFormWithData(discount) {
        $('#discountId').val(discount.discountId);
        $('#name').val(discount.name);
        $('#description').val(discount.description || '');
        $('#discountValue').val(discount.discountValue);
        $('#minOrderValue').val(discount.minOrderValue || '');
        $('#maxDiscountAmount').val(discount.maxDiscountAmount || '');
        $('#usageLimit').val(discount.usageLimit || 0);
        $('#userUsageLimit').val(discount.userUsageLimit || 0);
        $('#isActive').prop('checked', discount.isActive);

        // Format dates cho datetime-local input
        if (discount.startDate) {
            const startDate = new Date(discount.startDate);
            const startDateString = this.formatDateTimeForInput(startDate);
            $('#startDate').val(startDateString);
        }

        if (discount.endDate) {
            const endDate = new Date(discount.endDate);
            const endDateString = this.formatDateTimeForInput(endDate);
            $('#endDate').val(endDateString);
        }
    }

    // ✅ THÊM: Format datetime cho input
    formatDateTimeForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // ========== LIST PAGE FUNCTIONS ==========
    setDefaultDateRange() {
        const today = new Date();
        const currentYear = today.getFullYear();

        // Đầu năm ngoái (năm hiện tại - 1)
        const startOfLastYear = new Date(currentYear - 1, 0, 1); // 1/1/năm ngoái
        // Cuối năm hiện tại
        const endOfCurrentYear = new Date(currentYear, 11, 31); // 31/12/năm nay

        // Format thành YYYY-MM-DD cho input date
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Set giá trị mặc định
        $('#filterDateFrom').val(formatDate(startOfLastYear));
        $('#filterDateTo').val(formatDate(endOfCurrentYear));

        console.log('Default date range set:', formatDate(startOfLastYear), 'to', formatDate(endOfCurrentYear));
    }

    bindListEvents() {
        // ✅ SEARCH FUNCTIONALITY - Real-time search
        $('#searchDiscount').on('input', () => {
            this.filterDiscounts(); // Gọi filterDiscounts() mỗi khi gõ
        });

        // Search functionality
        // $('#searchDiscount').on('keyup', (e) => {
        //     if (e.key === 'Enter') {
        //         this.searchDiscounts();
        //     }
        // });
        //
        // $('#btnSearch').on('click', () => {
        //     this.searchDiscounts();
        // });

        // Filter events
        $('#filterDiscountStatus').on('change', () => {
            this.filterDiscounts();
        });

        $('#filterDateFrom, #filterDateTo').on('change', () => {
            this.filterDiscounts();
        });

        // THÊM SẮP XẾP THEO HEADER
        $('.sortable').on('click', (e) => {
            const sortField = $(e.currentTarget).data('sort');
            this.sortByColumn(sortField);
        });

        // Refresh button
        $('#btnRefresh').on('click', () => {
            this.refreshData();
        });

        // Modal events
        $('#discountDetailModal').on('hidden.bs.modal', () => {
            this.clearModal();
        });
    }

    sortByColumn(field) {
        // Toggle sort direction
        const currentSort = $('.sortable').data('current-sort');
        const currentDir = $('.sortable').data('current-dir');

        let newDir = 'asc';
        if (currentSort === field && currentDir === 'asc') {
            newDir = 'desc';
        }

        // Update UI
        $('.sortable').removeClass('sort-asc sort-desc');
        $('.sortable').data('current-sort', field);
        $('.sortable').data('current-dir', newDir);

        $(`.sortable[data-sort="${field}"]`).addClass(`sort-${newDir}`);

        // Sort data
        this.filteredDiscounts.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];

            // Handle different data types
            if (field === 'startDate' || field === 'endDate' || field === 'createdAt') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (newDir === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        this.renderDiscountTable();
    }

    handleApiError(response, data) {
        console.error('API Error:', response.status, data);

        if (response.status === 400) {
            // Bad Request - validation errors
            if (data.errors && Array.isArray(data.errors)) {
                const errorMessages = data.errors.map(error => error.message || error).join(', ');
                return `Lỗi dữ liệu: ${errorMessages}`;
            }
            return data.message || 'Dữ liệu không hợp lệ';
        } else if (response.status === 401) {
            return 'Phiên đăng nhập hết hạn';
        } else if (response.status === 403) {
            return 'Không có quyền thực hiện thao tác này';
        } else if (response.status === 404) {
            return 'Không tìm thấy mã giảm giá';
        } else if (response.status === 500) {
            return 'Lỗi server, vui lòng thử lại sau';
        } else {
            return data.message || 'Có lỗi xảy ra';
        }
    }

    // ========== FORM PAGE FUNCTIONS ==========
    setDefaultValues() {
        // Set default date range (7 days from now)
        const now = new Date();
        const endDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days later

        // Format for datetime-local input
        const formatDateTime = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        $('#startDate').val(formatDateTime(now));
        $('#endDate').val(formatDateTime(endDate));
    }

    bindFormEvents() {
        // Form submission
        $('#discountForm').on('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Real-time preview update
        $('#name, #description, #discountValue, #minOrderValue, #maxDiscountAmount, #startDate, #endDate, #usageLimit, #userUsageLimit, #isActive')
            .on('input change', () => {
                this.updatePreview();
            });

        // Date validation
        $('#startDate, #endDate').on('change', () => {
            this.validateDateRange();
        });

        // Number input validation
        $('#discountValue').on('input', () => {
            const value = parseFloat($('#discountValue').val());
            if (value > 100) {
                $('#discountValue').val(100);
            }
        });
    }

    validateDateRange() {
        const startDate = new Date($('#startDate').val());
        const endDate = new Date($('#endDate').val());

        if (startDate && endDate && startDate >= endDate) {
            this.showAlert('warning', 'Cảnh báo', 'Ngày kết thúc phải sau ngày bắt đầu');
            $('#endDate').val('');
        }
    }

    async handleFormSubmit() {
        try {
            console.log('=== START FORM SUBMIT ===');
            this.setFormLoading(true);

            // Validate form
            if (!this.validateForm()) {
                console.log('Form validation failed');
                return;
            }

            // Prepare form data
            const formData = this.prepareFormData();
            console.log('Form data:', formData);

            // Get token from localStorage
            const token = localStorage.getItem('access_token');
            console.log('Token:', token ? 'Found' : 'Not found');

            // Prepare headers
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // SỬA: Xác định method và URL
            const isEdit = this.isEditPage();
            const discountId = $('#discountId').val();
            const method = isEdit ? 'PUT' : 'POST';
            const url = isEdit ? `${this.baseUrl}/${discountId}` : this.baseUrl;

            console.log('Method:', method, 'URL:', url);

            // Submit to API
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(formData)
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            // Handle 401 - Token expired
            if (response.status === 401) {
                console.log('Token expired, trying to refresh...');

                // Try to refresh token
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    try {
                        const refreshResponse = await fetch('/auth/refresh', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                token: refreshToken
                            })
                        });

                        if (refreshResponse.ok) {
                            const refreshData = await refreshResponse.json();
                            // Backend trả về AuthenticationResponse { token, authenticated }
                            const newToken = (refreshData?.result && refreshData.result.token) || refreshData?.token;
                            if (newToken) {
                                localStorage.setItem('access_token', newToken);
                                try { document.cookie = `access_token=${newToken}; path=/; SameSite=Lax`; } catch (_) { }
                            }

                            // Retry the original request with new token
                            if (newToken) headers['Authorization'] = `Bearer ${newToken}`;

                            const retryResponse = await fetch(url, {
                                method: method,
                                headers: headers,
                                body: JSON.stringify(formData)
                            });

                            if (retryResponse.ok) {
                                const retryData = await retryResponse.json();
                                const message = isEdit ? 'Cập nhật mã giảm giá thành công!' : 'Tạo mã giảm giá thành công!';
                                this.showAlert('success', 'Thành công', message);

                                setTimeout(() => {
                                    window.location.href = '/admin/discounts';
                                }, 2000);
                                return;
                            }
                        }
                    } catch (refreshError) {
                        console.error('Refresh token failed:', refreshError);
                    }
                }

                // If refresh failed, redirect to home
                this.showAlert('error', 'Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại');
                setTimeout(() => {
                    window.location.href = '/home';
                }, 2000);
                return;
            }

            if (!response.ok) {
                const errorMessage = this.handleApiError(response, data);
                throw new Error(errorMessage);
            }

            const successMessage = isEdit ? 'Cập nhật mã giảm giá thành công!' : 'Tạo mã giảm giá thành công!';
            this.showAlert('success', 'Thành công', successMessage);

            window.location.href = '/admin/discounts';

        } catch (error) {
            console.error('Error submitting form:', error);
            const errorMessage = this.isEditPage() ? 'Không thể cập nhật mã giảm giá' : 'Không thể tạo mã giảm giá';
            this.showAlert('error', 'Lỗi', error.message || errorMessage);
        } finally {
            this.setFormLoading(false);
        }
    }

    validateForm() {
        const name = $('#name').val().trim();
        const discountValue = parseFloat($('#discountValue').val());
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();

        console.log('Validating form:', { name, discountValue, startDate, endDate });

        if (!name) {
            this.showAlert('error', 'Lỗi', 'Vui lòng nhập tên mã giảm giá');
            $('#name').focus();
            return false;
        }

        if (!discountValue || discountValue <= 0 || discountValue > 100) {
            this.showAlert('error', 'Lỗi', 'Vui lòng nhập giá trị giảm hợp lệ (1-100%)');
            $('#discountValue').focus();
            return false;
        }

        if (!startDate) {
            this.showAlert('error', 'Lỗi', 'Vui lòng chọn ngày bắt đầu');
            $('#startDate').focus();
            return false;
        }

        if (!endDate) {
            this.showAlert('error', 'Lỗi', 'Vui lòng chọn ngày kết thúc');
            $('#endDate').focus();
            return false;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            this.showAlert('error', 'Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu');
            $('#endDate').focus();
            return false;
        }

        console.log('Form validation passed');
        return true;
    }

    prepareFormData() {
        const formData = {
            name: $('#name').val().trim(),
            description: $('#description').val().trim() || null,
            discountValue: parseFloat($('#discountValue').val()),
            minOrderValue: $('#minOrderValue').val() ? parseFloat($('#minOrderValue').val()) : null,
            maxDiscountAmount: $('#maxDiscountAmount').val() ? parseFloat($('#maxDiscountAmount').val()) : null,
            startDate: $('#startDate').val(),
            endDate: $('#endDate').val(),
            usageLimit: $('#usageLimit').val() ? parseInt($('#usageLimit').val()) : null,
            userUsageLimit: $('#userUsageLimit').val() ? parseInt($('#userUsageLimit').val()) : null,
            isActive: $('#isActive').is(':checked')
        };

        // ✅ THÊM: Log dữ liệu để debug
        console.log('Prepared form data:', formData);

        return formData;
    }

    updatePreview() {
        const name = $('#name').val().trim();
        const description = $('#description').val().trim();
        const discountValue = $('#discountValue').val();
        const minOrderValue = $('#minOrderValue').val();
        const maxDiscountAmount = $('#maxDiscountAmount').val();
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();
        const usageLimit = $('#usageLimit').val();
        const userUsageLimit = $('#userUsageLimit').val();
        const isActive = $('#isActive').is(':checked');

        let previewHtml = '';

        if (name || discountValue) {
            previewHtml = `
                <div class="card border-primary">
                    <div class="card-body">
                        <h5 class="card-title text-primary">${name || 'Tên mã giảm giá'}</h5>
                        ${description ? `<p class="card-text text-muted">${description}</p>` : ''}
                        
                        <div class="row">
                            <div class="col-6">
                                <strong>Giá trị:</strong><br>
                                <span class="text-success fs-5">${discountValue || '0'}%</span>
                            </div>
                            <div class="col-6">
                                <strong>Trạng thái:</strong><br>
                                <span class="badge ${isActive ? 'bg-success' : 'bg-secondary'}">
                                    ${isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
                                </span>
                            </div>
                        </div>

                        ${minOrderValue ? `
                            <div class="mt-2">
                                <strong>Đơn tối thiểu:</strong><br>
                                <span class="text-info">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minOrderValue)}</span>
                            </div>
                        ` : ''}

                        ${maxDiscountAmount ? `
                            <div class="mt-2">
                                <strong>Giảm tối đa:</strong><br>
                                <span class="text-warning">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(maxDiscountAmount)}</span>
                            </div>
                        ` : ''}

                        ${startDate && endDate ? `
                            <div class="mt-2">
                                <strong>Thời gian:</strong><br>
                                <small class="text-muted">
                                    ${this.formatDate(startDate)} - ${this.formatDate(endDate)}
                                </small>
                            </div>
                        ` : ''}

                        ${usageLimit || userUsageLimit ? `
                            <div class="mt-2">
                                <strong>Giới hạn:</strong><br>
                                <small class="text-muted">
                                    ${usageLimit ? `Tổng: ${usageLimit}` : ''}
                                    ${usageLimit && userUsageLimit ? ' | ' : ''}
                                    ${userUsageLimit ? `Người dùng: ${userUsageLimit}` : ''}
                                </small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            previewHtml = `
                <div class="text-center text-muted">
                    <i class="mdi mdi-percent mdi-48px"></i>
                    <p class="mt-2">Thông tin mã giảm giá sẽ hiển thị ở đây</p>
                </div>
            `;
        }

        $('#discountPreview').html(previewHtml);
    }

    setFormLoading(loading) {
        const submitBtn = $('#submitBtn');
        const spinner = $('#loadingSpinner');
        const text = $('#submitText');

        if (loading) {
            submitBtn.prop('disabled', true);
            spinner.removeClass('d-none');
            const loadingText = this.isEditPage() ? 'Đang cập nhật...' : 'Đang tạo...';
            text.text(loadingText);
        } else {
            submitBtn.prop('disabled', false);
            spinner.addClass('d-none');
            const buttonText = this.isEditPage() ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá';
            text.text(buttonText);
        }
    }

    // ========== EXISTING LIST FUNCTIONS ==========
    async loadDiscounts() {
        try {
            this.showLoading();

            // Build query parameters - LOAD TẤT CẢ DỮ LIỆU
            const params = new URLSearchParams();
            params.append('page', 0);
            params.append('size', 1000);

            const response = await fetch(`${this.baseUrl}?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Không thể tải danh sách mã giảm giá');
            }

            const data = await response.json();
            this.discounts = data.result.content || [];

            // FILTER MẶC ĐỊNH: CHỈ HIỂN THỊ ĐANG HOẠT ĐỘNG
            // const now = new Date(); // ✅ DÙNG now THAY VÌ today

            this.filteredDiscounts = this.discounts;

            console.log('Total discounts loaded:', this.discounts.length);
            console.log('Active discounts filtered:', this.filteredDiscounts.length);

            this.renderDiscountTable();
            this.loadStatistics();

        } catch (error) {
            console.error('Error loading discounts:', error);
            this.showAlert('error', 'Lỗi', 'Không thể tải danh sách mã giảm giá');
        } finally {
            this.hideLoading();
        }
    }

    async loadStatistics() {
        try {
            // Thay vì gọi API statistics, tính toán từ dữ liệu hiện có
            // this.calculateStatistics();
            this.calculateStatisticsFromFilteredData();
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    calculateStatistics() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let totalDiscounts = 0;
        let activeDiscounts = 0;
        let upcomingDiscounts = 0;
        let expiredDiscounts = 0;

        console.log('Calculating statistics for', this.discounts.length, 'discounts');
        console.log('Current date:', today.toISOString().split('T')[0]);

        this.discounts.forEach((discount, index) => {
            totalDiscounts++;

            const startDate = new Date(discount.startDate);
            const endDate = new Date(discount.endDate);

            console.log(`Discount ${index + 1}: ${discount.name}`);
            console.log(`- isActive: ${discount.isActive}`);
            console.log(`- startDate: ${startDate.toISOString().split('T')[0]}`);
            console.log(`- endDate: ${endDate.toISOString().split('T')[0]}`);

            if (!discount.isActive) {
                console.log(`- Status: Inactive`);
            } else if (endDate < today) {
                expiredDiscounts++;
                console.log(`- Status: Expired`);
            } else if (startDate > today) {
                upcomingDiscounts++;
                console.log(`- Status: Upcoming`);
            } else if (startDate <= today && endDate >= today) {
                activeDiscounts++;
                console.log(`- Status: Active`);
            }
        });

        console.log('Final statistics:');
        console.log('- Total:', totalDiscounts);
        console.log('- Active:', activeDiscounts);
        console.log('- Upcoming:', upcomingDiscounts);
        console.log('- Expired:', expiredDiscounts);

        // Update UI
        $('#totalDiscounts').text(totalDiscounts);
        $('#activeDiscounts').text(activeDiscounts);
        $('#expiringDiscounts').text(upcomingDiscounts);
        $('#expiredDiscounts').text(expiredDiscounts);
    }

    calculateStatisticsFromFilteredData() {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const totalDiscounts = this.discounts.length;

            // ✅ SỬA: Dùng now thay vì today cho active discounts
            const activeDiscounts = this.discounts.filter(discount =>
                discount.isActive &&
                new Date(discount.startDate) <= now &&  // ✅ DÙNG now
                new Date(discount.endDate) >= now       // ✅ DÙNG now
            ).length;

            // ✅ SỬA: Logic "Sắp diễn ra" - chưa bắt đầu nhưng sắp bắt đầu
            const upcomingDiscounts = this.discounts.filter(discount => {
                const startDate = new Date(discount.startDate);
                const todayStart = new Date(today.getTime()); // Đảm bảo cùng timezone
                const daysUntilStart = Math.ceil((startDate - todayStart) / (1000 * 60 * 60 * 24));

                console.log(`Discount: ${discount.name}, startDate: ${startDate.toISOString().split('T')[0]}, today: ${todayStart.toISOString().split('T')[0]}, daysUntilStart: ${daysUntilStart}`);

                return discount.isActive && daysUntilStart > 0 && daysUntilStart <= 30;
            }).length;

            // ✅ SỬA: Dùng now cho expired discounts
            const expiredDiscounts = this.discounts.filter(discount =>
                new Date(discount.endDate) < now  // ✅ DÙNG now
            ).length;

            console.log('Statistics calculated:');
            console.log('- Total:', totalDiscounts);
            console.log('- Active:', activeDiscounts);
            console.log('- Upcoming:', upcomingDiscounts);
            console.log('- Expired:', expiredDiscounts);

            this.updateStatistics({
                totalDiscounts,
                activeDiscounts,
                upcomingDiscounts,
                expiredDiscounts
            });

        } catch (error) {
            console.error('Error calculating statistics:', error);
            this.updateStatistics({
                totalDiscounts: 0,
                activeDiscounts: 0,
                upcomingDiscounts: 0,
                expiredDiscounts: 0
            });
        }
    }

    updateStatistics(stats) {
        $('#totalDiscounts').text((stats.totalDiscounts || 0).toLocaleString());
        $('#activeDiscounts').text((stats.activeDiscounts || 0).toLocaleString());
        $('#expiringDiscounts').text((stats.upcomingDiscounts || 0).toLocaleString()); // Vẫn dùng ID cũ
        $('#expiredDiscounts').text((stats.expiredDiscounts || 0).toLocaleString());
    }

    renderDiscountTable() {
        const tbody = $('#discountTableBody');
        tbody.empty();

        if (this.filteredDiscounts.length === 0) {
            tbody.append(`
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="mdi mdi-information-outline me-2"></i>
                    Không tìm thấy mã giảm giá nào
                </td>
            </tr>
        `);
            return;
        }

        // HIỂN THỊ TẤT CẢ DỮ LIỆU (KHÔNG PHÂN TRANG)
        this.filteredDiscounts.forEach((discount, index) => {
            const row = this.createDiscountRow(discount, index + 1);
            tbody.append(row);
        });

        // Update total count
        $('#totalCount').text(this.filteredDiscounts.length);
    }

    createDiscountRow(discount, index) {
        const startDate = new Date(discount.startDate);
        const endDate = new Date(discount.endDate);
        const createdDate = new Date(discount.createdAt);

        const dateString = new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(startDate);

        const endDateString = new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(endDate);

        const createdDateString = new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(createdDate);

        return `
        <tr>
            <td class="text-center">${index}</td>
            <td>
                <div>
                    <span class="fw-bold text-primary">${discount.name}</span>
                    ${discount.description ? `<br><small class="text-muted">${discount.description}</small>` : ''}
                </div>
            </td>
            <td>
                <div>
                    <span class="fw-bold text-success">${discount.discountValue}%</span>
                    ${discount.maxDiscountAmount ? `<br><small class="text-muted">Tối đa: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount.maxDiscountAmount)}</small>` : ''}
                </div>
            </td>
            <td>
                <div>
                    <small class="text-muted">Từ: ${dateString}</small>
                    <br>
                    <small class="text-muted">Đến: ${endDateString}</small>
                </div>
            </td>
            <td class="text-center">
                <span class="fw-medium">${discount.usedCount || 0}</span>
                ${discount.usageLimit ? `<br><small class="text-muted">/ ${discount.usageLimit}</small>` : ''}
            </td>
            <td class="text-center">
                <span class="${this.getDiscountStatusClass(discount)}">
                    ${this.getDiscountStatusText(discount)}
                </span>
            </td>
            <td class="text-center">
                <small class="text-muted">${createdDateString}</small>
            </td>
            <td class="text-center">
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-sm btn-outline-success" 
                            onclick="discountManager.editDiscount(${discount.discountId})"
                            title="Chỉnh sửa">
                        <i class="mdi mdi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-sm ${discount.isActive ? 'btn-outline-warning' : 'btn-outline-success'}" 
                            onclick="discountManager.toggleDiscountStatus(${discount.discountId})"
                            title="${discount.isActive ? 'Tạm dừng' : 'Kích hoạt'}">
                        <i class="mdi mdi-${discount.isActive ? 'pause' : 'play'}"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" 
                            onclick="discountManager.deleteDiscount(${discount.discountId}, '${discount.name}')"
                            title="Xóa">
                        <i class="mdi mdi-delete"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }

    async toggleDiscountStatus(discountId) {
        try {
            const discount = this.discounts.find(d => d.discountId === discountId);
            if (!discount) {
                this.showAlert('error', 'Lỗi', 'Không tìm thấy mã giảm giá');
                return;
            }

            const newStatus = !discount.isActive;

            const response = await fetch(`${this.baseUrl}/${discountId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isActive: newStatus
                })
            });

            if (!response.ok) {
                throw new Error('Không thể cập nhật trạng thái mã giảm giá');
            }

            this.showAlert('success', 'Thành công', 'Cập nhật trạng thái mã giảm giá thành công');

            // Tải lại dữ liệu và áp dụng lại bộ lọc hiện tại
            await this.loadDiscounts();
            this.filterDiscounts(); // Áp dụng lại bộ lọc hiện tại
            await this.loadStatistics();

        } catch (error) {
            console.error('Error toggling discount status:', error);
            this.showAlert('error', 'Lỗi', 'Không thể cập nhật trạng thái mã giảm giá');
        }
    }

    async viewDiscountDetail(discountId) {
        try {
            const response = await fetch(`${this.baseUrl}/${discountId}`);

            if (!response.ok) {
                throw new Error('Không thể tải thông tin mã giảm giá');
            }

            const data = await response.json();
            const discount = data.result;

            // Fill modal with discount data
            $('#modalDiscountName').text(discount.name);
            $('#modalDiscountDescription').text(discount.description || 'Không có mô tả');
            $('#modalDiscountValue').text(`${discount.discountValue}%`);
            $('#modalMinOrderValue').text(discount.minOrderValue ?
                new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount.minOrderValue) :
                'Không giới hạn');
            $('#modalMaxDiscountAmount').text(discount.maxDiscountAmount ?
                new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount.maxDiscountAmount) :
                'Không giới hạn');
            $('#modalStartDate').text(this.formatDateTime(discount.startDate));
            $('#modalEndDate').text(this.formatDateTime(discount.endDate));
            $('#modalUsedCount').text(discount.usedCount || 0);
            $('#modalUsageLimit').text(discount.usageLimit || 'Không giới hạn');
            $('#modalDiscountStatus').html(`<span class="${this.getDiscountStatusClass(discount)}">${this.getDiscountStatusText(discount)}</span>`);

            $('#discountDetailModal').modal('show');

        } catch (error) {
            console.error('Error loading discount detail:', error);
            this.showAlert('error', 'Lỗi', 'Không thể tải thông tin mã giảm giá');
        }
    }

    editDiscount(discountId) {
        window.location.href = `/admin/discounts/${discountId}/edit`;
    }

    async updateDiscountStatus(discountId) {
        try {
            const discount = this.discounts.find(d => d.discountId === discountId);
            if (!discount) {
                this.showAlert('error', 'Lỗi', 'Không tìm thấy mã giảm giá');
                return;
            }

            $('#updateDiscountId').val(discountId);
            $('#updateDiscountStatus').val(discount.isActive ? 'true' : 'false');
            $('#updateStatusModal').modal('show');

        } catch (error) {
            console.error('Error preparing status update:', error);
            this.showAlert('error', 'Lỗi', 'Không thể cập nhật trạng thái mã giảm giá');
        }
    }

    async saveDiscountStatus() {
        try {
            const discountId = $('#updateDiscountId').val();
            const isActive = $('#updateDiscountStatus').val() === 'true';

            const response = await fetch(`${this.baseUrl}/${discountId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isActive: isActive
                })
            });

            if (!response.ok) {
                throw new Error('Không thể cập nhật trạng thái mã giảm giá');
            }

            $('#updateStatusModal').modal('hide');
            this.showAlert('success', 'Thành công', 'Cập nhật trạng thái mã giảm giá thành công');
            await this.loadDiscounts();
            await this.loadStatistics();

        } catch (error) {
            console.error('Error updating discount status:', error);
            this.showAlert('error', 'Lỗi', 'Không thể cập nhật trạng thái mã giảm giá');
        }
    }

    deleteDiscount(discountId, discountName) {
        $('#updateDiscountId').val(discountId);
        $('#deleteDiscountName').text(discountName);
        $('#deleteModal').modal('show');
    }

    async confirmDeleteDiscount() {
        try {
            const discountId = $('#updateDiscountId').val();

            const response = await fetch(`${this.baseUrl}/${discountId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Không thể xóa mã giảm giá');
            }

            $('#deleteModal').modal('hide');
            this.showAlert('success', 'Thành công', 'Xóa mã giảm giá thành công');
            await this.loadDiscounts();
            await this.loadStatistics();

        } catch (error) {
            console.error('Error deleting discount:', error);
            this.showAlert('error', 'Lỗi', 'Không thể xóa mã giảm giá');
        }
    }

    searchDiscounts() {
        const searchTerm = $('#searchDiscount').val().toLowerCase().trim();
        const status = $('#filterDiscountStatus').val();
        const dateFrom = $('#filterDateFrom').val();
        const dateTo = $('#filterDateTo').val();

        // Bắt đầu từ dữ liệu gốc
        // let searchResults = this.discounts;

        // Áp dụng search
        // if (searchTerm) {
        //     searchResults = this.discounts.filter(discount => {
        //         const nameMatch = discount.name.toLowerCase().includes(searchTerm);
        //         const descriptionMatch = discount.description &&
        //             discount.description.toLowerCase().includes(searchTerm);
        //         return nameMatch || descriptionMatch;
        //     });
        // }

        // ✅ GỌI filterDiscounts() ĐỂ ÁP DỤNG FILTER
        this.filterDiscounts();
    }

    clearSearch() {
        $('#searchDiscount').val('');
        this.filterDiscounts();
        console.log('Search cleared');
    }

    filterDiscounts() {
        const status = $('#filterDiscountStatus').val();
        const dateFrom = $('#filterDateFrom').val();
        const dateTo = $('#filterDateTo').val();
        const searchTerm = $('#searchDiscount').val().toLowerCase().trim();

        // Bắt đầu từ dữ liệu gốc
        let filterResults = this.discounts;

        // Áp dụng search trước
        if (searchTerm) {
            filterResults = this.discounts.filter(discount => {
                const nameMatch = discount.name.toLowerCase().includes(searchTerm);
                const descriptionMatch = discount.description &&
                    discount.description.toLowerCase().includes(searchTerm);
                return nameMatch || descriptionMatch;
            });
        }

        // Áp dụng filter theo trạng thái
        if (status !== '') {
            const now = new Date();
            filterResults = filterResults.filter(discount => {
                const startDate = new Date(discount.startDate);
                const endDate = new Date(discount.endDate);

                switch (status) {
                    case 'active':
                        return discount.isActive && startDate <= now && endDate >= now;
                    case 'inactive':
                        return !discount.isActive;
                    case 'expired':
                        return discount.isActive && endDate < now;
                    case 'upcoming':
                        return discount.isActive && startDate > now;
                    default:
                        return true;
                }
            });
        } else {
            // Nếu không chọn trạng thái, mặc định hiển thị đang hoạt động
            // const now = new Date(); // ✅ DÙNG now
            // filterResults = filterResults.filter(discount => {
            //     const startDate = new Date(discount.startDate);
            //     const endDate = new Date(discount.endDate);
            //     return discount.isActive && startDate <= now && endDate >= now; // ✅ SỬA LOGIC
            // });
        }

        // Áp dụng filter theo thời gian
        if (dateFrom) {
            filterResults = filterResults.filter(discount => {
                const startDate = new Date(discount.startDate);
                const fromDate = new Date(dateFrom);
                return startDate >= fromDate;
            });
        }

        if (dateTo) {
            filterResults = filterResults.filter(discount => {
                const endDate = new Date(discount.endDate);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                return endDate <= toDate;
            });
        }

        this.filteredDiscounts = filterResults;
        this.renderDiscountTable();
    }

    sortDiscounts() {
        const sortBy = $('#sortBy').val();
        const sortDir = $('#sortDir').val();

        this.filteredDiscounts.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'discountValue':
                    aValue = parseFloat(a.discountValue);
                    bValue = parseFloat(b.discountValue);
                    break;
                case 'startDate':
                    aValue = new Date(a.startDate);
                    bValue = new Date(b.startDate);
                    break;
                case 'endDate':
                    aValue = new Date(a.endDate);
                    bValue = new Date(b.endDate);
                    break;
                case 'usedCount':
                    aValue = a.usedCount || 0;
                    bValue = b.usedCount || 0;
                    break;
                case 'createdAt':
                default:
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
            }

            if (sortDir === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        this.currentPage = 1;
        this.renderDiscountTable();
        this.updatePagination();
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.filteredDiscounts.length / this.pageSize);

        const pagination = $('#pagination');
        pagination.empty();

        if (this.totalPages <= 1) return;

        // Previous button
        pagination.append(`
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="discountManager.goToPage(${this.currentPage - 1})">Trước</a>
            </li>
        `);

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            pagination.append(`
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="discountManager.goToPage(${i})">${i}</a>
                </li>
            `);
        }

        // Next button
        pagination.append(`
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="discountManager.goToPage(${this.currentPage + 1})">Sau</a>
            </li>
        `);

        // Update info
        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, this.filteredDiscounts.length);
        $('#paginationInfo').text(`Hiển thị ${start}-${end} trong tổng số ${this.filteredDiscounts.length} mã giảm giá`);
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.renderDiscountTable();
            this.updatePagination();
        }
    }

    async refreshData() {
        this.currentPage = 1;
        $('#searchDiscount').val('');
        $('#filterDiscountStatus').val(''); // Reset về "Tất cả"

        // Reset ngày về mặc định
        this.setDefaultDateRange();

        this.filteredDiscounts = this.discounts;

        this.renderDiscountTable();
        this.showAlert('success', 'Thành công', 'Dữ liệu đã được làm mới');
    }

    // Helper methods
    formatDateTime(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    getDiscountStatusClass(discount) {
        const now = new Date();
        const startDate = new Date(discount.startDate);
        const endDate = new Date(discount.endDate);

        if (!discount.isActive) {
            return 'text-secondary fw-bold';
        } else if (endDate < now) {
            return 'text-danger fw-bold';
        } else if (startDate > now) {
            return 'text-warning fw-bold';
        } else {
            return 'text-success fw-bold';
        }
    }

    getDiscountStatusText(discount) {
        const now = new Date();
        const startDate = new Date(discount.startDate);
        const endDate = new Date(discount.endDate);

        if (!discount.isActive) {
            return 'Ngưng hoạt động';
        } else if (endDate < now) {
            return 'Đã hết hạn';
        } else if (startDate > now) {
            return 'Sắp diễn ra';
        } else {
            return 'Đang hoạt động';
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

// Global functions for quick actions
function increaseValue(inputId) {
    const input = document.getElementById(inputId);
    const currentValue = parseInt(input.value) || 0;
    input.value = currentValue + 1;
    $(input).trigger('input');
}

function decreaseValue(inputId) {
    const input = document.getElementById(inputId);
    const currentValue = parseInt(input.value) || 0;
    if (currentValue > 0) {
        input.value = currentValue - 1;
        $(input).trigger('input');
    }
}

function resetForm() {
    $('#discountForm')[0].reset();
    $('#isActive').prop('checked', true);
    window.discountManager.setDefaultValues();
    window.discountManager.updatePreview();
}

// Initialize when document is ready
$(document).ready(function () {
    window.discountManager = new DiscountManager();
});

// Save discount status function for modal
function saveDiscountStatus() {
    discountManager.saveDiscountStatus();
}

// Confirm delete function for modal
function confirmDeleteDiscount() {
    discountManager.confirmDeleteDiscount();
}