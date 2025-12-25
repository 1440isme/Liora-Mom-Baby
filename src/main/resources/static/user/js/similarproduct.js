/**
 * Similar Products Manager
 * Handles loading and displaying similar products
 */
class SimilarProductsManager {
    constructor(productId) {
        this.productId = productId;
        this.loadingEl = document.getElementById('loadingSpinner');
        this.emptyEl = document.getElementById('emptyState');
        this.gridEl = document.getElementById('productsGrid');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.currentPage = 0;
        this.productsPerPage = 12; // Show more products in grid layout
        this.allProducts = [];
        this.isAddingToCart = false;
        this.isLoading = false;
        this.currentFilters = {
            minPrice: '',
            maxPrice: '',
            brands: [],
            ratings: [],
            sort: ''
        };
        
        // Add caching
        this.cache = new Map();
        this.cacheTimeout = 180000; // 3 minutes - giảm để cache fresh hơn
        
        // Add request debouncing
        this.loadTimeout = null;

        this.init();
    }

    async init() {
        if (!this.productId) {
            return;
        }

        console.log('=== SIMILAR PRODUCTS MANAGER INIT ===');
        console.log('Product ID:', this.productId);
        console.log('Current filters:', this.currentFilters);

        this.setupEventListeners();
        this.loadBrands();
        await this.loadSimilarProducts();

        console.log('=== INIT COMPLETED ===');
    }

