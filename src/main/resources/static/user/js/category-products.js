/**
 * Category Products Management
 * Handles product listing by category
 */
class CategoryProductsManager {
    constructor() {
        this.currentCategoryId = null;
        this.currentPage = 0;
        this.pageSize = 12;
        this.currentFilters = {
            search: '',
            minPrice: null,
            maxPrice: null,
            brands: [],
            ratings: [],
            sort: ''
        };
        this.products = [];
        this.totalElements = 0;
        this.totalPages = 0;
    }

    init() {
        try {
            this.getCategoryIdFromUrl();
            this.bindEvents();
            this.loadCategoryInfo();
            this.loadProducts();
        } catch (error) {
            console.error('Error in init():', error);
        }
    }

    getCategoryIdFromUrl() {
        const path = window.location.pathname;
        const match = path.match(/\/product\/view\/category\/(\d+)/);
        this.currentCategoryId = match ? parseInt(match[1]) : null;

        // Also try to get from query params as fallback
        if (!this.currentCategoryId) {
            const urlParams = new URLSearchParams(window.location.search);
            this.currentCategoryId = urlParams.get('categoryId');
        }

        if (!this.currentCategoryId) {
            console.error('Category ID not found in URL');
            this.showLoading(false);
            this.showEmptyState('Danh mục không tồn tại');
            return;
        }

    }

    async loadCategoryInfo() {
        try {
            console.log('Loading category info for ID:', this.currentCategoryId);
            const response = await fetch(`/api/products/categories/${this.currentCategoryId}`);

            if (!response.ok) {
                console.warn('Failed to load category info');
                return;
            }

            const data = await response.json();
            console.log('Category info response:', data);

            if (data.code === 1000 && data.result) {
                // Check if category is active
                if (data.result.isActive === false || data.result.isActive === null) {
                    this.showCategoryUnavailable(data.result.name);
                    return;
                }

                this.displayCategoryTitle(data.result.name);
            }
        } catch (error) {
            console.error('Error loading category info:', error);
        }
    }

    displayCategoryTitle(categoryName) {
        const categoryTitle = document.getElementById('categoryTitle');
        if (categoryTitle) {
            categoryTitle.textContent = categoryName;
            categoryTitle.style.display = 'block';
            console.log('Category title displayed:', categoryName);
        }
    }

