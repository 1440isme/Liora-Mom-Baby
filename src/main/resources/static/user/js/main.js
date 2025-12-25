// Main JavaScript functionality
class LioraApp {
    constructor() {
        this.currentPage = 'home';
        this.cartItems = [];
        this.wishlistItems = [];
        this.currentUser = null;

        this.init();
    }

    // ========== API HELPER METHODS ==========

    async apiCall(url, method = 'GET', data = null) {
        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        // Thêm Authorization header nếu có token
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method: method,
            headers: headers
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        // Với DELETE request, response có thể là empty body
        if (method === 'DELETE') {
            return { success: true };
        }

        return await response.json();
    }

    // Backend-integrated add to cart: đảm bảo tạo cart (guest/user) và thêm sản phẩm vào DB
    async addProductToCartBackend(productId, quantity = 1, choose = false, showMessage = true) {
        try {
            // 1) Lấy/khởi tạo cart hiện tại (sẽ tạo cart guest nếu chưa có)
            const cartData = await this.apiCall('/cart/api/current', 'GET');
            const cartId = cartData.cartId;
            if (!cartId) {
                console.error('Cart data:', cartData);
                throw new Error('Missing cartId - cart may not be initialized');
            }

            // 2) Gọi API thêm sản phẩm vào giỏ
            const addRaw = await this.apiCall(`/CartProduct/${cartId}`, 'POST', {
                idProduct: Number(productId),
                quantity: Number(quantity)
            });
            const addData = (addRaw && (addRaw.result || addRaw.data?.result)) ? (addRaw.result || addRaw.data.result) : addRaw;

            // 3) Nếu choose = true, tick chọn sản phẩm này
            if (choose && addData && addData.idCartProduct) {
                try {
                    // Gửi đầy đủ thông tin để tránh lỗi NULL constraint
                    const chooseResponse = await this.apiCall(`/CartProduct/${cartId}/${addData.idCartProduct}`, 'PUT', {
                        quantity: addData.quantity, // Gửi quantity hiện tại
                        choose: true
                    });
                } catch (chooseErr) {
                    console.error('Failed to mark product as chosen:', chooseErr);
                    console.error('Choose error details:', {
                        cartId,
                        cartProductId: addData.idCartProduct,
                        error: chooseErr.message,
                        response: chooseErr.response
                    });
                    // Không throw error để không ảnh hưởng đến việc thêm vào giỏ
                }
            }

            // 4) Cập nhật badge header bằng số lượng thực tế từ server
            try {
                // Cập nhật số LOẠI sản phẩm: dùng endpoint count (đếm số dòng CartProduct)
                await this.refreshCartBadge();
            } catch (_) {
                // Fallback local
                this.updateCartDisplay();
            }

            if (showMessage) {
                if (choose) {
                    this.showToast(`${quantity} x đã thêm vào giỏ hàng và được chọn sẵn!`, 'success');
                } else {
                    this.showToast(`${quantity} x đã thêm vào giỏ hàng!`, 'success');
                }
            }
            return addData;
        } catch (err) {
            console.error('addProductToCartBackend error:', err);
            throw err;
        }
    }

    // Buy now: thêm sản phẩm vào cart (để checkout chọn sẵn) rồi chuyển thẳng /checkout
    async buyNowBackend(productId, quantity = 1) {
        try {
            // 1) Lấy/khởi tạo cart
            const cartData = await this.apiCall('/cart/api/current', 'GET');
            const cartId = cartData.cartId;
            if (!cartId) throw new Error('Missing cartId');

            // 2) Thêm sản phẩm
            const addData = await this.apiCall(`/CartProduct/${cartId}`, 'POST', {
                idProduct: Number(productId),
                quantity: Number(quantity)
            });

            // 3) Đánh dấu chọn (choose=true) để checkout hiển thị ngay item này
            let idCartProduct = addData && addData.idCartProduct ? addData.idCartProduct : null;
            if (!idCartProduct) {
                // Fallback: lấy danh sách items trong giỏ để tìm idCartProduct theo idProduct
                try {
                    const items = await this.apiCall(`/cart/api/${cartId}/items`, 'GET');
                    const matches = Array.isArray(items) ? items.filter(it => Number(it.idProduct) === Number(productId)) : [];
                    // Ưu tiên item mới nhất nếu có
                    const matched = matches.length > 0 ? matches[matches.length - 1] : null;
                    if (matched && matched.idCartProduct) {
                        idCartProduct = matched.idCartProduct;
                    } else if (matches.length > 0) {
                        // Nếu vẫn không lấy được id, chọn tất cả matches (an toàn hơn cho UI checkout)
                        for (const it of matches) {
                            try {
                                await this.apiCall(`/CartProduct/${cartId}/${it.idCartProduct}`, 'PUT', { choose: true });
                            } catch (_) { /* ignore */ }
                        }
                    }
                } catch (_) { /* ignore */ }
            }

            if (idCartProduct) {
                try {
                    const parsedQty = Number(addData?.quantity ?? quantity);
                    const validQty = Number.isFinite(parsedQty) && parsedQty >= 1 ? parsedQty : undefined;
                    const body = { choose: true };
                    if (validQty !== undefined) body.quantity = validQty;

                    await this.apiCall(`/CartProduct/${cartId}/${idCartProduct}`, 'PUT', body);
                } catch (_) { /* ignore */ }
            }

            // 4) Chuyển tới checkout
            window.location.href = '/checkout';
        } catch (err) {
            console.error('buyNowBackend error:', err);
            this.showToast('Không thể thực hiện Mua ngay. Vui lòng thử lại.', 'error');
        }
    }
    init() {
        this.bindEvents();
        // Make initialization resilient across pages (e.g., /info)
        try {
            this.loadInitialData();
        } catch (_) { /* ignore to continue auth/header render */ }
        this.checkAuthState();
        this.refreshCartBadge();

        // Listen for login/logout events to update header immediately
        document.addEventListener('user:login', (e) => {
            this.currentUser = e.detail;
            this.updateUserDisplay();
        });
        document.addEventListener('user:logout', () => {
            this.currentUser = null;
            this.updateUserDisplay();

            // Reload product ratings after logout to ensure they are visible
            setTimeout(() => {
                this.reloadProductRatings();
            }, 1000);
        });
    }