    setupEventListeners() {
        // Sort dropdown
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.currentPage = 0;
                this.loadSimilarProducts();
            });
        }

        // Price range filter
        const priceRangeSelect = document.getElementById('priceRange');
        if (priceRangeSelect) {
            priceRangeSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                if (value) {
                    const [min, max] = value.split(',').map(Number);
                    this.currentFilters.minPrice = min;
                    this.currentFilters.maxPrice = max;
                } else {
                    this.currentFilters.minPrice = '';
                    this.currentFilters.maxPrice = '';
                }
                this.currentPage = 0;
                this.loadSimilarProducts();
            });
        }

        // Rating checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('rating-filter')) {
                this.updateRatingFilter();
                this.currentPage = 0;
                this.loadSimilarProducts();
            }
        });

        // Brand checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('brand-filter')) {
                this.updateBrandFilter();
                this.currentPage = 0;
                this.loadSimilarProducts();
            }
        });

        // Apply filters button
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', this.applyFilters.bind(this));
        }

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadSimilarProducts();
                }
            }
        });
    }

    updateRatingFilter() {
        const checkedRatings = document.querySelectorAll('.rating-filter:checked');
        this.currentFilters.ratings = Array.from(checkedRatings).map(cb => parseInt(cb.value));
    }

    updateBrandFilter() {
        const checkedBrands = document.querySelectorAll('.brand-filter:checked');
        this.currentFilters.brands = Array.from(checkedBrands).map(cb => cb.value);
        console.log('🔍 Updated brand filters:', this.currentFilters.brands);
    }

    async loadBrands() {
        try {
            console.log('🔍 Loading brands for similar products...');
            const response = await fetch(`/api/products/${this.productId}/similar-brands`);
            const data = await response.json();

            console.log('🔍 Similar brands API response:', data);

            if (data.code === 1000 && data.result) {
                const brandFiltersContainer = document.getElementById('brandFilters');
                if (brandFiltersContainer) {
                    brandFiltersContainer.innerHTML = data.result.map(brand => `
                        <div class="form-check">
                            <input class="form-check-input brand-filter" type="checkbox" value="${brand.name}" id="brand${brand.brandId}">
                            <label class="form-check-label" for="brand${brand.brandId}">${brand.name}</label>
                        </div>
                    `).join('');
                    console.log('🔍 Loaded similar product brands:', data.result.length);
                } else {
                    console.error('🔍 Brand filters container not found');
                }
            } else {
                console.error('🔍 Similar brands API error:', data);
            }
        } catch (error) {
            console.error('🔍 Error loading similar product brands:', error);
        }
    }

    applyFilters() {
        console.log('=== CLEAR FILTERS CALLED ===');

        // Clear all filter values
        const priceRange = document.getElementById('priceRange');
        const ratingCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="rating"]');
        const brandCheckboxes = document.querySelectorAll('.brand-filter');

        // Clear price filter
        if (priceRange) {
            priceRange.value = '';
        }
        this.currentFilters.minPrice = '';
        this.currentFilters.maxPrice = '';

        // Clear rating filter
        ratingCheckboxes.forEach(cb => cb.checked = false);
        this.currentFilters.ratings = [];

        // Clear brand filter
        brandCheckboxes.forEach(cb => cb.checked = false);
        this.currentFilters.brands = [];

        console.log('🔍 All filters cleared');
        console.log('Final filters:', this.currentFilters);
        this.currentPage = 0;
        
        // Debounce API calls để tránh spam requests
        if (this.loadTimeout) {
            clearTimeout(this.loadTimeout);
        }
        
        this.loadTimeout = setTimeout(() => {
            this.loadSimilarProducts();
        }, 300); // 300ms debounce
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

        // Update button states after scroll
        setTimeout(() => this.updateNavigationButtons(), 300);
    }

    updateNavigationButtons() {
        const navigationContainer = document.querySelector('.navigation-buttons');


        // Show navigation buttons only when there are more than 4 products
        if (this.allProducts && this.allProducts.length > 4) {
            if (navigationContainer) {
                navigationContainer.classList.remove('hidden');
            }

            // Check scroll position for button states
            const isAtStart = this.gridEl.scrollLeft <= 0;
            const isAtEnd = this.gridEl.scrollLeft >= (this.gridEl.scrollWidth - this.gridEl.clientWidth - 1);


            if (this.prevBtn) {
                this.prevBtn.disabled = isAtStart;
            }
            if (this.nextBtn) {
                this.nextBtn.disabled = isAtEnd;
            }
        } else {
            // Hide navigation if 4 or fewer products
            if (navigationContainer) {
                navigationContainer.classList.add('hidden');
            }
        }
    }

    renderCurrentPage() {
        // For horizontal carousel, render all products at once
        this.renderSimilarProducts(this.allProducts);
    }

    async loadSimilarProducts() {
        if (this.isLoading) return;

        // Create cache key
        const cacheKey = `${this.productId}_${JSON.stringify(this.currentFilters)}_${this.currentPage}`;
        
        // Check cache first
        const cachedData = this.getCachedData(cacheKey);
        if (cachedData) {
            console.log('🔍 Using cached data for similar products');
            this.allProducts = cachedData.content;
            this.totalPages = cachedData.totalPages;
            this.renderSimilarProducts(this.allProducts);
            this.renderPagination();
            return;
        }

        this.isLoading = true;
        this.showLoading();

        try {
            // Build query parameters with timeout
            const params = new URLSearchParams();
            params.append('size', '8'); // Giảm xuống 8 để load nhanh hơn
            params.append('page', this.currentPage.toString());

            // Add filters
            if (this.currentFilters.minPrice) {
                params.append('minPrice', this.currentFilters.minPrice);
            }
            if (this.currentFilters.maxPrice) {
                params.append('maxPrice', this.currentFilters.maxPrice);
            }
            if (this.currentFilters.brands.length > 0) {
                params.append('brands', this.currentFilters.brands.join(','));
            }
            if (this.currentFilters.ratings.length > 0) {
                params.append('ratings', this.currentFilters.ratings.join(','));
            }
            if (this.currentFilters.sort) {
                const [sortBy, sortDir] = this.currentFilters.sort.split(',');
                params.append('sortBy', sortBy);
                params.append('sortDir', sortDir);
            }

            const url = `/api/products/${this.productId}/similar?${params.toString()}`;
            console.log('🔍 API URL:', url);

            // Add timeout to prevent hanging - giảm timeout để fail fast
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            console.log('🔍 API Response:', data);

            if (data.code === 1000 && data.result && data.result.content.length > 0) {
                this.allProducts = data.result.content;
                this.totalPages = data.result.totalPages;
                
                // Cache the result
                this.setCachedData(cacheKey, {
                    content: this.allProducts,
                    totalPages: this.totalPages,
                    timestamp: Date.now()
                });
                
                this.renderSimilarProducts(this.allProducts);
                this.renderPagination();
                console.log('🔍 Loaded products:', this.allProducts.length);
            } else {
                console.log('🔍 No products found or API error:', data);
                this.showEmpty();
            }
        } catch (error) {
            console.error('🔍 Error loading similar products:', error);
            
            // Handle different error types
            if (error.name === 'AbortError') {
                this.showEmpty('Tải sản phẩm tương tự quá lâu. Vui lòng thử lại.');
            } else if (error.message.includes('HTTP error')) {
                this.showEmpty('Lỗi kết nối. Vui lòng thử lại.');
            } else {
                this.showEmpty('Lỗi khi tải sản phẩm tương tự');
            }
        } finally {
            this.isLoading = false;
        }
    }

    renderSimilarProducts(products) {
        this.hideLoading();
        this.hideEmpty();
        this.hideSkeletonLoading(); // Ẩn skeleton loading

        const productsHTML = products.map(product => this.createProductCard(product)).join('');
        this.gridEl.innerHTML = productsHTML;
        this.gridEl.style.display = 'grid';

        // Add class để ẩn skeleton loading
        document.body.classList.add('products-loaded');

        // Update results count
        const resultsCountEl = document.getElementById('resultsCount');
        if (resultsCountEl) {
            resultsCountEl.textContent = `Hiển thị ${products.length} sản phẩm`;
        }

        // Load product ratings immediately - không delay để load nhanh hơn
        this.loadProductRatingsOptimized();
    }

    renderPagination() {
        const paginationEl = document.getElementById('pagination');
        if (!paginationEl || this.totalPages <= 1) {
            if (paginationEl) {
                paginationEl.style.display = 'none';
            }
            return;
        }

        let paginationHTML = '<ul class="pagination justify-content-center">';

        // Previous button
        if (this.currentPage > 0) {
            paginationHTML += `<li class="page-item">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">Trước</a>
            </li>`;
        }

        // Page numbers
        const startPage = Math.max(0, this.currentPage - 2);
        const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<li class="page-item ${i === this.currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
            </li>`;
        }

        // Next button
        if (this.currentPage < this.totalPages - 1) {
            paginationHTML += `<li class="page-item">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">Sau</a>
            </li>`;
        }

        paginationHTML += '</ul>';
        paginationEl.innerHTML = paginationHTML;
        paginationEl.style.display = 'block';
    }

    createProductCard(product) {
        const productStatus = this.getProductStatus(product);
        const statusClass = this.getProductStatusClass(productStatus);

        return `
            <div class="product-card ${statusClass}" data-product-id="${product.productId}">
                <div class="position-relative">
                    <img src="${this.getMainImageUrl(product)}" 
                         class="card-img-top" 
                         alt="${product.name}"
                         onerror="this.src='/user/img/default-product.jpg'"
                         onclick="window.location.href='/product/${product.productId}?from=similar&productId=${this.productId}'"
                         style="cursor: pointer;"
                         loading="lazy">
                    
                    <div class="product-actions">
                        <button class="quick-view-btn" 
                                onclick="if(window.similarProductsManager) window.similarProductsManager.showQuickView(${product.productId}); else alert('Chức năng đang được tải...');"
                                title="Xem nhanh">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title" title="${product.name}">
                        <a href="/product/${product.productId}?from=similar&productId=${this.productId}" class="text-decoration-none text-dark product-name-link">
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
                    
                    <div class="mt-auto">
                        <div class="price-section d-flex justify-content-between align-items-center">
                            <span class="current-price">
                                ${this.formatPrice(product.price)}
                            </span>
                            <button class="add-to-cart-icon similar-products-cart-btn" 
                                    data-product-id="${product.productId}"
                                    data-product-name="${product.name}"
                                    data-product-price="${product.price}"
                                    title="Thêm vào giỏ"
                                    onclick="event.preventDefault(); event.stopPropagation(); window.similarProductsManager.addToCart(${product.productId}, '${product.name}', ${product.price})">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getProductStatus(product) {
        // 1. Kiểm tra ngừng kinh doanh (ưu tiên cao nhất)
        if (!product.available || !product.isActive) {
            return 'deactivated';
        }

        // 2. Kiểm tra hết hàng (chỉ khi sản phẩm còn active)
        if (product.stock === 0 || product.stock === null || product.stock <= 0) {
            return 'out_of_stock';
        }

        // 3. Sản phẩm có sẵn
        return 'available';
    }

    getProductStatusClass(status) {
        switch (status) {
            case 'deactivated': return 'product-deactivated';
            case 'out_of_stock': return 'product-out-of-stock';
            case 'available':
            default: return 'product-available';
        }
    }

    // Get main image URL - đồng nhất với các trang khác
    getMainImageUrl(product) {
        if (product.images && product.images.length > 0) {
            return product.images[0].imageUrl || product.images[0];
        }
        return product.mainImageUrl || '/user/img/default-product.jpg';
    }

    renderStars(rating, reviewCount = 0) {

        // Logic đúng cho product card - giống generateStarsForModal
        // Chỉ hiển thị sao rỗng khi rating = 0 hoặc không có rating
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

        this.createQuickViewModal(product);
    }

    // Create quick view modal
    createQuickViewModal(product) {
        // Remove existing modal if any
        const existingModal = document.getElementById('quickViewModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="quickViewModal" tabindex="-1" aria-labelledby="quickViewModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
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
                                        <div class="main-image-container mb-3">
                                            <button class="slider-nav slider-prev" id="modalPrevBtn">
                                                <i class="fas fa-chevron-left"></i>
                                            </button>
                                            <img id="modalMainProductImage" 
                                                 src="${this.getMainImageUrl(product)}" 
                                                 class="img-fluid rounded" 
                                                 alt="${product.name}"
                                                 onerror="this.src='/uploads/products/default.jpg'">
                                            <button class="slider-nav slider-next" id="modalNextBtn">
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
                                        <a href="/product/${product.productId}?from=similar&productId=${this.productId}" class="text-decoration-none text-dark">
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
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.similarProductsManager.decrementQuantity('${product.productId}')">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="quickViewQuantityInput_${product.productId}" onchange="window.similarProductsManager.validateQuantity('${product.productId}')" oninput="window.similarProductsManager.validateQuantity('${product.productId}')" onblur="window.similarProductsManager.validateQuantityOnBlur('${product.productId}')">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.similarProductsManager.incrementQuantity('${product.productId}')">+</button>
                                            </div>
                                        </div>
                                        <!-- Error Message -->
                                        <div id="quickViewQuantityError_${product.productId}" class="text-danger mt-2" style="display: none;">
                                            <i class="fas fa-info-circle me-1"></i>
                                            <span id="quickViewQuantityErrorMessage_${product.productId}">Số lượng tối đa bạn có thể mua là ${Math.min(product.stock || 10, 99)}.</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Actions -->
                                    <div class="d-grid gap-2">
                                        ${this.getQuickViewActions(product)}
                                        
                                        <!-- View Details Button -->
                                        <a href="/product/${product.productId}?from=similar&productId=${this.productId}" 
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

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('quickViewModal'));
        modal.show();

        // Add slider navigation event listeners
        this.setupSliderNavigation(product);

        // Update review data after modal is shown
        setTimeout(() => {
            console.log('🔍 Updating quick view rating for product:', product.productId);
            if (window.ProductRatingUtils) {
                console.log('🔍 Calling ProductRatingUtils.updateQuickViewReviewData...');
                window.ProductRatingUtils.updateQuickViewReviewData(product.productId, 'quickViewModal');
            } else {
                console.log('🔍 ProductRatingUtils not available for quick view, using fallback...');
                this.loadQuickViewRatingFallback(product.productId);
            }
        }, 200);

        // Remove modal from DOM when hidden
        document.getElementById('quickViewModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    // Get main image URL
    getMainImageUrl(product) {
        if (product.images && product.images.length > 0) {
            return product.images[0].imageUrl;
        }
        return product.mainImageUrl || '/uploads/products/default.jpg';
    }

    // Generate image thumbnails for modal
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

    // Generate thumbnail images (for old compatibility)
    generateThumbnails(product) {
        if (!product.images || product.images.length === 0) {
            return `
                <div class="col-3">
                    <div class="thumbnail-item active" data-image="${product.mainImageUrl || '/uploads/products/default.jpg'}">
                        <img src="${product.mainImageUrl || '/uploads/products/default.jpg'}" 
                             class="img-fluid rounded thumbnail-img" 
                             alt="${product.name}">
                    </div>
                </div>
            `;
        }

        return product.images.map((image, index) => `
            <div class="col-3">
                <div class="thumbnail-item ${index === 0 ? 'active' : ''}" data-image="${image.imageUrl}">
                    <img src="${image.imageUrl}" 
                         class="img-fluid rounded thumbnail-img" 
                         alt="${product.name}">
                </div>
            </div>
        `).join('');
    }

    // Get product status
    getProductStatus(product) {
        if (!product.available) {
            return 'deactivated';
        }
        if (product.stock === 0 || product.stock === null) {
            return 'out_of_stock';
        }
        return 'available';
    }

    // Get product status badge
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

    // Get quick view actions
    getQuickViewActions(product) {
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
                            onclick="window.similarProductsManager.buyNow(${product.productId})">
                        <i class="fas fa-bolt me-1"></i>
                        Mua ngay
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="event.preventDefault(); event.stopPropagation(); window.similarProductsManager.addToCartWithQuantity(${product.productId})">
                        <i class="fas fa-shopping-cart me-1"></i>
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;
    }

    // Generate stars for modal
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

    // Format number
    formatNumber(number) {
        return new Intl.NumberFormat('vi-VN').format(number);
    }

    // Calculate sales progress - đồng nhất với product-detail.js
    calculateSalesProgress(soldCount) {
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
    }

    // Setup slider navigation
    setupSliderNavigation(product) {
        // Wait for modal to be fully rendered
        setTimeout(() => {
            const prevBtn = document.getElementById('modalPrevBtn');
            const nextBtn = document.getElementById('modalNextBtn');
            const mainImage = document.getElementById('modalMainProductImage');
            const thumbnails = document.querySelectorAll('.thumbnail-item');

            console.log('Setting up slider navigation:', {
                prevBtn: !!prevBtn,
                nextBtn: !!nextBtn,
                mainImage: !!mainImage,
                thumbnails: thumbnails.length,
                productImages: product.images ? product.images.length : 0
            });

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

    // Buy now functionality - chuẩn từ bestseller-products.js
    async buyNow(productId) {
        const product = this.allProducts.find(p => p.productId === productId);
        if (!product) {
            this.showNotification('Không tìm thấy sản phẩm!', 'error');
            return;
        }

        // Lấy số lượng từ input trong QuickView
        const quantityInput = document.getElementById(`quickViewQuantityInput_${productId}`);
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

    // Quantity management methods for quick view modal
    decrementQuantity(productId) {
        const quantityInput = document.getElementById(`quickViewQuantityInput_${productId}`);
        if (quantityInput) {
            let currentValue = parseInt(quantityInput.value) || 0;
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                this.validateQuantity(productId);
            }
        }
    }

    incrementQuantity(productId) {
        const quantityInput = document.getElementById(`quickViewQuantityInput_${productId}`);
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
        const quantityInput = document.getElementById(`quickViewQuantityInput_${productId}`);
        const errorDiv = document.getElementById(`quickViewQuantityError_${productId}`);
        const errorMessage = document.getElementById(`quickViewQuantityErrorMessage_${productId}`);

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
        const quantityInput = document.getElementById(`quickViewQuantityInput_${productId}`);
        if (quantityInput && (quantityInput.value === '' || quantityInput.value === '0')) {
            quantityInput.value = 1;
        }
        this.validateQuantity(productId);
    }


    // Add to cart functionality
    async addToCart(productId, productName, price) {
        // Prevent duplicate calls
        if (this.isAddingToCart) {
            return;
        }
        this.isAddingToCart = true;

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
        } finally {
            // Reset flag after a delay
            setTimeout(() => {
                this.isAddingToCart = false;
            }, 1000);
        }
    }

    // Add to cart with quantity
    addToCartWithQuantity(productId) {
        // Prevent duplicate calls
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

        // Get quantity from input using unique ID
        const quantityInput = document.getElementById(`quickViewQuantityInput_${productId}`);
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        // Add to cart with quantity
        this.addToCartWithQuantityValue(productId, product.name, product.price, quantity);

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('quickViewModal'));
        if (modal) {
            modal.hide();
        }

        // Reset flag after a delay
        setTimeout(() => {
            this.isAddingToCart = false;
        }, 1000);
    }

    // Add to cart with specific quantity
    async addToCartWithQuantityValue(productId, productName, price, quantity) {
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

    // Show notification - đồng bộ với category-products
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
        }, 3000);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    showLoading() {
        // Hiển thị skeleton loading thay vì chỉ spinner
        this.showSkeletonLoading();
        
        if (this.loadingEl) {
            this.loadingEl.style.display = 'block';
        }
        if (this.emptyEl) {
            this.emptyEl.style.display = 'none';
        }
        if (this.gridEl) {
            this.gridEl.style.display = 'none';
            this.gridEl.innerHTML = '';
        }
        
        // Show loading message
        console.log('🔍 Loading similar products...');
    }

    hideLoading() {
        if (this.loadingEl) {
            this.loadingEl.style.display = 'none';
        }
    }

    showEmpty(message = 'Không tìm thấy sản phẩm tương tự nào.') {
        this.hideLoading();
        if (this.emptyEl) {
            const messageEl = this.emptyEl.querySelector('p');
            if (messageEl) {
                messageEl.textContent = message;
            }
            this.emptyEl.style.display = 'block';
        }
        if (this.gridEl) {
            this.gridEl.style.display = 'none';
        }
    }

    hideEmpty() {
        if (this.emptyEl) {
            this.emptyEl.style.display = 'none';
        }
    }

    hideSkeletonLoading() {
        const skeletonEl = document.getElementById('skeletonLoading');
        if (skeletonEl) {
            skeletonEl.style.display = 'none';
        }
    }

    showSkeletonLoading() {
        const skeletonEl = document.getElementById('skeletonLoading');
        if (skeletonEl) {
            skeletonEl.style.display = 'block';
        }
    }

    // Cache helper methods
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached;
        }
        if (cached) {
            this.cache.delete(key); // Remove expired cache
        }
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, data);
        
        // Clean up old cache entries if cache gets too large
        if (this.cache.size > 50) {
            const keys = Array.from(this.cache.keys());
            for (let i = 0; i < 10; i++) {
                this.cache.delete(keys[i]);
            }
        }
    }

    clearCache() {
        this.cache.clear();
        console.log('🔍 Similar products cache cleared');
    }

    // Optimized method to load product ratings
    loadProductRatingsOptimized() {
        console.log('🔍 Loading product ratings for similar products (optimized)...');
        
        const productCards = this.gridEl.querySelectorAll('.product-card');
        console.log('🔍 Found product cards:', productCards.length);
        
        if (productCards.length === 0) {
            console.log('🔍 No product cards found, skipping rating load');
            return;
        }
        
        // Chỉ dùng một phương pháp để tránh duplicate calls
        if (window.ProductRatingUtils) {
            console.log('🔍 Using ProductRatingUtils for rating loading...');
            window.ProductRatingUtils.loadAndUpdateProductCards(productCards);
        } else {
            console.log('🔍 ProductRatingUtils not available, using fallback...');
            this.loadProductRatingsFallback(productCards);
        }
    }

    // Fallback method to load product ratings when ProductRatingUtils is not available
    async loadProductRatingsFallback(productCards) {
        if (!productCards || productCards.length === 0) return;

        console.log('🔍 Loading ratings using fallback method for', productCards.length, 'products');

        // Get product IDs
        const productIds = Array.from(productCards).map(card => {
            const productId = card.dataset.productId;
            return productId ? parseInt(productId) : null;
        }).filter(id => id !== null);

        if (productIds.length === 0) {
            console.log('🔍 No valid product IDs found for fallback rating loading');
            return;
        }

        try {
            // Call the same API that ProductRatingUtils uses
            const response = await fetch('/api/reviews/products/statistics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productIds)
            });

            if (response.ok) {
                const statistics = await response.json();
                console.log('🔍 Fallback: Loaded rating statistics:', statistics);

                // Update each product card
                productCards.forEach(card => {
                    const productId = card.dataset.productId;
                    if (productId && statistics[productId]) {
                        this.updateProductCardRatingFallback(card, parseInt(productId), statistics[productId]);
                    }
                });
            } else {
                console.warn('🔍 Fallback: Failed to load rating statistics:', response.status);
            }
        } catch (error) {
            console.error('🔍 Fallback: Error loading rating statistics:', error);
        }
    }

    // Update product card rating using fallback method
    updateProductCardRatingFallback(cardElement, productId, productStats) {
        const averageRating = productStats.averageRating || 0;
        const reviewCount = productStats.totalReviews || 0;

        console.log('🔍 Fallback: Updating rating for product', productId, ':', averageRating, 'stars,', reviewCount, 'reviews');

        // Find rating container
        const ratingContainer = cardElement.querySelector('.product-rating');
        if (!ratingContainer) {
            console.log('🔍 Fallback: No rating container found for product:', productId);
            return;
        }

        // Update stars
        const starRating = ratingContainer.querySelector('.star-rating');
        if (starRating) {
            starRating.innerHTML = this.createStarRatingHTML(averageRating);
        }

        // Update rating count
        const ratingCount = ratingContainer.querySelector('.rating-count');
        if (ratingCount) {
            ratingCount.textContent = `(${reviewCount})`;
        }
    }

    // Create star rating HTML for fallback method
    createStarRatingHTML(rating) {
        if (!rating || rating === 0) {
            // Return empty stars
            let stars = '';
            for (let i = 0; i < 5; i++) {
                stars += `
                    <div class="star empty">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                        </svg>
                    </div>
                `;
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
            stars += `
                <div class="star filled">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffc107" stroke="#ffc107" stroke-width="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                    </svg>
                </div>
            `;
        }

        // Half star
        if (hasHalfStar) {
            stars += `
                <div class="star half">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffc107" stroke="#ffc107" stroke-width="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                    </svg>
                </div>
            `;
        }

        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += `
                <div class="star empty">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                    </svg>
                </div>
            `;
        }

        return stars;
    }

    // Fallback method to load quick view rating when ProductRatingUtils is not available
    async loadQuickViewRatingFallback(productId) {
        console.log('🔍 Fallback: Loading quick view rating for product:', productId);

        try {
            // Call the same API that ProductRatingUtils uses
            const response = await fetch('/api/reviews/products/statistics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([productId])
            });

            if (response.ok) {
                const statistics = await response.json();
                console.log('🔍 Fallback: Loaded quick view rating statistics:', statistics);

                const productStats = statistics[productId.toString()];
                if (productStats) {
                    this.updateQuickViewRatingFallback(productStats);
                }
            } else {
                console.warn('🔍 Fallback: Failed to load quick view rating statistics:', response.status);
            }
        } catch (error) {
            console.error('🔍 Fallback: Error loading quick view rating statistics:', error);
        }
    }

    // Update quick view rating using fallback method
    updateQuickViewRatingFallback(productStats) {
        const averageRating = productStats.averageRating || 0;
        const reviewCount = productStats.totalReviews || 0;

        console.log('🔍 Fallback: Updating quick view rating:', averageRating, 'stars,', reviewCount, 'reviews');

        // Find the modal
        const modal = document.getElementById('quickViewModal');
        if (!modal) {
            console.log('🔍 Fallback: Quick view modal not found');
            return;
        }

        // Find rating container in modal
        const ratingContainer = modal.querySelector('.rating .stars');
        const reviewCountSpan = modal.querySelector('.rating .review-count, .review-count');

        if (ratingContainer) {
            // Generate stars HTML using the same logic as generateStarsForModal
            let starsHTML = '';
            if (!averageRating || averageRating === 0) {
                for (let i = 0; i < 5; i++) {
                    starsHTML += '<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>';
                }
            } else {
                const fullStars = Math.floor(averageRating);
                const decimalPart = averageRating % 1;
                const hasHalfStar = decimalPart > 0;
                const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

                for (let i = 0; i < fullStars; i++) {
                    starsHTML += '<i class="fas fa-star text-warning"></i>';
                }
                if (hasHalfStar) {
                    starsHTML += '<i class="fas fa-star-half-alt text-warning"></i>';
                }
                for (let i = 0; i < emptyStars; i++) {
                    starsHTML += '<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>';
                }
            }

            ratingContainer.innerHTML = starsHTML;
            console.log('🔍 Fallback: Updated rating stars in quick view');
        }

        if (reviewCountSpan) {
            reviewCountSpan.textContent = `(${reviewCount} đánh giá)`;
            console.log('🔍 Fallback: Updated review count in quick view to:', reviewCount);
        }
    }
}