    bindEvents() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 500));
        }

        // Price range filter
        const priceRangeSelect = document.getElementById('priceRange');
        if (priceRangeSelect) priceRangeSelect.addEventListener('change', this.handlePriceRangeChange.bind(this));

        // Sort select - removed duplicate declaration

        // Page size
        const pageSizeSelect = document.getElementById('pageSize');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', this.handlePageSizeChange.bind(this));
        }

        // Filter buttons
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', this.applyFilters.bind(this));

        // Sort event
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.addEventListener('change', this.handleSort.bind(this));

        // Load brands dynamically
        this.loadBrands();
    }


    async loadProducts() {
        console.log('loadProducts called, categoryId:', this.currentCategoryId);
        if (!this.currentCategoryId) {
            console.error('No category ID available');
            return;
        }

        // Clear products immediately to avoid showing old data
        this.products = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.renderProducts(); // Clear the grid immediately

        this.showLoading(true);

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                size: this.pageSize
            });

            // Add filters
            if (this.currentFilters.search) {
                params.append('q', this.currentFilters.search);
            }
            if (this.currentFilters.minPrice) {
                params.append('minPrice', this.currentFilters.minPrice);
            }
            if (this.currentFilters.maxPrice) {
                params.append('maxPrice', this.currentFilters.maxPrice);
            }
            if (this.currentFilters.brands && this.currentFilters.brands.length > 0) {
                params.append('brands', this.currentFilters.brands.join(','));
            }
            if (this.currentFilters.ratings && this.currentFilters.ratings.length > 0) {
                params.append('ratings', this.currentFilters.ratings.join(','));
            }
            if (this.currentFilters.sort) {
                // Split the sort value (format: "name,asc" or "price,desc")
                const [sortBy, sortDir] = this.currentFilters.sort.split(',');
                if (sortBy && sortDir) {
                    params.append('sortBy', sortBy);
                    params.append('sortDir', sortDir);
                }
            }

            const fullUrl = `/api/products/category/${this.currentCategoryId}?${params}`;

            const response = await fetch(fullUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.code === 1000) {
                this.products = data.result.content || [];
                this.totalElements = data.result.totalElements || 0;
                this.totalPages = data.result.totalPages || 0;

                // Hide loading spinner
                this.showLoading(false);
            } else {
                console.log('API error:', data.message);
                this.showLoading(false);
                this.showEmptyState('Chưa có sản phẩm nào trong danh mục này');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showLoading(false);
            this.showEmptyState('Không thể tải sản phẩm. Vui lòng thử lại sau.');
            this.products = [];
            this.totalElements = 0;
            this.totalPages = 0;
        } finally {
            console.log('Finally block - rendering products:', this.products.length);
            this.renderProducts();
            this.updateResultsInfo();
            this.updatePagination();
        }
    }

    renderProducts() {
        console.log('renderProducts called with', this.products.length, 'products');
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        const loadingSpinner = document.getElementById('loadingSpinner');

        if (!grid) {
            console.log('Grid element not found');
            return;
        }

        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }

        if (this.products.length === 0) {
            console.log('No products - hiding grid and showing empty state');
            grid.style.display = 'none';
            grid.innerHTML = ''; // Clear grid content
            emptyState.style.display = 'block';

            // Update empty state message based on filters
            const hasFilters = this.hasActiveFilters();
            if (hasFilters) {
                emptyState.innerHTML = `
                    <i class="fas fa-filter fa-3x text-muted mb-3"></i>
                    <h4>Không tìm thấy sản phẩm phù hợp</h4>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc chọn khoảng giá khác</p>
                    <button class="btn btn-outline-primary" onclick="categoryProductsManager.clearFilters()">
                        <i class="fas fa-times me-2"></i>Xóa bộ lọc
                    </button>
                `;
            } else {
                emptyState.innerHTML = `
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h4>Không có sản phẩm nào</h4>
                    <p class="text-muted">Danh mục này hiện chưa có sản phẩm</p>
                `;
            }
            return;
        }

        console.log('Rendering products - clearing grid first');
        emptyState.style.display = 'none';
        grid.innerHTML = ''; // Clear grid content first
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        grid.style.gap = '1rem';
        grid.style.padding = '1rem 1rem';
        grid.style.width = '100%';
        grid.style.maxWidth = '2500px';
        grid.style.margin = '0 auto';
        grid.style.justifyContent = 'stretch';

        const html = this.products.map(product => this.createProductCard(product)).join('');
        grid.innerHTML = html;
        console.log('Grid updated with', this.products.length, 'products');

        console.log('Products rendered:', this.products.length);
        console.log('Grid element:', grid);
        console.log('Grid computed style:', window.getComputedStyle(grid).display);

        // Trigger rating load sau khi render xong
        setTimeout(() => {
            if (window.loadProductRatings) {
                window.loadProductRatings();
            }
        }, 500);

        // Bind add to cart events - removed because we use onclick attributes
        // this.bindAddToCartEvents();
    }

    createProductCard(product) {
        const productStatus = this.getProductStatus(product);
        const statusClass = this.getProductStatusClass(productStatus);
        const statusText = this.getProductStatusText(productStatus);

        return `
            <div class="product-card ${statusClass}" data-product-id="${product.productId}">
                    <div class="position-relative">
                        <img src="${product.mainImageUrl || '/user/img/default-product.jpg'}" 
                             class="card-img-top" 
                             alt="${product.name}"
                             onerror="this.src='/user/img/default-product.jpg'"
                             onclick="window.location.href='/product/${product.productId}?from=category&categoryId=${this.currentCategoryId}'"
                             style="cursor: pointer;">
                        
                    <!-- Product Status Badge - Removed to avoid overlapping with image -->
                        
                        <div class="product-actions">
                        <button class="quick-view-btn" 
                                onclick="if(window.app) window.app.showQuickView(${product.productId}); else alert('Chức năng đang được tải...');"
                                title="Xem nhanh">
                            <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title" title="${product.name}">
                            <a href="/product/${product.productId}?from=category&categoryId=${this.currentCategoryId}" class="text-decoration-none text-dark product-name-link">
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
                                <button class="add-to-cart-icon ${productStatus !== 'available' ? 'disabled' : ''}" 
                                    data-product-id="${product.productId}"
                                    data-product-name="${product.name}"
                                        data-product-price="${product.price}"
                                        ${productStatus !== 'available' ? 'disabled' : ''}
                                        title="${productStatus === 'out_of_stock' ? 'Hết hàng' :
                productStatus === 'deactivated' ? 'Ngừng kinh doanh' : 'Thêm vào giỏ'}"
                                        onclick="if(window.app) window.app.addToCart(${product.productId}); else alert('Chức năng đang được tải...');">
                                    <i class="fas fa-shopping-cart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getProductStatus(product) {
        // Product status validation

        // 1. Kiểm tra ngừng kinh doanh (ưu tiên cao nhất)
        if (!product.isActive) {
            return 'deactivated';
        }

        // 2. Kiểm tra hết hàng (chỉ khi sản phẩm còn active)
        if (product.stock <= 0) {
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

    getProductStatusText(status) {
        switch (status) {
            case 'deactivated':
                return 'Ngừng kinh doanh';
            case 'out_of_stock':
                return 'Hết hàng';
            default:
                return '';
        }
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
                            onclick="window.categoryProductsManager.buyNow(${product.productId})">
                        <i class="fas fa-bolt me-1"></i>
                        Mua ngay
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="window.categoryProductsManager.addToCartWithQuantity(${product.productId})">
                        <i class="fas fa-shopping-cart me-1"></i>
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;
    }

    generateStars(rating, reviewCount = 0) {

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

    // Method riêng cho Quick View modal
    generateStarsForModal(rating, reviewCount = 0) {

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


    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    // bindAddToCartEvents() method removed - using onclick attributes instead

    async addToCart(productId, productName, price) {
        console.log('addToCart called for productId:', productId, 'productName:', productName);
        console.log('window.cartManager exists:', !!window.cartManager);
        console.log('window.cartManager:', window.cartManager);

        try {
            // Check if cart functionality exists
            if (window.cartManager) {
                console.log('Using cartManager.addItem');
                await window.cartManager.addItem(productId, 1);
                console.log('cartManager.addItem completed');
                this.showNotification(`${productName} đã được thêm vào giỏ hàng`, 'success');
                return;
            } else {
                console.log('cartManager not available, trying fallback');
            }
        } catch (error) {
            console.error('Error with cartManager:', error);
        }

        // Gọi backend thống nhất: đảm bảo tạo cart và thêm sản phẩm
        if (window.app && typeof window.app.addProductToCartBackend === 'function') {
            try {
                await window.app.addProductToCartBackend(productId, 1, false);
                await window.app.refreshCartBadge?.();
                this.showNotification(`${productName} đã được thêm vào giỏ hàng`, 'success');
                return;
            } catch (e) {
                console.error('Backend addToCart failed:', e);
            }
        }

        // Final fallback
        this.showNotification('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
    }

    // Show quick view popup
    async showQuickView(productId) {
        const product = this.products.find(p => p.productId === productId);
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
                console.log('Could not load product images:', error);
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
                                            <button class="slider-nav slider-prev" id="prevBtn">
                                                <i class="fas fa-chevron-left"></i>
                                            </button>
                                            <img id="mainProductImage" 
                                                 src="${this.getMainImageUrl(product)}" 
                                                 class="img-fluid rounded" 
                                                 alt="${product.name}"
                                                 onerror="this.src='/user/img/default-product.jpg'">
                                            <button class="slider-nav slider-next" id="nextBtn">
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
                                        <a href="/product/${product.productId}?from=category&categoryId=${this.currentCategoryId}" class="text-decoration-none text-dark">
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
                                        ${this.getQuickViewActions(product)}
                                        
                                        <!-- View Details Button -->
                                        <a href="/product/${product.productId}?from=category&categoryId=${this.currentCategoryId}" 
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
            ProductRatingUtils.updateQuickViewReviewData(product.productId);
        }, 200);

        // Remove modal from DOM when hidden
        document.getElementById('quickViewModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    // Setup slider navigation
    setupSliderNavigation(product) {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const mainImage = document.getElementById('mainProductImage');
        const thumbnails = document.querySelectorAll('.thumbnail-item');

        if (!product.images || product.images.length <= 1) {
            // Hide navigation buttons if only one image
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            return;
        }

        let currentImageIndex = 0;

        // Update main image
        const updateMainImage = (index) => {
            if (product.images && product.images[index]) {
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
    }

    handleSearch(e) {
        this.currentFilters.search = e.target.value;
        this.currentPage = 0;
        this.loadProducts();
    }

    handlePriceRangeChange() {
        const priceRange = document.getElementById('priceRange').value;

        if (priceRange && priceRange.includes(',')) {
            const [minPrice, maxPrice] = priceRange.split(',').map(Number);
            this.currentFilters.minPrice = minPrice;
            this.currentFilters.maxPrice = maxPrice;
        } else {
            this.currentFilters.minPrice = null;
            this.currentFilters.maxPrice = null;
        }
    }


    handlePageSizeChange(e) {
        this.pageSize = parseInt(e.target.value);
        this.currentPage = 0;
        this.loadProducts();
    }

    applyFilters() {
        console.log('applyFilters called');

        // Get filter values
        const priceRange = document.getElementById('priceRange');
        const ratingCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="rating"]');

        console.log('Price range value:', priceRange ? priceRange.value : 'not found');

        // Update current filters - handle price range
        if (priceRange && priceRange.value && priceRange.value.includes(',')) {
            const [minPrice, maxPrice] = priceRange.value.split(',').map(Number);
            this.currentFilters.minPrice = minPrice;
            this.currentFilters.maxPrice = maxPrice;
            console.log('Price filter set:', { minPrice, maxPrice });
        } else {
            this.currentFilters.minPrice = null;
            this.currentFilters.maxPrice = null;
            console.log('No price filter');
        }

        // Get selected brands (dynamic)
        const brandCheckboxes = document.querySelectorAll('#brandFilters input[type="checkbox"]');
        this.currentFilters.brands = Array.from(brandCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        console.log('Selected brands:', this.currentFilters.brands);

        // Get selected ratings
        this.currentFilters.ratings = Array.from(ratingCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value));
        console.log('Selected ratings:', this.currentFilters.ratings);

        console.log('Final filters:', this.currentFilters);
        this.currentPage = 0;
        this.loadProducts();
    }

    async loadBrands() {
        console.log('loadBrands called, categoryId:', this.currentCategoryId);
        try {
            // Try to load brands with count first
            const response = await fetch(`/api/products/categories/${this.currentCategoryId}/brands-with-count`);
            console.log('Brands with count API response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Brands with count API data:', data);
                if (data.code === 1000 && data.result) {
                    this.renderBrandFiltersWithCount(data.result);
                    return;
                }
            }

            // Fallback to simple brands
            console.log('Falling back to simple brands');
            await this.loadBrandsSimple();
        } catch (error) {
            console.log('Error loading brands with count:', error);
            await this.loadBrandsSimple();
        }
    }

    async loadBrandsSimple() {
        try {
            const response = await fetch(`/api/products/categories/${this.currentCategoryId}/brands`);
            console.log('Simple brands API response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Simple brands API data:', data);
                this.renderBrandFilters(data.result || []);
            } else {
                console.log('Could not load simple brands, using fallback');
                this.renderBrandFilters([]);
            }
        } catch (error) {
            console.log('Error loading simple brands:', error);
            this.renderBrandFilters([]);
        }
    }

    renderBrandFilters(brands) {
        const brandFiltersContainer = document.getElementById('brandFilters');
        if (!brandFiltersContainer) return;

        if (brands.length === 0) {
            brandFiltersContainer.innerHTML = '<p class="text-muted">Không có thương hiệu nào</p>';
            return;
        }

        brandFiltersContainer.innerHTML = brands.map((brand, index) => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${brand}" id="brand${index + 1}">
                <label class="form-check-label" for="brand${index + 1}">${brand}</label>
            </div>
        `).join('');
    }

    renderBrandFiltersWithCount(brandsWithCount) {
        const brandFiltersContainer = document.getElementById('brandFilters');
        if (!brandFiltersContainer) return;

        if (Object.keys(brandsWithCount).length === 0) {
            brandFiltersContainer.innerHTML = '<p class="text-muted">Không có thương hiệu nào</p>';
            return;
        }

        // Sort brands by name
        const sortedBrands = Object.entries(brandsWithCount)
            .sort(([a], [b]) => a.localeCompare(b));

        brandFiltersContainer.innerHTML = sortedBrands.map(([brandName, count], index) => `
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" value="${brandName}" id="brand-${brandName}">
                <label class="form-check-label" for="brand-${brandName}">${brandName} (${count})</label>
            </div>
        `).join('');
    }

    handleSort(e) {
        console.log('Sort changed to:', e.target.value);
        this.currentFilters.sort = e.target.value;
        this.currentPage = 0;
        this.loadProducts();
    }

    hasActiveFilters() {
        return this.currentFilters.minPrice !== null ||
            this.currentFilters.maxPrice !== null ||
            this.currentFilters.brands.length > 0 ||
            this.currentFilters.ratings.length > 0;
    }

    clearFilters() {
        this.currentFilters = {
            search: '',
            minPrice: null,
            maxPrice: null,
            brands: [],
            ratings: [],
            sort: ''
        };

        // Reset form inputs
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';

        const priceRange = document.getElementById('priceRange');
        if (priceRange) priceRange.value = '';

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.value = '';

        // Reset brand checkboxes
        const brandCheckboxes = document.querySelectorAll('#brandFilters input[type="checkbox"]');
        brandCheckboxes.forEach(cb => cb.checked = false);

        // Reset rating checkboxes
        const ratingCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="rating"]');
        ratingCheckboxes.forEach(cb => cb.checked = false);

        this.currentPage = 0;
        this.loadProducts();
    }

    updateResultsInfo() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = `Hiển thị ${this.totalElements} sản phẩm`;
        }
    }

    updatePagination() {
        const pagination = document.getElementById('pagination');

        if (!pagination) {
            console.log('Pagination element not found!');
            return;
        }

        if (this.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'block';

        let html = '';

        // Previous button
        const prevDisabled = this.currentPage === 0 ? 'disabled' : '';
        html += `
            <li class="page-item ${prevDisabled}">
                <a class="page-link" href="#" onclick="window.categoryProductsManager.goToPage(${this.currentPage - 1}); return false;">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(0, this.currentPage - 2);
        const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage ? 'active' : '';
            html += `
                <li class="page-item ${activeClass}">
                    <a class="page-link" href="#" onclick="window.categoryProductsManager.goToPage(${i}); return false;">${i + 1}</a>
                </li>
            `;
        }

        // Next button
        const nextDisabled = this.currentPage >= this.totalPages - 1 ? 'disabled' : '';
        html += `
            <li class="page-item ${nextDisabled}">
                <a class="page-link" href="#" onclick="window.categoryProductsManager.goToPage(${this.currentPage + 1}); return false;">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        const paginationList = pagination.querySelector('.pagination');
        if (paginationList) {
            paginationList.innerHTML = html;
        } else {
            pagination.innerHTML = `<ul class="pagination justify-content-center">${html}</ul>`;
        }
    }

    goToPage(page) {
        if (page < 0 || page >= this.totalPages) return;
        this.currentPage = page;
        this.loadProducts();
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const grid = document.getElementById('productsGrid');

        if (show) {
            spinner.style.display = 'block';
            grid.style.display = 'none';
        } else {
            spinner.style.display = 'none';
        }
    }

    showError(message) {
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');

        if (grid) grid.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h4>Lỗi</h4>
                <p class="text-muted">${message}</p>
            `;
        }
    }

    showEmptyState(message) {
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        const loadingSpinner = document.getElementById('loadingSpinner');

        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }

        if (grid) grid.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                <h4>Chưa có sản phẩm</h4>
                <p class="text-muted">${message}</p>
            `;
        }
    }

    // Show category unavailable message
    showCategoryUnavailable(categoryName) {
        const container = document.querySelector('.container-fluid .row');
        if (!container) return;

        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <div class="error-icon mb-4">
                        <i class="fas fa-exclamation-triangle fa-4x text-warning"></i>
                    </div>
                    <h2 class="text-danger mb-3">Danh mục tạm ngưng hoạt động</h2>
                    <p class="text-muted mb-4">
                        Danh mục "${categoryName}" hiện đang tạm ngưng hoạt động. Vui lòng quay lại sau.
                    </p>
                    <div class="d-flex justify-content-center gap-3">
                        <a href="/" class="btn btn-primary btn-lg">
                            <i class="fas fa-home me-2"></i>
                            Về trang chủ
                        </a>
                        <a href="javascript:history.back()" class="btn btn-outline-secondary btn-lg">
                            <i class="fas fa-arrow-left me-2"></i>
                            Quay lại
                        </a>
                    </div>
                </div>
            </div>
        `;
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

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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

    // Generate image thumbnails for slider
    generateImageThumbnails(product) {
        // Use product images if available, otherwise fallback to main image
        let images = [];

        if (product.images && product.images.length > 0) {
            // Use actual product images
            images = product.images.map(img => img.imageUrl || img);
        } else {
            // Fallback to main image repeated
            const mainImage = product.mainImageUrl || '/user/img/default-product.jpg';
            images = [mainImage];
        }

        return images.map((image, index) => `
            <div class="thumbnail-item ${index === 0 ? 'active' : ''}" 
                 onclick="window.categoryProductsManager.changeMainImage('${image}')">
                <img src="${image}" 
                     class="thumbnail-img" 
                     alt="Thumbnail ${index + 1}"
                     onerror="this.src='/user/img/default-product.jpg'">
            </div>
        `).join('');
    }

    // Change main image when thumbnail is clicked
    changeMainImage(imageSrc) {
        const mainImage = document.getElementById('mainProductImage');
        if (mainImage) {
            mainImage.src = imageSrc;
        }

        // Update active thumbnail
        document.querySelectorAll('.thumbnail-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.thumbnail-item').classList.add('active');
    }

    // Add to cart with quantity
    addToCartWithQuantity(productId) {
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

        const product = this.products.find(p => p.productId === productId);
        if (!product) {
            this.showNotification('Không tìm thấy sản phẩm', 'error');
            return;
        }

        // Validate quantity against stock
        if (quantity > product.stock) {
            this.showNotification(`Số lượng bạn chọn (${quantity}) vượt quá số lượng tồn kho hiện có (${product.stock} sản phẩm). Vui lòng chọn số lượng phù hợp.`, 'error');
            return;
        }

        // Gọi backend thống nhất
        if (window.app && typeof window.app.addProductToCartBackend === 'function') {
            window.app.addProductToCartBackend(productId, quantity, false)
                .then(() => window.app.refreshCartBadge?.())
                .catch(() => this.showNotification('Không thể thêm vào giỏ hàng', 'error'));
            return;
        }
        this.showNotification('Không thể thêm vào giỏ hàng', 'error');
    }

    // Buy now - chuẩn từ bestseller-products.js
    async buyNow(productId) {
        const product = this.products.find(p => p.productId === productId);
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

    // Get main image URL for product
    getMainImageUrl(product) {
        if (product.images && product.images.length > 0) {
            // Use first image as main image
            return product.images[0].imageUrl || product.images[0];
        }
        return product.mainImageUrl || '/user/img/default-product.jpg';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking CategoryProductsManager...');
    console.log('window.categoryProductsManager:', window.categoryProductsManager);

    if (window.categoryProductsManager) {
        console.log('CategoryProductsManager found, initializing...');
        window.categoryProductsManager.init();
    } else {
        console.error('CategoryProductsManager not found!');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryProductsManager;
}

// Create global instance
try {
    window.categoryProductsManager = new CategoryProductsManager();
    console.log('CategoryProductsManager instance created successfully');
} catch (error) {
    console.error('Error creating CategoryProductsManager:', error);
}
