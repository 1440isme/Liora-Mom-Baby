/**
 * Bestseller Products Manager
 * Handles loading and displaying bestseller products
 */
class BestsellerProductsManager {
    constructor() {
        this.loadingEl = document.getElementById('bestsellerProductsLoading');
        this.emptyEl = document.getElementById('bestsellerProductsEmpty');
        this.gridEl = document.getElementById('bestsellerProductsGrid');
        this.prevBtn = document.getElementById('bestsellerPrevBtn');
        this.nextBtn = document.getElementById('bestsellerNextBtn');
        this.allProducts = [];
        this.isAddingToCart = false;

        this.init();
    }

    async init() {
        this.bindNavigationEvents();
        await this.loadBestsellerProducts();
    }

    bindNavigationEvents() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.navigateProducts(-1));
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.navigateProducts(1));
        }
    }

    navigateProducts(direction) {
        const cardWidth = 280 + 24; // Width of one card (280px) + gap (1.5rem = 24px)
        const currentScroll = this.gridEl.scrollLeft;
        const newScroll = currentScroll + (direction * cardWidth);

        this.gridEl.scrollTo({
            left: newScroll,
            behavior: 'smooth'
        });

        setTimeout(() => this.updateNavigationButtons(), 300);
    }

    updateNavigationButtons() {
        const navigationContainer = document.querySelector('.bestseller-products-section .navigation-buttons');

        console.log('Updating navigation buttons:', {
            productsCount: this.allProducts ? this.allProducts.length : 0,
            navigationContainer: !!navigationContainer,
            prevBtn: !!this.prevBtn,
            nextBtn: !!this.nextBtn
        });

        if (this.allProducts && this.allProducts.length > 4) {
            console.log('Showing navigation buttons - more than 4 products');
            if (navigationContainer) {
                navigationContainer.classList.remove('hidden');
            }

            const isAtStart = this.gridEl.scrollLeft <= 0;
            const isAtEnd = this.gridEl.scrollLeft >= (this.gridEl.scrollWidth - this.gridEl.clientWidth - 1);

            console.log('Navigation state:', { isAtStart, isAtEnd, scrollLeft: this.gridEl.scrollLeft, scrollWidth: this.gridEl.scrollWidth, clientWidth: this.gridEl.clientWidth });

            if (this.prevBtn) {
                this.prevBtn.disabled = isAtStart;
            }
            if (this.nextBtn) {
                this.nextBtn.disabled = isAtEnd;
            }
        } else {
            console.log('Hiding navigation buttons - 4 or fewer products');
            if (navigationContainer) {
                navigationContainer.classList.add('hidden');
            }
            // Disable buttons when hidden
            if (this.prevBtn) {
                this.prevBtn.disabled = true;
            }
            if (this.nextBtn) {
                this.nextBtn.disabled = true;
            }
        }
    }

    async loadBestsellerProducts() {
        this.showLoading();

        try {
            const url = `/api/products/best-selling?limit=8`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 1000 && data.result && data.result.length > 0) {
                this.allProducts = data.result;
                this.renderBestsellerProducts(this.allProducts);

                this.gridEl.addEventListener('scroll', () => this.updateNavigationButtons());

                // Update navigation buttons immediately after rendering
                this.updateNavigationButtons();
            } else {
                this.showEmpty();
            }
        } catch (error) {
            this.showEmpty('Lỗi khi tải sản phẩm bán chạy');
        }
    }

    renderBestsellerProducts(products) {
        this.hideLoading();
        this.hideEmpty();

        const productsHTML = products.map(product => this.createProductCard(product)).join('');
        this.gridEl.innerHTML = productsHTML;
        
        // Trigger rating load sau khi render xong
        setTimeout(() => {
            if (window.loadProductRatings) {
                window.loadProductRatings();
            }
        }, 500);
    }

    createProductCard(product) {
        const productStatus = this.getProductStatus(product);
        const statusClass = this.getProductStatusClass(productStatus);

        return `
            <div class="product-card ${statusClass}" data-product-id="${product.productId}">
                <div class="position-relative">
                    <img src="${product.mainImageUrl || '/user/img/default-product.jpg'}" 
                         class="card-img-top" 
                         alt="${product.name}"
                         onerror="this.src='/user/img/default-product.jpg'"
                         onclick="window.location.href='/product/${product.productId}'"
                         style="cursor: pointer;">
                    
                    <div class="product-actions">
                        <button class="quick-view-btn" 
                                onclick="if(window.bestsellerProductsManager) window.bestsellerProductsManager.showQuickView(${product.productId}); else alert('Chức năng đang được tải...');"
                                title="Xem nhanh">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title" title="${product.name}">
                        <a href="/product/${product.productId}" class="text-decoration-none text-dark product-name-link">
                            ${product.name}
                        </a>
                    </h6>
                    
                    <p class="brand-name">
                        <a href="/brand/${product.brandId}" class="text-decoration-none text-muted brand-link">
                            ${product.brandName || 'Thương hiệu'}
                        </a>
                    </p>
                    
                    <!-- Rating sẽ được load bởi ProductRatingUtils -->
                    <div class="product-rating" data-product-id="${product.productId}">
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
                                ${this.formatPrice(product.price)}
                            </span>
                            <button class="add-to-cart-icon bestseller-products-cart-btn" 
                                    data-product-id="${product.productId}"
                                    data-product-name="${product.name}"
                                    data-product-price="${product.price}"
                                    title="Thêm vào giỏ"
                                    onclick="event.preventDefault(); event.stopPropagation(); window.bestsellerProductsManager.addToCart(${product.productId}, '${product.name}', ${product.price})">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getProductStatus(product) {
        if (!product.available) return 'out-of-stock';
        if (product.stock <= 0) return 'out-of-stock';
        if (product.stock <= 5) return 'low-stock';
        return 'available';
    }

    getProductStatusClass(status) {
        switch (status) {
            case 'out-of-stock': return 'out-of-stock';
            case 'low-stock': return 'low-stock';
            default: return 'available';
        }
    }

    renderStars(rating, reviewCount = 0) {
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

    async showQuickView(productId) {
        const product = this.allProducts.find(p => p.productId === productId);
        if (!product) {
            this.showNotification('Không tìm thấy sản phẩm', 'error');
            return;
        }

        console.log('Bestseller Quick View - Product found:', {
            productId: product.productId,
            name: product.name,
            hasImages: !!product.images,
            imagesCount: product.images ? product.images.length : 0
        });

        if (!product.images) {
            try {
                console.log('Loading images for product:', productId);
                const response = await fetch(`/api/products/${productId}/images`);
                if (response.ok) {
                    const data = await response.json();
                    product.images = data.result || [];
                    console.log('Images loaded:', product.images.length);
                } else {
                    console.log('Failed to load images, status:', response.status);
                    product.images = [];
                }
            } catch (error) {
                console.log('Error loading images:', error);
                product.images = [];
            }
        }

        console.log('Final product images:', product.images);
        this.createQuickViewModal(product);
    }

    createQuickViewModal(product) {
        const existingModal = document.getElementById('bestsellerQuickViewModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="bestsellerQuickViewModal" tabindex="-1" aria-labelledby="bestsellerQuickViewModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0">
                            <h5 class="modal-title" id="bestsellerQuickViewModalLabel">Xem nhanh sản phẩm</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="product-image-slider">
                                        <!-- Main Image -->
                                        <div class="main-image-container mb-3">
                                            <button class="slider-nav slider-prev" id="bestsellerModalPrevBtn">
                                                <i class="fas fa-chevron-left"></i>
                                            </button>
                                            <img id="bestsellerModalMainProductImage" 
                                                 src="${this.getMainImageUrl(product)}" 
                                                 class="img-fluid rounded" 
                                                 alt="${product.name}"
                                                 onerror="this.src='/user/img/default-product.jpg'">
                                            <button class="slider-nav slider-next" id="bestsellerModalNextBtn">
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
                                
                                <div class="col-md-6">
                                    <h4 class="product-name mb-3">
                                        <a href="/product/${product.productId}" class="text-decoration-none text-dark">
                                            ${product.name}
                                        </a>
                                    </h4>
                                    <p class="brand-name text-muted mb-2">${product.brandName || 'Thương hiệu'}</p>
                                    
                                    <div class="product-status mb-3">
                                        ${this.getProductStatusBadge(product)}
                                        <span class="ms-2 text-muted">Mã sản phẩm: ${product.productId}</span>
                                    </div>
                                    
                                    <div class="rating mb-3">
                                        <span class="stars">
                                            ${this.generateStarsForModal(product.averageRating || 0, product.ratingCount || 0)}
                                        </span>
                                        <span class="review-count ms-2">(${product.ratingCount || 0} đánh giá)</span>
                                    </div>
                                    
                                    <!-- Sales Progress -->
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
                                    
                                    <div class="price-section mb-4">
                                        <span class="current-price h4 text-primary">
                                            ${this.formatCurrency(product.price)}
                                        </span>
                                    </div>
                                    
                                    <div class="quantity-selector mb-4">
                                        <div class="d-flex align-items-center">
                                            <label class="form-label mb-0" style="margin-right: 2rem;">Số lượng:</label>
                                            <div class="input-group" style="max-width: 150px;">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.bestsellerProductsManager.decrementQuantity('${product.productId}')">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="bestsellerQuickViewQuantityInput_${product.productId}" onchange="window.bestsellerProductsManager.validateQuantity('${product.productId}')" oninput="window.bestsellerProductsManager.validateQuantity('${product.productId}')" onblur="window.bestsellerProductsManager.validateQuantityOnBlur('${product.productId}')">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.bestsellerProductsManager.incrementQuantity('${product.productId}')">+</button>
                                            </div>
                                        </div>
                                        <div id="bestsellerQuickViewQuantityError_${product.productId}" class="text-danger mt-2" style="display: none;">
                                            <i class="fas fa-info-circle me-1"></i>
                                            <span id="bestsellerQuickViewQuantityErrorMessage_${product.productId}">Số lượng tối đa bạn có thể mua là ${Math.min(product.stock || 10, 99)}.</span>
                                        </div>
                                    </div>
                                    
                                    <div class="d-grid gap-2">
                                        ${this.getQuickViewActions(product)}
                                        
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

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('bestsellerQuickViewModal'));
        modal.show();

        // Add slider navigation event listeners
        this.setupSliderNavigation(product);

        // Update review data after modal is shown
        setTimeout(() => {
            ProductRatingUtils.updateQuickViewReviewData(product.productId, 'bestsellerQuickViewModal');
        }, 200);

        document.getElementById('bestsellerQuickViewModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    getMainImageUrl(product) {
        if (product.images && product.images.length > 0) {
            return product.images[0].imageUrl;
        }
        return product.mainImageUrl || '/user/img/default-product.jpg';
    }

    // Generate image thumbnails for modal
    generateImageThumbnails(product) {
        console.log('Generating thumbnails for product:', product.name, 'Images:', product.images);

        if (!product.images || product.images.length === 0) {
            console.log('No images found, using main image as thumbnail');
            return `
                <div class="thumbnail-item active">
                    <img src="${this.getMainImageUrl(product)}" 
                         class="thumbnail-img" 
                         alt="${product.name}"
                         onerror="this.src='/user/img/default-product.jpg'">
                </div>
            `;
        }

        console.log('Generating thumbnails for', product.images.length, 'images');
        return product.images.map((image, index) => `
            <div class="thumbnail-item ${index === 0 ? 'active' : ''}">
                <img src="${image.imageUrl}" 
                     class="thumbnail-img" 
                     alt="${product.name}"
                     onerror="this.src='/user/img/default-product.jpg'">
            </div>
        `).join('');
    }

    // Setup slider navigation
    setupSliderNavigation(product) {
        // Wait for modal to be fully rendered
        setTimeout(() => {
            const prevBtn = document.getElementById('bestsellerModalPrevBtn');
            const nextBtn = document.getElementById('bestsellerModalNextBtn');
            const mainImage = document.getElementById('bestsellerModalMainProductImage');
            const thumbnails = document.querySelectorAll('.thumbnail-item');

            console.log('Setting up bestseller slider navigation:', {
                prevBtn: !!prevBtn,
                nextBtn: !!nextBtn,
                mainImage: !!mainImage,
                thumbnails: thumbnails.length,
                productImages: product.images ? product.images.length : 0
            });

            if (!product.images || product.images.length <= 1) {
                // Hide navigation buttons if only one image
                console.log('Only one image, hiding navigation buttons');
                if (prevBtn) {
                    prevBtn.style.display = 'none';
                    prevBtn.style.visibility = 'hidden';
                }
                if (nextBtn) {
                    nextBtn.style.display = 'none';
                    nextBtn.style.visibility = 'hidden';
                }
                return;
            }

            console.log('Multiple images found, showing navigation buttons');

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

    getProductStatus(product) {
        if (!product.available) {
            return 'deactivated';
        }
        if (product.stock === 0 || product.stock === null) {
            return 'out_of_stock';
        }
        return 'available';
    }

    getProductStatusBadge(product) {
        const status = this.getProductStatus(product);

        switch (status) {
            case 'deactivated':
                return '<span class="badge bg-warning text-dark">Ngừng kinh doanh</span>';
            case 'out_of_stock':
                return '<span class="badge bg-danger">Hết hàng</span>';
            default:
                return '<span class="badge bg-success">Còn hàng</span>';
        }
    }

    getQuickViewActions(product) {
        const status = this.getProductStatus(product);

        if (status === 'deactivated') {
            return `
                <div class="alert alert-warning text-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Sản phẩm đã ngừng kinh doanh
                </div>
            `;
        }

        if (status === 'out_of_stock') {
            return `
                <div class="alert alert-danger text-center">
                    <i class="fas fa-times-circle me-2"></i>
                    Sản phẩm đã hết hàng
                </div>
            `;
        }

        return `
            <div class="row g-2">
                <div class="col-6">
                    <button class="btn btn-danger btn-lg w-100" 
                            onclick="window.bestsellerProductsManager.buyNow(${product.productId})">
                        <i class="fas fa-bolt me-1"></i>
                        Mua ngay
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="event.preventDefault(); event.stopPropagation(); window.bestsellerProductsManager.addToCartWithQuantity(${product.productId})">
                        <i class="fas fa-shopping-cart me-1"></i>
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;
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

        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star" style="color: #ffc107 !important;"></i>';
        }

        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt" style="color: #ffc107 !important;"></i>';
        }

        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>';
        }

        return stars;
    }

    async buyNow(productId) {
        const product = this.allProducts.find(p => p.productId === productId);
        if (!product) {
            this.showNotification('Không tìm thấy sản phẩm!', 'error');
            return;
        }

        // Lấy số lượng từ input trong QuickView
        const quantityInput = document.getElementById(`bestsellerQuickViewQuantityInput_${productId}`);
        const quantity = quantityInput ? (parseInt(quantityInput.value) || 1) : 1;

        // Đóng modal trước khi chuyển trang
        const modal = bootstrap.Modal.getInstance(document.getElementById('bestsellerQuickViewModal'));
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

    decrementQuantity(productId) {
        const quantityInput = document.getElementById(`bestsellerQuickViewQuantityInput_${productId}`);
        if (quantityInput) {
            let currentValue = parseInt(quantityInput.value) || 0;
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                this.validateQuantity(productId);
            }
        }
    }

    incrementQuantity(productId) {
        const quantityInput = document.getElementById(`bestsellerQuickViewQuantityInput_${productId}`);
        if (quantityInput) {
            let currentValue = parseInt(quantityInput.value) || 0;
            const maxStock = parseInt(quantityInput.getAttribute('max')) || 10;
            const maxAllowed = Math.min(maxStock, 99);
            if (currentValue < maxAllowed) {
                quantityInput.value = currentValue + 1;
                this.validateQuantity(productId);
            }
        }
    }

    validateQuantity(productId) {
        const quantityInput = document.getElementById(`bestsellerQuickViewQuantityInput_${productId}`);
        const errorDiv = document.getElementById(`bestsellerQuickViewQuantityError_${productId}`);
        const errorMessage = document.getElementById(`bestsellerQuickViewQuantityErrorMessage_${productId}`);

        if (!quantityInput || !errorDiv || !errorMessage) return;

        const currentValue = parseInt(quantityInput.value) || 0;
        const maxStock = parseInt(quantityInput.getAttribute('max')) || 10;
        const maxAllowed = Math.min(maxStock, 99);

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
        const quantityInput = document.getElementById(`bestsellerQuickViewQuantityInput_${productId}`);
        if (quantityInput && (quantityInput.value === '' || quantityInput.value === '0')) {
            quantityInput.value = 1;
        }
        this.validateQuantity(productId);
    }

    async addToCart(productId, productName, price) {
        if (this.isAddingToCart) {
            return;
        }
        this.isAddingToCart = true;

        try {
            // Sử dụng addProductToCartBackend để gọi API backend
            if (window.app && window.app.addProductToCartBackend) {
                await window.app.addProductToCartBackend(productId, 1, false);
                await window.app.refreshCartBadge?.();
                if (window.cartPage && typeof window.cartPage.loadCartData === 'function') {
                    await window.cartPage.loadCartData();
                }
            } else {
                this.showNotification('Chức năng đang được tải...', 'error');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showNotification('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
        } finally {
            setTimeout(() => {
                this.isAddingToCart = false;
            }, 1000);
        }
    }

    addToCartWithQuantity(productId) {
        if (this.isAddingToCart) {
            return;
        }
        this.isAddingToCart = true;

        const product = this.allProducts.find(p => p.productId === productId);
        if (!product) {
            this.showNotification('Không tìm thấy sản phẩm', 'error');
            this.isAddingToCart = false;
            return;
        }

        const quantityInput = document.getElementById(`bestsellerQuickViewQuantityInput_${productId}`);
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        this.addToCartWithQuantityValue(productId, product.name, product.price, quantity);

        const modal = bootstrap.Modal.getInstance(document.getElementById('bestsellerQuickViewModal'));
        if (modal) {
            modal.hide();
        }

        setTimeout(() => {
            this.isAddingToCart = false;
        }, 1000);
    }

    async addToCartWithQuantityValue(productId, productName, price, quantity) {
        try {
            // Sử dụng addProductToCartBackend để gọi API backend
            if (window.app && window.app.addProductToCartBackend) {
                await window.app.addProductToCartBackend(productId, quantity, false);
                await window.app.refreshCartBadge?.();
                if (window.cartPage && typeof window.cartPage.loadCartData === 'function') {
                    await window.cartPage.loadCartData();
                }
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

        let container = document.querySelector('.bestseller-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'bestseller-toast-container';
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

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    formatCurrency(price) {
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

    showLoading() {
        this.loadingEl.classList.remove('d-none');
        this.emptyEl.classList.add('d-none');
        this.gridEl.innerHTML = '';
    }

    hideLoading() {
        this.loadingEl.classList.add('d-none');
    }

    showEmpty(message = 'Không tìm thấy sản phẩm bán chạy nào.') {
        this.hideLoading();
        this.emptyEl.querySelector('p').textContent = message;
        this.emptyEl.classList.remove('d-none');
    }

    hideEmpty() {
        this.emptyEl.classList.add('d-none');
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
document.addEventListener('DOMContentLoaded', () => {
    if (window.bestsellerProductsManager) {
        console.log('BestsellerProductsManager already exists');
    } else {
        window.bestsellerProductsManager = new BestsellerProductsManager();
        console.log('BestsellerProductsManager created successfully');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BestsellerProductsManager;
}