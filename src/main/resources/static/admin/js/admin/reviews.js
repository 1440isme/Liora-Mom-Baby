/**
 * Admin Reviews Management JavaScript
 */

let currentPage = 0;
let pageSize = 10;
let currentFilters = {};
let currentSort = { field: 'createdAt', direction: 'desc' };

// Utility function để thêm authentication header
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

// Initialize page
$(document).ready(function () {
    loadBrands();
    loadCategories();
    loadReviews();
    loadStatistics();

    // Event listeners
    $('#btnSearch').click(function () {
        currentPage = 0;
        loadReviews();
    });

    $('#searchReview').keypress(function (e) {
        if (e.which === 13) {
            currentPage = 0;
            loadReviews();
        }
    });

    $('#filterRating, #filterBrand, #filterCategory, #filterProduct, #filterVisibility').change(function () {
        currentPage = 0;
        loadReviews();
        loadStatistics();
    });

    $('#btnRefresh').click(function () {
        resetFilters();
        loadReviews();
        loadStatistics();
    });

    // Brand change event
    $('#filterBrand').change(function () {
        const brandId = $(this).val();
        loadProducts(brandId, null);
        $('#filterCategory').val('');
        $('#filterProduct').val('');
    });

    // Category change event
    $('#filterCategory').change(function () {
        const categoryId = $(this).val();
        const brandId = $('#filterBrand').val();
        loadProducts(brandId, categoryId);
        $('#filterProduct').val('');
    });

    // Sortable column click events
    $('.sortable').click(function () {
        const field = $(this).data('sort');
        let direction = 'asc';

        // If clicking the same column, toggle direction
        if (currentSort.field === field) {
            direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        }

        currentSort = { field: field, direction: direction };
        currentPage = 0;

        updateSortIcons();
        loadReviews();
    });
});

// Update sort icons
function updateSortIcons() {
    $('.sortable').removeClass('sorted sorted-asc sorted-desc');
    $('.sort-icon').removeClass('mdi-arrow-up mdi-arrow-down').addClass('mdi-sort');

    const $currentSortColumn = $(`.sortable[data-sort="${currentSort.field}"]`);
    $currentSortColumn.addClass('sorted');

    if (currentSort.direction === 'asc') {
        $currentSortColumn.addClass('sorted-asc');
        $currentSortColumn.find('.sort-icon').removeClass('mdi-sort').addClass('mdi-arrow-up');
    } else {
        $currentSortColumn.addClass('sorted-desc');
        $currentSortColumn.find('.sort-icon').removeClass('mdi-sort').addClass('mdi-arrow-down');
    }
}

// Load reviews
function loadReviews() {
    showLoading();

    const filters = getCurrentFilters();

    $.ajax({
        url: '/admin/api/reviews',
        method: 'GET',
        headers: getAuthHeaders(),
        data: {
            page: currentPage,
            size: pageSize,
            sortBy: currentSort.field,
            sortDir: currentSort.direction,
            search: filters.search,
            rating: filters.rating,
            brandId: filters.brandId,
            categoryId: filters.categoryId,
            productId: filters.productId,
            isVisible: filters.isVisible
        },
        success: function (response) {
            displayReviews(response.reviews);
            updatePagination(response);
            hideLoading();
        },
        error: function (xhr) {
            hideLoading();
            showAlert('Lỗi khi tải danh sách đánh giá', 'error');
        }
    });
}

// Load statistics
function loadStatistics() {
    const filters = getCurrentFilters();

    $.ajax({
        url: '/admin/api/reviews/statistics',
        method: 'GET',
        headers: getAuthHeaders(),
        data: {
            rating: filters.rating,
            brandId: filters.brandId,
            categoryId: filters.categoryId,
            productId: filters.productId
        },
        success: function (response) {
            updateStatistics(response);
        },
        error: function (xhr) {
            console.error('Error loading statistics:', xhr);
        }
    });
}

