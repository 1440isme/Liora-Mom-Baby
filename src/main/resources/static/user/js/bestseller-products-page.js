/**
 * Bestseller Products Page Management
 * Handles product listing for bestseller products with filtering and sorting
 */
class BestsellerProductsPageManager {
    constructor() {
        console.log('BestsellerProductsPageManager constructor called');
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
        this.isLoading = false;
    }

    init() {
        console.log('BestsellerProductsPageManager init() called');
        try {
            this.bindEvents();
            console.log('bindEvents completed');
            this.loadBrands();
            this.loadProducts();
            console.log('loadProducts called');
        } catch (error) {
            console.error('Error in init():', error);
        }
    }

    bindEvents() {
        // Price range filter
        const priceRangeSelect = document.getElementById('priceRange');
        if (priceRangeSelect) {
            priceRangeSelect.addEventListener('change', this.handlePriceRangeChange.bind(this));
        }

        // Brand filters
        const brandFilters = document.getElementById('brandFilters');
        if (brandFilters) {
            brandFilters.addEventListener('change', this.handleBrandFilterChange.bind(this));
        }

        // Rating filters
        const ratingInputs = document.querySelectorAll('input[name="rating"]');
        ratingInputs.forEach(input => {
            input.addEventListener('change', this.handleRatingFilterChange.bind(this));
        });

        // Apply filters button
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', this.applyFilters.bind(this));
        }

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', this.handleSortChange.bind(this));
        }
    }



    async loadBrands() {
        console.log('loadBrands called for bestseller products');
        try {
            // Try to load brands with count first
            const response = await fetch('/api/products/best-selling-brands-with-count');
            console.log('Bestseller brands with count API response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Bestseller brands with count API data:', data);
                if (data.code === 1000 && data.result) {
                    console.log('Displaying brands with count:', data.result);
                    this.displayBrandFiltersWithCount(data.result);
                    return;
                }
            }

            // Fallback: try to load brands without count
            console.log('Trying fallback: load brands without count');
            const fallbackResponse = await fetch('/api/products/best-selling-brands');
            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                console.log('Fallback brands data:', fallbackData);
                if (fallbackData.code === 1000 && fallbackData.result) {
                    console.log('Using fallback brands:', fallbackData.result);
                    this.displayBrandFilters(fallbackData.result);
                    return;
                }
            }

            // Final fallback: try to load all brands
            console.log('Trying final fallback: load all brands');
            const finalFallbackResponse = await fetch('/admin/api/brands/all');
            if (finalFallbackResponse.ok) {
                const finalFallbackData = await finalFallbackResponse.json();
                console.log('Final fallback brands data:', finalFallbackData);
                if (finalFallbackData.code === 1000 && finalFallbackData.result) {
                    console.log('Using final fallback brands:', finalFallbackData.result);
                    this.displayBrandFilters(finalFallbackData.result);
                    return;
                }
            }

            console.log('Error loading bestseller brands');
        } catch (error) {
            console.log('Error loading bestseller brands:', error);
        }
    }

    displayBrandFiltersWithCount(brandsWithCount) {
        console.log('displayBrandFiltersWithCount called with brands:', brandsWithCount);
        const brandFilters = document.getElementById('brandFilters');
        if (!brandFilters) {
            console.log('brandFilters element not found!');
            return;
        }

        console.log('brandFilters element found:', brandFilters);

        if (!brandsWithCount || Object.keys(brandsWithCount).length === 0) {
            console.log('No brands to display');
            brandFilters.innerHTML = '<div class="text-muted">Không có thương hiệu nào</div>';
            return;
        }

        // Sort brands by name
        const sortedBrands = Object.entries(brandsWithCount)
            .sort(([a], [b]) => a.localeCompare(b));

        const brandHTML = sortedBrands.map(([brandName, count], index) => `
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" value="${brandName}" id="brand-${brandName}">
                <label class="form-check-label" for="brand-${brandName}">${brandName} (${count})</label>
            </div>
        `).join('');

        console.log('Generated brand HTML with count:', brandHTML);
        brandFilters.innerHTML = brandHTML;

        // Re-bind events for new brand checkboxes
        brandFilters.addEventListener('change', this.handleBrandFilterChange.bind(this));
        console.log('Brand filters with count displayed successfully');
    }

    displayBrandFilters(brands) {
        console.log('displayBrandFilters called with brands:', brands);
        const brandFilters = document.getElementById('brandFilters');
        if (!brandFilters) {
            console.log('brandFilters element not found!');
            return;
        }

        console.log('brandFilters element found:', brandFilters);

        if (!brands || brands.length === 0) {
            console.log('No brands to display');
            brandFilters.innerHTML = '<div class="text-muted">Không có thương hiệu nào</div>';
            return;
        }

        const brandHTML = brands.map(brand => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${brand.brandId}" id="brand_${brand.brandId}">
                <label class="form-check-label" for="brand_${brand.brandId}">${brand.name}</label>
            </div>
        `).join('');

        console.log('Generated brand HTML:', brandHTML);
        brandFilters.innerHTML = brandHTML;

        // Re-bind events for new brand checkboxes
        brandFilters.addEventListener('change', this.handleBrandFilterChange.bind(this));
        console.log('Brand filters displayed successfully');
    }

    handlePriceRangeChange(event) {
        const value = event.target.value;
        if (value) {
            const [minPrice, maxPrice] = value.split(',').map(Number);
            this.currentFilters.minPrice = minPrice;
            this.currentFilters.maxPrice = maxPrice;
        }
    }

    handleBrandFilterChange(event) {
        console.log('Brand filter changed:', event.target.value, event.target.checked);
        // Just log for now, actual filtering will be handled by applyFilters()
    }

    handleRatingFilterChange(event) {
        const checkedRatings = Array.from(document.querySelectorAll('input[name="rating"]:checked'))
            .map(input => parseInt(input.value));
        this.currentFilters.ratings = checkedRatings;
    }

    handleSortChange(event) {
        this.currentFilters.sort = event.target.value;
        this.currentPage = 0; // Reset to first page
        this.loadProducts();
    }

    applyFilters() {
        console.log('applyFilters called');
        
        // Update filters from UI before applying
        this.updateFiltersFromUI();
        this.currentPage = 0;
        this.loadProducts();
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
            search: '',
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

        // Reload products
        this.currentPage = 0;
        this.loadProducts();
    }

    async loadProducts() {
        if (this.isLoading) return;

        console.log('Loading bestseller products...');
        this.isLoading = true;
        this.showLoading();

        try {
            // Ensure filters are up to date
            this.updateFiltersFromUI();
            
            const params = new URLSearchParams({
                page: this.currentPage,
                size: this.pageSize
            });

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
            if (this.currentFilters.sort) {
                // Split the sort value (format: "name,asc" or "price,desc")
                const [sortBy, sortDir] = this.currentFilters.sort.split(',');
                console.log('Sort parameters:', { sortBy, sortDir });
                if (sortBy && sortDir) {
                    params.append('sortBy', sortBy);
                    params.append('sortDir', sortDir);
                }
            }
            console.log('Loading products with params:', params.toString());
            console.log('Current filters:', this.currentFilters);

            const fullUrl = `/api/products/best-selling-advanced?${params}`;
            console.log('Final URL:', fullUrl);

            const response = await fetch(fullUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API response:', data);

            // Accept both 1000 and 200 as success codes
            if (data && (data.code === 1000 || data.code === 200)) {
                // Support both paged and array results
                const result = data.result || {};
                const items = Array.isArray(result) ? result : (result.content || []);
                this.products = items || [];
                this.totalElements = Array.isArray(result) ? this.products.length : (result.totalElements || this.products.length);
                this.totalPages = Array.isArray(result) ? 1 : (result.totalPages || 1);

                console.log('Products loaded:', this.products.length, 'Total:', this.totalElements);

                // Hide loading spinner
                this.showLoading(false);

                // Render products and update UI
                this.renderProducts();
                this.updateResultsCount();
                this.updatePagination();

                // Show empty state if no products match filters
                if (this.products.length === 0) {
                    this.showEmptyState('Không tìm thấy sản phẩm phù hợp');
                }
            } else {
                console.log('API error:', data?.message);
                this.showLoading(false);
                this.showEmptyState('Chưa có sản phẩm bán chạy nào');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showLoading(false);
            this.showEmptyState('Có lỗi xảy ra khi tải sản phẩm');
        } finally {
            this.isLoading = false;
        }
    }

    showLoading(show = true) {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const productsGrid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');

        if (loadingSpinner) loadingSpinner.style.display = show ? 'block' : 'none';
        if (productsGrid) productsGrid.style.display = show ? 'none' : 'block';
        if (emptyState) emptyState.style.display = 'none';
    }

    showEmptyState(message = 'Không tìm thấy sản phẩm') {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const productsGrid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');

        // Hide loading spinner
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        // Hide products grid completely
        if (productsGrid) {
            productsGrid.style.display = 'none';
            productsGrid.style.visibility = 'hidden';
            productsGrid.innerHTML = ''; // Clear any existing content
        }
        
        // Show empty state
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.style.visibility = 'visible';
            
            // Kiểm tra xem có filter nào đang được áp dụng không
            const hasFilters = this.hasActiveFilters();
            
            if (hasFilters) {
                // Hiển thị với nút "Xóa bộ lọc"
                emptyState.innerHTML = `
                    <i class="fas fa-filter fa-3x text-muted mb-3"></i>
                    <h4>Không tìm thấy sản phẩm phù hợp</h4>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc chọn khoảng giá khác</p>
                    <button class="btn btn-outline-primary" onclick="window.bestsellerProductsPageManager.clearFilters()">
                        <i class="fas fa-times me-2"></i>Xóa bộ lọc
                    </button>
                `;
            } else {
                // Hiển thị bình thường không có nút
                emptyState.innerHTML = `
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h4>Không tìm thấy sản phẩm</h4>
                    <p class="text-muted">${message}</p>
                `;
            }
        }

        // Update results count to 0
        this.updateResultsCount();
        
        // Hide pagination when no products
        this.updatePagination();
        
        console.log('Empty state shown - no products match filters:', message);
    }

    // Kiểm tra xem có filter nào đang được áp dụng không
    hasActiveFilters() {
        return !!(
            this.currentFilters.minPrice ||
            this.currentFilters.maxPrice ||
            (this.currentFilters.brands && this.currentFilters.brands.length > 0) ||
            (this.currentFilters.ratings && this.currentFilters.ratings.length > 0)
        );
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        if (!productsGrid) return;

        if (this.products.length === 0) {
            this.showEmptyState();
            return;
        }

        // Hide empty state
        if (emptyState) {
            emptyState.style.display = 'none';
            emptyState.style.visibility = 'hidden';
        }

        // Show and configure grid
        productsGrid.style.display = 'block';
        productsGrid.style.visibility = 'visible';

        const productsHTML = this.products.map(product => this.createProductCard(product)).join('');
        productsGrid.innerHTML = productsHTML;
        
        // Trigger rating load sau khi render xong
        setTimeout(() => {
            if (window.loadProductRatings) {
                window.loadProductRatings();
            }
        }, 500);
        
        console.log(`Rendered ${this.products.length} bestseller products`);
    }

    createProductCard(product) {
        const productStatus = this.getProductStatus(product);
        const statusClass = this.getProductStatusClass(productStatus);

        // Safe property access with fallbacks
        const productId = product.productId || product.id || 0;
        const productName = product.name || 'Tên sản phẩm';
        const brandId = product.brandId || 0;
        const brandName = product.brandName || 'Thương hiệu';
        const reviewCount = product.reviewCount || product.ratingCount || 0;
        const currentPrice = product.currentPrice || product.price || 0;

        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class=" product-card ${statusClass}">
                    <div class="position-relative">
                        <img src="${this.getMainImageUrl(product)}" 
                             class="card-img-top" 
                             alt="${productName}"
                             onerror="this.src='/user/img/default-product.jpg'"
                             onclick="window.location.href='/product/${productId}'"
                             style="cursor: pointer;">
                        
                        <div class="product-actions">
                            <button class="quick-view-btn" 
                                    onclick="if(window.bestsellerProductsPageManager) window.bestsellerProductsPageManager.showQuickView(${productId}); else alert('Chức năng đang được tải...');"
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
                            <a href="/brand/${brandId}" class="text-decoration-none text-muted brand-link">
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
                                    ${this.formatCurrency(currentPrice)}
                                </span>
                                <button class="add-to-cart-icon bestseller-page-cart-btn" 
                                        data-product-id="${productId}"
                                        data-product-name="${productName}"
                                        data-product-price="${currentPrice}"
                                        title="Thêm vào giỏ"
                                        onclick="event.preventDefault(); event.stopPropagation(); window.bestsellerProductsPageManager.addToCart(${productId}, '${productName}', ${currentPrice})">
                                    <i class="fas fa-shopping-cart"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getMainImageUrl(product) {
        // Check for mainImageUrl first (from API response)
        if (product.mainImageUrl) {
            return product.mainImageUrl;
        }

        // Fallback to images array
        if (product.images && product.images.length > 0) {
            return product.images[0].imageUrl;
        }

        return '/user/img/default-product.jpg';
    }

    getProductStatus(product) {
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

    getProductStatusClass(status) {
        switch (status) {
            case 'deactivated': return 'product-deactivated';
            case 'out_of_stock': return 'product-out-of-stock';
            case 'available':
            default: return 'product-available';
        }
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

    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            // Use totalElements for consistency with pagination
            const n = this.totalElements || 0;
            resultsCount.textContent = `Hiển thị ${n} sản phẩm`;
            console.log(`Updated results count: ${n} total products`);
        }
    }

    updatePagination() {
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
                <a class="page-link" href="#" onclick="window.bestsellerProductsPageManager.goToPage(${this.currentPage - 1}); return false;">
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
                    <a class="page-link" href="#" onclick="window.bestsellerProductsPageManager.goToPage(${i}); return false;">${i + 1}</a>
                </li>
            `;
        }

        // Next button
        const nextDisabled = this.currentPage >= this.totalPages - 1 ? 'disabled' : '';
        paginationHTML += `
            <li class="page-item ${nextDisabled}">
                <a class="page-link" href="#" onclick="window.bestsellerProductsPageManager.goToPage(${this.currentPage + 1}); return false;">
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

        // Scroll to top of products
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async addToCart(productId, productName, price) {
        try {
            // Sử dụng addProductToCartBackend để gọi API backend
            if (window.app && window.app.addProductToCartBackend) {
                await window.app.addProductToCartBackend(productId, 1, false);
                await window.app.refreshCartBadge?.();
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showNotification('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
        }
    }

    async showQuickView(productId) {
        const product = this.products.find(p => (p.productId || p.id) === productId);
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
                                            <button class="slider-nav slider-prev" id="quickViewPrevBtn">
                                                <i class="mdi mdi-chevron-left"></i>
                                            </button>
                                            <img id="mainProductImage" 
                                                 src="${this.getMainImageUrl(product)}" 
                                                 class="img-fluid rounded" 
                                                 alt="${product.name}"
                                                 onerror="this.src='/user/img/default-product.jpg'">
                                            <button class="slider-nav slider-next" id="quickViewNextBtn">
                                                <i class="mdi mdi-chevron-right"></i>
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
                                    <p class="brand-name text-muted mb-2">${product.brand || product.brandName || 'N/A'}</p>
                                    
                                    <!-- Product Status -->
                                    <div class="product-status mb-3">
                                        ${this.getProductStatusBadge(product)}
                                        <span class="ms-2 text-muted">Mã sản phẩm: ${product.productId || 'N/A'}</span>
                                    </div>
                                    
                                    <!-- Rating -->
                                    <div class="rating mb-3">
                                        <span class="stars">
                                            ${this.generateStarsForModal(product.rating || product.averageRating || 0, product.reviewCount || 0)}
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
                                            ${this.formatCurrency(product.price)}
                                        </span>
                                        ${product.originalPrice ? `<span class="text-muted ms-2"><s>${this.formatCurrency(product.originalPrice)}</s></span>` : ''}
                                    </div>
                                    
                                    <!-- Quantity Selector -->
                                    <div class="quantity-selector mb-4">
                                        <div class="d-flex align-items-center">
                                            <label class="form-label mb-0" style="margin-right: 2rem;">Số lượng:</label>
                                            <div class="input-group" style="max-width: 150px;">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.bestsellerProductsPageManager.decrementQuantity()">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="quantityInput" onchange="window.bestsellerProductsPageManager.validateQuantity()" oninput="window.bestsellerProductsPageManager.validateQuantity()" onblur="window.bestsellerProductsPageManager.validateQuantityOnBlur()">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.bestsellerProductsPageManager.incrementQuantity()">+</button>
                                            </div>
                                        </div>
                                        <!-- Error Message -->
                                        <div id="quantityError" class="text-danger mt-2" style="display: none;">
                                            <i class="mdi mdi-information me-1"></i>
                                            <span id="quantityErrorMessage">Số lượng tối đa bạn có thể mua là ${Math.min(product.stock || 10, 99)}.</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Actions -->
                                    <div class="d-grid gap-2">
                                        ${this.getQuickViewActions(product)}
                                        
                                        <!-- View Details Button -->
                                        <a href="/product/${product.productId}" 
                                           class="btn btn-outline-primary btn-lg">
                                            <i class="mdi mdi-information me-2"></i>
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

        // Add slider navigation event listeners after modal is shown
        setTimeout(() => {
            this.setupSliderNavigation(product);
        }, 100);

        // Update review data after modal is shown
        setTimeout(() => {
            ProductRatingUtils.updateQuickViewReviewData(product.productId);
        }, 200);

        // Remove modal from DOM when hidden
        document.getElementById('quickViewModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
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
            case 'deactivated':
                return '<span class="badge bg-warning text-dark">Ngừng kinh doanh</span>';
            case 'out_of_stock':
                return '<span class="badge bg-danger">Hết hàng</span>';
            case 'available':
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
                    Sản phẩm đã ngừng kinh doanh! Chúng tôi xin lỗi vì sự bất tiện này. Vui lòng tham khảo các sản phẩm khác.
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
                            onclick="window.bestsellerProductsPageManager.buyNow(${product.productId})">
                        <i class="fas fa-bolt me-1"></i>
                        Mua ngay
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="event.preventDefault(); event.stopPropagation(); window.bestsellerProductsPageManager.addToCartWithQuantity(${product.productId})">
                        <i class="fas fa-shopping-cart me-1"></i>
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;
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

    setupSliderNavigation(product) {
        // Wait for modal to be fully rendered
        setTimeout(() => {
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const mainImage = document.getElementById('mainProductImage');
            const thumbnails = document.querySelectorAll('#quickViewModal .thumbnail-item');

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

    // Quantity management methods for quick view modal
    decrementQuantity(productId) {
        const quantityInput = document.getElementById(`quantityInput_${productId}`);
        if (quantityInput) {
            let currentValue = parseInt(quantityInput.value) || 0;
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                this.validateQuantity(productId);
            }
        }
    }

    incrementQuantity(productId) {
        const quantityInput = document.getElementById(`quantityInput_${productId}`);
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
        const quantityInput = document.getElementById(`quantityInput_${productId}`);
        const errorDiv = document.getElementById(`quantityError_${productId}`);
        const errorMessage = document.getElementById(`quantityErrorMessage_${productId}`);

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
        }
    }

    validateQuantityOnBlur(productId) {
        const quantityInput = document.getElementById(`quantityInput_${productId}`);
        if (quantityInput && (quantityInput.value === '' || quantityInput.value === '0')) {
            quantityInput.value = 1;
        }
        this.validateQuantity(productId);
    }

    // Buy now functionality - chuẩn từ main.js
    async buyNow(productId) {
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        // Get product info for notification
        const product = this.products.find(p => (p.productId || p.id) === productId);

        // Sử dụng buyNowBackend để tick true sản phẩm trong cart
        if (window.app && typeof window.app.buyNowBackend === 'function') {
            try {
                // Close modal trước
                const modal = bootstrap.Modal.getInstance(document.getElementById('quickViewModal'));
                if (modal) {
                    modal.hide();
                }

                // Sử dụng buyNowBackend để tick true và chuyển checkout
                await window.app.buyNowBackend(productId, quantity);
            } catch (error) {
                console.error('Buy now error:', error);
                this.showNotification('Không thể thực hiện Mua ngay. Vui lòng thử lại.', 'error');
            }
        } else {
            this.showNotification('Chức năng đang được tải...', 'error');
        }
    }

    // Add to cart with quantity - chuẩn từ main.js
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

    // Add to cart with specific quantity
    async addToCartWithQuantityValue(productId, productName, price, quantity) {
        try {
            if (window.app && window.app.addProductToCartBackend) {
                await window.app.addProductToCartBackend(productId, quantity, false);
                await window.app.refreshCartBadge?.();
                if (window.app.updateCartDisplay) {
                    window.app.updateCartDisplay();
                }
            }
            this.showNotification(`${quantity} x ${productName} đã được thêm vào giỏ hàng thành công!`, 'success');
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

        let container = document.querySelector('.bestseller-page-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'bestseller-page-toast-container';
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


    // Format currency - chuẩn từ main.js
    formatCurrency(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productsGrid')) {
        window.bestsellerProductsPageManager = new BestsellerProductsPageManager();
    }
});