// Make SimilarProductsManager available globally
window.SimilarProductsManager = SimilarProductsManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 similarproduct.js DOMContentLoaded fired');

    // Add quantity methods to app if they don't exist
    if (window.app && !window.app.incrementQuantity) {
        window.app.incrementQuantity = function () {
            const quantityInput = document.getElementById('quantityInput');
            if (!quantityInput) return;

            const currentValue = parseInt(quantityInput.value) || 0;
            const maxStock = parseInt(quantityInput.getAttribute('max')) || 10;
            const maxAllowed = Math.min(maxStock, 99); // Tối đa 99 sản phẩm

            if (currentValue < maxAllowed) {
                quantityInput.value = currentValue + 1;
                this.validateQuantity();
            }
        };

        window.app.decrementQuantity = function () {
            const quantityInput = document.getElementById('quantityInput');
            if (!quantityInput) return;

            const currentValue = parseInt(quantityInput.value) || 0;

            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                this.validateQuantity();
            }
        };

        window.app.validateQuantity = function () {
            const quantityInput = document.getElementById('quantityInput');
            const errorDiv = document.getElementById('quantityError');
            const errorMessage = document.getElementById('quantityErrorMessage');

            if (!quantityInput || !errorDiv || !errorMessage) return;

            const currentValue = parseInt(quantityInput.value) || 0;
            const maxStock = parseInt(quantityInput.getAttribute('max')) || 10;
            const maxAllowed = Math.min(maxStock, 99); // Tối đa 99 sản phẩm

            // Allow empty input for better UX (user can clear and type new number)
            if (quantityInput.value === '' || quantityInput.value === '0') {
                // Hide error message when input is empty (user is typing)
                errorDiv.style.display = 'none';
                quantityInput.classList.remove('is-invalid');
                return;
            }

            if (currentValue > maxAllowed) {
                // Show error message
                errorDiv.style.display = 'block';
                errorMessage.textContent = `Số lượng tối đa là ${maxAllowed} sản phẩm.`;
                quantityInput.classList.add('is-invalid');

                // Reset to max allowed
                quantityInput.value = maxAllowed;
            } else if (currentValue < 1) {
                // Show error for minimum
                errorDiv.style.display = 'block';
                errorMessage.textContent = 'Số lượng tối thiểu là 1.';
                quantityInput.classList.add('is-invalid');

                // Reset to minimum
                quantityInput.value = 1;
            } else {
                // Hide error message
                errorDiv.style.display = 'none';
                quantityInput.classList.remove('is-invalid');
            }
        };

        window.app.validateQuantityOnBlur = function () {
            const quantityInput = document.getElementById('quantityInput');
            if (!quantityInput) return;

            const currentValue = parseInt(quantityInput.value) || 0;
            const maxStock = parseInt(quantityInput.getAttribute('max')) || 10;

            // If input is empty or 0, set to minimum
            if (quantityInput.value === '' || currentValue < 1) {
                quantityInput.value = 1;
                this.validateQuantity();
            }
        };
    }

    console.log('🔍 similarproduct.js initialization completed');
});