// Load brands
function loadBrands() {
    $.ajax({
        url: '/admin/api/reviews/brands',
        method: 'GET',
        headers: getAuthHeaders(),
        success: function (response) {
            const select = $('#filterBrand');
            select.empty().append('<option value="">Tất cả thương hiệu</option>');

            response.forEach(function (brand) {
                select.append(`<option value="${brand.brandId}">${brand.name}</option>`);
            });
        },
        error: function (xhr) {
            console.error('Error loading brands:', xhr);
        }
    });
}

// Load categories
function loadCategories() {
    $.ajax({
        url: '/admin/api/reviews/categories',
        method: 'GET',
        headers: getAuthHeaders(),
        success: function (response) {
            const select = $('#filterCategory');
            select.empty().append('<option value="">Tất cả danh mục</option>');

            response.forEach(function (category) {
                select.append(`<option value="${category.categoryId}">${category.name}</option>`);
            });
        },
        error: function (xhr) {
            console.error('Error loading categories:', xhr);
        }
    });
}

// Load products
function loadProducts(brandId, categoryId) {
    $.ajax({
        url: '/admin/api/reviews/products',
        method: 'GET',
        headers: getAuthHeaders(),
        data: {
            brandId: brandId,
            categoryId: categoryId
        },
        success: function (response) {
            const select = $('#filterProduct');
            select.empty().append('<option value="">Tất cả sản phẩm</option>');

            response.forEach(function (product) {
                select.append(`<option value="${product.productId}">${product.name}</option>`);
            });
        },
        error: function (xhr) {
            console.error('Error loading products:', xhr);
        }
    });
}

// Display reviews
function displayReviews(reviews) {
    const tbody = $('#reviewTableBody');
    tbody.empty();

    if (reviews.length === 0) {
        tbody.append(`
            <tr>
                <td colspan="9" class="text-center py-4">
                    <i class="mdi mdi-information-outline me-2"></i>
                    Không có đánh giá nào
                </td>
            </tr>
        `);
        return;
    }

    reviews.forEach(function (review, index) {
        const row = createReviewRow(review, currentPage * pageSize + index + 1);
        tbody.append(row);
    });
}

// Function to strip HTML and extract plain text
function stripHtml(html) {
    if (!html) return '';
    
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Replace <br>, <p>, <div> with spaces
    text = text.replace(/<(?:br|p|div)[^>]*>/gi, ' ');
    
    // Remove remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');
    
    // Decode HTML entities
    const temp = document.createElement('div');
    temp.innerHTML = text;
    text = temp.textContent || temp.innerText || '';
    
    // Clean up multiple spaces and trim
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
}

// Function to check if content has media (images or videos)
function hasMedia(content) {
    if (!content) return false;
    return content.includes('<img') || content.includes('<video') || content.includes('<figure');
}

