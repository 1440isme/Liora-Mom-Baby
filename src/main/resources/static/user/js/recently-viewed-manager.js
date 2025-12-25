/**
 * Recently Viewed Products Manager
 * Quản lý sản phẩm đã xem gần đây
 */
class RecentlyViewedManager {
    constructor() {
        // Không dùng localStorage nữa, chỉ dùng API giống cart
        this.maxItems = 20;
        this.apiBaseUrl = '/api/recently-viewed';
        this.isInitialized = false;
        this.isTracking = false; // Prevent double tracking
        
        // Carousel variables
        this.currentIndex = 0;
        this.cardWidth = 280 + 24; // 280px width + 24px gap (1.5rem)
        
        this.init();
    }

    init() {
        console.log('🔍 [DEBUG] Bắt đầu khởi tạo RecentlyViewedManager...');
        
        if (this.isInitialized) {
            console.log('🔍 [DEBUG] RecentlyViewedManager đã được khởi tạo rồi, bỏ qua');
            return;
        }
        
        try {
            console.log('🔍 [DEBUG] Setup event listeners...');
            // Setup event listeners only
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ [SUCCESS] RecentlyViewedManager đã được khởi tạo thành công');
        } catch (error) {
            console.error('❌ [ERROR] Lỗi khi khởi tạo RecentlyViewedManager:', error);
        }
    }

