/**
 * Product Detail Page JavaScript
 * Handles product detail page functionality
 */

class ProductDetailManager {
    constructor() {
        this.productId = null;
        this.product = null;
        this.quantity = 1;
        this.maxStock = parseInt(document.getElementById('quantityInput')?.getAttribute('max') || '10');

        // Delay initialization để đảm bảo DOM đã load xong
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.productId = this.getProductIdFromUrl();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadRelatedProducts();
        this.setupImageLightbox();
        this.initProgressBar();
    }

    getProductIdFromUrl() {
        const path = window.location.pathname;
        console.log('🔍 [DEBUG] Current path:', path);
        const matches = path.match(/\/products\/(\d+)/);
        let productId = matches ? parseInt(matches[1]) : null;
        
        // Fallback: lấy từ hidden input nếu URL không có productId
        if (!productId) {
            const productIdInput = document.getElementById('productId');
            console.log('🔍 [DEBUG] Hidden input element:', productIdInput);
            if (productIdInput) {
                console.log('🔍 [DEBUG] Hidden input value:', productIdInput.value);
                productId = parseInt(productIdInput.value);
                console.log('🔍 [DEBUG] Fallback: lấy productId từ hidden input:', productId);
            } else {
                console.warn('⚠️ [WARNING] Không tìm thấy hidden input productId');
            }
        }
        
        console.log('🔍 [DEBUG] Final productId:', productId);
        return productId;
    }

    bindEvents() {
        // Quantity validation events
        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) {
            quantityInput.addEventListener('input', () => this.validateQuantity());
            quantityInput.addEventListener('change', () => this.validateQuantity());
            quantityInput.addEventListener('blur', () => this.validateQuantityOnBlur());
        }

