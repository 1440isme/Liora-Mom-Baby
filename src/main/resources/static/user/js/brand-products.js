class BrandProductsManager {
    constructor() {
        this.currentPage = 0;
        this.totalPages = 0;
        this.isLoading = false;
        this.currentFilters = {
            minPrice: '',
            maxPrice: '',
            categories: [],
            ratings: [],
            sort: ''
        };
        this.brandId = this.getBrandIdFromUrl();
        this.init();
    }

    getBrandIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        const brandIndex = pathParts.indexOf('brand');
        const brandId = brandIndex !== -1 && brandIndex + 1 < pathParts.length ? pathParts[brandIndex + 1] : null;
        console.log('getBrandIdFromUrl - pathParts:', pathParts);
        console.log('getBrandIdFromUrl - brandIndex:', brandIndex);
        console.log('getBrandIdFromUrl - brandId:', brandId);
        return brandId;
    }

    init() {
        console.log('=== BRAND PRODUCTS MANAGER INIT ===');
        console.log('Brand ID:', this.brandId);
        console.log('Current filters:', this.currentFilters);
        console.log('Current URL:', window.location.href);
        console.log('Pathname:', window.location.pathname);

        this.loadCategories();
        this.loadProducts();
        this.setupEventListeners();

        console.log('=== INIT COMPLETED ===');
    }

    setupEventListeners() {
        // Sort dropdown
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.currentPage = 0;
                this.loadProducts();
            });
        }

        // Price range filter
        const priceRangeSelect = document.getElementById('priceRange');
        if (priceRangeSelect) priceRangeSelect.addEventListener('change', this.handlePriceRangeChange.bind(this));

        // Filter inputs
        const minPriceInput = document.getElementById('minPrice');
        const maxPriceInput = document.getElementById('maxPrice');

        if (minPriceInput) {
            minPriceInput.addEventListener('input', this.debounce(() => {
                this.currentFilters.minPrice = minPriceInput.value;
                this.currentPage = 0;
                this.loadProducts();
            }, 500));
        }

        if (maxPriceInput) {
            maxPriceInput.addEventListener('input', this.debounce(() => {
                this.currentFilters.maxPrice = maxPriceInput.value;
                this.currentPage = 0;
                this.loadProducts();
            }, 500));
        }

        // Category checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('category-filter')) {
                this.updateCategoryFilter();
                this.currentPage = 0;
                this.loadProducts();
            }
        });

        // Rating checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('rating-filter')) {
                this.updateRatingFilter();
                this.currentPage = 0;
                this.loadProducts();
            }
        });

        // Apply filters button
        const applyFiltersBtn = document.getElementById('applyFilters');
        console.log('Apply filters button found:', applyFiltersBtn);
        if (applyFiltersBtn) {
            console.log('Adding event listener to apply filters button');
            applyFiltersBtn.addEventListener('click', this.applyFilters.bind(this));
        } else {
            console.error('Apply filters button not found!');
        }

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadProducts();
                }
            }
        });
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

    updateCategoryFilter() {
        const checkedCategories = document.querySelectorAll('.category-filter:checked');
        this.currentFilters.categories = Array.from(checkedCategories).map(cb => cb.value);
    }

    updateRatingFilter() {
        const checkedRatings = document.querySelectorAll('.rating-filter:checked');
        this.currentFilters.ratings = Array.from(checkedRatings).map(cb => parseInt(cb.value));
    }

    async loadProducts() {
        if (this.isLoading) return;

        console.log('Loading products for brand ID:', this.brandId);
        this.isLoading = true;
        this.showLoading();

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                size: 12
            });

            // Add filters
            if (this.currentFilters.minPrice) {
                params.append('minPrice', this.currentFilters.minPrice);
            }
            if (this.currentFilters.maxPrice) {
                params.append('maxPrice', this.currentFilters.maxPrice);
            }
            if (this.currentFilters.categories && this.currentFilters.categories.length > 0) {
                params.append('categories', this.currentFilters.categories.join(','));
            }
            if (this.currentFilters.ratings && this.currentFilters.ratings.length > 0) {
                params.append('ratings', this.currentFilters.ratings.join(','));
            }
            if (this.currentFilters.sort) {
                // Split the sort value (format: "name,asc" or "price,desc")
                const [sortBy, sortDir] = this.currentFilters.sort.split(',');
                console.log('Sort parameters:', { sortBy, sortDir });
                if (sortBy && sortDir) {
                    params.append('sortBy', sortBy);
                    params.append('sortDir', sortDir);
                }
            }

            const url = `/api/products/brand/${this.brandId}?${params}`;
            console.log('Fetching URL:', url);

            const response = await fetch(url);
            const data = await response.json();

            console.log('API Response:', data);

            if (data.code === 200 || data.code === 1000) {
                this.products = data.result.content || [];
                this.totalElements = data.result.totalElements || 0;
                this.totalPages = data.result.totalPages || 0;
                console.log('Products loaded:', this.products.length, 'Total:', this.totalElements);

                this.renderProducts(this.products);
                this.updatePagination(data.result);
                this.updateProductCount(data.result.totalElements);
            } else {
                console.error('API Error:', data.message);
                this.products = [];
                this.totalElements = 0;
                this.totalPages = 0;
                this.renderProducts([]);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
            this.totalElements = 0;
            this.totalPages = 0;
            this.renderProducts([]);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }


    renderProducts(products) {
        const container = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (!container) return;

        console.log('renderProducts called with', products.length, 'products');

        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }

        // Clear grid content first
        container.innerHTML = '';

        if (products.length === 0) {
            console.log('No products - showing empty state');
            this.showEmptyState('Chưa có sản phẩm nào trong thương hiệu này');
            return;
        }

        console.log('Rendering products - clearing grid first');
        if (emptyState) emptyState.style.display = 'none';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(4, 1fr)';
        container.style.gap = '1rem';
        container.style.padding = '1rem 1rem';
        container.style.width = '100%';
        container.style.maxWidth = '2500px';
        container.style.margin = '0 auto';
        container.style.justifyContent = 'stretch';

        const html = products.map(product => this.createProductCard(product)).join('');
        container.innerHTML = html;

        console.log('Products rendered:', products.length);

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
        const statusText = this.getProductStatusText(productStatus);

        const productUrl = `/product/${product.productId}?from=brand&brandId=${this.brandId}`;
        console.log('createProductCard - this.brandId:', this.brandId);
        console.log('createProductCard - productUrl:', productUrl);

        return `
            <div class="product-card ${statusClass}">
                    <div class="position-relative">
                        <img src="${product.mainImageUrl || '/user/img/default-product.jpg'}" 
                             class="card-img-top" 
                             alt="${product.name}"
                             onerror="this.src='/user/img/default-product.jpg'"
                             onclick="window.location.href='${productUrl}'"
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
                            <a href="${productUrl}" class="text-decoration-none text-dark product-name-link" onclick="console.log('Product link clicked - brandId:', ${this.brandId}, 'productId:', ${product.productId})">
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
                                        onclick="if(window.app) window.app.addToCart(${product.productId}, 1, true); else alert('Chức năng đang được tải...');">
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

        // 3. Sản phẩm có sẵn
        return 'available';
    }

    getProductStatusClass(productStatus) {
        switch (productStatus) {
            case 'deactivated':
                return 'product-deactivated';
            case 'out_of_stock':
                return 'product-out-of-stock';
            case 'available':
            default:
                return 'product-available';
        }
    }

    getProductStatusText(productStatus) {
        switch (productStatus) {
            case 'deactivated':
                return 'Ngừng kinh doanh';
            case 'out_of_stock':
                return 'Hết hàng';
            case 'available':
            default:
                return 'Có sẵn';
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

    generateStars(rating, reviewCount = 0) {

        // Logic đúng cho product card - giống generateStarsForModal trong category-products
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

    calculateSalesProgress(soldCount) {
        const maxSales = 100; // Giả sử 100 là mức bán chạy nhất
        const progress = Math.min((soldCount || 0) / maxSales * 100, 100);
        return Math.round(progress);
    }

    formatNumber(number) {
        return new Intl.NumberFormat('vi-VN').format(number);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    updatePagination(pageInfo) {
        this.totalPages = pageInfo.totalPages;

        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        if (this.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'block';
        const paginationList = pagination.querySelector('.pagination');
        if (!paginationList) return;

        let paginationHTML = '';

        // Previous button
        const prevDisabled = this.currentPage === 0 ? 'disabled' : '';
        paginationHTML += `
            <li class="page-item ${prevDisabled}">
                <a class="page-link" href="#" onclick="window.brandProductsManager.goToPage(${this.currentPage - 1}); return false;">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(0, this.currentPage - 2);
        const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage ? 'active' : '';
            paginationHTML += `
                <li class="page-item ${activeClass}">
                    <a class="page-link" href="#" onclick="window.brandProductsManager.goToPage(${i}); return false;">${i + 1}</a>
                </li>
            `;
        }

        // Next button
        const nextDisabled = this.currentPage >= this.totalPages - 1 ? 'disabled' : '';
        paginationHTML += `
            <li class="page-item ${nextDisabled}">
                <a class="page-link" href="#" onclick="window.brandProductsManager.goToPage(${this.currentPage + 1}); return false;">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginationList.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page < 0 || page >= this.totalPages) return;
        this.currentPage = page;
        this.loadProducts();
    }

    updateProductCount(total) {
        const countElement = document.getElementById('resultsCount');
        if (countElement) {
            countElement.textContent = `Hiển thị ${total} sản phẩm`;
        }
    }

    async loadCategories() {
        console.log('loadCategories called, brandId:', this.brandId);
        try {
            // Try to load categories with count first
            const response = await fetch(`/api/products/brands/${this.brandId}/categories-with-count`);
            console.log('Categories with count API response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Categories with count API data:', data);
                if (data.code === 1000 && data.result) {
                    this.renderCategoryFiltersWithCount(data.result);
                    return;
                }
            }

            // Fallback to simple categories
            await this.loadCategoriesSimple();
        } catch (error) {
            console.log('Error loading categories with count:', error);
            await this.loadCategoriesSimple();
        }
    }

    async loadCategoriesSimple() {
        try {
            const response = await fetch(`/api/products/brands/${this.brandId}/categories`);
            console.log('Simple categories API response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Simple categories API data:', data);
                this.renderCategoryFilters(data.result || []);
            } else {
                console.log('Could not load simple categories, using fallback');
                this.renderCategoryFilters([]);
            }
        } catch (error) {
            console.log('Error loading simple categories:', error);
            this.renderCategoryFilters([]);
        }
    }

    renderCategoryFilters(categories) {
        const categoryFiltersContainer = document.getElementById('categoryFilters');
        if (!categoryFiltersContainer) return;

        if (categories.length === 0) {
            categoryFiltersContainer.innerHTML = '<p class="text-muted">Không có danh mục nào</p>';
            return;
        }

        categoryFiltersContainer.innerHTML = categories.map((category, index) => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${category}" id="category${index + 1}">
                <label class="form-check-label" for="category${index + 1}">${category}</label>
            </div>
        `).join('');
    }

    renderCategoryFiltersWithCount(categoriesWithCount) {
        const categoryFiltersContainer = document.getElementById('categoryFilters');
        if (!categoryFiltersContainer) return;

        if (Object.keys(categoriesWithCount).length === 0) {
            categoryFiltersContainer.innerHTML = '<p class="text-muted">Không có danh mục nào</p>';
            return;
        }

        // Sort categories by name
        const sortedCategories = Object.entries(categoriesWithCount)
            .sort(([a], [b]) => a.localeCompare(b));

        categoryFiltersContainer.innerHTML = sortedCategories.map(([categoryName, count], index) => `
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" value="${categoryName}" id="category-${categoryName}">
                <label class="form-check-label" for="category-${categoryName}">${categoryName} (${count})</label>
            </div>
        `).join('');
    }

    handlePriceRangeChange() {
        const priceRange = document.getElementById('priceRange').value;
        console.log('Price range changed to:', priceRange);

        if (priceRange && priceRange.includes(',')) {
            const [minPrice, maxPrice] = priceRange.split(',').map(Number);
            this.currentFilters.minPrice = minPrice;
            this.currentFilters.maxPrice = maxPrice;
            console.log('Price filter updated:', { minPrice, maxPrice });
        } else {
            this.currentFilters.minPrice = null;
            this.currentFilters.maxPrice = null;
            console.log('Price filter cleared');
        }

        // Don't auto-apply filter - wait for "Áp dụng bộ lọc" button
        console.log('Price range updated, waiting for apply button');
    }

    applyFilters() {
        console.log('=== APPLY FILTERS CALLED ===');
        console.log('applyFilters method executed');

        // Get filter values
        const priceRange = document.getElementById('priceRange');
        const ratingCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="rating"]');

        console.log('Price range element:', priceRange);
        console.log('Price range value:', priceRange ? priceRange.value : 'not found');
        console.log('Rating checkboxes found:', ratingCheckboxes.length);

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

        // Get selected categories (dynamic)
        const categoryCheckboxes = document.querySelectorAll('#categoryFilters input[type="checkbox"]');
        console.log('Category checkboxes found:', categoryCheckboxes.length);
        console.log('Category checkboxes:', categoryCheckboxes);

        this.currentFilters.categories = Array.from(categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        console.log('Selected categories:', this.currentFilters.categories);

        // Get selected ratings
        this.currentFilters.ratings = Array.from(ratingCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value));
        console.log('Selected ratings:', this.currentFilters.ratings);

        console.log('Final filters:', this.currentFilters);
        console.log('Resetting to page 0 and calling loadProducts()');
        this.currentPage = 0;
        this.loadProducts();
        console.log('=== APPLY FILTERS COMPLETED ===');
    }

    hasActiveFilters() {
        return this.currentFilters.minPrice !== null ||
            this.currentFilters.maxPrice !== null ||
            this.currentFilters.categories.length > 0 ||
            this.currentFilters.ratings.length > 0;
    }

    clearFilters() {
        this.currentFilters = {
            minPrice: null,
            maxPrice: null,
            categories: [],
            ratings: [],
            sort: ''
        };

        // Reset form inputs
        const priceRangeSelect = document.getElementById('priceRange');
        if (priceRangeSelect) priceRangeSelect.value = '';

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.value = '';

        // Reset category checkboxes
        const categoryCheckboxes = document.querySelectorAll('#categoryFilters input[type="checkbox"]');
        categoryCheckboxes.forEach(cb => cb.checked = false);

        // Reset rating checkboxes
        const ratingCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="rating"]');
        ratingCheckboxes.forEach(cb => cb.checked = false);

        this.currentPage = 0;
        this.loadProducts();
    }

    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'block';
        document.getElementById('productsGrid').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
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

            // Check if there are active filters
            const hasFilters = this.hasActiveFilters();
            if (hasFilters) {
                emptyState.innerHTML = `
                    <i class="fas fa-filter fa-3x text-muted mb-3"></i>
                    <h4>Không tìm thấy sản phẩm phù hợp</h4>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc chọn khoảng giá khác</p>
                    <button class="btn btn-outline-primary" onclick="brandProductsManager.clearFilters()">
                        <i class="fas fa-times me-2"></i>Xóa bộ lọc
                    </button>
                `;
            } else {
                emptyState.innerHTML = `
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h4>Chưa có sản phẩm</h4>
                    <p class="text-muted">${message}</p>
                `;
            }
        }
    }

    // Quantity management
    decreaseQuantity(productId) {
        const quantityElement = document.getElementById(`quantity-${productId}`);
        if (quantityElement) {
            const currentQuantity = parseInt(quantityElement.textContent);
            if (currentQuantity > 1) {
                quantityElement.textContent = currentQuantity - 1;
            }
        }
    }

    increaseQuantity(productId) {
        const quantityElement = document.getElementById(`quantity-${productId}`);
        if (quantityElement) {
            const currentQuantity = parseInt(quantityElement.textContent);
            quantityElement.textContent = currentQuantity + 1;
        }
    }

    // Add to cart functionality
    async addToCart(productId) {
        console.log('addToCart called for productId:', productId);
        const quantityElement = document.getElementById(`quantity-${productId}`);
        const quantity = quantityElement ? parseInt(quantityElement.textContent) : 1;
        console.log('Quantity:', quantity);

        // Try to use cartManager if available (same as category-products.js)
        if (window.cartManager) {
            console.log('Using cartManager');
            try {
                await window.cartManager.addItem(productId, quantity);
                const product = this.products.find(p => p.productId === productId);
                const productName = product ? product.name : 'Sản phẩm';
                this.showNotification(`${productName} đã được thêm vào giỏ hàng`, 'success');
                return;
            } catch (error) {
                console.error('Error adding to cart with cartManager:', error);
            }
        }

        // Gọi backend thống nhất
        if (window.app && typeof window.app.addProductToCartBackend === 'function') {
            try {
                await window.app.addProductToCartBackend(productId, quantity, false);
                await window.app.refreshCartBadge?.();
                const product = this.products.find(p => p.productId === productId);
                const productName = product ? product.name : 'Sản phẩm';
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
        let product = null;

        // Try to find product in current products array first
        if (this.products && this.products.length > 0) {
            product = this.products.find(p => p.productId === productId);
        }

        // If not found, fetch from API
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
                                        <a href="/product/${product.productId}?from=brand&brandId=${this.brandId}" class="text-decoration-none text-dark">
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
                                        <a href="/product/${product.productId}?from=brand&brandId=${this.brandId}" 
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

    async addToCartFromQuickView(productId) {
        await this.addToCart(productId);
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('quickViewModal'));
        if (modal) {
            modal.hide();
        }
    }

    // Helper methods for quick view
    getMainImageUrl(product) {
        if (product.images && product.images.length > 0) {
            // Use first image as main image
            return product.images[0].imageUrl || product.images[0];
        }
        return product.mainImageUrl || '/user/img/default-product.jpg';
    }

    generateImageThumbnails(product) {
        // Use product images if available, otherwise fallback to main image
        let images = [];

        if (product.images && product.images.length > 0) {
            // Use actual product images
            images = product.images;
        } else if (product.mainImageUrl) {
            // Fallback to main image
            images = [{ imageUrl: product.mainImageUrl }];
        }

        if (images.length === 0) {
            return '<div class="thumbnail-item active"><img src="/user/img/default-product.jpg" class="img-thumbnail" alt="Default"></div>';
        }

        return images.map((image, index) => `
            <div class="thumbnail-item ${index === 0 ? 'active' : ''}" onclick="brandProductsManager.changeMainImage('${image.imageUrl || image}')">
                <img src="${image.imageUrl || image}" 
                     class="img-thumbnail" 
                     alt="Thumbnail ${index + 1}"
                     onerror="this.src='/user/img/default-product.jpg'">
            </div>
        `).join('');
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
                            onclick="window.brandProductsManager.buyNow(${product.productId})">
                        <i class="fas fa-bolt me-1"></i>
                        Mua ngay
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="window.brandProductsManager.addToCartWithQuantity(${product.productId})">
                        <i class="fas fa-shopping-cart me-1"></i>
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;
    }

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
    }

    generateStarsForModal(rating, reviewCount = 0) {

        // Logic đúng cho Quick View modal
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

    // Buy now - chuẩn từ bestseller-products.js
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

}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname.includes('/brand/')) {
        window.brandProductsManager = new BrandProductsManager();
    }
});
