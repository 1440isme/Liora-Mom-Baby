/**
 * Product Comparison Manager
 * Quản lý chức năng so sánh sản phẩm
 */
class ProductComparisonManager {
    constructor() {
        this.maxCompareItems = 3; // Tối đa 3 sản phẩm
        this.compareItems = this.loadFromStorage();
        this.init();
    }

    init() {
        // Tạo modal nếu chưa có
        this.createModal();
        
        // Tạo nút floating
        this.createFloatingButton();
        
        // Render badge số lượng
        this.updateCompareBadge();
        
        // Bind events
        this.bindEvents();
        
        // Expose to window
        window.productComparisonManager = this;
    }

    /**
     * Load danh sách so sánh từ localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('productComparison');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading comparison from storage:', e);
            return [];
        }
    }

    /**
     * Lưu danh sách so sánh vào localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('productComparison', JSON.stringify(this.compareItems));
        } catch (e) {
            console.error('Error saving comparison to storage:', e);
        }
    }

    /**
     * Thêm sản phẩm vào danh sách so sánh
     */
    async addToCompare(productId) {
        // Kiểm tra đã có trong danh sách chưa
        if (this.compareItems.some(item => item.productId === productId)) {
            this.showNotification('Sản phẩm đã có trong danh sách so sánh!', 'info');
            return false;
        }

        // Kiểm tra số lượng tối đa
        if (this.compareItems.length >= this.maxCompareItems) {
            this.showNotification(`Chỉ có thể so sánh tối đa ${this.maxCompareItems} sản phẩm!`, 'warning');
            return false;
        }

        // Lấy thông tin sản phẩm từ API
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (!response.ok) {
                throw new Error('Không thể lấy thông tin sản phẩm');
            }
            const data = await response.json();
            
            if (data.code === 1000 || data.code === 200) {
                const product = data.result;
                const compareItem = {
                    productId: product.productId,
                    name: product.name,
                    price: product.price,
                    brandName: product.brandName,
                    categoryName: product.categoryName,
                    mainImageUrl: product.mainImageUrl,
                    averageRating: product.averageRating || 0,
                    ratingCount: product.ratingCount || 0,
                    soldCount: product.soldCount || 0,
                    stock: product.stock || 0,
                    ageRange: product.ageRange,
                    size: product.size,
                    volume: product.volume,
                    origin: product.origin,
                    description: product.description ? this.stripHtml(product.description).substring(0, 100) + '...' : ''
                };

                this.compareItems.push(compareItem);
                this.saveToStorage();
                this.updateCompareBadge();
                this.updateCompareButtons();
                this.showNotification(`Đã thêm "${product.name}" vào danh sách so sánh!`, 'success');
                return true;
            }
        } catch (error) {
            console.error('Error adding product to compare:', error);
            this.showNotification('Có lỗi xảy ra khi thêm sản phẩm vào danh sách so sánh!', 'error');
            return false;
        }
    }

    /**
     * Xóa sản phẩm khỏi danh sách so sánh
     */
    removeFromCompare(productId) {
        const index = this.compareItems.findIndex(item => item.productId === productId);
        if (index > -1) {
            const productName = this.compareItems[index].name;
            this.compareItems.splice(index, 1);
            this.saveToStorage();
            this.updateCompareBadge();
            this.updateCompareButtons();
            this.showNotification(`Đã xóa "${productName}" khỏi danh sách so sánh!`, 'success');
            
            // Nếu đang mở modal, cập nhật lại
            if (document.getElementById('compareModal')?.classList.contains('show')) {
                this.renderComparison();
            }
        }
    }

    /**
     * Kiểm tra sản phẩm đã có trong danh sách so sánh chưa
     */
    isInCompare(productId) {
        return this.compareItems.some(item => item.productId === productId);
    }

    /**
     * Cập nhật badge số lượng sản phẩm đã chọn
     */
    updateCompareBadge() {
        const count = this.compareItems.length;
        const badges = document.querySelectorAll('.compare-badge');
        badges.forEach(badge => {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        });
        // Cập nhật nút floating
        this.updateFloatingButton();
    }

    /**
     * Cập nhật trạng thái nút so sánh trên các sản phẩm
     */
    updateCompareButtons() {
        document.querySelectorAll('.compare-btn').forEach(btn => {
            const productId = parseInt(btn.dataset.productId);
            if (this.isInCompare(productId)) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-check"></i> Đã thêm';
                btn.title = 'Xóa khỏi danh sách so sánh';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="fas fa-balance-scale"></i> So sánh';
                btn.title = 'Thêm vào danh sách so sánh';
            }
        });
    }

    /**
     * Hiển thị modal so sánh
     */
    showComparison() {
        if (this.compareItems.length < 2) {
            this.showNotification('Cần ít nhất 2 sản phẩm để so sánh!', 'warning');
            return;
        }

        const modal = document.getElementById('compareModal');
        if (modal) {
            this.renderComparison();
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    }

    /**
     * Render bảng so sánh
     */
    renderComparison() {
        const tbody = document.getElementById('compareTableBody');
        if (!tbody) return;

        if (this.compareItems.length < 2) {
            tbody.innerHTML = '<tr><td colspan="' + (this.compareItems.length + 1) + '" class="text-center">Cần ít nhất 2 sản phẩm để so sánh</td></tr>';
            return;
        }

        let html = '';

        // Hình ảnh
        html += '<tr><th scope="row">Hình ảnh</th>';
        this.compareItems.forEach(item => {
            html += `
                <td class="text-center">
                    <img src="${item.mainImageUrl || '/user/img/default-product.jpg'}" 
                         alt="${item.name}" 
                         class="compare-product-image"
                         onerror="this.src='/user/img/default-product.jpg'">
                </td>
            `;
        });
        html += '</tr>';

        // Tên sản phẩm
        html += '<tr><th scope="row">Tên sản phẩm</th>';
        this.compareItems.forEach(item => {
            html += `
                <td>
                    <a href="/product/${item.productId}" class="text-decoration-none text-dark fw-semibold">
                        ${item.name}
                    </a>
                </td>
            `;
        });
        html += '</tr>';

        // Thương hiệu
        html += '<tr><th scope="row">Thương hiệu</th>';
        this.compareItems.forEach(item => {
            html += `<td>${item.brandName || 'N/A'}</td>`;
        });
        html += '</tr>';

        // Danh mục
        html += '<tr><th scope="row">Danh mục</th>';
        this.compareItems.forEach(item => {
            html += `<td>${item.categoryName || 'N/A'}</td>`;
        });
        html += '</tr>';

        // Giá
        html += '<tr><th scope="row">Giá</th>';
        this.compareItems.forEach(item => {
            html += `<td class="fw-bold text-danger">${this.formatPrice(item.price)}</td>`;
        });
        html += '</tr>';

        // Đánh giá
        html += '<tr><th scope="row">Đánh giá</th>';
        this.compareItems.forEach(item => {
            html += `
                <td>
                    <div class="d-flex align-items-center justify-content-center gap-2">
                        ${this.renderStars(item.averageRating)}
                        <span class="text-muted">(${item.ratingCount || 0})</span>
                    </div>
                </td>
            `;
        });
        html += '</tr>';

        // Đã bán
        html += '<tr><th scope="row">Đã bán</th>';
        this.compareItems.forEach(item => {
            html += `<td>${this.formatNumber(item.soldCount || 0)}</td>`;
        });
        html += '</tr>';

        // Tồn kho
        html += '<tr><th scope="row">Tồn kho</th>';
        this.compareItems.forEach(item => {
            const stockStatus = item.stock > 0 ? 
                `<span class="text-success">Còn ${item.stock} sản phẩm</span>` : 
                '<span class="text-danger">Hết hàng</span>';
            html += `<td>${stockStatus}</td>`;
        });
        html += '</tr>';

        // Độ tuổi (Mom & Baby)
        if (this.compareItems.some(item => item.ageRange)) {
            html += '<tr><th scope="row">Độ tuổi</th>';
            this.compareItems.forEach(item => {
                html += `<td>${item.ageRange || 'N/A'}</td>`;
            });
            html += '</tr>';
        }

        // Size (Mom & Baby)
        if (this.compareItems.some(item => item.size)) {
            html += '<tr><th scope="row">Size</th>';
            this.compareItems.forEach(item => {
                html += `<td>${item.size || 'N/A'}</td>`;
            });
            html += '</tr>';
        }

        // Dung tích (Mom & Baby)
        if (this.compareItems.some(item => item.volume)) {
            html += '<tr><th scope="row">Dung tích</th>';
            this.compareItems.forEach(item => {
                html += `<td>${item.volume || 'N/A'}</td>`;
            });
            html += '</tr>';
        }

        // Xuất xứ (Mom & Baby)
        if (this.compareItems.some(item => item.origin)) {
            html += '<tr><th scope="row">Xuất xứ</th>';
            this.compareItems.forEach(item => {
                html += `<td>${item.origin || 'N/A'}</td>`;
            });
            html += '</tr>';
        }

        // Mô tả
        html += '<tr><th scope="row">Mô tả</th>';
        this.compareItems.forEach(item => {
            html += `<td class="small">${item.description || 'N/A'}</td>`;
        });
        html += '</tr>';

        // Hành động
        html += '<tr><th scope="row">Hành động</th>';
        this.compareItems.forEach(item => {
            html += `
                <td>
                    <div class="d-flex flex-column gap-2">
                        <a href="/product/${item.productId}" class="btn btn-sm btn-outline-primary">
                            <i class="fas fa-eye"></i> Xem chi tiết
                        </a>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.productComparisonManager.removeFromCompare(${item.productId})">
                            <i class="fas fa-times"></i> Xóa
                        </button>
                    </div>
                </td>
            `;
        });
        html += '</tr>';

        tbody.innerHTML = html;
    }

    /**
     * Render stars rating
     */
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let html = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                html += '<i class="fas fa-star text-warning"></i>';
            } else if (i === fullStars && hasHalfStar) {
                html += '<i class="fas fa-star-half-alt text-warning"></i>';
            } else {
                html += '<i class="far fa-star text-muted"></i>';
            }
        }
        
        return html;
    }

    /**
     * Format price
     */
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    /**
     * Format number
     */
    formatNumber(num) {
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    /**
     * Strip HTML tags
     */
    stripHtml(html) {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    /**
     * Tạo modal so sánh
     */
    createModal() {
        if (document.getElementById('compareModal')) return;

        const modalHTML = `
            <div class="modal fade" id="compareModal" tabindex="-1" aria-labelledby="compareModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-xl modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="compareModalLabel">
                                <i class="fas fa-balance-scale me-2"></i>So sánh sản phẩm
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table table-bordered table-hover">
                                    <tbody id="compareTableBody">
                                        <!-- Comparison content will be rendered here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                            <button type="button" class="btn btn-danger" onclick="window.productComparisonManager.clearAll()">
                                <i class="fas fa-trash"></i> Xóa tất cả
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Tạo nút floating để hiển thị modal so sánh
     */
    createFloatingButton() {
        if (document.getElementById('floatingCompareButton')) return;

        const buttonHTML = `
            <button id="floatingCompareButton" class="show-compare-btn" style="display: none;">
                <i class="fas fa-balance-scale"></i>
                <span>So sánh</span>
                <span class="compare-badge">0</span>
            </button>
        `;

        document.body.insertAdjacentHTML('beforeend', buttonHTML);

        // Hiển thị nút nếu có sản phẩm trong danh sách
        this.updateFloatingButton();
    }

    /**
     * Cập nhật nút floating
     */
    updateFloatingButton() {
        const button = document.getElementById('floatingCompareButton');
        if (!button) return;

        const count = this.compareItems.length;
        const badge = button.querySelector('.compare-badge');

        if (count > 0) {
            button.style.display = 'flex';
            if (badge) {
                badge.textContent = count;
                badge.style.display = 'inline-block';
            }
        } else {
            button.style.display = 'none';
        }
    }

    /**
     * Xóa tất cả sản phẩm khỏi danh sách so sánh
     */
    clearAll() {
        if (this.compareItems.length === 0) return;
        
        if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi danh sách so sánh?')) {
            this.compareItems = [];
            this.saveToStorage();
            this.updateCompareBadge();
            this.updateCompareButtons();
            this.renderComparison();
            this.showNotification('Đã xóa tất cả sản phẩm khỏi danh sách so sánh!', 'success');
        }
    }

    /**
     * Bind events
     */
    bindEvents() {
        // Click nút so sánh - sử dụng event delegation để hoạt động với dynamic content
        document.addEventListener('click', (e) => {
            const compareBtn = e.target.closest('.compare-btn');
            if (compareBtn) {
                e.preventDefault();
                e.stopPropagation();
                
                const productId = parseInt(compareBtn.dataset.productId);
                if (isNaN(productId)) {
                    console.error('Invalid product ID:', compareBtn.dataset.productId);
                    return;
                }
                
                if (this.isInCompare(productId)) {
                    this.removeFromCompare(productId);
                } else {
                    this.addToCompare(productId);
                }
            }
        });

        // Click nút hiển thị modal so sánh
        document.addEventListener('click', (e) => {
            if (e.target.closest('.show-compare-btn')) {
                e.preventDefault();
                this.showComparison();
            }
        });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Sử dụng hàm showNotification từ main.js nếu có
        if (window.showNotification) {
            window.showNotification(message, type);
        } else if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            // Fallback: alert
            alert(message);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ProductComparisonManager();
    });
} else {
    new ProductComparisonManager();
}