        // Image lightbox
        const mainImage = document.getElementById('mainProductImage');
        if (mainImage) {
            mainImage.addEventListener('click', () => this.openImageLightbox());
        }
    }

    // Image Gallery Functions
    changeMainImage(thumbnail, imageUrl) {
        // Update main image
        const mainImage = document.getElementById('productDetailMainImage');
        if (mainImage) {
            mainImage.src = imageUrl;
        }

        // Update active thumbnail
        document.querySelectorAll('.product-detail-thumbnail-item').forEach(item => {
            item.classList.remove('active');
        });
        thumbnail.classList.add('active');
    }

    scrollImages(direction) {
        const thumbnails = document.querySelectorAll('.product-detail-thumbnail-item');
        const mainImage = document.getElementById('productDetailMainImage');

        if (thumbnails.length === 0 || !mainImage) {
            console.error('Required elements not found!');
            return;
        }

        // Find current active thumbnail
        let currentIndex = -1;
        thumbnails.forEach((thumb, index) => {
            if (thumb.classList.contains('active')) {
                currentIndex = index;
            }
        });

        if (currentIndex === -1) currentIndex = 0;

        // Calculate new index
        let newIndex;
        if (direction === 'up') {
            newIndex = currentIndex > 0 ? currentIndex - 1 : thumbnails.length - 1;
        } else {
            newIndex = currentIndex < thumbnails.length - 1 ? currentIndex + 1 : 0;
        }

        // Update image and active state
        const targetThumbnail = thumbnails[newIndex];
        const targetImageUrl = targetThumbnail.dataset.imageUrl;

        mainImage.src = targetImageUrl;
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        targetThumbnail.classList.add('active');
    }

    openImageLightbox() {
        const mainImage = document.getElementById('mainProductImage');
        const lightboxImage = document.getElementById('lightboxImage');

        if (mainImage && lightboxImage) {
            lightboxImage.src = mainImage.src;
            lightboxImage.alt = mainImage.alt;

            const lightbox = new bootstrap.Modal(document.getElementById('imageLightbox'));
            lightbox.show();
        }
    }

    setupImageLightbox() {
        const lightbox = document.getElementById('imageLightbox');
        if (lightbox) {
            lightbox.addEventListener('show.bs.modal', () => {
                document.body.style.overflow = 'hidden';
            });

            lightbox.addEventListener('hide.bs.modal', () => {
                document.body.style.overflow = 'auto';
            });
        }
    }

    // Quantity Management
    validateQuantity() {
        const quantityInput = document.getElementById('quantityInput');
        const errorDiv = document.getElementById('quantityError');
        const errorMessage = document.getElementById('quantityErrorMessage');

        if (!quantityInput || !errorDiv || !errorMessage) return;

        const currentValue = parseInt(quantityInput.value) || 0;

        // Allow empty input for better UX
        if (quantityInput.value === '' || quantityInput.value === '0') {
            errorDiv.style.display = 'none';
            quantityInput.classList.remove('is-invalid');
            return;
        }

        if (currentValue > this.maxStock) {
            errorDiv.style.display = 'block';
            errorMessage.textContent = `Số lượng tối đa bạn có thể mua là ${this.maxStock}.`;
            quantityInput.classList.add('is-invalid');
            quantityInput.value = this.maxStock;
        } else if (currentValue < 1) {
            errorDiv.style.display = 'block';
            errorMessage.textContent = 'Số lượng tối thiểu là 1.';
            quantityInput.classList.add('is-invalid');
            quantityInput.value = 1;
        } else {
            errorDiv.style.display = 'none';
            quantityInput.classList.remove('is-invalid');
        }
    }

    validateQuantityOnBlur() {
        const quantityInput = document.getElementById('quantityInput');
        if (!quantityInput) return;

        const currentValue = parseInt(quantityInput.value) || 0;

        if (quantityInput.value === '' || currentValue < 1) {
            quantityInput.value = 1;
            this.validateQuantity();
        }
    }

    incrementQuantity() {
        const quantityInput = document.getElementById('quantityInput');
        if (!quantityInput) return;

        const currentValue = parseInt(quantityInput.value) || 0;

        if (currentValue < this.maxStock) {
            quantityInput.value = currentValue + 1;
            this.validateQuantity();
        }
    }

    decrementQuantity() {
        const quantityInput = document.getElementById('quantityInput');
        if (!quantityInput) return;

        const currentValue = parseInt(quantityInput.value) || 0;

        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            this.validateQuantity();
        }
    }

    // Cart Functions (backend)
    async addToCart() {
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

        if (quantity > this.maxStock) {
            this.showNotification(`Số lượng bạn chọn (${quantity}) vượt quá số lượng tồn kho hiện có (${this.maxStock} sản phẩm). Vui lòng chọn số lượng phù hợp.`, 'error');
            return;
        }

        try {
            if (window.app && typeof window.app.addProductToCartBackend === 'function') {
                await window.app.addProductToCartBackend(this.productId, quantity, false);
                await window.app.refreshCartBadge?.();
            } else {
                this.showNotification('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
            }
        } catch (_) {
            this.showNotification('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
        }
    }

    async buyNow() {
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

        if (quantity > this.maxStock) {
            this.showNotification(`Số lượng bạn chọn (${quantity}) vượt quá số lượng tồn kho hiện có (${this.maxStock} sản phẩm). Vui lòng chọn số lượng phù hợp.`, 'error');
            return;
        }

        try {
            if (window.app && typeof window.app.buyNowBackend === 'function') {
                await window.app.buyNowBackend(this.productId, quantity);
                return;
            }
            this.showNotification('Không thể thực hiện mua ngay. Vui lòng thử lại.', 'error');
        } catch (_) {
            this.showNotification('Không thể thực hiện mua ngay. Vui lòng thử lại.', 'error');
        }
    }

    toggleWishlist() {
        // Toggle wishlist functionality
        const wishlistBtn = document.querySelector('[onclick="toggleWishlist()"]');
        const icon = wishlistBtn.querySelector('i');

        if (icon.classList.contains('fas')) {
            // Remove from wishlist
            icon.classList.remove('fas');
            icon.classList.add('far');
            wishlistBtn.innerHTML = '<i class="far fa-heart me-2"></i>Thêm vào yêu thích';
            this.showNotification('Đã xóa khỏi danh sách yêu thích', 'info');
        } else {
            // Add to wishlist
            icon.classList.remove('far');
            icon.classList.add('fas');
            wishlistBtn.innerHTML = '<i class="fas fa-heart me-2"></i>Đã thêm vào yêu thích';
            this.showNotification('Đã thêm vào danh sách yêu thích! 💕', 'success');
        }
    }

    getProductDataFromPage() {
        const productName = document.querySelector('.product-name')?.textContent;
        const productPrice = document.querySelector('.current-price')?.textContent;
        const productImage = document.querySelector('#mainProductImage')?.src;

        if (productName && productPrice) {
            return {
                id: this.productId,
                name: productName,
                price: parseFloat(productPrice.replace(/[^\d]/g, '')) / 1000, // Convert from VND format
                image: productImage,
                stock: this.maxStock
            };
        }
        return null;
    }

    // Related Products
    async loadRelatedProducts() {
        try {
            // Kiểm tra productId trước khi gọi API
            if (!this.productId || this.productId === 'null' || this.productId === null) {
                console.warn('⚠️ [WARNING] ProductId không hợp lệ, bỏ qua load related products:', this.productId);
                return;
            }
            
            console.log('🔍 [DEBUG] Loading related products cho productId:', this.productId);
            const response = await fetch(`/api/products/${this.productId}/similar`);
            if (response.ok) {
                const products = await response.json();
                this.renderRelatedProducts(products);
            } else {
                console.warn('⚠️ [WARNING] API response không OK:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ [ERROR] Error loading related products:', error);
        }
    }

    renderRelatedProducts(products) {
        const container = document.getElementById('relatedProducts');
        if (!container || !products || products.length === 0) return;

        const productsHTML = products.slice(0, 4).map(product => `
            <div class="col-lg-3 col-md-6">
                <div class="card h-100">
                    <img src="${product.image || '/user/img/default-product.jpg'}" 
                         class="card-img-top" 
                         alt="${product.name}">
                    <div class="card-body">
                        <h6 class="card-title">${product.name}</h6>
                        <p class="card-text">${this.formatPrice(product.price)}</p>
                        <a href="/product/${product.productId}" class="btn btn-outline-pink btn-sm">
                            Xem chi tiết
                        </a>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = productsHTML;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    // Notification System
    showNotification(message, type = 'info') {
        // Create toast notification
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        const toastId = 'toast-' + Date.now();

        const toastHTML = `
            <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0" 
                 id="${toastId}" role="alert">
                <div class="toast-header">
                    <i class="fas fa-${type === 'success' ? 'check-circle text-success' : type === 'error' ? 'exclamation-circle text-danger' : 'info-circle text-info'} me-2"></i>
                    <strong class="me-auto">Liora Cosmetic</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
        toast.show();

        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }
}

// Global functions for HTML onclick events
function changeMainImage(thumbnail, imageUrl) {
    if (window.productDetailManager) {
        window.productDetailManager.changeMainImage(thumbnail, imageUrl);
    }
}

function productDetailScroll(direction) {
    if (window.productDetailManager) {
        window.productDetailManager.scrollImages(direction);
    }
}

function incrementQuantity() {
    if (window.productDetailManager) {
        window.productDetailManager.incrementQuantity();
    }
}

function decrementQuantity() {
    if (window.productDetailManager) {
        window.productDetailManager.decrementQuantity();
    }
}

function validateQuantity() {
    if (window.productDetailManager) {
        window.productDetailManager.validateQuantity();
    }
}

function validateQuantityOnBlur() {
    if (window.productDetailManager) {
        window.productDetailManager.validateQuantityOnBlur();
    }
}

// Add methods to ProductDetailManager class
ProductDetailManager.prototype.initProgressBar = function () {
    const progressBar = document.querySelector('.product-detail-progress-bar');
    if (!progressBar) {
        console.log('Progress bar not found');
        return;
    }

    console.log('Initializing progress bar...');

    // Force the background
    progressBar.style.background = 'linear-gradient(90deg, #E8A2B0 0%, #C97089 100%)';
    progressBar.style.backgroundColor = '#E8A2B0';
    progressBar.style.display = 'block';
    progressBar.style.height = '100%';

    // Calculate width dynamically from soldCount
    const soldCountElement = document.querySelector('.product-detail-sales-count');
    if (soldCountElement) {
        const soldCount = parseInt(soldCountElement.textContent) || 0;
        console.log('Found soldCount:', soldCount);

        // Calculate progress using same logic as Java SalesProgressUtil
        let progress = this.calculateSalesProgress(soldCount);
        const widthPercent = progress.toFixed(1) + '%';

        progressBar.style.width = widthPercent;
        console.log('Calculated width for soldCount', soldCount, ':', widthPercent);
    } else {
        console.log('soldCount element not found');
    }

    console.log('Progress bar initialized with width:', progressBar.style.width);
};

ProductDetailManager.prototype.calculateSalesProgress = function (soldCount) {
    const thresholds = [
        { max: 50, percentage: 30 },      // 0-50: 0-30%
        { max: 100, percentage: 40 },     // 50-100: 30-40%
        { max: 500, percentage: 55 },     // 100-500: 40-55%
        { max: 1000, percentage: 70 },    // 500-1000: 55-70%
        { max: 5000, percentage: 85 },    // 1000-5000: 70-85%
        { max: 10000, percentage: 95 },   // 5000-10000: 85-95%
        { max: Infinity, percentage: 100 } // >10000: 95-100%
    ];

    for (let i = 0; i < thresholds.length; i++) {
        const { max, percentage } = thresholds[i];

        if (soldCount <= max) {
            // Get previous threshold percentage
            const basePercentage = (i > 0) ? thresholds[i - 1].percentage : 0;

            // Calculate progress within this threshold
            const prevMax = (i > 0) ? thresholds[i - 1].max : 0;
            const range = max - prevMax;

            if (range > 0) {
                const progress = ((soldCount - prevMax) / range) * (percentage - basePercentage);
                return Math.min(100, Math.max(0, basePercentage + progress));
            } else {
                return basePercentage;
            }
        }
    }

    return 100; // For very high sales
};

function addToCart() {
    if (window.productDetailManager) {
        window.productDetailManager.addToCart();
    }
}

function buyNow() {
    if (window.productDetailManager) {
        window.productDetailManager.buyNow();
    }
}

function toggleWishlist() {
    if (window.productDetailManager) {
        window.productDetailManager.toggleWishlist();
    }
}

// Reviews Manager
class ReviewsManager {
    constructor(productId) {
        this.productId = productId;
        this.currentPage = 0;
        this.currentRating = null;
        this.pageSize = 10;
        this.totalPages = 0;
        this.totalElements = 0;

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadReviews();
    }

    bindEvents() {
        // Filter button events
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rating = e.currentTarget.dataset.rating;
                this.filterByRating(rating);
            });
        });

        // Tab change event
        const reviewsTab = document.getElementById('reviews-tab');
        if (reviewsTab) {
            reviewsTab.addEventListener('shown.bs.tab', () => {
                this.loadReviews();
            });
        }
    }

    async loadReviews(page = 0, rating = null) {
        try {
            this.showLoading(true);

            const params = new URLSearchParams({
                page: page,
                size: this.pageSize
            });

            if (rating && rating !== 'all') {
                params.append('rating', rating);
            }

            const response = await fetch(`/api/reviews/product/${this.productId}?${params}`);
            const data = await response.json();

            if (response.ok) {
                this.currentPage = page;
                this.currentRating = rating;
                this.totalPages = data.totalPages;
                this.totalElements = data.totalElements;

                this.updateStatistics(data.statistics);
                this.renderReviews(data.reviews);
                this.updatePagination();
                this.updateFilterCounts(data.statistics.ratingCounts);

                this.showNoReviews(data.reviews.length === 0);
            } else {
                console.error('Error loading reviews:', data.error);
                this.showError('Không thể tải đánh giá sản phẩm');
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.showError('Có lỗi xảy ra khi tải đánh giá');
        } finally {
            this.showLoading(false);
        }
    }

    updateStatistics(statistics) {
        // Update overall rating
        const overallRating = document.getElementById('overallRating');
        const overallStars = document.getElementById('overallStars');
        const totalReviews = document.getElementById('totalReviews');

        if (overallRating) {
            overallRating.textContent = statistics.averageRating.toFixed(1);
        }

        if (overallStars) {
            this.updateStars(overallStars, statistics.averageRating);
        }

        if (totalReviews) {
            totalReviews.textContent = `${statistics.totalReviews} đánh giá`;
        }

        // Update rating breakdown
        this.updateRatingBreakdown(statistics.ratingCounts, statistics.ratingPercentages);
    }

    updateStars(container, rating) {
        const stars = container.querySelectorAll('i');
        const fullStars = Math.floor(rating);
        const decimalPart = rating % 1;
        const hasHalfStar = decimalPart > 0;

        stars.forEach((star, index) => {
            star.className = 'fas fa-star';
            if (index < fullStars) {
                star.style.color = '#ff6b9d';
            } else if (index === fullStars && hasHalfStar) {
                star.className = 'fas fa-star-half-alt';
                star.style.color = '#ff6b9d';
            } else {
                star.style.color = '#ddd';
            }
        });
    }

    updateRatingBreakdown(ratingCounts, ratingPercentages) {
        for (let rating = 5; rating >= 1; rating--) {
            const ratingBar = document.querySelector(`[data-rating="${rating}"]`);
            if (ratingBar) {
                const progressBar = ratingBar.querySelector('.progress-bar');
                const countSpan = ratingBar.querySelector('.rating-count');

                if (progressBar) {
                    progressBar.style.width = `${ratingPercentages[rating]}%`;
                }

                if (countSpan) {
                    countSpan.textContent = ratingCounts[rating];
                }
            }
        }
    }

    updateFilterCounts(ratingCounts) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const rating = btn.dataset.rating;
            const countSpan = btn.querySelector('.count');

            if (countSpan && rating !== 'all') {
                countSpan.textContent = ratingCounts[rating] || 0;
            }
        });
    }

    renderReviews(reviews) {
        const reviewsList = document.getElementById('reviewsList');
        if (!reviewsList) return;

        if (reviews.length === 0) {
            reviewsList.innerHTML = '';
            return;
        }

        const reviewsHTML = reviews.map(review => this.createReviewHTML(review)).join('');
        reviewsList.innerHTML = reviewsHTML;
        
        // Add event delegation for image clicks
        this.bindImageClickEvents();
    }
    
    bindImageClickEvents() {
        const reviewsList = document.getElementById('reviewsList');
        if (!reviewsList) return;
        
        reviewsList.addEventListener('click', (e) => {
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

    createReviewHTML(review) {
        const reviewDate = new Date(review.createdAt).toLocaleDateString('vi-VN');

        // Debug: Log review data để kiểm tra (có thể xóa sau khi fix xong)
        console.log('Review data:', review);

        // Sử dụng userDisplayName từ backend (đã xử lý logic ẩn danh)
        const displayName = review.userDisplayName || 'Người dùng';
        const userInitial = displayName.charAt(0).toUpperCase();

        // Tạo avatar từ userAvatar hoặc fallback
        let avatarHTML = '';
        const hasValidAvatar = review.userAvatar &&
            review.userAvatar.trim() !== '' &&
            review.userAvatar !== 'null' &&
            review.userAvatar !== 'undefined';

        if (hasValidAvatar) {
            avatarHTML = `<img src="${review.userAvatar}" alt="${displayName}" class="review-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        }

        // Fallback avatar với chữ cái đầu
        avatarHTML += `<div class="review-avatar-text" style="${hasValidAvatar ? 'display: none;' : ''}">${userInitial}</div>`;

        // Kiểm tra xem review có bị ẩn không
        const isHidden = review.isVisible === false;

        // Parse HTML để tìm ảnh upload
        const userImages = this.extractUserImages(review.content);
        const hasUserImages = userImages.length > 0;

        // Tạo HTML cho text content (bỏ qua ảnh)
        let textContent = review.content || 'Không có nội dung đánh giá.';
        if (hasUserImages && !isHidden) {
            // Loại bỏ thẻ img từ content để chỉ hiển thị text
            textContent = textContent.replace(/<figure[^>]*>.*?<\/figure>/gi, '').trim();
            if (!textContent || textContent === '') {
                textContent = 'Đánh giá này có ảnh đính kèm.';
            }
        }

        return `
            <div class="review-item ${isHidden ? 'review-hidden' : ''}">
                <div class="review-header">
                    <div class="review-avatar">
                        ${avatarHTML}
                    </div>
                    <div class="review-user-info">
                        <div class="review-username">${displayName}</div>
                        <div class="review-rating">
                            <div class="review-stars">
                                ${this.createStarsHTML(review.rating)}
                            </div>
                            <div class="review-date">${reviewDate}</div>
                        </div>
                    </div>
                </div>
                <div class="review-content">
                    ${isHidden ?
                        '<div class="review-hidden-content"><i class="fas fa-eye-slash me-2"></i>Nội dung đánh giá đã bị ẩn</div>' :
                        textContent
                    }
                </div>
                ${hasUserImages && !isHidden ? this.createUserImagesCollapse(userImages, review.reviewId) : ''}
            </div>
        `;
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
        const uniqueId = `review-images-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return `
            <div class="review-user-images-section" data-review-images='${JSON.stringify(images)}' data-review-id="${reviewId}">
                                 <button class="btn btn-link p-0 mt-2 review-show-images-btn" 
                         type="button" 
                         data-bs-toggle="collapse" 
                         data-bs-target="#${uniqueId}"
                         aria-expanded="false">
                     <i class="fas fa-images"></i>
                     <span>Xem ảnh</span>
                     <i class="fas fa-chevron-down collapse-icon" style="margin-left: 4px; font-size: 0.7rem;"></i>
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

    openImageLightbox(images, startIndex) {
        // Get or create lightbox
        let lightbox = document.getElementById('reviewImageLightbox');
        
        if (!lightbox) {
            // Create lightbox if it doesn't exist
            lightbox = document.createElement('div');
            lightbox.className = 'review-image-lightbox';
            lightbox.id = 'reviewImageLightbox';
            lightbox.innerHTML = `
                <span class="close-btn">&times;</span>
                <button class="nav-btn prev">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="nav-btn next">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="lightbox-container">
                    <img src="" alt="Full size" id="reviewLightboxImage">
                    <div class="image-counter"></div>
                </div>
            `;
            document.body.appendChild(lightbox);
            
            // Add click event to close
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
            
            // Navigation buttons
            navPrev.addEventListener('click', function(e) {
                e.stopPropagation();
                window.reviewsManager.navigateImage('prev');
            });
            
            navNext.addEventListener('click', function(e) {
                e.stopPropagation();
                window.reviewsManager.navigateImage('next');
            });
            
            // Store images array
            lightbox.dataset.images = JSON.stringify(images);
            lightbox.dataset.currentIndex = startIndex;
            
            // Keyboard navigation
            document.addEventListener('keydown', function(e) {
                if (lightbox.classList.contains('active')) {
                    if (e.key === 'ArrowLeft') {
                        window.reviewsManager.navigateImage('prev');
                    } else if (e.key === 'ArrowRight') {
                        window.reviewsManager.navigateImage('next');
                    } else if (e.key === 'Escape') {
                        lightbox.classList.remove('active');
                    }
                }
            });
        }

        // Store images and current index
        lightbox.dataset.images = JSON.stringify(images);
        lightbox.dataset.currentIndex = startIndex;

        // Update image and counter
        this.updateLightboxImage();
        
        // Show lightbox
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
        const imageCounter = lightbox.querySelector('.image-counter');
        const navPrev = lightbox.querySelector('.nav-btn.prev');
        const navNext = lightbox.querySelector('.nav-btn.next');
        
        // Update image
        const image = lightbox.querySelector('#reviewLightboxImage');
        if (image) {
            image.src = images[currentIndex];
        }
        
        // Update counter
        if (imageCounter) {
            imageCounter.textContent = `${currentIndex + 1} / ${images.length}`;
        }
        
        // Show/hide navigation buttons based on number of images
        if (navPrev) {
            navPrev.style.display = images.length > 1 ? 'flex' : 'none';
        }
        if (navNext) {
            navNext.style.display = images.length > 1 ? 'flex' : 'none';
        }
    }

    createStarsHTML(rating) {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        return starsHTML;
    }

    maskUsername(username) {
        if (!username || username.length <= 2) {
            return username;
        }

        if (username.length === 3) {
            return username.charAt(0) + "*" + username.charAt(2);
        }

        // Tạo chuỗi với chữ đầu, các dấu *, và chữ cuối
        let masked = username.charAt(0);
        for (let i = 1; i < username.length - 1; i++) {
            masked += "*";
        }
        masked += username.charAt(username.length - 1);

        return masked;
    }

    updatePagination() {
        const pagination = document.getElementById('reviewsPagination');
        if (!pagination) return;

        if (this.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'block';

        let paginationHTML = '';

        // Previous button
        if (this.currentPage > 0) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${this.currentPage - 1}">‹</a>
                </li>
            `;
        }

        // Page numbers
        const startPage = Math.max(0, this.currentPage - 2);
        const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage ? 'active' : '';
            paginationHTML += `
                <li class="page-item ${isActive}">
                    <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
                </li>
            `;
        }

        // Next button
        if (this.currentPage < this.totalPages - 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${this.currentPage + 1}">›</a>
                </li>
            `;
        }

        pagination.querySelector('.pagination').innerHTML = paginationHTML;

        // Bind pagination events
        pagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.currentTarget.dataset.page);
                this.loadReviews(page, this.currentRating);
            });
        });
    }

    filterByRating(rating) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[data-rating="${rating}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Load reviews with new filter
        this.loadReviews(0, rating);
    }

    showLoading(show) {
        const loading = document.getElementById('reviewsLoading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    showNoReviews(show) {
        const noReviews = document.getElementById('noReviewsMessage');
        if (noReviews) {
            noReviews.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        const reviewsList = document.getElementById('reviewsList');
        if (reviewsList) {
            reviewsList.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                    <p class="text-muted">${message}</p>
                </div>
            `;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productDetailManager = new ProductDetailManager();

    // Initialize reviews manager when reviews tab is shown
    const reviewsTab = document.getElementById('reviews-tab');
    if (reviewsTab) {
        reviewsTab.addEventListener('shown.bs.tab', () => {
            if (!window.reviewsManager) {
                const productId = document.getElementById('productId')?.value;
                if (productId) {
                    window.reviewsManager = new ReviewsManager(productId);
                }
            }
        });
    }
});
