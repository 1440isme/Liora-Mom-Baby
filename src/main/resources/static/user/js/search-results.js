class SearchResultsManager {
    constructor() {
        this.currentQuery = '';
        this.currentPage = 0;
        this.pageSize = 12;
        this.currentProductId = null; // Track current product for quick view
        this.currentFilters = { minPrice: null, maxPrice: null, brands: [], ratings: [], sort: '' };
        this.products = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.init();
    }

    init() {
        this.parseUrl();
        this.bindEvents();
        this.loadBrands().finally(() => this.loadResults());
    }

    parseUrl() {
        const params = new URLSearchParams(window.location.search);
        this.currentQuery = params.get('q') || '';
        const qEl = document.getElementById('searchQueryDisplay');
        if (qEl) qEl.textContent = this.currentQuery;
    }

    bindEvents() {
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.addEventListener('change', () => {
            this.currentPage = 0;
            this.loadResults();
        });

        const applyFilters = document.getElementById('applyFilters');
        if (applyFilters) applyFilters.addEventListener('click', () => {
            this.applyFilters();
        });

        document.addEventListener('change', (e) => {
            if (e.target && e.target.closest && e.target.closest('#brandFilters')) this.onBrandChange(e);
            if (e.target && String(e.target.id || '').startsWith('rating')) this.onRatingChange(e);
        });
    }

    applyFilters() {
        console.log('applyFilters called');

        // Update filters from UI before applying
        this.updateFiltersFromUI();
        this.currentPage = 0;
        this.loadResults();
    }

    updateFiltersFromUI() {
        // Update price range filter
        const priceRange = document.getElementById('priceRange');
        if (priceRange && priceRange.value && priceRange.value.includes(',')) {
            const [minPrice, maxPrice] = priceRange.value.split(',').map(Number);
            this.currentFilters.minPrice = minPrice;
            this.currentFilters.maxPrice = maxPrice;
            console.log('Price filter set:', { minPrice, maxPrice });
        } else {
            this.currentFilters.minPrice = null;
            this.currentFilters.maxPrice = null;
        }

        // Update brand filters
        const brandCheckboxes = document.querySelectorAll('#brandFilters input[type="checkbox"]');
        this.currentFilters.brands = Array.from(brandCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        console.log('Selected brands:', this.currentFilters.brands);

        // Update rating filters
        const ratingCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="rating"]');
        this.currentFilters.ratings = Array.from(ratingCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value));
        console.log('Selected ratings:', this.currentFilters.ratings);

        // Update sort filter
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            this.currentFilters.sort = sortSelect.value || '';
        }

        console.log('Final filters:', this.currentFilters);
    }

    clearFilters() {
        // Reset all filters
        this.currentFilters = {
            minPrice: null,
            maxPrice: null,
            brands: [],
            ratings: [],
            sort: ''
        };

        // Reset UI elements
        const priceRangeSelect = document.getElementById('priceRange');
        if (priceRangeSelect) priceRangeSelect.value = '';

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.value = '';

        // Uncheck all brand checkboxes
        const brandCheckboxes = document.querySelectorAll('#brandFilters input[type="checkbox"]');
        brandCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Uncheck all rating checkboxes
        const ratingCheckboxes = document.querySelectorAll('input[id^="rating"]');
        ratingCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Reload results
        this.currentPage = 0;
        this.loadResults();
    }

    onBrandChange(e) {
        const el = e.target;
        if (!el || el.type !== 'checkbox') return;
        const val = String(el.value);
        const i = this.currentFilters.brands.indexOf(val);
        if (el.checked && i === -1) this.currentFilters.brands.push(val);
        if (!el.checked && i !== -1) this.currentFilters.brands.splice(i, 1);
    }

    onRatingChange(e) {
        const el = e.target;
        if (!el || el.type !== 'checkbox') return;
        const rating = parseInt(el.value, 10);
        if (isNaN(rating)) return;
        const i = this.currentFilters.ratings.indexOf(rating);
        if (el.checked && i === -1) this.currentFilters.ratings.push(rating);
        if (!el.checked && i !== -1) this.currentFilters.ratings.splice(i, 1);
    }

    async loadResults() {
        this.showLoading();
        try {
            // Ensure filters are up to date
            this.updateFiltersFromUI();

            const sortValue = (document.getElementById('sortSelect')?.value) || '';
            const [sortBy, sortDir] = sortValue ? sortValue.split(',') : ['', ''];
            const params = new URLSearchParams({ q: this.currentQuery, page: String(this.currentPage), size: String(this.pageSize) });
            if (sortBy) params.append('sortBy', sortBy);
            if (sortDir) params.append('sortDir', sortDir);

            // Add filters with proper validation
            if (this.currentFilters.minPrice != null && this.currentFilters.minPrice !== '' && this.currentFilters.minPrice >= 0) {
                params.append('minPrice', String(this.currentFilters.minPrice));
            }
            if (this.currentFilters.maxPrice != null && this.currentFilters.maxPrice !== '' && this.currentFilters.maxPrice > 0) {
                params.append('maxPrice', String(this.currentFilters.maxPrice));
            }
            if (this.currentFilters.brands && this.currentFilters.brands.length > 0) {
                params.append('brands', this.currentFilters.brands.join(','));
            }
            if (this.currentFilters.ratings && this.currentFilters.ratings.length > 0) {
                params.append('ratings', this.currentFilters.ratings.join(','));
            }

            const url = `/api/products/search?${params.toString()}`;
            console.log('Loading search results with URL:', url);
            console.log('Current filters:', this.currentFilters);

            const res = await fetch(url);
            if (!res.ok) {
                console.error('Search API Error:', res.status, res.statusText);
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            console.log('Search API Response:', data);

            if (data && (data.code === 1000 || data.code === 200)) {
                const result = data.result || {};
                const items = Array.isArray(result) ? result : (result.content || []);
                this.products = items || [];
                this.totalElements = Array.isArray(result) ? this.products.length : (result.totalElements || this.products.length);
                this.totalPages = Array.isArray(result) ? 1 : (result.totalPages || 1);

                if (this.products.length > 0) {
                    this.renderProducts();
                    this.updatePagination();
                    this.updateResultsCount();
                    this.hideLoading();
                } else {
                    this.showEmptyState();
                }
            } else {
                this.showEmptyState();
            }
        } catch (e) {
            console.error('Search load error:', e);
            this.showEmptyState();
        }
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const empty = document.getElementById('emptyState');
        if (!grid) return;

        // Hide empty state
        if (empty) {
            empty.style.display = 'none';
            empty.style.visibility = 'hidden';
        }

        // Show and configure grid
        grid.style.display = 'grid';
        grid.style.visibility = 'visible';
        grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        grid.style.gap = '0.8rem';
        grid.style.padding = '2rem 1rem';

        grid.innerHTML = this.products.map(p => this.createCard(p)).join('');

        // Trigger rating load sau khi render xong
        setTimeout(() => {
            if (window.loadProductRatings) {
                window.loadProductRatings();
            }
        }, 500);

        console.log(`Rendered ${this.products.length} search results`);
    }

    createCard(product) {
        const productId = product.productId || product.id;
        const name = product.name || 'Sản phẩm';
        const brandName = product.brandName || 'Thương hiệu';
        const brandId = product.brandId || '';
        const price = product.price || 0;
        const imageUrl = product.mainImageUrl || '/user/img/default-product.jpg';

        // Get product status and apply appropriate styling
        const productStatus = this.getProductStatus(product);
        const statusClass = this.getProductStatusClass(productStatus);
        const isAvailable = productStatus === 'available';

        return `
            <div class="product-card ${statusClass}" data-product-id="${productId}">
                <div class="position-relative">
                    <img src="${imageUrl}" class="card-img-top" alt="${name}" onerror="this.src='/user/img/default-product.jpg'"
                         style="cursor:pointer" onclick="window.location.href='/product/${productId}?from=search'">
                    <div class="product-actions">
                        <button class="quick-view-btn" title="Xem nhanh"
                            onclick="window.searchResultsManager && window.searchResultsManager.showQuickView(${productId})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title" title="${name}"><a href="/product/${productId}?from=search" class="text-decoration-none text-dark product-name-link">${name}</a></h6>
                    <p class="brand-name"><a href="/brand/${brandId}" class="text-decoration-none text-muted brand-link">${brandName}</a></p>
                    
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
                    
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="current-price">${this.formatPrice(price)}</span>
                        <button class="add-to-cart-icon ${!isAvailable ? 'disabled' : ''}" 
                                title="${productStatus === 'out_of_stock' ? 'Hết hàng' : productStatus === 'deactivated' ? 'Ngừng kinh doanh' : 'Thêm vào giỏ'}"
                                ${!isAvailable ? 'disabled' : ''}
                                onclick="event.preventDefault(); event.stopPropagation(); ${isAvailable ? `window.searchResultsManager.addToCart(${productId}, '${name.replace(/'/g, "\\'")}', ${price})` : ''}">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    }

    formatPrice(price) {
        const num = Number(price);
        if (!isFinite(num)) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
    }

    async addToCart(productId, productName, price) {
        try {
            if (window.app && typeof window.app.addProductToCartBackend === 'function') {
                await window.app.addProductToCartBackend(productId, 1, false);
                await window.app.refreshCartBadge?.();
                return;
            }
        } catch (e) { console.error('Add to cart error:', e); }
        alert('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
    }

    async showQuickView(productId) {
        this.currentProductId = productId; // Store current product ID
        const product = this.products.find(p => (p.productId || p.id) === productId);
        if (!product) return;
        if (!product.images && Array.isArray(product.imageUrls)) product.images = product.imageUrls.map(u => ({ imageUrl: u }));

        // Load review statistics before creating modal
        try {
            const statistics = await ProductRatingUtils.loadReviewStatistics([productId]);
            const productStats = statistics[productId.toString()];
            if (productStats) {
                product.averageRating = productStats.averageRating || 0;
                product.reviewCount = productStats.totalReviews || 0;
                console.log('Loaded rating data for modal:', product.averageRating, 'stars,', product.reviewCount, 'reviews');
            }
        } catch (error) {
            console.error('Error loading rating data:', error);
        }

        this.createQuickViewModal(product);
    }

    createQuickViewModal(product) {
        // Remove existing modal if any
        const existingModal = document.getElementById('quickViewModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="quickViewModal" tabindex="-1" aria-labelledby="quickViewModalLabel" aria-hidden="true" style="z-index: 9999 !important;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style="position: relative; z-index: 10000 !important;">
                        <div class="modal-header border-0">
                            <h5 class="modal-title" id="quickViewModalLabel">Xem nhanh sản phẩm</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <!-- Product Image Slider -->
                                <div class="col-md-6">
                                    <div class="product-image-slider">
                                        <!-- Main Image -->
                                        <div class="main-image-container position-relative mb-3">
                                            <img id="mainProductImage" 
                                                 src="${this.getMainImageUrl(product)}" 
                                                 class="img-fluid rounded" 
                                                 alt="${product.name}"
                                                 onerror="this.src='/user/img/default-product.jpg'">
                                            <button class="slider-nav slider-prev" id="searchPrevBtn">
                                                <i class="fas fa-chevron-left"></i>
                                            </button>
                                            <button class="slider-nav slider-next" id="searchNextBtn">
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
                                    <p class="brand-name text-muted mb-2">${product.brandName || 'Thương hiệu'}</p>
                                    
                                    <!-- Product Status -->
                                    <div class="product-status mb-3">
                                        ${this.getProductStatusBadge(product)}
                                        <span class="ms-2 text-muted">Mã sản phẩm: ${product.productId}</span>
                                    </div>
                                    
                                    <!-- Rating -->
                                    <div class="rating mb-3">
                                        <span class="stars">
                                            ${this.generateStarsForModal(product.averageRating || 0, product.reviewCount || 0)}
                                        </span>
                                        <span class="review-count ms-2">(${product.reviewCount || 0} đánh giá)</span>
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
                                    
                                    <!-- Price -->
                                    <div class="price-section mb-4">
                                        <span class="current-price h4 text-primary">
                                            ${this.formatPrice(product.price)}
                                        </span>
                                    </div>
                                    
                                    <!-- Quantity Selector -->
                                    <div class="quantity-selector mb-4">
                                        <div class="d-flex align-items-center">
                                            <label class="form-label mb-0" style="margin-right: 2rem;">Số lượng:</label>
                                            <div class="input-group" style="max-width: 150px;">
                                                <button class="btn btn-outline-secondary" type="button" onclick="app.decrementQuantity()">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="quantityInput" onchange="app.validateQuantity()" oninput="app.validateQuantity()" onblur="app.validateQuantityOnBlur()">
                                                <button class="btn btn-outline-secondary" type="button" onclick="app.incrementQuantity()">+</button>
                                            </div>
                                        </div>
                                        <!-- Error Message -->
                                        <div id="quantityError" class="text-danger mt-2" style="display: none;">
                                            <i class="fas fa-info-circle me-1"></i>
                                            <span id="quantityErrorMessage">Số lượng tối đa bạn có thể mua là ${Math.min(product.stock || 10, 99)}.</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Actions -->
                                    <div class="d-grid gap-2">
                                        ${this.getQuickViewActions(product, this.currentProductId)}
                                        
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
        const modal = new bootstrap.Modal(document.getElementById('quickViewModal'), {
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
            ProductRatingUtils.updateQuickViewReviewData(product.productId);
        }, 200);

        // Remove modal from DOM when hidden
        document.getElementById('quickViewModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    // Helpers for Quick View
    getMainImageUrl(product) {
        if (product && product.mainImageUrl) return product.mainImageUrl;
        if (product && Array.isArray(product.images) && product.images.length > 0) {
            const first = product.images[0];
            return (first && (first.imageUrl || first)) || '/user/img/default-product.jpg';
        }
        return '/user/img/default-product.jpg';
    }

    generateImageThumbnails(product) {
        let images = [];
        if (product && Array.isArray(product.images) && product.images.length > 0) {
            images = product.images;
        } else if (product && product.mainImageUrl) {
            images = [{ imageUrl: product.mainImageUrl }];
        } else {
            images = [{ imageUrl: '/user/img/default-product.jpg' }];
        }
        return images.map((img, idx) => `
            <div class="thumbnail-item ${idx === 0 ? 'active' : ''}" style="cursor:pointer;">
                <img src="${img.imageUrl || img}" class="thumbnail-img" alt="${product.name}" onerror="this.src='/user/img/default-product.jpg'" style="width:60px;height:60px;object-fit:cover;border:1px solid #e0e0e0;border-radius:4px;${idx === 0 ? 'border-width:2px;' : ''}"/>
            </div>
        `).join('');
    }

    getProductStatus(product) {
        if (!product) return 'out_of_stock';

        // 1. Kiểm tra ngừng kinh doanh (ưu tiên cao nhất)
        // Bao gồm: sản phẩm bị ngừng, category bị ngừng, hoặc brand bị ngừng
        // (Khi category/brand bị ngừng, tất cả sản phẩm thuộc sẽ có isActive = false)
        if (product.deactivated || product.isActive === false) {
            return 'deactivated';
        }

        // 2. Kiểm tra hết hàng (chỉ khi sản phẩm còn active)
        if (product.available === false) {
            return 'out_of_stock';
        }
        if (typeof product.stock === 'number' && product.stock <= 0) {
            return 'out_of_stock';
        }

        // 3. Còn hàng (isActive = true và stock > 0)
        return 'available';
    }

    getProductStatusClass(status) {
        switch (status) {
            case 'deactivated':
                return 'product-deactivated';
            case 'out_of_stock':
                return 'product-out-of-stock';
            default:
                return '';
        }
    }

    getProductStatusBadge(product) {
        const status = this.getProductStatus(product);
        if (status === 'deactivated') return '<span class="badge bg-warning text-dark">Ngừng kinh doanh</span>';
        if (status === 'out_of_stock') return '<span class="badge bg-danger">Hết hàng</span>';
        return '<span class="badge bg-success">Còn hàng</span>';
    }

    generateStarsForModal(rating, reviewCount = 0) {
        console.log('generateStarsForModal called with rating:', rating, 'type:', typeof rating);

        // Logic đúng cho Quick View modal
        if (!rating || rating === 0 || rating === '0' || rating === null || rating === undefined) {
            let stars = '';
            for (let i = 0; i < 5; i++) {
                stars += '<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>';
            }
            return stars;
        }

        console.log('Modal: Rating is not 0, showing stars based on rating:', rating);
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

    getQuickViewActions(product, productId) {
        const status = this.getProductStatus(product);
        const isDisabled = status !== 'available';

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
            <!-- Buy Now & Add to Cart Buttons (Same Row) -->
            <div class="row g-2">
                <div class="col-6">
                    <button class="btn btn-danger btn-lg w-100" 
                            onclick="window.searchResultsManager.buyNow(${productId})">
                        <i class="fas fa-bolt me-1"></i>
                        Mua ngay
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="window.searchResultsManager.addToCartWithQuantity(${productId})">
                        <i class="fas fa-shopping-cart me-1"></i>
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;
    }


    setupSliderNavigation(product) {
        const prevBtn = document.getElementById('searchPrevBtn');
        const nextBtn = document.getElementById('searchNextBtn');
        const mainImage = document.getElementById('mainProductImage');
        const thumbnails = document.querySelectorAll('.thumbnail-item');

        if (!product || !Array.isArray(product.images) || product.images.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            return;
        }

        let currentImageIndex = 0;

        const updateMainImage = (index) => {
            if (product.images && product.images[index]) {
                const image = product.images[index];
                // Handle both object format {imageUrl: '...'} and string format '...'
                mainImage.src = image.imageUrl || image;
                mainImage.alt = product.name;

                // Update thumbnail selection
                thumbnails.forEach((thumb, i) => {
                    thumb.classList.toggle('active', i === index);
                    const thumbnailImg = thumb.querySelector('img');
                    if (thumbnailImg) {
                        thumbnailImg.style.borderWidth = i === index ? '2px' : '1px';
                    }
                });
            }
        };

        // Previous button
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : product.images.length - 1;
                updateMainImage(currentImageIndex);
            });
        }

        // Next button
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentImageIndex = currentImageIndex < product.images.length - 1 ? currentImageIndex + 1 : 0;
                updateMainImage(currentImageIndex);
            });
        }

        // Thumbnail click handlers
        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                currentImageIndex = index;
                updateMainImage(currentImageIndex);
            });
        });

        // Initialize with first image
        updateMainImage(0);
    }

    // Add to cart with quantity
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

    // Buy now
    async buyNow(productId) {
        let product = null;
        if (this.products && this.products.length > 0) {
            product = this.products.find(p => p.productId === productId);
        }
        if (!product) {
            try {
                const response = await fetch(`/api/products/${productId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.code === 200 || data.code === 1000) {
                        product = data.result;
                    }
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        }

        if (!product) {
            this.showNotification('Không tìm thấy sản phẩm!', 'error');
            return;
        }

        // Lấy số lượng từ input trong QuickView
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? (parseInt(quantityInput.value) || 1) : 1;

        // Đóng modal trước khi chuyển trang
        const modal = bootstrap.Modal.getInstance(document.getElementById('quickViewModal'));
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

    showNotification(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        // Add to page
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(container);
        }
        container.appendChild(toast);

        // Show toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Auto remove
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    // Helper method to format numbers (e.g., 1000 -> 1.000)
    formatNumber(number) {
        return new Intl.NumberFormat('vi-VN').format(number);
    }

    // Helper method to calculate sales progress percentage
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

    async buyNow(productId) {
        const i = document.getElementById('quickQty');
        const quantity = i ? (parseInt(i.value || '1', 10) || 1) : 1;
        const modalEl = document.getElementById('quickViewModal');
        const bs = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
        if (bs) bs.hide();
        if (window.app && typeof window.app.buyNowBackend === 'function') {
            try { await window.app.buyNowBackend(productId, quantity); } catch (e) { console.error('buyNow error', e); alert('Không thể thực hiện Mua ngay. Vui lòng thử lại.'); }
        } else { alert('Chức năng đang được tải...'); }
    }

    async addToCartWithQuantity(productId) {
        const i = document.getElementById('quickQty');
        const quantity = i ? (parseInt(i.value || '1', 10) || 1) : 1;
        try {
            if (window.app && typeof window.app.addProductToCartBackend === 'function') {
                await window.app.addProductToCartBackend(productId, quantity, false);
                await window.app.refreshCartBadge?.();
            } else { alert('Chức năng đang được tải...'); }
        } catch (e) { console.error('add to cart error', e); alert('Không thể thêm vào giỏ hàng. Vui lòng thử lại.'); }
        const modalEl = document.getElementById('quickViewModal');
        const bs = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
        if (bs) bs.hide();
    }

    showLoading() { const l = document.getElementById('loadingSpinner'); const g = document.getElementById('productsGrid'); const e = document.getElementById('emptyState'); if (l) l.style.display = 'block'; if (g) g.style.display = 'none'; if (e) e.style.display = 'none'; }
    hideLoading() { const l = document.getElementById('loadingSpinner'); const g = document.getElementById('productsGrid'); if (l) l.style.display = 'none'; if (g) g.style.display = 'block'; }
    showEmptyState() {
        const l = document.getElementById('loadingSpinner');
        const g = document.getElementById('productsGrid');
        const e = document.getElementById('emptyState');

        // Hide loading spinner
        if (l) l.style.display = 'none';

        // Hide products grid completely
        if (g) {
            g.style.display = 'none';
            g.style.visibility = 'hidden';
            g.innerHTML = ''; // Clear any existing content
        }

        // Show empty state
        if (e) {
            e.style.display = 'block';
            e.style.visibility = 'visible';
        }

        this.updateResultsCount();

        // Hide pagination when no products
        this.updatePagination();

        console.log('Empty state shown - no search results match filters');
    }

    updatePagination() {
        const pagination = document.getElementById('pagination'); if (!pagination) return; if (this.totalPages <= 1) { pagination.style.display = 'none'; return; }
        pagination.style.display = 'block'; const ul = pagination.querySelector('.pagination'); if (!ul) return; let html = '';
        const prevDisabled = this.currentPage === 0 ? 'disabled' : '';
        html += `<li class="page-item ${prevDisabled}"><a class="page-link" href="#" onclick="window.searchResultsManager.goToPage(${this.currentPage - 1}); return false;"><i class=\"fas fa-chevron-left\"></i></a></li>`;
        const start = Math.max(0, this.currentPage - 2); const end = Math.min(this.totalPages - 1, this.currentPage + 2);
        for (let i = start; i <= end; i++) { const active = i === this.currentPage ? 'active' : ''; html += `<li class=\"page-item ${active}\"><a class=\"page-link\" href=\"#\" onclick=\"window.searchResultsManager.goToPage(${i}); return false;\">${i + 1}</a></li>`; }
        const nextDisabled = this.currentPage >= this.totalPages - 1 ? 'disabled' : '';
        html += `<li class=\"page-item ${nextDisabled}\"><a class=\"page-link\" href=\"#\" onclick=\"window.searchResultsManager.goToPage(${this.currentPage + 1}); return false;\"><i class=\"fas fa-chevron-right\"></i></a></li>`;
        ul.innerHTML = html;
    }

    goToPage(page) { if (page < 0 || page >= this.totalPages) return; this.currentPage = page; this.loadResults(); }

    updateResultsCount() {
        const el = document.getElementById('resultsCount');
        if (!el) return;

        // Use totalElements for consistency with pagination
        const n = this.totalElements || 0;
        el.textContent = `Hiển thị ${n} sản phẩm`;
        console.log(`Updated search results count: ${n} total products`);
    }

    async loadBrands() {
        try {
            const url = this.currentQuery ? `/api/products/search-brands?q=${encodeURIComponent(this.currentQuery)}` : '/api/products/search-brands';
            const res = await fetch(url);
            const data = res.ok ? await res.json() : null;
            const brands = (data && (data.code === 1000 || data.code === 200) && data.result) ? data.result : [];
            const el = document.getElementById('brandFilters'); if (!el) return;
            if (!brands || brands.length === 0) { el.innerHTML = '<p class="text-muted">Không có thương hiệu nào</p>'; return; }
            el.innerHTML = brands.map(b => `<div class=\"form-check mb-2\"><input class=\"form-check-input\" type=\"checkbox\" value=\"${b.brandId}\" id=\"brand-${b.brandId}\"><label class=\"form-check-label\" for=\"brand-${b.brandId}\">${b.name || b.brandName}</label></div>`).join('');
        } catch (_) { }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.searchResultsManager = new SearchResultsManager();
});