// Create review row
function createReviewRow(review, index) {
    // Strip HTML and get plain text preview
    const plainText = stripHtml(review.content);
    const hasMediaContent = hasMedia(review.content);
    
    let contentHtml = '';
    if (plainText) {
        // Truncate to 50 characters max for preview
        const truncatedText = plainText.length > 50 ? plainText.substring(0, 47) + '...' : plainText;
        
        contentHtml = `<div class="content-preview" title="${plainText}">
            ${truncatedText}
            ${hasMediaContent ? '<br><small class="text-info"><i class="mdi mdi-image"></i> Có hình ảnh/video</small>' : ''}
        </div>`;
    } else {
        contentHtml = '<span class="text-muted">Không có nội dung</span>';
    }

    const stars = generateStars(review.rating);

    // Cập nhật format cho Ẩn danh - sử dụng text với fw-bold thay vì badge
    const anonymous = review.anonymous ?
        '<span class="text-info fw-bold">Ẩn danh</span>' :
        '<span class="text-secondary fw-bold">Hiển thị</span>';

    // Cập nhật format cho Trạng thái - sử dụng text với fw-bold thay vì badge
    const visibility = review.isVisible ?
        '<span class="text-success fw-bold">Hiển thị</span>' :
        '<span class="text-danger fw-bold">Ẩn</span>';

    const createdAt = formatDateTime(review.createdAt);

    return `
        <tr>
            <td class="text-center">${index}</td>
            <td>${contentHtml}</td>
            <td class="text-center">
                <div class="star-rating">${stars}</div>
                <small class="text-muted">${review.rating}/5</small>
            </td>
            <td class="text-center">${anonymous}</td>
            <td class="text-center">
                <span class="text-dark fw-bold">${review.userId}</span>
            </td>
            <td class="text-center">
                <span class="text-dark fw-bold">${review.productId}</span>
            </td>
            <td class="text-center">
                <small>${createdAt}</small>
            </td>
            <td class="text-center">${visibility}</td>
            <td class="text-center">
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-${review.isVisible ? 'warning' : 'success'}" 
                            onclick="toggleReviewVisibility(${review.reviewId}, ${review.isVisible})" 
                            title="${review.isVisible ? 'Ẩn đánh giá' : 'Hiển thị đánh giá'}">
                        <i class="mdi mdi-${review.isVisible ? 'eye-off' : 'eye'}"></i>
                    </button>
                    <button type="button" class="btn btn-outline-info" onclick="viewReviewDetail(${review.reviewId})" title="Xem chi tiết">
                        <i class="mdi mdi-information-outline"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function toggleReviewVisibility(reviewId, currentVisibility) {
    const newVisibility = !currentVisibility;
    const action = newVisibility ? 'hiển thị' : 'ẩn';

    // Lưu thông tin vào modal
    $('#confirmReviewId').val(reviewId);
    $('#confirmNewVisibility').val(newVisibility);
    $('#confirmActionText').text(action);

    // Hiển thị modal xác nhận
    $('#confirmVisibilityModal').modal('show');
}

// Function xác nhận
function confirmToggleVisibility() {
    const reviewId = $('#confirmReviewId').val();
    const newVisibility = $('#confirmNewVisibility').val() === 'true';
    const action = newVisibility ? 'hiển thị' : 'ẩn';

    $.ajax({
        url: `/admin/api/reviews/${reviewId}/visibility`,
        method: 'PUT',
        headers: getAuthHeaders(),
        data: JSON.stringify({ isVisible: newVisibility }),
        processData: false,
        success: function (response) {
            $('#confirmVisibilityModal').modal('hide');
            showAlert(`Đã ${action} đánh giá thành công`, 'success');
            loadReviews();
            loadStatistics();
        },
        error: function (xhr) {
            showAlert('Lỗi khi cập nhật trạng thái', 'error');
        }
    });
}

// Generate stars HTML
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="mdi mdi-star"></i>';
        } else {
            stars += '<i class="mdi mdi-star-outline"></i>';
        }
    }
    return stars;
}

// Update statistics
function updateStatistics(stats) {
    $('#averageRating').text(stats.averageRating ? stats.averageRating.toFixed(1) : '0.0');
    $('#totalReviews').text(stats.totalReviews || 0);
    $('#fiveStarReviews').text(stats.fiveStarReviews || 0);
    $('#fiveStarPercentage').text(stats.fiveStarPercentage ? stats.fiveStarPercentage.toFixed(1) + '%' : '0%');
}

// View review detail
function viewReviewDetail(reviewId) {
    // Redirect to detail page instead of showing modal
    window.location.href = `/admin/reviews/detail/${reviewId}`;
}

// Show review detail modal
function showReviewDetailModal(review) {
    // Display full HTML content including images and videos
    const contentHtml = review.content ? 
        `<div class="review-modal-content">${review.content}</div>` : 
        '<span class="text-muted">Không có nội dung</span>';
    $('#modalReviewContent').html(contentHtml);
    $('#modalReviewRating').html(generateStars(review.rating) + ` <span class="ms-2">${review.rating}/5</span>`);
    $('#modalReviewAnonymous').html(review.anonymous ?
        '<span class="text-info fw-bold">Ẩn danh</span>' :
        '<span class="text-secondary fw-bold">Hiển thị tên</span>');
    $('#modalReviewStatus').html(review.isVisible ?
        '<span class="text-success fw-bold">Hiển thị</span>' :
        '<span class="text-danger fw-bold">Ẩn</span>');
    $('#modalReviewUser').text(review.userDisplayName || 'Không xác định');
    $('#modalReviewProduct').text(review.productName || 'Không xác định');
    $('#modalReviewCreatedAt').text(formatDateTime(review.createdAt));
    $('#modalReviewLastUpdate').text(formatDateTime(review.lastUpdate));

    $('#reviewDetailModal').modal('show');
}

// Update review visibility
function updateReviewVisibility(reviewId, currentVisibility) {
    $('#updateReviewId').val(reviewId);
    $('#updateReviewVisibility').val(!currentVisibility);
    $('#updateVisibilityModal').modal('show');
}

// Save review visibility
function saveReviewVisibility() {
    const reviewId = $('#updateReviewId').val();
    const isVisible = $('#updateReviewVisibility').val() === 'true';

    $.ajax({
        url: `/admin/api/reviews/${reviewId}/visibility`,
        method: 'PUT',
        headers: getAuthHeaders(),
        data: JSON.stringify({ isVisible: isVisible }),
        processData: false,
        success: function (response) {
            $('#updateVisibilityModal').modal('hide');
            showAlert(response.message, 'success');
            loadReviews();
            loadStatistics();
        },
        error: function (xhr) {
            showAlert('Lỗi khi cập nhật trạng thái', 'error');
        }
    });
}

// Get current filters
function getCurrentFilters() {
    return {
        search: $('#searchReview').val(),
        rating: $('#filterRating').val() || null,
        brandId: $('#filterBrand').val() || null,
        categoryId: $('#filterCategory').val() || null,
        productId: $('#filterProduct').val() || null,
        isVisible: $('#filterVisibility').val() || null
    };
}

// Reset filters
function resetFilters() {
    $('#searchReview').val('');
    $('#filterRating').val('');
    $('#filterBrand').val('');
    $('#filterCategory').val('');
    $('#filterProduct').val('');
    $('#filterVisibility').val('');
    currentPage = 0;
    currentSort = { field: 'createdAt', direction: 'desc' };
    updateSortIcons();
}

// Update pagination
function updatePagination(response) {
    const pagination = $('#pagination');
    pagination.empty();

    const totalPages = response.totalPages;
    const currentPageNum = response.currentPage;

    // Previous button
    if (response.hasPrevious) {
        pagination.append(`
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${currentPageNum - 1})">Trước</a>
            </li>
        `);
    }

    // Page numbers
    const startPage = Math.max(0, currentPageNum - 2);
    const endPage = Math.min(totalPages - 1, currentPageNum + 2);

    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPageNum ? 'active' : '';
        pagination.append(`
            <li class="page-item ${isActive}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i + 1}</a>
            </li>
        `);
    }

    // Next button
    if (response.hasNext) {
        pagination.append(`
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${currentPageNum + 1})">Sau</a>
            </li>
        `);
    }

    // Update pagination info
    const startItem = currentPageNum * pageSize + 1;
    const endItem = Math.min((currentPageNum + 1) * pageSize, response.totalItems);
    $('#paginationInfo').text(`Hiển thị ${startItem}-${endItem} trong tổng số ${response.totalItems} đánh giá`);
}

// Change page
function changePage(page) {
    currentPage = page;
    loadReviews();
}

// Utility functions
function showLoading() {
    $('#loadingSpinner').removeClass('d-none');
}

function hideLoading() {
    $('#loadingSpinner').addClass('d-none');
}

function showAlert(message, type) {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    $('#alertContainer').html(alertHtml);

    // Auto hide after 5 seconds
    setTimeout(function () {
        $('.alert').alert('close');
    }, 5000);
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString('vi-VN');
}