    bindEvents() {
        // Category filter events (only for actual filter buttons)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.category-tabs .btn')) {
                e.preventDefault();
                this.handleCategoryFilter(e.target);
            }
        });

        // Handle brand-item clicks (only for non-link elements)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.brand-item')) {
                // Check if it's a link inside brand-item, don't prevent default
                if (e.target.closest('a')) {
                    return; // Let the link work normally
                }
                e.preventDefault();
                const item = e.target.closest('.brand-item');
                this.handleCategoryItemClick(item.textContent.trim());
            }
        });

        // Search functionality
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            let searchTimeout;

            // Input event with debounce
            input.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                searchTimeout = setTimeout(() => {
                    this.handleSearch(query);
                }, 300); // Debounce search
            });

            // Enter key event - immediate search
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(searchTimeout);
                    const query = e.target.value.trim();
                    if (query.length >= 2) {
                        this.handleSearch(query);
                        // Redirect to search results page
                        window.location.href = `/search-results?q=${encodeURIComponent(query)}`;
                    }
                }
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('searchResultsDropdown');
            const searchContainer = e.target.closest('.search-container');

            if (dropdown && !searchContainer) {
                this.hideSearchDropdown();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSearchDropdown();
            }
        });

        // Newsletter subscription
        const newsletterForms = document.querySelectorAll('.newsletter-form');
        newsletterForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSubscription(form);
            });
        });

        // Cart and wishlist events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart')) {
                e.preventDefault();
                const productId = e.target.closest('.add-to-cart').dataset.productId;
                this.addToCart(productId);
            }

            if (e.target.closest('.add-to-wishlist')) {
                e.preventDefault();
                const productId = e.target.closest('.add-to-wishlist').dataset.productId;
                this.toggleWishlist(productId);
            }
        });

        // Prevent opening auth modal if already authenticated
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-bs-target="#authModal"]');
            if (trigger && this.currentUser) {
                e.preventDefault();
                // Ensure header shows dropdown (in case not yet rendered)
                this.updateUserDisplay();
            }
        });

        // Handle copy discount code
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-discount-btn')) {
                const discountName = e.target.getAttribute('data-discount-name');
                navigator.clipboard.writeText(discountName).then(function () {
                    e.target.innerText = 'ĐÃ SAO CHÉP';
                    setTimeout(function () {
                        e.target.innerText = 'SAO CHÉP MÃ';
                    }, 2000);
                }).catch(function (err) {
                    console.error('Could not copy text: ', err);
                });
            }
        });
    }

    showPage(pageName) {
        // Update navigation active state
        document.querySelectorAll('.nav-btn, .nav-btn-mobile').forEach(btn => {
            btn.classList.remove('active');
        });

        document.querySelectorAll(`[data-page="${pageName}"]`).forEach(btn => {
            btn.classList.add('active');
        });

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.loadPageContent(pageName);

            // Reload product ratings when page is shown
            this.reloadProductRatings();
        }

        this.currentPage = pageName;

        // Close mobile menu if open
        const navbarCollapse = document.getElementById('navbarNav');
        if (navbarCollapse.classList.contains('show')) {
            bootstrap.Collapse.getInstance(navbarCollapse).hide();
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    loadPageContent(pageName) {
        const pageElement = document.getElementById(`${pageName}-page`);

        switch (pageName) {
            case 'skincare':
                this.loadCategoryPage(pageElement, 'skincare', 'Skincare Products', 'Discover our complete skincare collection for healthy, glowing skin');
                break;
            case 'makeup':
                this.loadCategoryPage(pageElement, 'makeup', 'Makeup Collection', 'Express your beauty with our vibrant makeup selection');
                break;
            case 'bestsellers':
                this.loadCategoryPage(pageElement, 'bestsellers', 'Bestselling Products', 'Our most loved products chosen by thousands of customers');
                break;
            case 'new-arrivals':
                this.loadCategoryPage(pageElement, 'new-arrivals', 'New Arrivals', 'Be the first to try our latest K-beauty discoveries');
                break;
        }
    }

    reloadProductRatings() {
        // Delay để đảm bảo DOM đã được render xong
        setTimeout(() => {
            // Tìm tất cả product cards trên trang hiện tại
            const productCards = document.querySelectorAll('.product-card, .card.product-card');

            if (productCards.length > 0) {
                // Sử dụng ProductRatingUtils nếu có
                if (window.ProductRatingUtils && typeof ProductRatingUtils.loadAndUpdateProductCards === 'function') {
                    ProductRatingUtils.loadAndUpdateProductCards(productCards);
                } else if (window.loadProductRatings && typeof window.loadProductRatings === 'function') {
                    window.loadProductRatings();
                }
            }

            // Reload ratings cho các trang cụ thể có manager riêng
            this.reloadSpecificPageRatings();
        }, 500);
    }

    reloadSpecificPageRatings() {
        // Reload ratings cho bestseller products homepage
        if (window.bestsellerProductsHomepageManager) {
            if (typeof window.bestsellerProductsHomepageManager.loadProductRatings === 'function') {
                window.bestsellerProductsHomepageManager.loadProductRatings();
            } else if (typeof window.bestsellerProductsHomepageManager.renderBestsellerProducts === 'function') {
                // Trigger re-render which will reload ratings
                const products = window.bestsellerProductsHomepageManager.products || [];
                if (products.length > 0) {
                    window.bestsellerProductsHomepageManager.renderBestsellerProducts(products);
                }
            }
        }

        // Reload ratings cho newest products homepage
        if (window.newestProductsHomepageManager) {
            if (typeof window.newestProductsHomepageManager.loadProductRatings === 'function') {
                window.newestProductsHomepageManager.loadProductRatings();
            } else if (typeof window.newestProductsHomepageManager.renderNewestProducts === 'function') {
                // Trigger re-render which will reload ratings
                const products = window.newestProductsHomepageManager.products || [];
                if (products.length > 0) {
                    window.newestProductsHomepageManager.renderNewestProducts();
                }
            }
        }

        // Reload ratings cho featured category products
        if (window.featuredCategoryProductsManager) {
            if (typeof window.featuredCategoryProductsManager.loadProductRatings === 'function') {
                window.featuredCategoryProductsManager.loadProductRatings();
            } else if (typeof window.featuredCategoryProductsManager.renderProducts === 'function') {
                window.featuredCategoryProductsManager.renderProducts();
            }
        }

        // Reload ratings cho brand products
        if (window.brandProductsManager) {
            if (typeof window.brandProductsManager.loadProductRatings === 'function') {
                window.brandProductsManager.loadProductRatings();
            } else if (typeof window.brandProductsManager.renderProducts === 'function') {
                window.brandProductsManager.renderProducts();
            }
        }

        // Reload ratings cho category products
        if (window.categoryProductsManager) {
            if (typeof window.categoryProductsManager.loadProductRatings === 'function') {
                window.categoryProductsManager.loadProductRatings();
            } else if (typeof window.categoryProductsManager.renderProducts === 'function') {
                window.categoryProductsManager.renderProducts();
            }
        }

        // Reload ratings cho search results
        if (window.searchResultsManager) {
            if (typeof window.searchResultsManager.loadProductRatings === 'function') {
                window.searchResultsManager.loadProductRatings();
            } else if (typeof window.searchResultsManager.renderResults === 'function') {
                window.searchResultsManager.renderResults();
            }
        }

        // Reload ratings cho newest products page
        if (window.newestProductsPageManager) {
            if (typeof window.newestProductsPageManager.loadProductRatings === 'function') {
                window.newestProductsPageManager.loadProductRatings();
            } else if (typeof window.newestProductsPageManager.renderProducts === 'function') {
                window.newestProductsPageManager.renderProducts();
            }
        }

        // Reload ratings cho bestseller products page
        if (window.bestsellerProductsPageManager) {
            if (typeof window.bestsellerProductsPageManager.loadProductRatings === 'function') {
                window.bestsellerProductsPageManager.loadProductRatings();
            } else if (typeof window.bestsellerProductsPageManager.renderProducts === 'function') {
                window.bestsellerProductsPageManager.renderProducts();
            }
        }

        // Reload ratings cho similar products
        if (window.similarProductsManager) {
            if (typeof window.similarProductsManager.loadProductRatingsOptimized === 'function') {
                window.similarProductsManager.loadProductRatingsOptimized();
            }
        }
    }

    loadCategoryPage(pageElement, category, title, subtitle) {
        const products = ProductManager.getProductsByCategory(category);

        pageElement.innerHTML = `
            <div class="category-hero bg-gradient-pink text-white py-5">
                <div class="container text-center">
                    <h1 class="display-4 fw-bold mb-3">${title}</h1>
                    <p class="lead">${subtitle}</p>
                </div>
            </div>
            
            <div class="container py-5">
                <div class="row">
                    <div class="col-lg-3 mb-4">
                        <div class="filter-sidebar bg-white rounded-4 p-4 box-shadow-soft">
                            <h5 class="fw-bold mb-3">Filter Products</h5>
                            
                            <div class="mb-4">
                                <h6 class="fw-semibold mb-2">Price Range</h6>
                                <div class="d-flex gap-2">
                                    <input type="number" class="form-control form-control-sm" placeholder="Min" id="priceMin">
                                    <input type="number" class="form-control form-control-sm" placeholder="Max" id="priceMax">
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <h6 class="fw-semibold mb-2">Brand</h6>
                                <div class="filter-brands">
                                    ${this.getBrandFilters(products)}
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <h6 class="fw-semibold mb-2">Rating</h6>
                                <div class="filter-ratings">
                                    ${this.getRatingFilters()}
                                </div>
                            </div>
                            
                            <button class="btn btn-pink-primary w-100 rounded-pill" onclick="app.applyFilters()">
                                Apply Filters
                            </button>
                        </div>
                    </div>
                    
                    <div class="col-lg-9">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <p class="text-muted mb-0">Showing <span id="productCount">${products.length}</span> products</p>
                            <select class="form-select w-auto" id="sortProducts" onchange="app.sortProducts(this.value)">
                                <option value="default">Sort by: Default</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="rating">Highest Rated</option>
                                <option value="newest">Newest First</option>
                            </select>
                        </div>
                        
                        <div class="row g-4" id="categoryProductsGrid">
                            ${this.renderProductGrid(products)}
                        </div>
                        
                        <!-- Pagination -->
                        <nav class="mt-5">
                            <ul class="pagination justify-content-center">
                                <li class="page-item disabled">
                                    <span class="page-link">Previous</span>
                                </li>
                                <li class="page-item active">
                                    <span class="page-link">1</span>
                                </li>
                                <li class="page-item">
                                    <a class="page-link" href="#">2</a>
                                </li>
                                <li class="page-item">
                                    <a class="page-link" href="#">3</a>
                                </li>
                                <li class="page-item">
                                    <a class="page-link" href="#">Next</a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        `;
    }

    getBrandFilters(products) {
        const brands = [...new Set(products.map(p => p.brand))];
        return brands.map(brand => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${brand}" id="brand-${brand.replace(/\s+/g, '-')}">
                <label class="form-check-label" for="brand-${brand.replace(/\s+/g, '-')}">
                    ${brand}
                </label>
            </div>
        `).join('');
    }

    getRatingFilters() {
        return [4, 3, 2, 1].map(rating => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${rating}" id="rating-${rating}">
                <label class="form-check-label" for="rating-${rating}">
                    ${this.renderStars(rating)} & up
                </label>
            </div>
        `).join('');
    }

    renderProductGrid(products) {
        return products.map(product => `
            <div class="col-md-6 col-xl-4">
                <div class="card product-card h-100">
                    <div class="position-relative overflow-hidden">
                        <img src="${product.image}" class="product-image" alt="${product.name}">
                        <div class="position-absolute top-0 end-0 p-2">
                            <button class="btn btn-dark btn-sm rounded-circle quick-view-btn" 
                                    data-product-id="${product.productId}"
                                    onclick="app.showQuickView(${product.productId})"
                                    title="Xem nhanh">
                                <i class="mdi mdi-eye"></i>
                            </button>
                        </div>
                        ${product.discount ? `
                            <div class="position-absolute top-0 start-0 p-2">
                                <span class="badge bg-danger">-${product.discount}%</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-body">
                        <div class="product-brand">${product.brand || product.brandName || 'N/A'}</div>
                        <h5 class="product-title">
                            <a href="/product/${product.productId}" class="text-decoration-none text-dark">
                                ${product.name}
                            </a>
                        </h5>
                        <div class="rating-stars mb-2">
                            ${this.renderStars(product.rating || product.averageRating || 0)}
                            <span class="rating-text ms-1">(${product.reviewCount || 0})</span>
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
                        
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <span class="product-price">${this.formatCurrency(product.price)}</span>
                                ${product.originalPrice ? `<span class="product-original-price">${this.formatCurrency(product.originalPrice)}</span>` : ''}
                            </div>
                            <button class="btn btn-pink-primary btn-sm rounded-pill add-to-cart" data-product-id="${product.productId}">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderStars(rating) {
        // Nếu rating = 0 hoặc null/undefined, hiển thị 5 sao rỗng
        if (!rating || rating === 0 || rating === '0') {
            return Array(5).fill('<i class="mdi mdi-star-outline"></i>').join('');
        }

        const fullStars = Math.floor(rating);
        const decimalPart = rating % 1;
        const hasHalfStar = decimalPart > 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return [
            ...Array(fullStars).fill('<i class="mdi mdi-star"></i>'),
            ...(hasHalfStar ? ['<i class="mdi mdi-star-half"></i>'] : []),
            ...Array(emptyStars).fill('<i class="mdi mdi-star-outline"></i>')
        ].join('');
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

    handleCategoryFilter(button) {
        // Update active state
        document.querySelectorAll('.category-tabs .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Filter products
        const category = button.dataset.category;
        const products = category === 'all' ? ProductManager.getAllProducts() : ProductManager.getProductsByCategory(category);

        // Update products grid
        const grid = document.getElementById('featured-products-grid');
        if (grid) {
            grid.innerHTML = this.renderProductGrid(products.slice(0, 8)); // Show first 8 products
        }
    }

    handleSearch(query) {
        if (query.length < 2) {
            this.hideSearchDropdown();
            return;
        }

        // Show loading state
        this.showSearchLoading();

        // Call search API
        this.searchProducts(query);
    }

    async searchProducts(query) {
        try {
            const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&size=5`);
            const data = await response.json();

            // Check for both success format (true/false) and code format (1000 for success)
            const isSuccess = (data.success === true) || (data.code === 1000);

            if (isSuccess && data.result) {
                this.displaySearchResults(query, data.result);
            } else {
                this.showSearchError();
            }
        } catch (error) {
            console.error('Search fetch error:', error);
            this.showSearchError();
        }
    }

    displaySearchResults(query, pageData) {
        const dropdown = document.getElementById('searchResultsDropdown');
        const resultsList = document.getElementById('searchResultsList');
        const totalCount = document.getElementById('totalResultsCount');
        const viewMoreLink = document.getElementById('viewMoreLink');

        // Clear previous results
        resultsList.innerHTML = '';

        if (pageData.content && pageData.content.length > 0) {
            // Display products
            pageData.content.forEach(product => {
                const productItem = this.createSearchResultItem(product);
                resultsList.appendChild(productItem);
            });

            // Calculate remaining products
            const totalElements = pageData.totalElements || 0;
            const displayedCount = pageData.content.length;
            const remainingCount = totalElements - displayedCount;

            // Update view more link and count
            if (remainingCount > 0) {
                totalCount.textContent = remainingCount;
                viewMoreLink.href = `/search-results?q=${encodeURIComponent(query)}`;
                viewMoreLink.style.display = 'block';
            } else {
                viewMoreLink.style.display = 'none';
            }

            // Show dropdown
            dropdown.classList.add('show');
        } else {
            // No results
            resultsList.innerHTML = '<div class="search-no-results">Không tìm thấy sản phẩm nào</div>';
            viewMoreLink.style.display = 'none';
            dropdown.classList.add('show');
        }
    }

    createSearchResultItem(product) {
        const item = document.createElement('a');
        item.className = 'search-result-item';
        item.href = `/product/${product.productId}`;

        const mainImage = product.mainImageUrl || '/admin/images/liora-pink.svg';
        const priceDisplay = this.formatCurrency(product.price);

        item.innerHTML = `
            <img src="${mainImage}" alt="${product.name}" class="search-result-image" onerror="this.src='/admin/images/liora-pink.svg'">
            <div class="search-result-info">
                <div class="search-result-name">${product.name}</div>
                <div class="search-result-price">
                    <span class="search-result-current-price">${priceDisplay}</span>
                </div>
            </div>
        `;

        return item;
    }

    showSearchLoading() {
        const dropdown = document.getElementById('searchResultsDropdown');
        const resultsList = document.getElementById('searchResultsList');

        if (resultsList) resultsList.innerHTML = '<div class="search-loading">Đang tìm kiếm...</div>';
        if (dropdown) {
            dropdown.classList.add('show');
        }
    }

    showSearchError() {
        const dropdown = document.getElementById('searchResultsDropdown');
        const resultsList = document.getElementById('searchResultsList');

        resultsList.innerHTML = '<div class="search-no-results">Có lỗi xảy ra khi tìm kiếm</div>';
        dropdown.classList.add('show');
    }

    hideSearchDropdown() {
        const dropdown = document.getElementById('searchResultsDropdown');
        dropdown.classList.remove('show');
    }

    // Test function để kiểm tra dropdown
    testDropdown() {
        const dropdown = document.getElementById('searchResultsDropdown');
        const resultsList = document.getElementById('searchResultsList');

        if (resultsList) resultsList.innerHTML = '<div class="search-loading">Test loading...</div>';
        if (dropdown) {
            dropdown.classList.add('show');
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    handleCategoryItemClick(itemName) {
        // Handle clicks on subcategory items and brand items
        this.showToast(`Browsing: ${itemName}`, 'info');
        // You can implement specific category filtering here
    }

    handleNewsletterSubscription(form) {
        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput.value.trim();

        if (!email) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        // Simulate newsletter subscription
        setTimeout(() => {
            this.showToast('Thank you for subscribing! 🎉 Check your email for a welcome discount.', 'success');
            emailInput.value = '';
        }, 500);
    }

    addToCart(productId, quantity = 1, showMessage = true) {
        this.addProductToCartBackend(productId, quantity, false, showMessage).catch(() => {
            this.showToast('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
        });
    }

    toggleWishlist(productId) {
        const index = this.wishlistItems.indexOf(productId);

        if (index > -1) {
            this.wishlistItems.splice(index, 1);
            this.showToast('Removed from wishlist', 'info');
        } else {
            this.wishlistItems.push(productId);
            this.showToast('Added to wishlist! 💕', 'success');
        }

        // Update wishlist button states
        document.querySelectorAll(`[data-product-id="${productId}"] .mdi-heart`).forEach(icon => {
            icon.className = this.isInWishlist(productId) ? 'mdi mdi-heart text-danger' : 'mdi mdi-heart-outline text-muted';
        });
    }

    isInWishlist(productId) {
        return this.wishlistItems.includes(productId);
    }

    updateCartDisplay() {
        // Fallback: giữ lại để tương thích cũ (dựa vào local state)
        const totalItems = this.cartItems.reduce((total, item) => total + item.quantity, 0);
        document.querySelectorAll('.cart-badge').forEach(badge => {
            badge.textContent = totalItems;
        });
    }

    // Đếm theo số loại sản phẩm (server-side): số dòng CartProduct
    async refreshCartBadge() {
        try {
            const cartData = await this.apiCall('/cart/api/current', 'GET');
            const cartId = cartData && cartData.cartId;
            if (!cartId) return;

            const distinctCount = await this.apiCall(`/cart/api/${cartId}/count`, 'GET');
            document.querySelectorAll('.cart-badge').forEach(badge => {
                badge.textContent = distinctCount;
            });
        } catch (_) {
            // bỏ qua, không chặn UI
        }
    }

    applyFilters() {
        // Get filter values
        const priceMin = document.getElementById('priceMin')?.value || 0;
        const priceMax = document.getElementById('priceMax')?.value || Infinity;

        const selectedBrands = Array.from(document.querySelectorAll('.filter-brands input:checked')).map(cb => cb.value);
        const selectedRatings = Array.from(document.querySelectorAll('.filter-ratings input:checked')).map(cb => parseInt(cb.value));

        // Apply filters
        let filteredProducts = ProductManager.getProductsByCategory(this.currentPage);

        // Price filter
        filteredProducts = filteredProducts.filter(product =>
            product.price >= priceMin && product.price <= priceMax
        );

        // Brand filter
        if (selectedBrands.length > 0) {
            filteredProducts = filteredProducts.filter(product =>
                selectedBrands.includes(product.brand || product.brandName || '')
            );
        }

        // Rating filter
        if (selectedRatings.length > 0) {
            filteredProducts = filteredProducts.filter(product =>
                selectedRatings.some(rating => product.rating >= rating)
            );
        }

        // Update display
        const grid = document.getElementById('categoryProductsGrid');
        const countElement = document.getElementById('productCount');

        if (grid) {
            grid.innerHTML = this.renderProductGrid(filteredProducts);
        }

        if (countElement) {
            countElement.textContent = filteredProducts.length;
        }

        this.showToast(`Applied filters - ${filteredProducts.length} products found`, 'info');
    }

    sortProducts(sortBy) {
        let products = ProductManager.getProductsByCategory(this.currentPage);

        switch (sortBy) {
            case 'price-low':
                products.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                products.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                products.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                products.sort((a, b) => new Date(b.dateAdded || '2024-01-01') - new Date(a.dateAdded || '2024-01-01'));
                break;
            default:
                // Default sort
                break;
        }

        const grid = document.getElementById('categoryProductsGrid');
        if (grid) {
            grid.innerHTML = this.renderProductGrid(products);
        }
    }

    loadInitialData() {
        // Load featured products (only if ProductManager exists on this page)
        const grid = document.getElementById('featured-products-grid');
        if (grid && window.ProductManager && typeof ProductManager.getFeaturedProducts === 'function') {
            const featuredProducts = ProductManager.getFeaturedProducts();
            grid.innerHTML = this.renderProductGrid(featuredProducts);
        }

        // Load reviews (only if ReviewManager exists on this page)
        if (window.ReviewManager && typeof ReviewManager.loadReviews === 'function') {
            ReviewManager.loadReviews();
        }

        // Load categories for header with delay to ensure DOM is ready
        setTimeout(() => {
            this.loadHeaderCategories();
        }, 100);
    }

    // Load categories for header dropdown
    async loadHeaderCategories() {
        try {
            const response = await fetch('/api/header/categories/api');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.result && data.result.length > 0) {
                this.renderHeaderCategories(data.result);
            } else {
                this.renderEmptyCategories();
            }
        } catch (error) {
            console.error('Error loading header categories:', error);
            this.renderEmptyCategories();
        }
    }

    // Render categories in header dropdown
    renderHeaderCategories(categories) {
        // Render all 3 columns immediately
        this.renderAllCategories(categories);
    }

    // Render all categories in 3-tier structure like Guardian
    renderAllCategories(categories) {
        // Try multiple selectors to find columns (3-column layout like image)
        let leftColumn = document.querySelector('.category-column:first-child .category-list');
        let middleColumn = document.querySelector('.category-column:nth-child(2) .subcategory-list');
        let rightColumn = document.querySelector('.category-column:nth-child(3) .product-list');

        // Fallback selectors for Bootstrap grid structure
        if (!leftColumn) {
            leftColumn = document.querySelector('.col-md-3:first-child .category-list');
        }
        if (!middleColumn) {
            middleColumn = document.querySelector('.col-md-4:nth-child(2) .subcategory-list');
        }
        if (!rightColumn) {
            rightColumn = document.querySelector('.col-md-5:nth-child(3) .product-list');
        }

        // Another fallback - direct class selection
        if (!leftColumn) {
            leftColumn = document.querySelector('.category-list');
        }
        if (!middleColumn) {
            middleColumn = document.querySelector('.subcategory-list');
        }
        if (!rightColumn) {
            rightColumn = document.querySelector('.product-list');
        }

        if (!leftColumn || !middleColumn || !rightColumn) {
            return;
        }

        // Clear all columns
        leftColumn.innerHTML = '';
        middleColumn.innerHTML = '';
        rightColumn.innerHTML = '';

        // Collect all level 2 and level 3 categories
        const allLevel2Categories = [];
        const allLevel3Categories = [];

        categories.forEach(level1Category => {
            if (level1Category.children) {
                level1Category.children.forEach(level2Category => {
                    allLevel2Categories.push(level2Category);

                    if (level2Category.children) {
                        level2Category.children.forEach(level3Category => {
                            allLevel3Categories.push({
                                ...level3Category,
                                parentLevel2Id: level2Category.categoryId,
                                parentLevel2Name: level2Category.name
                            });
                        });
                    }
                });
            }
        });

        // Sort categories alphabetically for better organization
        const sortedCategories = categories.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

        // Render Level 1 categories in left column with hover functionality
        sortedCategories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item guardian-style';
            categoryItem.dataset.categoryId = category.categoryId;
            categoryItem.dataset.categoryName = category.name;
            categoryItem.dataset.children = JSON.stringify(category.children || []);
            categoryItem.textContent = category.name;

            // Add hover event to show subcategories
            categoryItem.addEventListener('mouseenter', () => {
                // Remove active class from all items
                document.querySelectorAll('.category-item.guardian-style').forEach(item => {
                    item.classList.remove('active');
                });

                // Add active class to current item
                categoryItem.classList.add('active');

                this.showSubcategoriesForCategory(category, middleColumn, rightColumn);
            });


            leftColumn.appendChild(categoryItem);
        });

        // Show first category by default
        if (categories.length > 0) {
            // Add active class to first item
            const firstItem = leftColumn.querySelector('.category-item.guardian-style:first-child');
            if (firstItem) {
                firstItem.classList.add('active');
            }
            this.showSubcategoriesForCategory(categories[0], middleColumn, rightColumn);
        }
    }

    // Show subcategories for a specific level 1 category
    showSubcategoriesForCategory(category, middleColumn, rightColumn) {
        // Clear existing content
        middleColumn.innerHTML = '';
        rightColumn.innerHTML = '';

        if (category.children && category.children.length > 0) {
            // Get all level 2 and level 3 categories for this level 1 category
            const level2Categories = category.children;
            const allLevel3Categories = [];

            level2Categories.forEach(level2Category => {
                if (level2Category.children) {
                    level2Category.children.forEach(level3Category => {
                        allLevel3Categories.push({
                            ...level3Category,
                            parentLevel2Id: level2Category.categoryId,
                            parentLevel2Name: level2Category.name
                        });
                    });
                }
            });

            // Render level 2 categories in 4-column grid
            this.renderLevel2Categories(level2Categories, allLevel3Categories, middleColumn, rightColumn);
        } else {
            // Show empty state
            middleColumn.innerHTML = '<div class="empty-message">Chưa có danh mục con</div>';
            rightColumn.innerHTML = '<div class="empty-message">Chưa có sản phẩm</div>';
        }
    }

    // Render Level 2 categories with their Level 3 children (4 categories per row)
    renderLevel2Categories(level2Categories, level3Categories, middleColumn, rightColumn) {
        // Sort level 2 categories alphabetically
        const sortedLevel2Categories = level2Categories.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

        // Create a single row with 4 level 2 categories
        const level2Row = document.createElement('div');
        level2Row.className = 'level2-row';
        level2Row.style.cssText = 'display: flex; gap: 20px; width: 100%; margin-bottom: 20px;';

        // Render first 4 level 2 categories in a single row
        sortedLevel2Categories.slice(0, 4).forEach(level2Category => {
            const level2Item = document.createElement('div');
            level2Item.className = 'level2-item';
            level2Item.style.cssText = 'flex: 1; min-width: 200px;';

            // Get level 3 items for this category and sort them
            const level3Items = level3Categories.filter(level3 =>
                level3.parentLevel2Id === level2Category.categoryId
            ).sort((a, b) => a.name.localeCompare(b.name, 'vi'));

            this.renderCategoryGroup(level2Category, level3Items, level2Item);
            level2Row.appendChild(level2Item);
        });

        // Add the row to middle column
        middleColumn.appendChild(level2Row);

        // If there are more than 4 categories, render the rest in right column
        if (sortedLevel2Categories.length > 4) {
            sortedLevel2Categories.slice(4).forEach(level2Category => {
                const level3Items = level3Categories.filter(level3 =>
                    level3.parentLevel2Id === level2Category.categoryId
                ).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
                this.renderCategoryGroup(level2Category, level3Items, rightColumn);
            });
        }
    }

    // Old method removed - using single row layout

    // Render a single category group with header and items
    renderCategoryGroup(level2Category, level3Items, column) {
        // Category header (bold, uppercase) - ALWAYS show header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-group-header';
        categoryHeader.style.cssText = `
            font-weight: bold; 
            color: #333; 
            margin: 16px 0 8px 0; 
            padding: 8px 0; 
            border-bottom: 1px solid #e0e0e0; 
            text-transform: uppercase; 
            font-size: 14px;
            letter-spacing: 0.5px;
        `;
        categoryHeader.textContent = level2Category.name;
        column.appendChild(categoryHeader);

        // Level 3 items in vertical list - show even if empty
        if (level3Items && level3Items.length > 0) {
            level3Items.forEach(level3Category => {
                const level3Item = document.createElement('div');
                level3Item.className = 'level3-vertical-item';
                level3Item.style.cssText = `
                    padding: 6px 0; 
                    margin: 2px 0; 
                    cursor: pointer; 
                    transition: all 0.2s ease; 
                    font-size: 13px; 
                    color: #666; 
                    border-left: 3px solid transparent;
                    padding-left: 8px;
                `;
                level3Item.textContent = level3Category.name;
                level3Item.dataset.categoryId = level3Category.categoryId;

                // Add hover effect
                level3Item.addEventListener('mouseenter', () => {
                    level3Item.style.backgroundColor = '#f8f9fa';
                    level3Item.style.color = '#333';
                    level3Item.style.borderLeftColor = 'var(--pink-primary)';
                    level3Item.style.paddingLeft = '12px';
                });

                level3Item.addEventListener('mouseleave', () => {
                    level3Item.style.backgroundColor = 'transparent';
                    level3Item.style.color = '#666';
                    level3Item.style.borderLeftColor = 'transparent';
                    level3Item.style.paddingLeft = '8px';
                });

                // Add click handler
                level3Item.addEventListener('click', () => {
                    window.location.href = `/product/view/category/${level3Category.categoryId}`;
                });

                column.appendChild(level3Item);
            });
        }
        // Don't show empty message - just show header
    }

    // Render Level 3 categories in vertical list (no grid)
    renderLevel3Categories(level3Categories, column) {
        // Group level 3 categories by their parent level 2
        const groupedByParent = {};

        level3Categories.forEach(level3Category => {
            const parentId = level3Category.parentLevel2Id;
            if (!groupedByParent[parentId]) {
                groupedByParent[parentId] = [];
            }
            groupedByParent[parentId].push(level3Category);
        });

        // Render each group with its parent name as header
        Object.keys(groupedByParent).forEach(parentId => {
            const level3Items = groupedByParent[parentId];
            const parentName = level3Items[0]?.parentLevel2Name || 'Danh mục';

            // Parent header
            const parentHeader = document.createElement('div');
            parentHeader.className = 'level3-parent-header';
            parentHeader.style.cssText = 'font-weight: bold; color: #333; margin: 16px 0 8px 0; padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-transform: uppercase; font-size: 14px;';
            parentHeader.textContent = parentName;
            column.appendChild(parentHeader);

            // Level 3 items in vertical list
            level3Items.forEach(level3Category => {
                const level3Item = document.createElement('div');
                level3Item.className = 'level3-vertical-item';
                level3Item.style.cssText = `
                    padding: 8px 0; 
                    margin: 2px 0; 
                    cursor: pointer; 
                    transition: all 0.2s ease; 
                    font-size: 13px; 
                    color: #666; 
                    border-left: 3px solid transparent;
                    padding-left: 8px;
                `;
                level3Item.textContent = level3Category.name;
                level3Item.dataset.categoryId = level3Category.categoryId;

                // Add hover effect
                level3Item.addEventListener('mouseenter', () => {
                    level3Item.style.backgroundColor = '#f8f9fa';
                    level3Item.style.color = '#333';
                    level3Item.style.borderLeftColor = 'var(--pink-primary)';
                    level3Item.style.paddingLeft = '12px';
                });

                level3Item.addEventListener('mouseleave', () => {
                    level3Item.style.backgroundColor = 'transparent';
                    level3Item.style.color = '#666';
                    level3Item.style.borderLeftColor = 'transparent';
                    level3Item.style.paddingLeft = '8px';
                });

                // Add click handler
                level3Item.addEventListener('click', () => {
                    window.location.href = `/product/view/category/${level3Category.categoryId}`;
                });

                column.appendChild(level3Item);
            });
        });
    }

    // Old method removed - using new grid layout for level 2 and vertical list for level 3


    // No need for complex event binding since we render everything immediately

    // All old methods removed - using new Guardian-style layout

    // Show error message when API fails
    showErrorMessage() {
        const leftColumn = document.querySelector('.category-column:first-child .category-list');
        if (leftColumn) {
            leftColumn.innerHTML = `
                <div class="category-loading text-danger">
                    <i class="mdi mdi-alert-circle"></i>
                    Lỗi tải danh mục. Vui lòng thử lại.
                </div>
            `;
        }
    }

    // Show message when no categories found
    showNoCategoriesMessage() {
        const leftColumn = document.querySelector('.category-column:first-child .category-list');
        if (leftColumn) {
            leftColumn.innerHTML = `
                <div class="category-loading text-muted">
                    <i class="mdi mdi-information"></i>
                    Chưa có danh mục nào.
                </div>
            `;
        }
    }

    // Render empty state when no categories are available
    renderEmptyCategories() {
        const categoriesContainer = document.getElementById('categoriesMenu');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted mb-0">Chưa có danh mục sản phẩm</p>
                </div>
            `;
        }
    }

    checkAuthState() {
        // Check if user is logged in (from localStorage)
        const userData = localStorage.getItem('liora_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            // Hydrate roles/isAdmin from access_token if missing
            const lacksRoles = !Array.isArray(this.currentUser.roles) || this.currentUser.roles.length === 0;
            const notAdminFlag = this.currentUser.isAdmin !== true;
            if (lacksRoles || notAdminFlag) {
                try {
                    const token = localStorage.getItem('access_token');
                    if (token) {
                        const payload = this.parseJwt(token);
                        const roles = this.extractRolesFromPayload(payload);
                        const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN') || roles.includes('MANAGER') || roles.includes('ROLE_MANAGER');
                        this.currentUser = { ...this.currentUser, roles, isAdmin };
                        localStorage.setItem('liora_user', JSON.stringify(this.currentUser));
                    }
                } catch (_) { }
            }
            this.updateUserDisplay();
        } else {
            this.updateUserDisplay();
        }
    }

    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join(''));
            return JSON.parse(jsonPayload);
        } catch (_) { return {}; }
    }

    extractRolesFromPayload(payload) {
        try {
            if (!payload) return [];
            if (Array.isArray(payload.roles)) return payload.roles.map(r => String(r).toUpperCase());
            if (Array.isArray(payload.authorities)) return payload.authorities.map(r => String(r).toUpperCase());
            if (typeof payload.scope === 'string') return payload.scope.split(' ').map(r => r.toUpperCase());
            if (payload.realm_access && Array.isArray(payload.realm_access.roles)) return payload.realm_access.roles.map(r => r.toUpperCase());
            return [];
        } catch (_) { return []; }
    }

    updateUserDisplay() {
        const userSection = document.getElementById('desktop-user-section');
        const mobileUserSection = document.getElementById('mobile-user-section');
        const mobileMenuAccountSection = document.getElementById('mobile-menu-account-section');

        if (this.currentUser) {
            const displayName = this.currentUser.name || this.currentUser.username || 'User';
            const rolesArr = Array.isArray(this.currentUser.roles) ? this.currentUser.roles.map(r => String(r).toUpperCase()) : [];
            const isAdmin = this.currentUser.isAdmin === true || rolesArr.includes('ADMIN') || rolesArr.includes('ROLE_ADMIN') || rolesArr.includes('MANAGER') || rolesArr.includes('ROLE_MANAGER');
            const adminLink = isAdmin ? `<li><a class="dropdown-item" href="/admin" id="adminPanelLink"><i class="mdi mdi-cog me-2"></i>Trang quản trị</a></li>` : '';

            const userHTML = `
                <div class="dropdown">
                    <button class="btn btn-user dropdown-toggle" type="button" id="userMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="mdi mdi-account-circle me-1"></i>
                        <span>${displayName}</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuButton">
                        <li class="dropdown-header">Xin chào, ${displayName}</li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="/info" onclick="app.openUserInfo()"><i class="mdi mdi-account me-2"></i>Thông tin cá nhân</a></li>
                        ${adminLink}
                        <li><a class="dropdown-item" href="/home" onclick="app.signOut()"><i class="mdi mdi-logout me-2"></i>Đăng xuất</a></li>
                    </ul>
                </div>
            `;

            const mobileUserHTML = `
                <a href="#" class="btn-user-mobile" onclick="toggleMobileMenu()">
                    <i class="mdi mdi-account-circle"></i>
                </a>
            `;

            const mobileMenuAccountHTML = `
                <div class="mobile-account-info">
                    <i class="mdi mdi-account-circle"></i>
                    <div class="mobile-account-text">
                        <div class="mobile-account-title">TÀI KHOẢN</div>
                        <div class="mobile-account-user-name">${displayName}</div>
                    </div>
                </div>
                <div class="mobile-account-actions">
                    <a href="/info" class="mobile-account-action" onclick="app.openUserInfo()">
                        <i class="mdi mdi-account"></i>
                        <span>Thông tin cá nhân</span>
                    </a>
                    ${isAdmin ? '<a href="/admin" class="mobile-account-action"><i class="mdi mdi-cog"></i><span>Trang quản trị</span></a>' : ''}
                    <a href="#" class="mobile-account-action" onclick="app.signOut()">
                        <i class="mdi mdi-logout"></i>
                        <span>Đăng xuất</span>
                    </a>
                </div>
            `;

            if (userSection) userSection.innerHTML = userHTML;
            if (mobileUserSection) mobileUserSection.innerHTML = mobileUserHTML;
            if (mobileMenuAccountSection) mobileMenuAccountSection.innerHTML = mobileMenuAccountHTML;

            // Show user actions in mobile menu when logged in
            const mobileUserActions = document.getElementById('mobile-user-actions');
            const mobileNavigationSection = document.getElementById('mobile-navigation-section');

            if (mobileUserActions && mobileNavigationSection) {
                mobileUserActions.style.display = 'block';
                mobileNavigationSection.style.display = 'none';
            }
        } else {
            const userHTML = `
                <button class="btn btn-user" data-bs-toggle="modal" data-bs-target="#authModal">
                    <i class="mdi mdi-account-circle me-1"></i>
                    <span>Đăng nhập / Đăng ký Liora</span>
                </button>
            `;

            const mobileUserHTML = `
                <button class="btn-user-mobile" data-bs-toggle="modal" data-bs-target="#authModal">
                    <i class="mdi mdi-account-circle"></i>
                </button>
            `;

            const mobileMenuAccountHTML = `
                <div class="mobile-account-info">
                    <i class="mdi mdi-account-circle"></i>
                    <div class="mobile-account-text">
                        <div class="mobile-account-title">TÀI KHOẢN</div>
                        <a href="#" class="mobile-account-link" data-bs-toggle="modal" data-bs-target="#authModal">
                            Đăng nhập / Đăng ký
                        </a>
                    </div>
                </div>
            `;

            if (userSection) userSection.innerHTML = userHTML;
            if (mobileUserSection) mobileUserSection.innerHTML = mobileUserHTML;
            if (mobileMenuAccountSection) mobileMenuAccountSection.innerHTML = mobileMenuAccountHTML;

            // Hide user actions in mobile menu when not logged in
            const mobileUserActions = document.getElementById('mobile-user-actions');
            const mobileNavigationSection = document.getElementById('mobile-navigation-section');

            if (mobileUserActions && mobileNavigationSection) {
                mobileUserActions.style.display = 'none';
                mobileNavigationSection.style.display = 'block';
            }
        }
    }

    // Toggle mobile menu function
    toggleMobileMenu() {
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        if (mobileMenuOverlay) {
            mobileMenuOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    signOut() {
        localStorage.removeItem('liora_user');
        localStorage.removeItem('access_token');
        try { document.cookie = 'access_token=; Max-Age=0; path=/; SameSite=Lax'; } catch (_) { }
        this.currentUser = null;
        this.updateUserDisplay();
        this.showToast('Signed out successfully', 'success');
        document.dispatchEvent(new CustomEvent('user:logout'));

        // Always redirect to /home (works across pages like /info)
        // Commented out to allow navigation to other pages
        // try {
        //     if (window && window.location && window.location.pathname !== '/home') {
        //         window.location.href = '/home';
        //         return;
        //     }
        // } catch (_) { }
        // Fallback for SPA context
        this.showPage('home');
    }

    showToast(message, type = 'info') {
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            // Tạo container nếu chưa có để tránh lỗi trên các trang không có sẵn
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }
        // Deduplicate: if a toast with exactly the same message is currently present, do not add another
        try {
            const existing = Array.from(toastContainer.querySelectorAll('.toast .toast-body'))
                .map(el => ({ body: el, toast: el.closest('.toast') }))
                .find(item => (item.body.textContent || '').trim() === (message || '').trim());
            if (existing && existing.toast) {
                // If it's already visible, just restart its timer instead of duplicating
                const instance = bootstrap.Toast.getInstance(existing.toast) || new bootstrap.Toast(existing.toast, { delay: 4000 });
                instance.show();
                return;
            }
        } catch (_) { /* noop */ }
        const toastId = 'toast-' + Date.now();

        const toastHTML = `
            <div id="${toastId}" class="toast ${type}" role="alert">
                <div class="toast-header">
                    <i class="mdi mdi-${type === 'success' ? 'check-circle text-success' : type === 'error' ? 'alert-circle text-danger' : 'information text-info'} me-2"></i>
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

    // Open user info (placeholder: show toast; integrate profile modal/page later)
    openUserInfo() {
        if (!this.currentUser) {
            this.showToast('Bạn chưa đăng nhập', 'error');
            return;
        }
        const name = this.currentUser.name || this.currentUser.username || 'User';
        this.showToast(`Tài khoản: ${name}`, 'info');
        // TODO: navigate to profile page or open profile modal
        // window.location.href = '/profile';
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
            { max: Infinity, percentage: 100 } // >10000: 95-100%/
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

    // Show quick view popup
    async showQuickView(productId) {
        // Validate productId
        if (!productId || productId === 'undefined' || productId === 'null') {
            console.error('Invalid productId:', productId);
            this.showToast('Lỗi: Không tìm thấy sản phẩm', 'error');
            return;
        }

        let product = null;

        // Try to find product in current products array first
        if (this.products && Array.isArray(this.products)) {
            product = this.products.find(p => p.id === productId);
        }

        // If not found, try to find in other managers
        if (!product) {
            // Try bestseller products manager
            if (window.bestsellerProductsManager && window.bestsellerProductsManager.products) {
                product = window.bestsellerProductsManager.products.find(p => p.id === productId);
            }

            // Try newest products manager
            if (!product && window.newestProductsManager && window.newestProductsManager.products) {
                product = window.newestProductsManager.products.find(p => p.id === productId);
            }

            // Try bestseller products homepage manager
            if (!product && window.bestsellerProductsHomepageManager && window.bestsellerProductsHomepageManager.products) {
                product = window.bestsellerProductsHomepageManager.products.find(p => p.id === productId);
            }

            // Try newest products homepage manager
            if (!product && window.newestProductsHomepageManager && window.newestProductsHomepageManager.products) {
                product = window.newestProductsHomepageManager.products.find(p => p.id === productId);
            }
        }

        // If still not found, try to fetch from API
        if (!product) {
            try {
                const response = await fetch(`/api/products/${productId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.code === 1000 && data.result) {
                        product = data.result;
                    }
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        }

        if (!product) {
            this.showToast('Không tìm thấy sản phẩm', 'error');
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
                                                <button class="btn btn-outline-secondary" type="button" onclick="app.decrementQuantity()">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="quantityInput" onchange="app.validateQuantity()" oninput="app.validateQuantity()" onblur="app.validateQuantityOnBlur()">
                                                <button class="btn btn-outline-secondary" type="button" onclick="app.incrementQuantity()">+</button>
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

    // Setup slider navigation
    setupSliderNavigation(product) {
        const prevBtn = document.getElementById('quickViewPrevBtn');
        const nextBtn = document.getElementById('quickViewNextBtn');
        const mainImage = document.getElementById('mainProductImage');
        const thumbnails = document.querySelectorAll('.thumbnail-item');

        if (!product.images || product.images.length <= 1) {
            // Hide navigation buttons if only one image
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            return;
        }

        // Show navigation buttons
        if (prevBtn) prevBtn.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'block';

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

        // Remove existing event listeners to prevent duplicates
        if (prevBtn) {
            prevBtn.replaceWith(prevBtn.cloneNode(true));
        }
        if (nextBtn) {
            nextBtn.replaceWith(nextBtn.cloneNode(true));
        }

        // Get fresh references after replacement
        const newPrevBtn = document.getElementById('quickViewPrevBtn');
        const newNextBtn = document.getElementById('quickViewNextBtn');

        // Previous button
        if (newPrevBtn) {
            newPrevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : product.images.length - 1;
                updateMainImage(currentImageIndex);
            });
        }

        // Next button
        if (newNextBtn) {
            newNextBtn.addEventListener('click', (e) => {
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
            const mainImage = product.image || '/user/img/default-product.jpg';
            images = [mainImage];
        }

        return images.map((image, index) => `
            <div class="thumbnail-item ${index === 0 ? 'active' : ''}" 
                 onclick="app.changeMainImage('${image}')">
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
        // Validate productId
        if (!productId || productId === 'undefined' || productId === 'null') {
            console.error('Invalid productId:', productId);
            this.showToast('Lỗi: Không tìm thấy sản phẩm', 'error');
            return;
        }

        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

        // Gọi backend để đảm bảo tạo cart (guest/user) và thêm sản phẩm
        this.addProductToCartBackend(productId, quantity, true, true).catch(() => {
            this.showToast('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
        });
    }

    // Buy now - chuẩn từ bestseller-products.js
    async buyNow(productId) {
        // Lấy số lượng từ input trong QuickView
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? (parseInt(quantityInput.value) || 1) : 1;

        // Đóng modal trước khi chuyển trang
        const modal = bootstrap.Modal.getInstance(document.getElementById('quickViewModal'));
        if (modal) {
            modal.hide();
        }

        // Gọi buyNowBackend để thêm vào giỏ (tick choose=true) và chuyển tới checkout
        try {
            await this.buyNowBackend(productId, quantity);
        } catch (error) {
            console.error('buyNow error:', error);
            this.showToast('Không thể thực hiện Mua ngay. Vui lòng thử lại.', 'error');
        }
    }

    // Get main image URL for product
    getMainImageUrl(product) {
        if (product.images && product.images.length > 0) {
            // Use first image as main image
            return product.images[0].imageUrl || product.images[0];
        }
        return product.image || '/user/img/default-product.jpg';
    }

    // Quantity validation methods
    validateQuantity() {
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
    }

    // Handle input blur - validate when user finishes typing
    validateQuantityOnBlur() {
        const quantityInput = document.getElementById('quantityInput');
        if (!quantityInput) return;

        const currentValue = parseInt(quantityInput.value) || 0;
        const maxStock = parseInt(quantityInput.getAttribute('max')) || 10;

        // If input is empty or 0, set to minimum
        if (quantityInput.value === '' || currentValue < 1) {
            quantityInput.value = 1;
            this.validateQuantity();
        }
    }

    incrementQuantity() {
        const quantityInput = document.getElementById('quantityInput');
        if (!quantityInput) return;

        const currentValue = parseInt(quantityInput.value) || 0;
        const maxStock = parseInt(quantityInput.getAttribute('max')) || 10;
        const maxAllowed = Math.min(maxStock, 99); // Tối đa 99 sản phẩm

        if (currentValue < maxAllowed) {
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

    // Product status helper functions for quick view
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

    getProductStatusBadge(product) {
        const status = this.getProductStatus(product);
        switch (status) {
            case 'deactivated':
                return '<span class="badge bg-warning">Ngừng kinh doanh</span>';
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
                            onclick="app.buyNow(${product.productId})">
                        <i class="mdi mdi-lightning-bolt me-1"></i>
                        Mua ngay
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="app.addToCartWithQuantity(${product.productId})">
                        <i class="mdi mdi-cart-plus me-1"></i>
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;
    }

}

// Global function for page navigation (called from HTML onclick)
function showPage(pageName) {
    app.showPage(pageName);
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new LioraApp();
    window.app = app; // Make app globally available
    // Ensure user UI renders after all fragments load
    setTimeout(() => {
        app.updateUserDisplay();
    }, 0);
});

// Global function to reload product ratings (for external use)
window.reloadProductRatings = function () {
    if (app && typeof app.reloadProductRatings === 'function') {
        app.reloadProductRatings();
    } else {
        console.warn('App not initialized or reloadProductRatings method not available');
    }
};

// Export for use in other scripts
window.LioraApp = LioraApp;

// ========================================
// BANNER SLIDER CLASS
// ========================================
class BannerSlider {
    constructor() {
        this.slider = document.getElementById('bannerSlider');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.dotsContainer = document.getElementById('sliderDots');
        this.currentSlide = 0;
        this.banners = [];
        this.isDragging = false;
        this.hasMoved = false;
        this.startX = 0;
        this.currentX = 0;
        this.autoSlideInterval = null;
        this.isInitialized = false;

        // Only initialize if elements exist (on home page)
        if (this.slider && this.prevBtn && this.nextBtn && this.dotsContainer) {
            this.init();
        }
    }

    async init() {
        try {
            await this.loadBanners();
            this.renderSlides();
            this.renderDots();
            this.bindEvents();
            this.startAutoSlide();
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing banner slider:', error);
        }
    }

    async loadBanners() {
        try {
            const response = await fetch('/content/api/banners', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Handle different response formats
            if (Array.isArray(data)) {
                this.banners = data;
            } else if (data && Array.isArray(data.value)) {
                this.banners = data.value;
            } else if (data && Array.isArray(data.data)) {
                this.banners = data.data;
            } else {
                this.banners = [];
            }

            // If no banners, show default content
            if (this.banners.length === 0) {
                this.banners = [{
                    id: 1,
                    title: "Chào mừng đến với Liora",
                    imageUrl: "/user/img/banner.jpg",
                    targetLink: "#"
                }];
            }
        } catch (error) {
            console.error('Error loading banners:', error);
            // Fallback content
            this.banners = [{
                id: 1,
                title: "Chào mừng đến với Liora",
                imageUrl: "/user/img/banner.jpg",
                targetLink: "#"
            }];
        }
    }

    renderSlides() {
        if (!this.slider) return;

        this.slider.innerHTML = '';

        this.banners.forEach((banner, index) => {
            const slide = document.createElement('div');
            slide.className = 'banner-slide';
            slide.style.backgroundImage = `url(${banner.imageUrl})`;

            // Add click handler with drag detection
            slide.addEventListener('click', (e) => {
                // Only redirect if it's a click (not a drag)
                if (!this.isDragging && !this.hasMoved) {
                    if (banner.targetLink) {
                        window.open(banner.targetLink, '_blank');
                    }
                }
            });

            this.slider.appendChild(slide);
        });

        // Set initial position
        this.slider.style.transform = 'translateX(0%)';
    }

    renderDots() {
        if (!this.dotsContainer) return;

        this.dotsContainer.innerHTML = '';

        this.banners.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => this.goToSlide(index));
            this.dotsContainer.appendChild(dot);
        });
    }

    bindEvents() {
        if (!this.slider || !this.prevBtn || !this.nextBtn) return;

        // Navigation buttons
        this.prevBtn.addEventListener('click', () => this.prevSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());

        // Touch/Mouse events for dragging
        this.slider.addEventListener('mousedown', (e) => this.startDrag(e));
        this.slider.addEventListener('touchstart', (e) => this.startDrag(e));

        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('touchmove', (e) => this.drag(e));

        document.addEventListener('mouseup', () => this.endDrag());
        document.addEventListener('touchend', () => this.endDrag());

        // Pause auto-slide on hover
        this.slider.addEventListener('mouseenter', () => this.stopAutoSlide());
        this.slider.addEventListener('mouseleave', () => this.startAutoSlide());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prevSlide();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextSlide();
            }
        });
    }

    startDrag(e) {
        if (!this.isInitialized) return;

        this.isDragging = true;
        this.hasMoved = false;
        this.startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        this.slider.style.cursor = 'grabbing';
        this.stopAutoSlide();
    }

    drag(e) {
        if (!this.isDragging || !this.isInitialized) return;

        e.preventDefault();
        this.currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const diffX = this.startX - this.currentX;

        // Mark as moved if drag distance is significant
        if (Math.abs(diffX) > 5) {
            this.hasMoved = true;
        }

        // Add visual feedback during drag
        this.slider.style.transform = `translateX(calc(-${this.currentSlide * 100}% - ${diffX * 0.1}px))`;
    }

    endDrag() {
        if (!this.isDragging || !this.isInitialized) return;

        this.isDragging = false;
        this.slider.style.cursor = 'grab';

        const diffX = this.startX - this.currentX;
        const threshold = 50;

        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        } else {
            this.goToSlide(this.currentSlide);
        }

        // Reset hasMoved after a short delay to allow click detection
        setTimeout(() => {
            this.hasMoved = false;
        }, 100);

        this.startAutoSlide();
    }

    goToSlide(index) {
        if (!this.isInitialized) return;

        this.currentSlide = index;
        this.slider.style.transform = `translateX(-${index * 100}%)`;
        this.updateDots();
    }

    nextSlide() {
        if (!this.isInitialized || this.banners.length <= 1) return;

        this.currentSlide = (this.currentSlide + 1) % this.banners.length;
        this.goToSlide(this.currentSlide);
    }

    prevSlide() {
        if (!this.isInitialized || this.banners.length <= 1) return;

        this.currentSlide = this.currentSlide === 0 ? this.banners.length - 1 : this.currentSlide - 1;
        this.goToSlide(this.currentSlide);
    }

    updateDots() {
        if (!this.dotsContainer) return;

        const dots = this.dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    startAutoSlide() {
        if (!this.isInitialized || this.banners.length <= 1) return;

        this.stopAutoSlide();
        this.autoSlideInterval = setInterval(() => {
            this.nextSlide();
        }, 5000); // Auto slide every 5 seconds
    }

    stopAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
            this.autoSlideInterval = null;
        }
    }

    destroy() {
        this.stopAutoSlide();
        this.isInitialized = false;
    }
}

// Export for use in other scripts
window.BannerSlider = BannerSlider;

// ========================================
// DISCOUNT SLIDER CLASS
// ========================================
class DiscountSlider {
    constructor(containerId, prevBtnId, nextBtnId) {
        this.container = document.getElementById(containerId);
        this.prevBtn = document.getElementById(prevBtnId);
        this.nextBtn = document.getElementById(nextBtnId);
        this.currentSlide = 0;
        this.totalSlides = 0;
        this.slidesPerView = 4;
        this.isInitialized = false;

        // Only initialize if elements exist
        if (this.container && this.prevBtn && this.nextBtn) {
            this.init();
        }
    }

    init() {
        try {
            this.updateSlidesPerView();
            this.bindEvents();
            this.updateSlider();
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing discount slider:', error);
        }
    }

    updateSlidesPerView() {
        const width = window.innerWidth;
        if (width <= 480) {
            this.slidesPerView = 1;
        } else if (width <= 768) {
            this.slidesPerView = 2;
        } else if (width <= 1200) {
            this.slidesPerView = 3;
        } else {
            this.slidesPerView = 4;
        }
    }

    bindEvents() {
        // Navigation buttons
        this.prevBtn.addEventListener('click', () => this.prevSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());

        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateSlidesPerView();
            this.updateSlider();
        });
    }

    updateSlider() {
        if (!this.isInitialized) return;

        const slides = this.container.querySelectorAll('.discount-slide-item');
        this.totalSlides = slides.length;

        if (this.totalSlides === 0) return;

        // Hide navigation buttons if not needed
        if (this.totalSlides <= this.slidesPerView) {
            this.prevBtn.style.display = 'none';
            this.nextBtn.style.display = 'none';
        } else {
            this.prevBtn.style.display = 'flex';
            this.nextBtn.style.display = 'flex';
        }

        // Update button states
        this.updateButtonStates();
    }

    prevSlide() {
        if (this.totalSlides <= this.slidesPerView) return;

        this.currentSlide = Math.max(this.currentSlide - 1, 0);
        this.updateSliderPosition();
        this.updateButtonStates();
    }

    nextSlide() {
        if (this.totalSlides <= this.slidesPerView) return;

        this.currentSlide = Math.min(
            this.currentSlide + 1,
            this.totalSlides - this.slidesPerView
        );
        this.updateSliderPosition();
        this.updateButtonStates();
    }

    updateSliderPosition() {
        const translateX = -(this.currentSlide * (100 / this.slidesPerView));
        this.container.style.transform = `translateX(${translateX}%)`;
    }

    updateButtonStates() {
        if (this.prevBtn) {
            this.prevBtn.style.opacity = this.currentSlide === 0 ? '0.5' : '1';
            this.prevBtn.disabled = this.currentSlide === 0;
        }

        if (this.nextBtn) {
            this.nextBtn.style.opacity = this.currentSlide >= this.totalSlides - this.slidesPerView ? '0.5' : '1';
            this.nextBtn.disabled = this.currentSlide >= this.totalSlides - this.slidesPerView;
        }
    }
}

// Export for use in other scripts
window.DiscountSlider = DiscountSlider;

// Global functions for HTML onclick handlers
function toggleMobileMenu() {
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    if (mobileMenuOverlay) {
        mobileMenuOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}
