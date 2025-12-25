/**
 * Review Detail Management JavaScript
 * Chi tiết đánh giá - Liora Admin
 */

class ReviewDetailManager {
    constructor() {
        this.baseUrl = '/admin/api/reviews';
        this.reviewId = window.reviewIdFromServer || this.getReviewIdFromUrl();
        this.reviewData = null;
        this.init();
    }

    init() {
        if (this.reviewId) {
            this.loadReviewDetail();
            this.bindEvents();
        } else {
            this.showAlert('error', 'Lỗi', 'Không tìm thấy mã đánh giá');
            setTimeout(() => {
                window.location.href = '/admin/reviews';
            }, 2000);
        }
    }

    bindEvents() {
        // Update visibility button
        $('#btnUpdateVisibility').on('click', () => {
            this.showUpdateVisibilityModal();
        });

        // Print review button
        $('#btnPrintReview').on('click', () => {
            this.printReview();
        });

        // Modal events
        $('#updateVisibilityModal').on('hidden.bs.modal', () => {
            this.clearModal();
        });
    }

    getReviewIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart && !isNaN(lastPart)) {
                console.log('ReviewId from path:', lastPart);
                return lastPart;
            }
        }

        console.log('No reviewId found in URL');
        return null;
    }

    async loadReviewDetail() {
        try {
            this.showLoading();

            console.log('Loading review detail for ID:', this.reviewId);

            const response = await fetch(`${this.baseUrl}/${this.reviewId}`);

            if (!response.ok) {
                throw new Error('Không thể tải thông tin đánh giá');
            }

            this.reviewData = await response.json();
            console.log('Found review:', this.reviewData);

            this.renderReviewDetail();

        } catch (error) {
            console.error('Error loading review detail:', error);
            this.showAlert('error', 'Lỗi', error.message);
        } finally {
            this.hideLoading();
        }
    }

    renderReviewDetail() {
        const review = this.reviewData;
        
        // Update page title
        document.title = `Chi tiết đánh giá #${review.reviewId} - Liora Admin`;
        $('#pageReviewId').text(`#${review.reviewId}`);
        
        // Review content - Display HTML including images and videos
        // Extract images from HTML
        const userImages = this.extractUserImages(review.content);
        const hasUserImages = userImages.length > 0;
        
        // Clean content (remove img tags)
        let cleanContent = review.content || '';
        if (hasUserImages) {
            cleanContent = cleanContent.replace(/<figure[^>]*>.*?<\/figure>/gi, '').trim();
            if (!cleanContent) {
                cleanContent = 'Đánh giá này có ảnh đính kèm.';
            }
        }
        
        let contentHtml = '';
        if (review.content) {
            contentHtml = `<div class="review-content-detail">
                ${cleanContent}
                ${hasUserImages ? this.createUserImagesCollapse(userImages, review.reviewId) : ''}
            </div>`;
        } else {
            contentHtml = '<span class="text-muted">Không có nội dung</span>';
        }
        
        $('#reviewContent').html(contentHtml);
        
        // Bind image click events after content is rendered
        setTimeout(() => this.bindImageClickEvents(), 100);
        
        $('#reviewStars').html(this.generateStars(review.rating));
        $('#ratingText').text(`${review.rating}/5 sao`);
        
        // Review information
        $('#reviewIdDetail').text(`#${review.reviewId}`);
        
        // Format dates
        try {
            const createdAt = new Date(review.createdAt);
            const updatedAt = new Date(review.lastUpdate || review.createdAt);
            
            $('#reviewCreatedAt').text(this.formatDateTime(createdAt));
            $('#reviewUpdatedAt').text(this.formatDateTime(updatedAt));
        } catch (error) {
            console.error('Error formatting dates:', error);
            $('#reviewCreatedAt').text('Không có thông tin');
            $('#reviewUpdatedAt').text('Không có thông tin');
        }
        
        // Review status - Cập nhật hiển thị Ẩn danh
        $('#reviewStatus').html(`<span class="${this.getVisibilityClass(review.isVisible)}">${this.getVisibilityText(review.isVisible)}</span>`);
        $('#reviewAnonymous').html(`<span class="${this.getAnonymousClass(review.anonymous)}">${this.getAnonymousText(review.anonymous)}</span>`);
        
        // User information - Hiển thị email và số điện thoại
        // User information - Lấy từ đơn hàng thay vì từ user
        $('#orderCustomerName').text(review.orderCustomerName || 'Không xác định');
        $('#userId').text(review.userId || 'N/A');
        $('#orderCustomerEmail').text(review.orderCustomerEmail || 'N/A');
        $('#orderCustomerPhone').text(review.orderCustomerPhone || 'N/A');
        $('#orderCustomerAddress').text(review.orderCustomerAddress || 'N/A');

        // Set user avatar if available (vẫn giữ avatar từ user)
        if (review.userAvatar) {
            $('#userAvatar').attr('src', review.userAvatar).show();
        } else {
            $('#userAvatar').hide();
        }
        
        // Set user avatar if available
        if (review.userAvatar) {
            $('#userAvatar').attr('src', review.userAvatar).show();
        } else {
            $('#userAvatar').hide();
        }
        
        // Product information - Hiển thị đầy đủ thông tin sản phẩm
        $('#productName').text(review.productName || 'Không xác định');
        $('#productId').text(review.productId || 'N/A');
        $('#productBrand').text(review.productBrandName || 'N/A');
        $('#productCategory').text(review.productCategoryName || 'N/A');
        
        // Format product price
        if (review.productPrice && review.productPrice > 0) {
            $('#productPrice').text(new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(review.productPrice));
        } else {
            $('#productPrice').text('N/A');
        }
        
        // Set product image
        if (review.productThumbnail) {
            $('#productImage').attr('src', review.productThumbnail).show();
        } else {
            // Hiển thị ảnh placeholder nếu không có ảnh
            $('#productImage').attr('src', '/admin/images/no-image.png').show();
        }
        
        // Order information - Thay thế phần thống kê
        if (review.orderId) {
            // Tạo link clickable cho mã đơn hàng
            const orderCode = review.orderCode || `#${review.orderId}`;
            const orderLink = `<a href="/admin/orders/detail/${review.orderId}" class="text-decoration-none fw-bold text-primary" title="Xem chi tiết đơn hàng">${orderCode}</a>`;
            $('#orderCode').html(orderLink);

            $('#orderDate').text(review.orderDate ? this.formatDateTime(new Date(review.orderDate)) : 'N/A');
            $('#orderUserId').text(review.userId || 'N/A');
        } else {
            $('#orderCode').text('N/A');
            $('#orderDate').text('N/A');
            $('#orderUserId').text('N/A');
        }
    }

    // Cập nhật method getAnonymousText để hiển thị "Có" hoặc "Không"
    getAnonymousText(isAnonymous) {
        return isAnonymous ? 'Có' : 'Không';
    }

    generateStars(rating) {
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

    getVisibilityClass(isVisible) {
        return isVisible ? 'text-success fw-bold' : 'text-danger fw-bold';
    }

    getVisibilityText(isVisible) {
        return isVisible ? 'Hiển thị' : 'Ẩn';
    }

    getAnonymousClass(isAnonymous) {
        return isAnonymous ? 'text-info fw-bold' : 'text-secondary fw-bold';
    }

    getAnonymousText(isAnonymous) {
        return isAnonymous ? 'Ẩn danh' : 'Hiển thị tên';
    }

    showUpdateVisibilityModal() {
        if (!this.reviewData) return;

        $('#updateReviewId').val(this.reviewData.reviewId);
        $('#updateReviewVisibility').val(this.reviewData.isVisible ? 'true' : 'false');

        $('#updateVisibilityModal').modal('show');
    }

    async saveReviewVisibility() {
        try {
            const reviewId = $('#updateReviewId').val();
            const isVisible = $('#updateReviewVisibility').val() === 'true';

            const response = await fetch(`${this.baseUrl}/${reviewId}/visibility?isVisible=${isVisible}`, {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error('Không thể cập nhật trạng thái đánh giá');
            }

            $('#updateVisibilityModal').modal('hide');
            this.showAlert('success', 'Thành công', 'Cập nhật trạng thái đánh giá thành công');

            // Reload review detail
            await this.loadReviewDetail();

        } catch (error) {
            console.error('Error updating review visibility:', error);
            this.showAlert('error', 'Lỗi', 'Không thể cập nhật trạng thái đánh giá');
        }
    }

    printReview() {
        const printWindow = window.open('', '_blank');
        const review = this.reviewData;

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Đánh giá #${review.reviewId}</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .info-section { margin-bottom: 20px; }
                    .info-title { font-weight: bold; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .stars { color: #ffc107; font-size: 18px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>LIORA FASHION</h1>
                    <h2>ĐÁNH GIÁ #${review.reviewId}</h2>
                    <p>Ngày: ${this.formatDateTime(new Date(review.createdAt))}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Nội dung đánh giá:</div>
                    <p><strong>Điểm đánh giá:</strong> <span class="stars">${this.generateStars(review.rating)}</span> (${review.rating}/5)</p>
                    <p><strong>Nội dung:</strong> ${review.content || 'Không có nội dung'}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Thông tin người đánh giá:</div>
                    <p><strong>Tên:</strong> ${review.orderCustomerName || 'Không xác định'}</p>
                    <p><strong>Mã người dùng:</strong> ${review.userId || 'N/A'}</p>
                    <p><strong>Email:</strong> ${review.orderCustomerEmail || 'N/A'}</p>
                    <p><strong>Số điện thoại:</strong> ${review.orderCustomerPhone || 'N/A'}</p>
                    <p><strong>Địa chỉ:</strong> ${review.orderCustomerAddress || 'N/A'}</p>
                    <p><strong>Ẩn danh:</strong> ${review.anonymous ? 'Có' : 'Không'}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Thông tin sản phẩm:</div>
                    <p><strong>Tên sản phẩm:</strong> ${review.productName || 'Không xác định'}</p>
                    <p><strong>Mã sản phẩm:</strong> ${review.productId || 'N/A'}</p>
                    <p><strong>Thương hiệu:</strong> ${review.brandName || 'N/A'}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Trạng thái:</div>
                    <p><strong>Hiển thị:</strong> ${review.isVisible ? 'Có' : 'Không'}</p>
                    <p><strong>Ngày tạo:</strong> ${this.formatDateTime(new Date(review.createdAt))}</p>
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

    formatDateTime(date) {
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    showLoading() {
        $('#loadingSpinner').removeClass('d-none');
    }

    hideLoading() {
        $('#loadingSpinner').addClass('d-none');
    }

    clearModal() {
        $('#updateVisibilityForm')[0].reset();
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

    extractUserImages(htmlContent) {
        if (!htmlContent) return [];
        
        const images = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const imgElements = doc.querySelectorAll('figure.image img');
        
        imgElements.forEach(img => {
            const src = img.getAttribute('src');
            if (src) {
                images.push(src);
            }
        });
        
        return images;
    }

    createUserImagesCollapse(images, reviewId) {
        const uniqueId = `review-images-${reviewId}-${Date.now()}`;
        
        return `
            <div class="review-user-images-section" data-review-images='${JSON.stringify(images)}' data-review-id="${reviewId}">
                <button class="btn btn-link p-0 mt-2 review-show-images-btn" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#${uniqueId}"
                        aria-expanded="false">
                    <i class="mdi mdi-image-multiple"></i>
                    <span>Xem ảnh</span>
                    <i class="mdi mdi-chevron-down collapse-icon"></i>
                </button>
                <div class="collapse mt-2" id="${uniqueId}">
                    <div class="review-user-images-grid">
                        ${images.map((src, index) => `
                            <div class="review-user-image-item" data-image-index="${index}">
                                <img src="${src}" alt="Review image" class="img-fluid" loading="lazy">
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    bindImageClickEvents() {
        const container = document.querySelector('.review-content-detail');
        if (!container) return;
        
        container.addEventListener('click', (e) => {
            const imageItem = e.target.closest('.review-user-image-item');
            if (imageItem) {
                const section = imageItem.closest('.review-user-images-section');
                if (section) {
                    const imagesJson = section.getAttribute('data-review-images');
                    if (imagesJson) {
                        try {
                            const images = JSON.parse(imagesJson);
                            const imageIndex = parseInt(imageItem.getAttribute('data-image-index'));
                            this.openImageLightbox(images, imageIndex);
                        } catch (error) {
                            console.error('Error parsing images:', error);
                        }
                    }
                }
            }
        });
    }

    openImageLightbox(images, startIndex) {
        let lightbox = document.getElementById('reviewImageLightbox');
        
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.className = 'review-image-lightbox';
            lightbox.id = 'reviewImageLightbox';
            lightbox.innerHTML = `
                <span class="close-btn">&times;</span>
                <button class="nav-btn prev">
                    <i class="mdi mdi-chevron-left"></i>
                </button>
                <button class="nav-btn next">
                    <i class="mdi mdi-chevron-right"></i>
                </button>
                <div class="lightbox-container">
                    <img src="" alt="Full size" id="reviewLightboxImage">
                    <div class="image-counter"></div>
                </div>
            `;
            document.body.appendChild(lightbox);
            
            const closeBtn = lightbox.querySelector('.close-btn');
            const navPrev = lightbox.querySelector('.nav-btn.prev');
            const navNext = lightbox.querySelector('.nav-btn.next');
            
            lightbox.addEventListener('click', function(e) {
                if (e.target === lightbox) {
                    lightbox.classList.remove('active');
                }
            });
            
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                lightbox.classList.remove('active');
            });
            
            navPrev.addEventListener('click', function(e) {
                e.stopPropagation();
                window.reviewDetailManager.navigateImage('prev');
            });
            
            navNext.addEventListener('click', function(e) {
                e.stopPropagation();
                window.reviewDetailManager.navigateImage('next');
            });
            
            document.addEventListener('keydown', function(e) {
                if (lightbox.classList.contains('active')) {
                    if (e.key === 'ArrowLeft') {
                        window.reviewDetailManager.navigateImage('prev');
                    } else if (e.key === 'ArrowRight') {
                        window.reviewDetailManager.navigateImage('next');
                    } else if (e.key === 'Escape') {
                        lightbox.classList.remove('active');
                    }
                }
            });
        }

        lightbox.dataset.images = JSON.stringify(images);
        lightbox.dataset.currentIndex = startIndex;

        this.updateLightboxImage();
        lightbox.classList.add('active');
    }

    navigateImage(direction) {
        const lightbox = document.getElementById('reviewImageLightbox');
        if (!lightbox) return;
        
        const images = JSON.parse(lightbox.dataset.images);
        let currentIndex = parseInt(lightbox.dataset.currentIndex);
        
        if (direction === 'prev') {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
        } else if (direction === 'next') {
            currentIndex = (currentIndex + 1) % images.length;
        }
        
        lightbox.dataset.currentIndex = currentIndex;
        this.updateLightboxImage();
    }

    updateLightboxImage() {
        const lightbox = document.getElementById('reviewImageLightbox');
        if (!lightbox) return;
        
        const images = JSON.parse(lightbox.dataset.images);
        const currentIndex = parseInt(lightbox.dataset.currentIndex);
        
        const img = document.getElementById('reviewLightboxImage');
        const counter = lightbox.querySelector('.image-counter');
        
        if (img && images[currentIndex]) {
            img.src = images[currentIndex];
        }
        
        if (counter) {
            counter.textContent = `${currentIndex + 1} / ${images.length}`;
        }
    }
}

// Initialize when document is ready
$(document).ready(function() {
    window.reviewDetailManager = new ReviewDetailManager();
});

// Save review visibility function for modal
function saveReviewVisibility() {
    if (window.reviewDetailManager) {
        window.reviewDetailManager.saveReviewVisibility();
    }
}