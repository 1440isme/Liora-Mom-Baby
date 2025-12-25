/**
 * Newest Products Homepage Manager
 * Handles newest products display on homepage
 */
class NewestProductsHomepageManager {
    constructor() {
        this.products = [];
        this.isLoading = false;
        this.init();
    }

    init() {
        try {
            this.loadNewestProducts();
            this.bindEvents();
        } catch (error) {
            console.error('Error in init():', error);
        }
    }

    bindEvents() {
        // Navigation buttons
        const prevBtn = document.getElementById('homepageNewestPrevBtn');
        const nextBtn = document.getElementById('homepageNewestNextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousProducts());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextProducts());
        }
    }

    async loadNewestProducts() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch('/api/products/newest?limit=8');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.code === 1000 && data.result) {
                this.products = data.result;
                this.renderNewestProducts();

                // Add scroll event listener
                const grid = document.getElementById('homepageNewestProductsGrid');
                if (grid) {
                    grid.addEventListener('scroll', () => this.updateNavigationButtons());
                }

                // Update navigation buttons after a short delay to ensure DOM is ready
                setTimeout(() => {
                    this.updateNavigationButtons();
                }, 100);
            } else {
                this.showEmpty();
            }
        } catch (error) {
            console.error('Error loading newest products:', error);
            this.showEmpty();
        } finally {
            this.isLoading = false;
        }
    }

    renderNewestProducts() {
        const grid = document.getElementById('homepageNewestProductsGrid');
        if (!grid) return;

        if (this.products.length === 0) {
            this.showEmpty();
            return;
        }


        // Render all products instead of slicing
        grid.innerHTML = this.products.map(product => this.createProductCard(product)).join('');
        this.hideLoading();

        // Trigger rating load sau khi render xong
        setTimeout(() => {
            if (window.loadProductRatings) {
                window.loadProductRatings();
            }
        }, 500);
    }

    createProductCard(product) {
        const productId = product.productId || 0;
        const productName = product.name || 'Tên sản phẩm';
        const brandName = product.brandName || product.brand?.name || 'Thương hiệu';
        const price = product.price || 0;
        const rating = product.averageRating || product.rating || 0;
        const reviewCount = product.reviewCount || 0;
        const mainImageUrl = this.getMainImageUrl(product);
        const status = this.getProductStatus(product);
        const statusClass = this.getProductStatusClass(product);
        const statusBadge = this.getProductStatusBadge(product);

        return `
            <div class="product-card ${statusClass}" data-product-id="${productId}">
                <div class="position-relative">
                    <img src="${mainImageUrl}" 
                         class="card-img-top" 
                         alt="${productName}"
                         onerror="this.src='/user/img/default-product.jpg'"
                         onclick="window.location.href='/product/${product.productId}'"
                         style="cursor: pointer;">
                    
                    <div class="product-actions">
                        <button class="quick-view-btn" 
                                onclick="if(window.app) window.app.showQuickView(${product.productId}); else alert('Chức năng đang được tải...');"
                                title="Xem nhanh">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title" title="${productName}">
                        <a href="/product/${productId}" class="text-decoration-none text-dark product-name-link">
                            ${productName}
                        </a>
                    </h6>
                    
                    <p class="brand-name">
                        <a href="/brand/${product.brandId || product.brand?.brandId || 0}" class="text-decoration-none text-muted brand-link">
                            ${brandName}
                        </a>
                    </p>
                    
                    <!-- Rating sẽ được load bởi ProductRatingUtils -->
                    <div class="product-rating" data-product-id="${productId}">
                        <div class="star-rating">
                            <div class="star empty">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                            <div class="star empty">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                            <div class="star empty">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                            <div class="star empty">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                            <div class="star empty">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                        </div>
                        <span class="rating-count">(0)</span>
                    </div>
                    
                    <div class="mt-auto">
                        <!-- Sales Progress Bar -->
                        <div class="sales-progress mb-3">
                            <div class="sales-info d-flex justify-content-between align-items-center mb-1">
                                <span class="sales-label">Đã bán</span>
                                <span class="sales-count">${this.formatNumber(product.soldCount || 0)}</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar" 
                                     style="width: ${this.calculateSalesProgress(product.soldCount || 0)}%"
                                     role="progressbar">
                                </div>
                            </div>
                        </div>
                        
                        <div class="price-section d-flex justify-content-between align-items-center">
                            <span class="current-price">
                                ${this.formatPrice(price)}
                            </span>
                            <button class="add-to-cart-icon homepage-newest-cart-btn" 
                                    data-product-id="${productId}"
                                    data-product-name="${productName}"
                                    data-product-price="${price}"
                                    title="Thêm vào giỏ"
                                    onclick="event.preventDefault(); event.stopPropagation(); if(window.app) window.app.addToCart(${productId}); else alert('Chức năng đang được tải...');">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getMainImageUrl(product) {
        // Prioritize mainImageUrl from API response
        if (product.mainImageUrl) {
            return product.mainImageUrl;
        }

        // Fallback to first image in images array
        if (product.images && product.images.length > 0) {
            return product.images[0].imageUrl || product.images[0];
        }

        // Default fallback
        return '/user/img/default-product.jpg';
    }

    generateStars(rating) {
        if (!rating || rating === 0) {
            // Show 5 empty stars if no rating
            return '<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>'.repeat(5);
        }

        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star text-warning"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt text-warning"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>';
        }

        return stars;
    }

    formatPrice(price) {
        if (!price || price === null || price === undefined) {
            return '0 ₫';
        }

        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) {
            return '0 ₫';
        }

        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(numPrice);
    }

    getProductStatus(product) {
        if (!product.isActive) return 'inactive';
        if (!product.available) return 'out_of_stock';
        if (product.stock === 0) return 'out_of_stock';
        return 'active';
    }

    getProductStatusClass(product) {
        const status = this.getProductStatus(product);
        switch (status) {
            case 'out_of_stock': return 'btn-outline-danger';
            case 'inactive': return 'btn-outline-secondary';
            default: return '';
        }
    }

    getProductStatusBadge(product) {
        const status = this.getProductStatus(product);
        if (status === 'active') {
            return '<div class="product-status"><span class="status-badge status-new">Mới</span></div>';
        }
        if (status === 'out_of_stock') {
            return '<div class="product-status"><span class="status-badge status-out-of-stock">Hết hàng</span></div>';
        }
        if (status === 'inactive') {
            return '<div class="product-status"><span class="status-badge status-inactive">Không khả dụng</span></div>';
        }
        return '';
    }

    showLoading() {
        const loading = document.getElementById('homepageNewestProductsLoading');
        const grid = document.getElementById('homepageNewestProductsGrid');
        const empty = document.getElementById('homepageNewestProductsEmpty');

        if (loading) loading.style.display = 'block';
        if (grid) grid.style.display = 'none';
        if (empty) empty.style.display = 'none';
    }

    hideLoading() {
        const loading = document.getElementById('homepageNewestProductsLoading');
        const grid = document.getElementById('homepageNewestProductsGrid');

        if (loading) loading.style.display = 'none';
        if (grid) grid.style.display = 'grid';
    }

    showEmpty() {
        const loading = document.getElementById('homepageNewestProductsLoading');
        const grid = document.getElementById('homepageNewestProductsGrid');
        const empty = document.getElementById('homepageNewestProductsEmpty');

        if (loading) loading.style.display = 'none';
        if (grid) grid.style.display = 'none';
        if (empty) empty.style.display = 'block';
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('homepageNewestPrevBtn');
        const nextBtn = document.getElementById('homepageNewestNextBtn');
        const navButtons = document.querySelector('.newest-products-homepage-section .navigation-buttons');
        const grid = document.getElementById('homepageNewestProductsGrid');

        if (!grid || !this.products) return;

        if (this.products.length <= 4) {
            if (navButtons) navButtons.classList.add('hidden');
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            return;
        }

        if (navButtons) navButtons.classList.remove('hidden');

        const scrollLeft = grid.scrollLeft;
        const maxScrollLeft = grid.scrollWidth - grid.clientWidth;

        // Add small tolerance for floating point precision
        const isAtStart = scrollLeft <= 1;
        const isAtEnd = scrollLeft >= (maxScrollLeft - 1);


        if (prevBtn) {
            prevBtn.disabled = isAtStart;
        }
        if (nextBtn) {
            nextBtn.disabled = isAtEnd;
        }
    }

    previousProducts() {
        const grid = document.getElementById('homepageNewestProductsGrid');
        if (grid) {
            const cardWidth = 280 + 24; // card width + gap
            grid.scrollBy({
                left: -cardWidth,
                behavior: 'smooth'
            });

            // Update buttons after scroll animation
            setTimeout(() => {
                this.updateNavigationButtons();
            }, 300);
        }
    }

    nextProducts() {
        const grid = document.getElementById('homepageNewestProductsGrid');
        if (grid) {
            const cardWidth = 280 + 24; // card width + gap
            grid.scrollBy({
                left: cardWidth,
                behavior: 'smooth'
            });

            // Update buttons after scroll animation
            setTimeout(() => {
                this.updateNavigationButtons();
            }, 300);
        }
    }

    async addToCart(productId, productName, price) {
        try {
            // Sử dụng addProductToCartBackend để gọi API backend
            if (window.app && window.app.addProductToCartBackend) {
                await window.app.addProductToCartBackend(productId, 1, false);
                await window.app.refreshCartBadge?.();
            } else {
                this.showNotification('Chức năng đang được tải...', 'error');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showNotification('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
        }
    }

    async showQuickView(productId) {

        // Find product in current products
        const product = this.products.find(p => (p.productId || p.id) === productId);
        if (!product) {
            console.error('Product not found:', productId);
            return;
        }

        // Load product images if not already loaded
        if (!product.images) {
            try {
                const response = await fetch(`/api/products/${productId}/images`);
                if (response.ok) {
                    const data = await response.json();
                    product.images = data.result || [];
                }
            } catch (error) {
                product.images = [];
            }
        }

        // Load review statistics before creating modal
        try {
            const statistics = await ProductRatingUtils.loadReviewStatistics([productId]);
            const productStats = statistics[productId.toString()];
            if (productStats) {
                product.averageRating = productStats.averageRating || 0;
                product.reviewCount = productStats.totalReviews || 0;
            }
        } catch (error) {
            console.error('Error loading rating data:', error);
        }

        this.createQuickViewModal(product);
    }

    createQuickViewModal(product) {
        // Remove existing modal and backdrop if any
        const existingModal = document.getElementById('homepageNewestQuickViewModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Remove any existing backdrop
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="homepageNewestQuickViewModal" tabindex="-1" aria-labelledby="homepageNewestQuickViewModalLabel" aria-hidden="true" style="z-index: 9999 !important;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style="z-index: 10000 !important;">
                        <div class="modal-header border-0">
                            <h5 class="modal-title" id="homepageNewestQuickViewModalLabel">Xem nhanh sản phẩm</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <!-- Product Image Slider -->
                                <div class="col-md-6">
                                    <div class="product-image-slider">
                                        <!-- Main Image -->
                                        <div class="main-image-container mb-3">
                                            <button class="slider-nav slider-prev" id="homepageNewestModalPrevBtn">
                                                <i class="fas fa-chevron-left"></i>
                                            </button>
                                            <img id="homepageNewestModalMainProductImage" 
                                                 src="${this.getMainImageUrl(product)}" 
                                                 class="img-fluid" 
                                                 alt="${product.name}"
                                                 onerror="this.src='/user/img/default-product.jpg'">
                                            <button class="slider-nav slider-next" id="homepageNewestModalNextBtn">
                                                <i class="fas fa-chevron-right"></i>
                                            </button>
                                        </div>
                                        
                                        <!-- Thumbnail Slider -->
                                        <div class="thumbnail-slider">
                                            <div class="thumbnail-container d-flex gap-2">
                                                ${this.generateImageThumbnails(product)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Product Info -->
                                <div class="col-md-6">
                                    <h4 class="product-name mb-3">
                                        <a href="/product/${product.productId}" class="text-decoration-none text-dark">
                                            ${product.name}
                                        </a>
                                    </h4>
                                    <p class="brand-name text-muted mb-2">${product.brandName || product.brand?.name || 'Thương hiệu'}</p>
                                    
                                    <!-- Product Status -->
                                    <div class="product-status mb-3">
                                        ${this.getProductStatusBadge(product)}
                                        <span class="ms-2 text-muted">Mã sản phẩm: ${product.productId}</span>
                                    </div>
                                    
                                    <!-- Rating -->
                                    <div class="rating mb-3">
                                        <span class="stars">
                                            ${this.generateStarsForModal(product.averageRating || product.rating || 0, product.reviewCount || 0)}
                                        </span>
                                        <span class="review-count ms-2">(${product.reviewCount || 0} đánh giá)</span>
                                    </div>
                                    
                                    <!-- Price -->
                                    <div class="price-section mb-4">
                                        <span class="current-price h4 text-primary">
                                            ${this.formatPrice(product.price || 0)}
                                        </span>
                                    </div>
                                    
                                    <!-- Quantity Selector -->
                                    <div class="quantity-selector mb-4">
                                        <div class="d-flex align-items-center">
                                            <label class="form-label mb-0" style="margin-right: 2rem;">Số lượng:</label>
                                            <div class="input-group" style="max-width: 150px;">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.newestProductsHomepageManager.decrementQuantity('${product.productId}')">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="homepageNewestQuantityInput_${product.productId}" onchange="window.newestProductsHomepageManager.validateQuantity('${product.productId}')" oninput="window.newestProductsHomepageManager.validateQuantity('${product.productId}')" onblur="window.newestProductsHomepageManager.validateQuantityOnBlur('${product.productId}')">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.newestProductsHomepageManager.incrementQuantity('${product.productId}')">+</button>
                                            </div>
                                        </div>
                                        <!-- Error Message -->
                                        <div id="homepageNewestQuantityError_${product.productId}" class="text-danger mt-2" style="display: none;">
                                            <i class="fas fa-info-circle me-1"></i>
                                            <span id="homepageNewestQuantityErrorMessage_${product.productId}">Số lượng tối đa bạn có thể mua là ${Math.min(product.stock || 10, 99)}.</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Actions -->
                                    <div class="d-grid gap-2">
                                        ${this.getQuickViewActions(product)}
                                        
                                        <!-- View Details Button -->
                                        <a href="/product/${product.productId}" 
                                           class="btn btn-outline-primary btn-lg">
                                            <i class="fas fa-info-circle me-2"></i>
                                            Xem chi tiết sản phẩm
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal with proper backdrop
        const modal = new bootstrap.Modal(document.getElementById('homepageNewestQuickViewModal'), {
            backdrop: true,
            keyboard: true,
            focus: true
        });
        modal.show();

        // Ensure backdrop has proper z-index
        setTimeout(() => {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.style.setProperty('z-index', '9998', 'important');
                backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }
        }, 10);

        // Add slider navigation event listeners
        this.setupSliderNavigation(product);

        // Update review data after modal is shown
        setTimeout(() => {
            ProductRatingUtils.updateQuickViewReviewData(product.productId, 'homepageNewestQuickViewModal');
        }, 500);

        // Clean up when modal is hidden
        document.getElementById('homepageNewestQuickViewModal').addEventListener('hidden.bs.modal', () => {
            const modalElement = document.getElementById('homepageNewestQuickViewModal');
            if (modalElement) {
                modalElement.remove();
            }
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, { once: true });
    }

    generateImageThumbnails(product) {
        if (!product.images || product.images.length === 0) {
            return `
                <div class="thumbnail-item active">
                    <img src="${this.getMainImageUrl(product)}" 
                         class="thumbnail-img" 
                         alt="${product.name}">
                </div>
            `;
        }

        return product.images.map((image, index) => `
            <div class="thumbnail-item ${index === 0 ? 'active' : ''}">
                <img src="${image.imageUrl}" 
                     class="thumbnail-img" 
                     alt="${product.name}">
            </div>
        `).join('');
    }

    getProductStatusBadge(product) {
        const status = this.getProductStatus(product);

        switch (status) {
            case 'out_of_stock':
                return '<span class="badge bg-danger">Hết hàng</span>';
            case 'inactive':
                return '<span class="badge bg-secondary">Không khả dụng</span>';
            default:
                return '<span class="badge bg-success">Còn hàng</span>';
        }
    }

    getQuickViewActions(product) {
        const status = this.getProductStatus(product);
        const isDisabled = status !== 'active';

        if (status === 'out_of_stock') {
            return `
                <div class="alert alert-danger text-center">
                    <i class="fas fa-times-circle me-2"></i>
                    Sản phẩm đã hết hàng
                </div>
            `;
        }

        return `
            <!-- Buy Now & Add to Cart Buttons (Same Row) -->
            <div class="row g-2">
                <div class="col-6">
                    <button class="btn btn-danger btn-lg w-100" 
                            onclick="window.newestProductsHomepageManager.buyNow(${product.productId})">
                        <i class="fas fa-bolt me-1"></i>
                        Mua ngay
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="event.preventDefault(); event.stopPropagation(); window.newestProductsHomepageManager.addToCartWithQuantity(${product.productId})">
                        <i class="fas fa-shopping-cart me-1"></i>
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;
    }

    setupSliderNavigation(product) {
        // Wait for modal to be fully rendered
        setTimeout(() => {
            const prevBtn = document.getElementById('homepageNewestModalPrevBtn');
            const nextBtn = document.getElementById('homepageNewestModalNextBtn');
            const mainImage = document.getElementById('homepageNewestModalMainProductImage');
            const thumbnails = document.querySelectorAll('#homepageNewestQuickViewModal .thumbnail-item');


            if (!product.images || product.images.length <= 1) {
                // Hide navigation buttons if only one image
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
                return;
            }

            let currentImageIndex = 0;

            // Update main image
            const updateMainImage = (index) => {
                if (product.images && product.images[index] && mainImage) {
                    mainImage.src = product.images[index].imageUrl;
                    mainImage.alt = product.name;

                    // Update thumbnail selection
                    thumbnails.forEach((thumb, i) => {
                        thumb.classList.toggle('active', i === index);
                    });
                }
            };

            // Previous button
            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : product.images.length - 1;
                    updateMainImage(currentImageIndex);
                });
            }

            // Next button
            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    currentImageIndex = currentImageIndex < product.images.length - 1 ? currentImageIndex + 1 : 0;
                    updateMainImage(currentImageIndex);
                });
            }

            // Thumbnail click handlers
            thumbnails.forEach((thumb, index) => {
                thumb.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    currentImageIndex = index;
                    updateMainImage(currentImageIndex);
                });
            });
        }, 100); // Small delay to ensure modal is rendered
    }

    generateStarsForModal(rating, reviewCount = 0) {
        if (!rating || rating === 0 || rating === '0' || rating === null || rating === undefined) {
            let stars = '';
            for (let i = 0; i < 5; i++) {
                stars += '<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>';
            }
            return stars;
        }

        const fullStars = Math.floor(rating);
        const decimalPart = rating % 1;
        const hasHalfStar = decimalPart > 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';

        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star" style="color: #ffc107 !important;"></i>';
        }

        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt" style="color: #ffc107 !important;"></i>';
        }

        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>';
        }

        return stars;
    }

    // Quantity management methods for quick view modal
    decrementQuantity(productId) {
        const quantityInput = document.getElementById(`homepageNewestQuantityInput_${productId}`);
        if (quantityInput) {
            let currentValue = parseInt(quantityInput.value) || 0;
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                this.validateQuantity(productId);
            }
        }
    }

    incrementQuantity(productId) {
        const quantityInput = document.getElementById(`homepageNewestQuantityInput_${productId}`);
        if (quantityInput) {
            let currentValue = parseInt(quantityInput.value) || 0;
            const maxStock = parseInt(quantityInput.getAttribute('max')) || 10;
            const maxAllowed = Math.min(maxStock, 99); // Tối đa 99 sản phẩm
            if (currentValue < maxAllowed) {
                quantityInput.value = currentValue + 1;
                this.validateQuantity(productId);
            }
        }
    }

    validateQuantity(productId) {
        const quantityInput = document.getElementById(`homepageNewestQuantityInput_${productId}`);
        const errorDiv = document.getElementById(`homepageNewestQuantityError_${productId}`);
        const errorMessage = document.getElementById(`homepageNewestQuantityErrorMessage_${productId}`);

        if (!quantityInput || !errorDiv || !errorMessage) return;

        const currentValue = parseInt(quantityInput.value) || 0;
        const maxStock = parseInt(quantityInput.getAttribute('max')) || 10;
        const maxAllowed = Math.min(maxStock, 99); // Tối đa 99 sản phẩm

        if (quantityInput.value === '' || quantityInput.value === '0') {
            errorDiv.style.display = 'none';
            quantityInput.classList.remove('is-invalid');
            return;
        }

        if (currentValue < 1) {
            quantityInput.value = 1;
            errorDiv.style.display = 'block';
            errorMessage.textContent = 'Số lượng không thể nhỏ hơn 1.';
            quantityInput.classList.add('is-invalid');
        } else if (currentValue > maxAllowed) {
            quantityInput.value = maxAllowed;
            errorDiv.style.display = 'block';
            errorMessage.textContent = `Số lượng tối đa là ${maxAllowed} sản phẩm.`;
            quantityInput.classList.add('is-invalid');
        } else {
            errorDiv.style.display = 'none';
            quantityInput.classList.remove('is-invalid');
        }
    }

    validateQuantityOnBlur(productId) {
        const quantityInput = document.getElementById(`homepageNewestQuantityInput_${productId}`);
        if (quantityInput && (quantityInput.value === '' || quantityInput.value === '0')) {
            quantityInput.value = 1;
        }
        this.validateQuantity(productId);
    }

    // Buy now functionality - chuẩn từ bestseller-products.js
    async buyNow(productId) {
        // Lấy số lượng từ input trong QuickView
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? (parseInt(quantityInput.value) || 1) : 1;

        // Đóng modal trước khi chuyển trang
        const modal = bootstrap.Modal.getInstance(document.getElementById('homepageNewestQuickViewModal'));
        if (modal) {
            modal.hide();
        }

        // Gọi buyNowBackend để thêm vào giỏ (tick choose=true) và chuyển tới checkout
        if (window.app && typeof window.app.buyNowBackend === 'function') {
            try {
                await window.app.buyNowBackend(productId, quantity);
            } catch (error) {
                console.error('buyNow error:', error);
                this.showNotification('Không thể thực hiện Mua ngay. Vui lòng thử lại.', 'error');
            }
        } else {
            this.showNotification('Chức năng đang được tải...', 'error');
        }
    }

    async addToCartWithQuantity(productId) {
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        try {
            // Sử dụng addProductToCartBackend để gọi API backend
            if (window.app && window.app.addProductToCartBackend) {
                await window.app.addProductToCartBackend(productId, quantity, false);
                await window.app.refreshCartBadge?.();
            } else {
                this.showNotification('Chức năng đang được tải...', 'error');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showNotification('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
        }

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('quickViewModal'));
        if (modal) {
            modal.hide();
        }
    }

    async addToCartWithQuantityValue(productId, quantity) {
        try {
            // Sử dụng addProductToCartBackend để gọi API backend
            if (window.app && window.app.addProductToCartBackend) {
                await window.app.addProductToCartBackend(productId, quantity, false);
                await window.app.refreshCartBadge?.();
            } else {
                this.showNotification('Chức năng đang được tải...', 'error');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showNotification('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        let container = document.querySelector('.homepage-newest-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'homepage-newest-toast-container';
            container.style.cssText = 'position: fixed !important; top: 20px !important; right: 20px !important; z-index: 9999 !important; width: 300px;';
            document.body.appendChild(container);
        }
        container.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    calculateSalesProgress(soldCount) {
        // Define different thresholds for progress calculation - optimized for better visual appeal
        const thresholds = [
            { max: 50, percentage: 30 },     // 0-50: 0-30% (tăng từ 20%)
            { max: 100, percentage: 40 },    // 50-100: 30-40%
            { max: 500, percentage: 55 },   // 100-500: 40-55%
            { max: 1000, percentage: 70 },   // 500-1000: 55-70%
            { max: 5000, percentage: 85 },   // 1000-5000: 70-85%
            { max: 10000, percentage: 95 },  // 5000-10000: 85-95%
            { max: Infinity, percentage: 100 } // >10000: 95-100%
        ];

        for (const threshold of thresholds) {
            if (soldCount <= threshold.max) {
                // Get previous threshold percentage
                const prevThreshold = thresholds[thresholds.indexOf(threshold) - 1];
                const basePercentage = prevThreshold ? prevThreshold.percentage : 0;

                // Calculate progress within this threshold
                const prevMax = prevThreshold ? prevThreshold.max : 0;
                const range = threshold.max - prevMax;
                const progress = ((soldCount - prevMax) / range) * (threshold.percentage - basePercentage);

                return Math.min(100, basePercentage + progress);
            }
        }

        return 100; // For very high sales
    }

    formatNumber(number) {
        return new Intl.NumberFormat('vi-VN').format(number);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('homepageNewestProductsGrid')) {
        window.newestProductsHomepageManager = new NewestProductsHomepageManager();
    }
});