    /**
     * Track sản phẩm đã xem - đơn giản như giỏ hàng (chỉ API)
     */
    async trackProductView(productId, productData = null) {
        console.log('🔍 [DEBUG] Bắt đầu track product view:', productId);
        
        try {
            // Validate productId
            if (!productId || productId <= 0) {
                console.warn('⚠️ [WARNING] ID sản phẩm không hợp lệ:', productId);
                return false;
            }

            // Prevent double tracking (avoid ID increment by 2)
            if (this.isTracking) {
                console.log('🔍 [DEBUG] Đang tracking rồi, bỏ qua request duplicate');
                return false;
            }
            
            this.isTracking = true;
            
            console.log('🔍 [DEBUG] ProductId hợp lệ, gọi API track...');

            // Gọi API để track trên server (giống giỏ hàng)
            const token = localStorage.getItem('access_token');
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };
            
            // Thêm Authorization header nếu có token (giống Cart)
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch('/api/recently-viewed/track', {
                method: 'POST',
                headers: headers,
                body: `productId=${productId}`
            });

            console.log('🔍 [DEBUG] API response status:', response.status, response.statusText);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ [SUCCESS] API track thành công:', result);
                
                // Refresh UI sau khi API thành công - tăng timeout để đảm bảo DB đã cập nhật
                setTimeout(() => {
                    console.log('🔍 [DEBUG] Refresh UI sau API success...');
                    this.renderRecentlyViewed('recentlyViewedGrid', 6);
                }, 500);
                
                return true;
            } else {
                console.warn('⚠️ [WARNING] API track thất bại:', response.status, response.statusText);
                const errorText = await response.text();
                console.warn('⚠️ [WARNING] Error response:', errorText);
                return false;
            }

        } catch (error) {
            console.error('❌ [ERROR] Lỗi khi theo dõi lượt xem sản phẩm:', error);
            return false;
        } finally {
            // Reset flag sau 500ms để cho phép track lại
            setTimeout(() => {
                this.isTracking = false;
            }, 500);
        }
    }

    
    /**
     * Get product info from current page
     */
    getProductInfoFromPage(productId) {
        try {
            console.log('🔍 [DEBUG] getProductInfoFromPage called for productId:', productId);
            
            // Check if we have product data in the page
            const productIdElem = document.getElementById('productId');
            console.log('🔍 [DEBUG] productIdElem:', productIdElem);
            
            if (productIdElem && productIdElem.value == productId) {
                // Try to extract from page data
                const name = document.querySelector('.product-detail-title')?.textContent?.trim();
                const price = this.extractPrice();
                const mainImageUrl = document.getElementById('productDetailMainImage')?.src;
                const brandName = document.querySelector('.product-detail-brand')?.textContent?.trim();
                const categoryName = document.querySelector('.product-detail-category')?.textContent?.trim();
                
                console.log('🔍 [DEBUG] Extracted values - name:', name, 'price:', price, 'image:', mainImageUrl);
                
                const product = {
                    productId: productId,
                    name: name || 'Unknown Product',
                    productName: name || 'Unknown Product',
                    price: price,
                    productPrice: price,
                    mainImageUrl: mainImageUrl || '/user/img/default-product.jpg',
                    brandName: brandName || '',
                    categoryName: categoryName || '',
                    available: true,
                    stock: 100,
                    soldCount: 0,
                    averageRating: 0,
                    ratingCount: 0
                };
                console.log('🔍 [DEBUG] Extracted product data from page:', product);
                return product;
            }
            console.log('🔍 [DEBUG] productIdElem not found or value mismatch');
            return null;
        } catch (error) {
            console.error('❌ [ERROR] Lỗi khi lấy thông tin sản phẩm từ trang:', error);
            return null;
        }
    }
    
    /**
     * Extract price from page
     */
    extractPrice() {
        try {
            const priceElem = document.querySelector('.h2.fw-bold.text-dark');
            if (priceElem) {
                const priceText = priceElem.textContent.trim();
                // Remove ₫ and spaces, then parse
                const price = priceText.replace(/[₫,\s]/g, '');
                return parseFloat(price) || 0;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Lấy guestId từ cookie
     */
    getGuestIdFromCookie() {
        try {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'guest_cart_id') {
                    console.log('🔍 [DEBUG] Tìm thấy guestId trong cookie:', value);
                    return value;
                }
            }
            console.log('⚠️ [WARNING] Không tìm thấy guest_cart_id trong cookie');
            return null;
        } catch (error) {
            console.error('❌ [ERROR] Lỗi khi lấy guestId từ cookie:', error);
            return null;
        }
    }

    /**
     * Đồng bộ dữ liệu device với user khi đăng nhập
     */
    async syncGuestToUser() {
        try {
            console.log('🔍 [DEBUG] Đồng bộ device với user...');
            
            // Lấy guestId từ cookie (giống như cart)
            const guestId = this.getGuestIdFromCookie();
            
            if (!guestId) {
                console.log('⚠️ [WARNING] Không có guestId, bỏ qua sync');
                // Không có guestId có nghĩa là user chưa từng xem sản phẩm khi là guest
                // Hoặc đã sync rồi
                await this.renderRecentlyViewed('recentlyViewedGrid', 6);
                return true;
            }
            
            console.log('🔍 [DEBUG] Gọi API sync với guestId:', guestId);
            
            const token = localStorage.getItem('access_token');
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };
            
            // Thêm Authorization header nếu có token (giống Cart)
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch('/api/recently-viewed/sync', {
                method: 'POST',
                headers: headers,
                body: `guestId=${guestId}`
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ [SUCCESS] Sync device thành công:', result);
                
                // Reload data sau khi sync
                await this.renderRecentlyViewed('recentlyViewedGrid', 6);
                return true;
            } else {
                console.warn('⚠️ [WARNING] Sync device thất bại:', response.status);
                const errorText = await response.text();
                console.warn('⚠️ [WARNING] Error response:', errorText);
                return false;
            }
        } catch (error) {
            console.error('❌ [ERROR] Lỗi khi sync device:', error);
            return false;
        }
    }

    /**
     * Lấy danh sách sản phẩm đã xem gần đây - chỉ dùng API giống cart
     */
    async getRecentlyViewed(limit = 10) {
        try {
            console.log('🔍 [DEBUG] Lấy recently viewed, limit:', limit);
            
            // 1. Thử load từ API trước
            try {
                const token = localStorage.getItem('access_token');
                const headers = {};
                
                // Thêm Authorization header nếu có token (giống Cart)
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                
                const response = await fetch(`/api/recently-viewed?limit=${limit}`, {
                    method: 'GET',
                    headers: headers
                    // Không cần header X-Device-ID nữa, backend sẽ lấy từ cookie
                });

                console.log('🔍 [DEBUG] API response status:', response.status, response.statusText);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('🔍 [DEBUG] API response data:', result);
                    
                    if (result.success && result.data && Array.isArray(result.data)) {
                        console.log('✅ [SUCCESS] Load từ API thành công:', result.data.length, 'sản phẩm');
                        console.log('🔍 [DEBUG] API data sample:', result.data[0]);
                        
                        // Không lưu localStorage, chỉ return data
                        return result.data;
                    } else {
                        console.warn('⚠️ [WARNING] API response không hợp lệ:', result);
                        console.warn('⚠️ [WARNING] success:', result.success, 'data:', result.data, 'isArray:', Array.isArray(result.data));
                    }
                } else {
                    console.warn('⚠️ [WARNING] API response status:', response.status, response.statusText);
                    const errorText = await response.text();
                    console.warn('⚠️ [WARNING] Error response:', errorText);
                }
            } catch (apiError) {
                console.warn('⚠️ [WARNING] Lỗi API:', apiError);
            }

            // Không có fallback localStorage nữa, giống cart
            console.log('⚠️ [WARNING] API failed, return empty array');
            return [];
            
        } catch (error) {
            console.error('❌ [ERROR] Lỗi khi lấy danh sách sản phẩm đã xem:', error);
            return [];
        }
    }

    /**
     * Xóa lịch sử xem sản phẩm - sử dụng API
     */
    async clearHistory() {
        try {
            console.log('🔍 [DEBUG] Xóa lịch sử recently viewed...');
            
            // 1. Gọi API để xóa trên server
        try {
            const token = localStorage.getItem('access_token');
            const headers = {};
            
            // Thêm Authorization header nếu có token (giống Cart)
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch('/api/recently-viewed', {
                method: 'DELETE',
                headers: headers
                // Không cần header X-Device-ID nữa, backend sẽ lấy từ cookie
            });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ [SUCCESS] API clear thành công:', result);
                } else {
                    console.warn('⚠️ [WARNING] API clear thất bại:', response.status);
                }
            } catch (apiError) {
                console.warn('⚠️ [WARNING] Lỗi API clear:', apiError);
            }

            // Không cần xóa localStorage nữa
            
            // 3. Re-render to show empty state
            this.renderRecentlyViewed('recentlyViewedGrid', 6);
            
            console.log('✅ [SUCCESS] Đã xóa lịch sử sản phẩm đã xem');
            return true;
        } catch (error) {
            console.error('❌ [ERROR] Lỗi khi xóa lịch sử:', error);
            return false;
        }
    }

    /**
     * Xóa một sản phẩm khỏi lịch sử - sử dụng API
     */
    async removeProduct(productId) {
        try {
            console.log('🔍 [DEBUG] Xóa sản phẩm khỏi recently viewed:', productId);
            
            // 1. Gọi API để xóa trên server
        try {
            const token = localStorage.getItem('access_token');
            const headers = {};
            
            // Thêm Authorization header nếu có token (giống Cart)
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`/api/recently-viewed/${productId}`, {
                method: 'DELETE',
                headers: headers
                // Không cần header X-Device-ID nữa, backend sẽ lấy từ cookie
            });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ [SUCCESS] API remove thành công:', result);
                } else {
                    console.warn('⚠️ [WARNING] API remove thất bại:', response.status);
                }
            } catch (apiError) {
                console.warn('⚠️ [WARNING] Lỗi API remove:', apiError);
            }
            
            // Không cần xóa localStorage nữa
            
            // Re-render to update display
            this.renderRecentlyViewed('recentlyViewedGrid', 6);
            
            console.log('✅ [SUCCESS] Đã xóa sản phẩm khỏi danh sách đã xem:', productId);
            return true;
        } catch (error) {
            console.error('❌ [ERROR] Lỗi khi xóa sản phẩm:', error);
            return false;
        }
    }

    // Không có clearOldLocalStorageData nữa vì không dùng localStorage

    /**
     * Render UI component - cập nhật để sử dụng async getRecentlyViewed
     */
    async renderRecentlyViewed(containerId, limit = 6) {
        console.log('🔍 [DEBUG] Bắt đầu render recently viewed, containerId:', containerId, 'limit:', limit);
        
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.warn('⚠️ [WARNING] Không tìm thấy container:', containerId);
                return;
            }

            console.log('🔍 [DEBUG] Container tìm thấy, lấy dữ liệu recently viewed...');
            
            // Lấy dữ liệu từ API (giống giỏ hàng)
            let recentlyViewed = await this.getRecentlyViewed(limit);
            console.log('🔍 [DEBUG] Dữ liệu từ API:', recentlyViewed.length, 'sản phẩm');
            console.log('🔍 [DEBUG] API data sample:', recentlyViewed[0]);
            
            // 3. Deduplicate dữ liệu trước khi render
            recentlyViewed = this.deduplicateProducts(recentlyViewed);
            console.log('🔍 [DEBUG] Sau khi deduplicate:', recentlyViewed.length, 'sản phẩm');
            
            console.log('🔍 [DEBUG] Dữ liệu cuối cùng:', recentlyViewed);
            
            if (recentlyViewed.length === 0) {
                console.log('🔍 [DEBUG] Không có sản phẩm nào, hiển thị empty state');
                // Hiển thị empty state
                const emptyEl = document.getElementById('recentlyViewedEmpty');
                if (emptyEl) {
                    emptyEl.classList.remove('d-none');
                    console.log('🔍 [DEBUG] Đã hiển thị empty state');
                }
                container.innerHTML = '';
                return;
            }

            console.log('🔍 [DEBUG] Có ' + recentlyViewed.length + ' sản phẩm, ẩn empty state và render grid');
            
            // Ẩn empty state
            const emptyEl = document.getElementById('recentlyViewedEmpty');
            if (emptyEl) {
                emptyEl.classList.add('d-none');
                console.log('🔍 [DEBUG] Đã ẩn empty state');
            }

            // Render products với grid layout giống similar products
            console.log('🔍 [DEBUG] Render HTML cho ' + recentlyViewed.length + ' sản phẩm...');
            container.innerHTML = this.getRecentlyViewedHTML(recentlyViewed);
            
            console.log('🔍 [DEBUG] Setup event listeners cho container...');
            this.setupUIEventListeners(container);

            // Update navigation buttons visibility
                const cards = container.querySelectorAll('.product-card');
            this.updateNavigationButtons(cards.length, 4);
            
            // Reset scroll position when new products are loaded
            const grid = document.getElementById('recentlyViewedGrid');
            if (grid) {
                grid.scrollLeft = 0;
            }

            // Load rating data sau khi render xong
            setTimeout(() => {
                if (window.ProductRatingUtils && typeof window.ProductRatingUtils.loadAndUpdateProductCards === 'function') {
                    console.log('🔍 [DEBUG] Loading rating data cho recently viewed products...');
                    const productCards = container.querySelectorAll('.product-card');
                    window.ProductRatingUtils.loadAndUpdateProductCards(productCards);
                }
            }, 500);

            console.log('✅ [SUCCESS] Render recently viewed hoàn tất');

        } catch (error) {
            console.error('❌ [ERROR] Lỗi khi hiển thị sản phẩm đã xem:', error);
        }
    }

    // Không dùng localStorage nữa, tất cả hoạt động qua API

    /**
     * Deduplicate products by productId - loại bỏ duplicate
     */
    deduplicateProducts(products) {
        if (!Array.isArray(products)) {
            return [];
        }
        
        const seen = new Set();
        const unique = [];
        
        for (const product of products) {
            const productId = product.productId || product.id;
            if (productId && !seen.has(productId)) {
                seen.add(productId);
                unique.push(product);
            }
        }
        
        console.log('🔍 [DEBUG] Deduplicate: từ', products.length, 'thành', unique.length, 'sản phẩm');
        return unique;
    }

    // Các hàm localStorage đã được xóa, không dùng nữa

    /**
     * Send tracking data to server (DISABLED to prevent ERR_INCOMPLETE_CHUNKED_ENCODING)
     */
    async sendToServer(productId) {
        // Disabled to prevent chunked encoding errors
        return false;
    }

    /**
     * Get recently viewed from server (DISABLED)
     */
    async getFromServer(limit = 10) {
        // Disabled to prevent chunked encoding errors
        return [];
    }

    /**
     * Clear from server (DISABLED)
     */
    async clearFromServer() {
        // Disabled to prevent chunked encoding errors
        return false;
    }

    /**
     * Remove from server (DISABLED)
     */
    async removeFromServer(productId) {
        // Disabled to prevent chunked encoding errors
        return false;
    }





    /**
     * Bind navigation events
     */
    bindNavigationEvents() {
        const prevBtn = document.getElementById('recentlyViewedPrevBtn');
        const nextBtn = document.getElementById('recentlyViewedNextBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.slideCarousel(-1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.slideCarousel(1));
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Track product views on product detail pages
        if (window.location.pathname.includes('/product/')) {
            const productId = this.extractProductIdFromUrl();
            if (productId) {
                this.trackProductView(productId);
            }
        }

        // Bind navigation events
        this.bindNavigationEvents();

        // Listen for product view events
        document.addEventListener('productViewed', (event) => {
            if (event.detail && event.detail.productId) {
                this.trackProductView(event.detail.productId, event.detail.productData);
            }
        });

        // Listen for user login events để sync data
        document.addEventListener('user:login', async () => {
            console.log('🔍 [DEBUG] User đã đăng nhập, sync recently viewed data...');
            await this.syncGuestToUser();
        });

        // Listen for page load để sync nếu user đã đăng nhập
        document.addEventListener('DOMContentLoaded', async () => {
            // Kiểm tra nếu user đã đăng nhập (có thể check qua cookie hoặc global variable)
            if (window.currentUser && window.currentUser.id) {
                console.log('🔍 [DEBUG] User đã đăng nhập, sync recently viewed data...');
                await this.syncGuestToUser();
            }
        });
    }

    /**
     * Extract product ID from URL
     */
    extractProductIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        const productIndex = pathParts.indexOf('product');
        if (productIndex !== -1 && pathParts[productIndex + 1]) {
            return parseInt(pathParts[productIndex + 1]);
        }
        return null;
    }

    /**
     * Get empty state HTML
     */
    getEmptyStateHTML() {
        return `
            <div class="recently-viewed-empty text-center py-4">
                <i class="fas fa-history fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Chưa có sản phẩm nào được xem gần đây</h5>
                <p class="text-muted">Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!</p>
            </div>
        `;
    }

    /**
     * Get recently viewed HTML
     */
    getRecentlyViewedHTML(products) {
        return products.map(product => this.getProductCardHTML(product)).join('');
    }

    /**
     * Get product card HTML - đồng bộ với similar products
     */
    getProductCardHTML(product) {
        console.log('🔍 [DEBUG] Rendering product card:', product);
        console.log('🔍 [DEBUG] Product data - productName:', product.productName, 'name:', product.name, 'brandName:', product.brandName, 'price:', product.price);
        
        const productStatus = this.getProductStatus(product);
        const statusClass = this.getProductStatusClass(productStatus);

        return `
            <div class="product-card ${statusClass}" data-product-id="${product.productId}">
                <div class="position-relative">
                    <a href="/product/${product.productId}" class="product-image-link">
                        <img src="${product.mainImageUrl || '/user/img/default-product.jpg'}" 
                             class="card-img-top" 
                             alt="${product.productName || product.name || 'Sản phẩm'}"
                             onerror="this.src='/user/img/default-product.jpg'">
                    </a>
                    
                    <div class="product-actions">
                        <button class="quick-view-btn" 
                                onclick="if(window.recentlyViewedManager) window.recentlyViewedManager.showQuickView('${product.productId}'); else alert('Chức năng đang được tải...');"
                                title="Xem nhanh">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>

                <div class="card-body d-flex flex-column">
                    <h6 class="card-title" title="${product.productName || product.name || 'Sản phẩm'}">
                        <a href="/product/${product.productId}" class="text-decoration-none text-dark product-name-link">
                            ${product.productName || product.name || 'Sản phẩm'}
                        </a>
                    </h6>
                    
                    <p class="brand-name">
                        <span class="text-muted">
                            ${product.brandName || 'Thương hiệu'}
                        </span>
                    </p>
                    
                    <div class="rating">
                        <span class="stars">
                            ${this.renderStars(product.averageRating || 0, product.ratingCount || 0)}
                        </span>
                        <span class="rating-count">(${product.ratingCount || 0})</span>
                    </div>
                    
                    <div class="mt-auto">
                        <!-- Sales Progress Bar -->
                        <div class="sales-progress mb-3">
                            <div class="sales-info d-flex justify-content-between align-items-center mb-1">
                                <span class="sales-label">Đã bán</span>
                                <span class="sales-count">${product.soldCount || 0}</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar" style="width: ${this.calculateSalesProgress(product.soldCount || 0)}%"></div>
                            </div>
                        </div>

                        <div class="price-section d-flex justify-content-between align-items-center">
                            <span class="current-price">
                                ${this.formatPrice(product.price || 0)}
                            </span>
                            <button class="add-to-cart-icon recently-viewed-cart-btn"
                                    data-product-id="${product.productId}"
                                    title="Thêm vào giỏ"
                                    onclick="event.preventDefault(); event.stopPropagation(); if(window.app) { window.app.addToCart(${product.productId}); }">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get product status
     */
    getProductStatus(product) {
        // 1. Kiểm tra ngừng kinh doanh (ưu tiên cao nhất)
        if (!product.available) {
            return 'deactivated';
        }

        // 2. Kiểm tra hết hàng (chỉ khi sản phẩm còn available)
        if (product.stock <= 0) {
            return 'out_of_stock';
        }

        // 3. Sản phẩm có sẵn
        return 'available';
    }

    /**
     * Get product status class
     */
    getProductStatusClass(status) {
        switch (status) {
            case 'deactivated': return 'product-deactivated';
            case 'out_of_stock': return 'product-out-of-stock';
            case 'available':
            default: return 'product-available';
        }
    }

    /**
     * Render stars rating
     */
    renderStars(rating, reviewCount = 0) {
        // Logic đúng cho product card - giống similar products
        if (!rating || rating === 0 || rating === '0' || rating === null || rating === undefined) {
            let stars = '';
            for (let i = 0; i < 5; i++) {
                stars += '<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>';
            }
            return stars;
        }

        const numRating = parseFloat(rating);
        const fullStars = Math.floor(numRating);
        const hasHalfStar = numRating % 1 >= 0.5;
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
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>';
        }

        return stars;
    }

    /**
     * Setup UI event listeners
     */
    setupUIEventListeners(container) {
        // Add to cart buttons
        container.querySelectorAll('.btn-add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = e.target.closest('.recently-viewed-item').dataset.productId;
                this.addToCart(productId);
            });
        });

        // Quick view buttons
        container.querySelectorAll('.btn-quick-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = e.target.closest('.recently-viewed-item').dataset.productId;
                this.showQuickView(productId);
            });
        });
    }

    /**
     * Add to cart
     */
    addToCart(productId, quantity = 1) {
        console.log('🔍 [DEBUG] addToCart called with productId:', productId, 'quantity:', quantity);
        
        // Ensure productId is a string/number, not object
        const cleanProductId = typeof productId === 'object' ? productId.productId || productId.id : productId;
        console.log('🔍 [DEBUG] Clean productId:', cleanProductId);
        
        if (window.app && window.app.addProductToCartBackend) {
            window.app.addProductToCartBackend(cleanProductId, quantity, true)
                .then(() => {
                    this.showNotification('Đã thêm vào giỏ hàng!', 'success');
                })
                .catch((error) => {
                    console.error('Lỗi khi thêm vào giỏ hàng:', error);
                    this.showNotification('Không thể thêm vào giỏ hàng', 'error');
                });
        } else {
            this.showNotification('Chức năng đang được tải...', 'error');
        }
    }

    /**
     * Show quick view
     */
    showQuickView(productId) {
        if (window.app && window.app.showQuickView) {
            window.app.showQuickView(productId);
        } else {
            window.location.href = `/product/${productId}`;
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    /**
     * Format price
     */
    formatPrice(price) {
        if (!price) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }


    /**
     * Show quick view modal
     */
    async showQuickView(productId) {
        console.log('🔍 [DEBUG] showQuickView called with productId:', productId);
        
        try {
            const recentlyViewed = await this.getRecentlyViewed(20);
            console.log('🔍 [DEBUG] Recently viewed products:', recentlyViewed);
            
            const product = recentlyViewed.find(p => p.productId == productId); // Use == instead of === for type flexibility
            if (!product) {
                console.warn('⚠️ [WARNING] Product not found in recently viewed:', productId);
                this.showNotification('Không tìm thấy sản phẩm trong danh sách đã xem', 'error');
                return;
            }

            console.log('🔍 [DEBUG] Found product:', product);

            // Load product images if not already loaded
            if (!product.images) {
                try {
                    const response = await fetch(`/api/products/${productId}/images`);
                    if (response.ok) {
                        const data = await response.json();
                        product.images = data.result || [];
                    }
                } catch (error) {
                    console.warn('⚠️ [WARNING] Error loading images:', error);
                    product.images = [];
                }
            }

            this.createQuickViewModal(product);
        } catch (error) {
            console.error('❌ [ERROR] Error in showQuickView:', error);
            this.showNotification('Lỗi khi mở quick view', 'error');
        }
    }

    /**
     * Create quick view modal - đồng bộ hoàn toàn với similar-products và main.js
     */
    createQuickViewModal(product) {
        console.log('🔍 [DEBUG] createQuickViewModal called with product:', product);
        
        // Ensure productId is a string
        const productId = typeof product.productId === 'object' ? product.productId.productId || product.productId.id : product.productId;
        console.log('🔍 [DEBUG] Clean productId for modal:', productId);
        
        // Remove existing modal if any (giống similar-products)
        const existingModal = document.getElementById('quickViewModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Tạo modal giống hệt similar-products và main.js
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
                                                 alt="${product.productName || product.name}"
                                                 onerror="this.src='/user/img/default-product.jpg'">
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
                                        <a href="/product/${productId}" class="text-decoration-none text-dark">
                                            ${product.productName || product.name}
                                        </a>
                                    </h4>
                                    <p class="brand-name text-muted mb-2">${product.brandName || product.brand || 'Thương hiệu'}</p>
                                    
                                    <!-- Product Status -->
                                    <div class="product-status mb-3">
                                        ${this.getProductStatusBadge(product)}
                                        <span class="ms-2 text-muted">Mã sản phẩm: ${productId}</span>
                                    </div>
                                    
                                    <!-- Rating -->
                                    <div class="rating mb-3">
                                        <span class="stars">
                                            ${this.generateStarsForModal(product.averageRating || product.rating || 0, product.reviewCount || product.ratingCount || 0)}
                                        </span>
                                        <span class="review-count ms-2">(${product.reviewCount || product.ratingCount || 0} đánh giá)</span>
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
                                            ${this.formatPrice(product.productPrice || product.price)}
                                        </span>
                                        ${product.originalPrice ? `<span class="text-muted ms-2"><s>${this.formatPrice(product.originalPrice)}</s></span>` : ''}
                                    </div>
                                    
                                    <!-- Quantity Selector -->
                                    <div class="quantity-selector mb-4">
                                        <div class="d-flex align-items-center">
                                            <label class="form-label mb-0" style="margin-right: 2rem;">Số lượng:</label>
                                            <div class="input-group" style="max-width: 150px;">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.recentlyViewedManager.decrementQuantity('${productId}')">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || product.stockQuantity || 10, 99)}" id="quickViewQuantityInput_${productId}" onchange="window.recentlyViewedManager.validateQuantity('${productId}')" oninput="window.recentlyViewedManager.validateQuantity('${productId}')" onblur="window.recentlyViewedManager.validateQuantityOnBlur('${productId}')">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.recentlyViewedManager.incrementQuantity('${productId}')">+</button>
                                            </div>
                                        </div>
                                        <!-- Error Message -->
                                        <div id="quickViewQuantityError_${productId}" class="text-danger mt-2" style="display: none;">
                                            <i class="fas fa-info-circle me-1"></i>
                                            <span id="quickViewQuantityErrorMessage_${productId}">Số lượng tối đa bạn có thể mua là ${Math.min(product.stock || product.stockQuantity || 10, 99)}.</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Actions -->
                                    <div class="d-grid gap-2">
                                        <div class="row g-2">
                                            <div class="col-6">
                                                <button class="btn btn-danger btn-lg w-100" 
                                                        onclick="window.recentlyViewedManager.buyNow('${productId}')">
                                                    <i class="fas fa-bolt me-2"></i>Mua ngay
                                                </button>
                                            </div>
                                            <div class="col-6">
                                                <button class="btn btn-primary btn-lg w-100" 
                                                        onclick="window.recentlyViewedManager.addToCartFromModal('${productId}')">
                                                    <i class="fas fa-shopping-cart me-2"></i>Thêm vào giỏ
                                                </button>
                                            </div>
                                        </div>
                                        <a href="/product/${productId}" class="btn btn-outline-primary btn-lg">
                                            <i class="fas fa-info-circle me-2"></i>Xem chi tiết sản phẩm
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Thêm modal vào DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('quickViewModal'));
        modal.show();
        
        console.log('🔍 [DEBUG] Quick view modal shown successfully');
        
        // Setup slider navigation
        this.setupSliderNavigation(product);
        
        // Update review data after modal is shown (giống similar-products)
        setTimeout(() => {
            console.log('🔍 [DEBUG] Calling ProductRatingUtils.updateQuickViewReviewData for productId:', productId);
            ProductRatingUtils.updateQuickViewReviewData(productId);
        }, 200);
        
        // Clean up modal when hidden (giống similar-products)
        document.getElementById('quickViewModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    /**
     * Slide carousel
     */
    slideCarousel(direction) {
        const grid = document.getElementById('recentlyViewedGrid');
        if (!grid) return;
        
        const cards = grid.querySelectorAll('.product-card');
        const totalCards = cards.length;
        const maxVisibleCards = 4;
        
        if (totalCards <= maxVisibleCards) {
            // If we have 4 or fewer cards, no need to slide
            this.updateNavigationButtons(totalCards, maxVisibleCards);
            return;
        }
        
        const cardWidth = 280 + 24; // Width of one card (280px) + gap (1.5rem = 24px)
        const currentScroll = grid.scrollLeft;
        const newScroll = currentScroll + (direction * cardWidth);
        
        grid.scrollTo({
            left: newScroll,
            behavior: 'smooth'
        });
        
        // Update button states after scroll
        setTimeout(() => this.updateNavigationButtons(totalCards, maxVisibleCards), 300);
    }

    /**
     * Update navigation buttons
     */
    updateNavigationButtons(totalCards, maxVisibleCards) {
        const prevBtn = document.getElementById('recentlyViewedPrevBtn');
        const nextBtn = document.getElementById('recentlyViewedNextBtn');
        const navButtons = document.getElementById('recentlyViewedNavButtons');
        const grid = document.getElementById('recentlyViewedGrid');
        
        console.log('🔍 [DEBUG] Updating navigation buttons, totalCards:', totalCards, 'maxVisibleCards:', maxVisibleCards);
        
        // Show navigation buttons only when there are more than 4 products
        if (totalCards > maxVisibleCards) {
            console.log('🔍 [DEBUG] Showing navigation buttons');
            if (navButtons) {
                navButtons.style.display = 'flex';
                navButtons.classList.remove('hidden');
            }
            
            // Check scroll position for button states
            const isAtStart = grid.scrollLeft <= 0;
            const isAtEnd = grid.scrollLeft >= (grid.scrollWidth - grid.clientWidth - 1);
            
            console.log('🔍 [DEBUG] Scroll position - isAtStart:', isAtStart, 'isAtEnd:', isAtEnd);
            
            if (prevBtn) {
                prevBtn.disabled = isAtStart;
                console.log('🔍 [DEBUG] Prev button disabled:', isAtStart);
            }
            if (nextBtn) {
                nextBtn.disabled = isAtEnd;
                console.log('🔍 [DEBUG] Next button disabled:', isAtEnd);
            }
        } else {
            console.log('🔍 [DEBUG] Hiding navigation buttons - not enough cards');
            // Hide navigation if 4 or fewer products
            if (navButtons) {
                navButtons.style.display = 'none';
                navButtons.classList.add('hidden');
            }
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
        }
    }

    /**
     * Get main image URL - đồng bộ với similar-products
     */
    getMainImageUrl(product) {
        if (product.images && product.images.length > 0) {
            return product.images[0].imageUrl || product.images[0];
        }
        return product.mainImageUrl || product.imageUrl || '/user/img/default-product.jpg';
    }

    /**
     * Generate image thumbnails - đồng bộ với similar-products
     */
    generateImageThumbnails(product) {
        const images = product.images || [];
        if (images.length === 0) {
            return `<div class="thumbnail-item active">
                        <img src="${this.getMainImageUrl(product)}" 
                             class="thumbnail-img" 
                             alt="${product.productName || product.name}"
                             onclick="window.recentlyViewedManager.setMainImage('${this.getMainImageUrl(product)}')">
                    </div>`;
        }

        return images.map((image, index) => {
            const imageUrl = image.imageUrl || image;
            return `
                <div class="thumbnail-item ${index === 0 ? 'active' : ''}">
                    <img src="${imageUrl}" 
                         class="thumbnail-img" 
                         alt="${product.productName || product.name}"
                         onclick="window.recentlyViewedManager.setMainImage('${imageUrl}')">
                </div>
            `;
        }).join('');
    }

    /**
     * Set main image
     */
    setMainImage(imageUrl) {
        const mainImg = document.getElementById('modalMainProductImage');
        if (mainImg) {
            mainImg.src = imageUrl;
        }
        
        // Update active thumbnail
        document.querySelectorAll('.thumbnail-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.thumbnail-item').classList.add('active');
    }

    /**
     * Setup slider navigation - đồng bộ với similar-products
     */
    setupSliderNavigation(product) {
        const images = product.images || [];
        if (images.length <= 1) {
            document.getElementById('modalPrevBtn').style.display = 'none';
            document.getElementById('modalNextBtn').style.display = 'none';
            return;
        }

        let currentImageIndex = 0;
        
        document.getElementById('modalPrevBtn').addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
            const imageUrl = images[currentImageIndex].imageUrl || images[currentImageIndex];
            this.updateMainImage(imageUrl);
            this.updateActiveThumbnail(currentImageIndex);
        });

        document.getElementById('modalNextBtn').addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % images.length;
            const imageUrl = images[currentImageIndex].imageUrl || images[currentImageIndex];
            this.updateMainImage(imageUrl);
            this.updateActiveThumbnail(currentImageIndex);
        });
    }

    /**
     * Update main image
     */
    updateMainImage(imageUrl) {
        const mainImg = document.getElementById('modalMainProductImage');
        if (mainImg) {
            mainImg.src = imageUrl;
        }
    }

    /**
     * Update active thumbnail
     */
    updateActiveThumbnail(index) {
        document.querySelectorAll('.thumbnail-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    }

    /**
     * Get product status badge - đồng bộ với similar-products
     */
    getProductStatusBadge(product) {
        const status = this.getProductStatus(product);
        switch (status) {
            case 'available':
                return '<span class="badge bg-success">Còn hàng</span>';
            case 'out_of_stock':
                return '<span class="badge bg-danger">Hết hàng</span>';
            case 'deactivated':
                return '<span class="badge bg-secondary">Ngừng kinh doanh</span>';
            default:
                return '<span class="badge bg-secondary">Không xác định</span>';
        }
    }

    /**
     * Generate stars for modal - đồng bộ với similar-products
     */
    generateStarsForModal(rating, reviewCount) {
        const numRating = parseFloat(rating);
        
        // Nếu không có rating hoặc rating = 0, hiển thị sao rỗng
        if (!numRating || numRating === 0) {
            let stars = '';
            for (let i = 0; i < 5; i++) {
                stars += '<i class="far fa-star" style="color: #ccc;"></i>';
            }
            return stars;
        }
        
        const fullStars = Math.floor(numRating);
        const hasHalfStar = numRating % 1 >= 0.5;
        let stars = '';

        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star" style="color: #ffc107;"></i>';
        }

        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt" style="color: #ffc107;"></i>';
        }

        // Empty stars
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star" style="color: #ccc;"></i>';
        }

        return stars;
    }

    /**
     * Format number
     */
    formatNumber(num) {
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    /**
     * Calculate sales progress - đồng bộ với similar-products
     */
    calculateSalesProgress(soldCount) {
        if (!soldCount || soldCount === 0) return 0;
        
        // Giả sử max sales là 100 để tính %
        const maxSales = 100;
        const percentage = Math.min((soldCount / maxSales) * 100, 100);
        return Math.round(percentage);
    }

    /**
     * Quantity management functions
     */
    decrementQuantity(productId) {
        const input = document.getElementById(`quickViewQuantityInput_${productId}`);
        if (input && parseInt(input.value) > 1) {
            input.value = parseInt(input.value) - 1;
            this.validateQuantity(productId);
        }
    }

    incrementQuantity(productId) {
        const input = document.getElementById(`quickViewQuantityInput_${productId}`);
        if (input) {
            input.value = parseInt(input.value) + 1;
            this.validateQuantity(productId);
        }
    }

    validateQuantity(productId) {
        const input = document.getElementById(`quickViewQuantityInput_${productId}`);
        const errorDiv = document.getElementById(`quickViewQuantityError_${productId}`);
        
        if (!input) return;

        const value = parseInt(input.value);
        const max = parseInt(input.max);
        
        if (value > max) {
            input.value = max;
            if (errorDiv) {
                errorDiv.style.display = 'block';
            }
        } else if (value < 1) {
            input.value = 1;
        } else {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }
    }

    validateQuantityOnBlur(productId) {
        const input = document.getElementById(`quickViewQuantityInput_${productId}`);
        if (input && (!input.value || input.value < 1)) {
            input.value = 1;
        }
        this.validateQuantity(productId);
    }

    /**
     * Add to cart from modal
     */
    addToCartFromModal(productId) {
        const input = document.getElementById(`quickViewQuantityInput_${productId}`);
        const quantity = input ? parseInt(input.value) : 1;
        
        console.log('🔍 [DEBUG] addToCartFromModal called with productId:', productId, 'quantity:', quantity);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('quickViewModal'));
        if (modal) {
            modal.hide();
        }
        
        // Add to cart using the main addToCart function
        this.addToCart(productId, quantity);
    }

    /**
     * Buy now
     */
    buyNow(productId) {
        const input = document.getElementById(`quickViewQuantityInput_${productId}`);
        const quantity = input ? parseInt(input.value) : 1;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('quickViewModal'));
        if (modal) {
            modal.hide();
        }
        
        // Redirect to checkout
        window.location.href = `/checkout?productId=${productId}&quantity=${quantity}`;
    }
}

// Initialize global instance
window.recentlyViewedManager = new RecentlyViewedManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecentlyViewedManager;
}
