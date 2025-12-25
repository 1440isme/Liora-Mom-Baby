/**
 * Cart Page JavaScript
 * Xử lý tất cả tương tác trong trang giỏ hàng
 */

class CartPage {
    constructor() {
        this.cartItems = [];
        this.appliedDiscount = null;
        this.selectedItems = new Set();
        this.cartId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCartData();
    }

    bindEvents() {
        $(document).on('click', '.quantity-btn', (e) => {
            this.handleQuantityChange(e);
        });

        // Quantity input direct change
        $(document).on('change', '.quantity-input', (e) => {
            this.handleQuantityInputChange(e);
        });

        // Apply/Remove promo code - prevent duplicate event binding
        $('#applyPromoBtn').off('click').on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.appliedDiscount) {
                this.handleRemovePromo();
            } else {
                this.handleApplyPromo();
            }
        });

        // Chỉ validation khi nhấn Enter hoặc blur (không validation real-time)
        $(document).on('keypress', '.quantity-input', (e) => {
            if (e.which === 13) { // Enter key
                e.preventDefault();
                console.log('Enter pressed, saving quantity...', e.target.value);
                // Blur input để trigger validation và save
                $(e.target).blur();
            }
        });

        // Xử lý khi ra khỏi ô input (blur event)
        $(document).on('blur', '.quantity-input', (e) => {
            this.handleQuantityInputChange(e);
        });

        // Select all checkbox
        $(document).on('change', '#selectAllItems', (e) => {
            this.handleSelectAll(e.target.checked);
        });

        // Individual item checkbox
        $(document).on('change', '.cart-item-checkbox', (e) => {
            this.handleItemSelect(e);
        });

        // Remove item
        $(document).on('click', '.cart-action-btn.delete', (e) => {
            this.handleRemoveItem(e);
        });


        // Toggle unavailable items selection
        $(document).on('click', '#toggleUnavailableSelection', (e) => {
            this.handleToggleUnavailableSelection(e);
        });

        // Delete selected unavailable items
        $(document).on('click', '#deleteSelectedUnavailable', (e) => {
            this.handleDeleteSelectedUnavailable(e);
        });

        // Handle unavailable item selection
        $(document).on('change', '.unavailable-checkbox', (e) => {
            this.handleUnavailableItemSelection(e);
        });

        // Handle select all unavailable items
        $(document).on('change', '#selectAllUnavailable', (e) => {
            this.handleSelectAllUnavailable(e);
        });

        // Handle find similar products
        $(document).on('click', '.btn-find-similar', (e) => {
            this.handleFindSimilarProducts(e);
        });

        // Remove selected items
        $(document).on('click', '#deleteSelectedBtn', () => {
            this.handleRemoveSelected();
        });

        // Checkout button
        $(document).on('click', '#checkoutBtn', (e) => {
            e.preventDefault();
            this.navigateToCheckout();
        });
    }

    async loadCartData() {
        try {
            this.showLoading(true);

            // Lấy thông tin giỏ hàng hiện tại
            const cartResponse = await this.apiCall('/cart/api/current', 'GET');
            this.cartId = cartResponse.cartId;

            if (this.cartId) {
                // Lấy danh sách sản phẩm trong giỏ hàng
                const itemsResponse = await this.apiCall(`/cart/api/${this.cartId}/items`, 'GET');
                this.cartItems = itemsResponse;
                this.renderCartItems();
                this.updateCartSummary();

                // Update header cart badge (server-side count for accuracy on cart page)
                if (window.app && window.app.refreshCartBadge) {
                    window.app.refreshCartBadge();
                } else if (window.app && window.app.updateCartDisplay) {
                    window.app.updateCartDisplay();
                }
            } else {
                this.showEmptyCart();
            }
        } catch (error) {
            this.showToast('Không thể tải thông tin giỏ hàng', 'error');
            this.showEmptyCart();
        } finally {
            this.showLoading(false);
        }
    }

    renderCartItems() {
        if (!this.cartItems || this.cartItems.length === 0) {
            this.showEmptyCart();
            return;
        }

        // Phân loại sản phẩm
        const availableItems = [];
        const unavailableItems = [];

        this.cartItems.forEach(item => {
            const status = this.getProductStatus(item);
            if (status === 'available') {
                availableItems.push(item);
            } else {
                unavailableItems.push(item);
            }
        });

        const cartItemsContainer = $('#cart-items');
        cartItemsContainer.empty();

        // Hiển thị sản phẩm khả dụng trước
        availableItems.forEach(item => {
            const cartItemHTML = this.createCartItemHTML(item);
            cartItemsContainer.append(cartItemHTML);
        });

        // Hiển thị sản phẩm không tồn tại
        if (unavailableItems.length > 0) {
            cartItemsContainer.append(this.createUnavailableItemsSection(unavailableItems));
        }

        this.showCartWithItems();

        // Cập nhật trạng thái UI sau khi render
        this.updateSelectAllState();
        this.updateDeleteButton();
        this.updateCartSummary();
    }

    createCartItemHTML(item) {
        const productStatus = this.getProductStatus(item);
        const isDisabled = productStatus !== 'available';

        return `
            <div class="cart-item ${isDisabled ? 'disabled' : ''}" data-cart-product-id="${item.idCartProduct}" data-unit-price="${item.productPrice || 0}">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <div class="form-check">
                            <input class="form-check-input cart-item-checkbox" type="checkbox" 
                                   ${item.choose ? 'checked' : ''} 
                                   ${isDisabled ? 'disabled' : ''}>
                        </div>
                    </div>
                    <div class="col-auto">
                        <a href="/product/${item.idProduct}" style="text-decoration: none;">
                            <img src="${item.mainImageUrl || 'https://placehold.co/300x300'}" alt="${item.productName || 'Sản phẩm'}" class="cart-product-image">
                        </a>
                    </div>
                    <div class="col">
                        <div class="cart-product-info">
                            <a href="/product/${item.idProduct}" style="text-decoration: none; color: inherit;">
                                <h6 class="cart-product-title">${item.productName || 'Tên sản phẩm'}</h6>
                            </a>
                            <div class="cart-product-brand">
                                <a href="/brand/${item.brandId}" class="text-decoration-none brand-link" style="color: var(--accent-color);">
                                    ${item.brandName || 'Thương hiệu'}
                                </a>
                            </div>
                            <div class="cart-product-price" style="background-color: #f8f9fa; padding: 1px 4px; border-radius: 3px; font-size: 0.8rem; color: #6c757d; display: inline-block;">
                                Đơn giá: ${this.formatCurrency(item.productPrice || 0)}
                            </div>
                            ${this.getProductStatusTag(productStatus)}
                        </div>
                    </div>
                    <div class="col-auto">
                        <div class="quantity-controls">
                            <button class="quantity-btn" data-action="decrease" ${isDisabled ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${Math.min(item.stock || 99, 99)}" ${isDisabled ? 'disabled' : ''}>
                            <button class="quantity-btn" data-action="increase" ${isDisabled ? 'disabled' : ''}>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-auto">
                        <div class="cart-price-section">
                            <div class="cart-price">${this.formatCurrency(item.totalPrice || 0)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createUnavailableItemsSection(unavailableItems) {
        const itemsHTML = unavailableItems.map(item => this.createUnavailableItemHTML(item)).join('');

        return `
            <div class="unavailable-items-section">
                <div class="section-divider">
                    <hr>
                    <span class="divider-text">Sản phẩm không tồn tại</span>
                    <hr>
                </div>
                <div class="unavailable-items-header">
                    <div class="unavailable-items-controls">
                        <div class="unavailable-select-all" style="display: none;">
                            <input type="checkbox" id="selectAllUnavailable" class="select-all-checkbox">
                            <label for="selectAllUnavailable" class="select-all-label">Chọn tất cả</label>
                        </div>
                        <button class="btn btn-outline-danger btn-sm" id="deleteSelectedUnavailable" style="display: none;">
                            <i class="fas fa-trash"></i>
                            <span class="selected-count">0</span>
                        </button>
                        <button class="btn btn-link btn-sm" id="toggleUnavailableSelection" title="Chọn sản phẩm để xóa">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                <div class="unavailable-items">
                    ${itemsHTML}
                </div>
            </div>
        `;
    }

    createUnavailableItemHTML(item) {
        const productStatus = this.getProductStatus(item);
        const statusText = productStatus === 'out_of_stock' ? 'Hết hàng' : 'Ngừng kinh doanh';
        const statusClass = productStatus === 'out_of_stock' ? 'status-out-of-stock' : 'status-deactivated';

        return `
            <div class="unavailable-item" data-cart-product-id="${item.idCartProduct}">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <div class="unavailable-item-checkbox" style="display: none;">
                            <input type="checkbox" class="unavailable-checkbox" data-cart-product-id="${item.idCartProduct}">
                        </div>
                    </div>
                    <div class="col-auto">
                        <a href="/product/${item.idProduct}" style="text-decoration: none;">
                            <img src="${item.mainImageUrl || 'https://placehold.co/300x300'}" alt="${item.productName || 'Sản phẩm'}" class="unavailable-product-image">
                        </a>
                    </div>
                    <div class="col">
                        <div class="unavailable-product-info">
                            <a href="/product/${item.idProduct}" style="text-decoration: none; color: inherit;">
                                <h6 class="unavailable-product-title">${item.productName || 'Tên sản phẩm'}</h6>
                            </a>
                            <div class="unavailable-product-brand">
                                <a href="/brand/${item.brandId}" class="text-decoration-none brand-link" style="color: var(--accent-color);">
                                    ${item.brandName || 'Thương hiệu'}
                                </a>
                            </div>
                            <span class="product-status-tag ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                    <div class="col-auto">
                        <a href="/similar-products?q=${encodeURIComponent(item.productName || '')}&similar=true" class="btn btn-outline-primary btn-sm btn-find-similar" data-product-id="${item.idProduct}">
                            <i class="fas fa-search"></i>
                            <span class="btn-text">Tìm sản phẩm tương tự</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Use CartUtils for product status
    getProductStatus(item) {
        return CartUtils.getProductStatus(item);
    }

    getProductStatusTag(status) {
        return CartUtils.getProductStatusTag(status);
    }

    async handleQuantityChange(e) {
        await CartUtils.handleQuantityChange(
            e,
            this.updateCartProductQuantity.bind(this),
            CartUtils.showToast.bind(this),
            this.updateCartSummary.bind(this) // Callback để cập nhật tổng tiền sau khi thay đổi
        );
    }

    async handleQuantityInputChange(e) {
        await CartUtils.handleQuantityInputChange(
            e, 
            this.updateCartProductQuantity.bind(this), 
            CartUtils.showToast.bind(this),
            this.updateCartSummary.bind(this) // Callback để cập nhật tổng tiền sau khi thay đổi
        );
    }

    async handleSelectAll(isChecked) {
        $('.cart-item-checkbox').prop('checked', isChecked);
        $('.cart-item').toggleClass('selected', isChecked);

        // Cập nhật tất cả sản phẩm trong giỏ hàng
        const promises = [];
        $('.cart-item').each((index, item) => {
            const cartProductId = $(item).data('cart-product-id');
            promises.push(this.updateCartProductSelection(cartProductId, isChecked));
        });

        await Promise.all(promises);
        this.updateDeleteButton();
        this.updateCartSummary();
    }

    async handleItemSelect(e) {
        const checkbox = $(e.target);
        const cartItem = checkbox.closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');
        const isChecked = checkbox.is(':checked');

        cartItem.toggleClass('selected', isChecked);
        await this.updateCartProductSelection(cartProductId, isChecked);
        this.updateSelectAllState();
        this.updateDeleteButton();
        this.updateCartSummary();
    }

    updateSelectAllState() {
        const totalItems = $('.cart-item-checkbox').length;
        const checkedItems = $('.cart-item-checkbox:checked').length;
        const selectAllCheckbox = $('#selectAllItems');

        if (checkedItems === 0) {
            selectAllCheckbox.prop('checked', false).prop('indeterminate', false);
        } else if (checkedItems === totalItems) {
            selectAllCheckbox.prop('checked', true).prop('indeterminate', false);
        } else {
            selectAllCheckbox.prop('checked', false).prop('indeterminate', true);
        }
    }

    updateDeleteButton() {
        const hasSelected = $('.cart-item-checkbox:checked').length > 0;
        const deleteBtn = $('#deleteSelectedBtn');

        if (hasSelected) {
            deleteBtn.prop('disabled', false);
        } else {
            deleteBtn.prop('disabled', true);
        }

        console.log('Update delete button - hasSelected:', hasSelected, 'disabled:', deleteBtn.prop('disabled'));
    }

    handleRemoveItem(e) {
        const cartItem = $(e.target).closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');
        const productName = cartItem.find('.cart-product-title').text();

        CartUtils.showConfirmDialog(
            'Xóa sản phẩm',
            `Bạn có chắc chắn muốn xóa "${productName}" khỏi giỏ hàng?`,
            async () => {
                await this.removeCartProduct(cartProductId, cartItem);
            }
        );
    }

    handleRemoveSelected() {
        const selectedCount = $('.cart-item-checkbox:checked').length;

        if (selectedCount === 0) return;

        CartUtils.showConfirmDialog(
            'Xóa sản phẩm đã chọn',
            `Bạn có chắc chắn muốn xóa ${selectedCount} sản phẩm đã chọn?`,
            async () => {
                try {
                    // Gọi API để xóa tất cả sản phẩm đã chọn
                    const response = await this.apiCall(
                        `/CartProduct/${this.cartId}/selected`,
                        'DELETE'
                    );

                    // Lấy danh sách ID của các sản phẩm đã chọn để xóa khỏi cartItems
                    const selectedIds = [];
                    $('.cart-item-checkbox:checked').each((index, checkbox) => {
                        const cartItem = $(checkbox).closest('.cart-item');
                        const cartProductId = cartItem.data('cart-product-id');
                        selectedIds.push(cartProductId);
                    });

                    // Xóa khỏi dữ liệu local
                    this.cartItems = this.cartItems.filter(item => !selectedIds.includes(item.idCartProduct));

                    // Xóa tất cả sản phẩm đã chọn khỏi DOM
                    $('.cart-item-checkbox:checked').closest('.cart-item').each((index, item) => {
                        this.removeItemWithAnimation($(item));
                    });

                    // Cập nhật lại UI sau khi xóa
                    this.updateSelectAllState();
                    this.updateDeleteButton();
                    this.updateCartSummary();

                    // Update header cart badge (server-side count for accuracy on cart page)
                    if (window.app && window.app.refreshCartBadge) {
                        window.app.refreshCartBadge();
                    } else if (window.app && window.app.updateCartDisplay) {
                        window.app.updateCartDisplay();
                    }

                } catch (error) {
                    CartUtils.showToast('Không thể xóa sản phẩm đã chọn', 'error');
                }
            }
        );
    }


    handleToggleUnavailableSelection(e) {
        e.preventDefault();
        const button = $(e.target).closest('#toggleUnavailableSelection');
        const isActive = button.hasClass('active');

        if (isActive) {
            // Tắt chế độ chọn
            button.removeClass('active');
            $('.unavailable-item-checkbox').hide();
            $('.unavailable-select-all').hide();
            $('#deleteSelectedUnavailable').hide();
            $('.unavailable-checkbox').prop('checked', false);
            $('#selectAllUnavailable').prop('checked', false);
        } else {
            // Bật chế độ chọn
            button.addClass('active');
            $('.unavailable-item-checkbox').show();
            $('.unavailable-select-all').show();
            $('#deleteSelectedUnavailable').show();
            this.updateSelectAllUnavailableState();
        }
    }

    handleUnavailableItemSelection(e) {
        this.updateUnavailableDeleteButton();
        this.updateSelectAllUnavailableState();
    }

    handleSelectAllUnavailable(e) {
        const isChecked = $(e.target).is(':checked');
        $('.unavailable-checkbox').prop('checked', isChecked);
        this.updateUnavailableDeleteButton();
    }

    updateSelectAllUnavailableState() {
        const totalUnavailable = $('.unavailable-checkbox').length;
        const selectedUnavailable = $('.unavailable-checkbox:checked').length;
        const selectAllCheckbox = $('#selectAllUnavailable');

        if (selectedUnavailable === 0) {
            selectAllCheckbox.prop('checked', false);
            selectAllCheckbox.prop('indeterminate', false);
        } else if (selectedUnavailable === totalUnavailable) {
            selectAllCheckbox.prop('checked', true);
            selectAllCheckbox.prop('indeterminate', false);
        } else {
            selectAllCheckbox.prop('checked', false);
            selectAllCheckbox.prop('indeterminate', true);
        }
    }

    updateUnavailableDeleteButton() {
        const selectedCount = $('.unavailable-checkbox:checked').length;
        const deleteBtn = $('#deleteSelectedUnavailable');
        const countSpan = deleteBtn.find('.selected-count');

        // Luôn hiển thị thùng rác khi ở chế độ chọn
        if ($('#toggleUnavailableSelection').hasClass('active')) {
            deleteBtn.show();

            // Thêm/xóa class enabled dựa trên số lượng được chọn
            if (selectedCount > 0) {
                deleteBtn.addClass('enabled');
            } else {
                deleteBtn.removeClass('enabled');
            }
        }

        // Cập nhật số lượng (nhưng đã ẩn bằng CSS)
        countSpan.text(selectedCount);
    }

    async handleDeleteSelectedUnavailable(e) {
        e.preventDefault();
        const selectedCheckboxes = $('.unavailable-checkbox:checked');

        if (selectedCheckboxes.length === 0) {
            CartUtils.showToast('Vui lòng chọn sản phẩm để xóa', 'warning');
            return;
        }

        CartUtils.showConfirmDialog(
            'Xóa sản phẩm đã chọn',
            `Bạn có chắc chắn muốn xóa ${selectedCheckboxes.length} sản phẩm đã chọn?`,
            async () => {
                try {
                    const selectedIds = [];
                    selectedCheckboxes.each((index, checkbox) => {
                        const cartProductId = $(checkbox).data('cart-product-id');
                        selectedIds.push(cartProductId);
                    });

                    console.log('Deleting unavailable items:', selectedIds);

                    // Xóa từng sản phẩm không tồn tại
                    for (const cartProductId of selectedIds) {
                        console.log('Deleting unavailable cart product:', cartProductId);
                        await this.apiCall(`/CartProduct/${this.cartId}/unavailable/${cartProductId}`, 'DELETE');
                    }

                    // Xóa khỏi dữ liệu local
                    this.cartItems = this.cartItems.filter(item => !selectedIds.includes(item.idCartProduct));

                    // Xóa khỏi DOM
                    selectedCheckboxes.closest('.unavailable-item').each((index, item) => {
                        this.removeItemWithAnimation($(item));
                    });

                    // Tắt chế độ chọn
                    $('#toggleUnavailableSelection').removeClass('active');
                    $('.unavailable-item-checkbox').hide();
                    $('.unavailable-select-all').hide();
                    $('#deleteSelectedUnavailable').hide();
                    $('.unavailable-checkbox').prop('checked', false);
                    $('#selectAllUnavailable').prop('checked', false);

                    // Cập nhật lại UI
                    this.updateCartSummary();

                    // Update header cart badge
                    if (window.app && window.app.forceUpdateCartDisplay) {
                        window.app.forceUpdateCartDisplay();
                    }

                    CartUtils.showToast(`Đã xóa ${selectedIds.length} sản phẩm khỏi giỏ hàng`, 'success');

                } catch (error) {
                    console.error('Error deleting unavailable items:', error);
                    this.showToast('Không thể xóa sản phẩm đã chọn', 'error');
                }
            }
        );
    }

    handleFindSimilarProducts(e) {
        e.preventDefault();
        const button = $(e.target).closest('.btn-find-similar');
        const productId = button.data('product-id');

        if (!productId) {
            this.showToast('Không thể tìm sản phẩm tương tự', 'error');
            return;
        }

        // Hiển thị loading và chuyển đến trang sản phẩm tương tự
        this.showLoading(true);
        
        // Thêm delay nhỏ để user thấy loading
        setTimeout(() => {
            window.location.href = `/product/similar-products/${productId}`;
        }, 500);
    }

    removeItemWithAnimation(cartItem) {
        cartItem.addClass('removing');

        setTimeout(() => {
            cartItem.fadeOut(300, () => {
                cartItem.remove();
                this.updateSelectAllState();
                this.updateDeleteButton();
                this.updateCartSummary();
                this.checkIfCartEmpty();
            });
        }, 200);
    }

    async removeUnavailableItem(cartProductId, cartItemElement) {
        try {
            await this.apiCall(
                `/CartProduct/${this.cartId}/unavailable/${cartProductId}`,
                'DELETE'
            );

            // Xóa khỏi dữ liệu local
            this.cartItems = this.cartItems.filter(item => item.idCartProduct !== cartProductId);

            // Animation xóa
            this.removeItemWithAnimation(cartItemElement);

            // Update header cart badge (server-side count for accuracy on cart page)
            if (window.app && window.app.forceUpdateCartDisplay) {
                window.app.forceUpdateCartDisplay();
            }

            this.showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'success');

        } catch (error) {
            this.showToast('Không thể xóa sản phẩm', 'error');
        }
    }

    checkIfCartEmpty() {
        if (!this.cartItems || this.cartItems.length === 0) {
            this.showEmptyCart();
        }
    }

    showEmptyCart() {
        $('#cart-items-row').fadeOut(300, () => {
            $('#cart-empty-row').fadeIn(300);
        });
    }

    showCartWithItems() {
        $('#cart-empty-row').fadeOut(300, () => {
            $('#cart-items-row').fadeIn(300);
        });
    }

    async updateCartSummary() {
        try {
            // ✅ Gọi API để lấy tổng tiền từ backend
            const totalResponse = await this.apiCall(`/cart/api/${this.cartId}/total`, 'GET');
            const subtotal = totalResponse || 0;

            // Đếm số sản phẩm đã chọn (để hiển thị)
            let selectedCount = 0;
            let availableSelectedCount = 0;

            $('.cart-item').each((index, element) => {
                const $item = $(element);
                const checkbox = $item.find('.cart-item-checkbox');
                if (!checkbox.is(':checked')) return;

                const cartProductId = $item.data('cart-product-id');
                const cartItem = this.cartItems.find(item => item.idCartProduct === cartProductId);
                
                if (!cartItem) return;
                
                selectedCount++;
                
                // Đếm sản phẩm hợp lệ (available=true, isActive=true)
                if (cartItem.choose && cartItem.available && cartItem.isActive) {
                    availableSelectedCount++;
                }
            });

            // ✅ FIX: Tính lại discount amount nếu có discount được áp dụng
            let discountAmount = 0;
            if (this.appliedDiscount) {
                discountAmount = this.appliedDiscount.discountAmount || 0;
                this.recalculateDiscountAmount(subtotal);
            }
            
            const total = subtotal - discountAmount;

            $('#selected-count').text(selectedCount);
            $('#subtotal').text(this.formatCurrency(subtotal));
            $('#total').text(this.formatCurrency(total));

            // Luôn hiển thị dòng giảm giá
            $('.summary-row').eq(1).show();
            $('#discount').text(`-${this.formatCurrency(discountAmount)}`);

            // Chỉ cho phép checkout nếu có ít nhất 1 sản phẩm khả dụng được chọn
            $('#checkoutBtn').prop('disabled', availableSelectedCount === 0);

            // Hiển thị cảnh báo nếu có sản phẩm không khả dụng được chọn
            if (selectedCount > 0 && availableSelectedCount === 0) {
                this.showToast('Không thể thanh toán: Tất cả sản phẩm đã chọn đều không khả dụng', 'warning');
            } else if (selectedCount > availableSelectedCount) {
                this.showToast(`${selectedCount - availableSelectedCount} sản phẩm không khả dụng sẽ bị loại bỏ khỏi đơn hàng`, 'info');
            }
        } catch (error) {
            console.error('Error updating cart summary:', error);
            // Fallback: Hiển thị 0 nếu API lỗi
            $('#subtotal').text(this.formatCurrency(0));
            $('#total').text(this.formatCurrency(0));
        }
    }

    // ✅ FIX: Method để tính lại discount amount khi subtotal thay đổi
    async recalculateDiscountAmount(subtotal) {
        if (!this.appliedDiscount) return;
        
        try {
            const response = await this.apiCall('/discounts/apply', 'POST', {
                discountCode: this.appliedDiscount.discountCode,
                orderTotal: subtotal
            });

            if (response.result) {
                // Cập nhật discount amount mới
                this.appliedDiscount.discountAmount = response.result.discountAmount;
                
                // Cập nhật UI với discount amount mới
                $('#discount').text(`-${this.formatCurrency(this.appliedDiscount.discountAmount)}`);
                const total = subtotal - this.appliedDiscount.discountAmount;
                $('#total').text(this.formatCurrency(total));
            }
        } catch (error) {
            console.warn('Không thể tính lại discount amount:', error);
            // Nếu không tính được, có thể discount không còn hợp lệ
            // Có thể hiển thị thông báo hoặc gỡ discount
        }
    }

    handleCheckout() {
        const selectedCount = $('.cart-item-checkbox:checked').length;

        if (selectedCount === 0) {
            this.showToast('Vui lòng chọn ít nhất một sản phẩm để thanh toán', 'warning');
            return;
        }

        // Show loading
        this.showLoading(true);

        // Simulate checkout process
        setTimeout(() => {
            this.showLoading(false);
            this.showToast('Chuyển đến trang thanh toán...', 'success');

            // Redirect to checkout page
            setTimeout(() => {
                window.location.href = '/checkout';
            }, 1000);
        }, 1500);
    }

    async handleApplyPromo() {
        // Prevent multiple simultaneous calls
        if (this.isApplyingPromo) {
            return;
        }
        
        this.isApplyingPromo = true;
        
        const promoCode = $('#promoCode').val().trim();

        if (!promoCode) {
            this.isApplyingPromo = false;
            return;
        }

        try {
            this.showLoading(true);

            // ✅ Gọi API để lấy tổng tiền từ backend
            const totalResponse = await this.apiCall(`/cart/api/${this.cartId}/total`, 'GET');
            const orderTotal = totalResponse || 0;

            // Gọi API để kiểm tra và áp dụng mã giảm giá
            const response = await this.apiCall('/discounts/apply', 'POST', {
                discountCode: promoCode,
                orderTotal: orderTotal
            });

            if (response.result) {
                // Lưu thông tin discount
                this.appliedDiscount = response.result;
                this.showToast('Áp dụng mã giảm giá thành công!', 'success');
                $('#promoCode').val('').attr('placeholder', `${promoCode}`).prop('disabled', true);
                $('#applyPromoBtn').text('Gỡ mã').removeClass('btn-primary').addClass('btn-outline-danger');

                // Cập nhật summary với thông tin discount
                this.updateCartSummary();
            }

        } catch (error) {
            // Hiển thị thông báo lỗi chi tiết
            let errorMessage = 'Mã giảm giá không hợp lệ';

            try {
                const errorData = JSON.parse(error.message);
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // Nếu không parse được JSON, dùng message gốc
                if (error.message) {
                    errorMessage = error.message;
                }
            }

            this.showToast(errorMessage, 'error');
        } finally {
            this.showLoading(false);
            this.isApplyingPromo = false;
        }
    }

    // gỡ mã giảm giá
    handleRemovePromo() {
        this.appliedDiscount = null;
        this.showToast('Đã gỡ mã giảm giá', 'info');

        // ✅ SỬA: Reset UI về trạng thái ban đầu
        $('#promoCode').val('').attr('placeholder', 'Nhập mã giảm giá').prop('disabled', false);
        $('#applyPromoBtn').text('Áp dụng').removeClass('btn-outline-danger');

        this.updateCartSummary();
    }

    // Wrapper methods for CartUtils
    showToast(message, type = 'info') {
        CartUtils.showToast(message, type);
    }

    showLoading(show) {
        CartUtils.showLoading(show);
    }

    formatCurrency(amount) {
        return CartUtils.formatCurrency(amount);
    }

    async apiCall(url, method = 'GET', data = null) {
        return CartUtils.apiCall(url, method, data);
    }

    async updateCartProductQuantity(cartProductId, quantity) {
        try {
            const response = await this.apiCall(
                `/CartProduct/${this.cartId}/${cartProductId}`,
                'PUT',
                { quantity: quantity }
            );

            // Cập nhật dữ liệu local
            const cartItem = this.cartItems.find(item => item.idCartProduct === cartProductId);
            if (cartItem) {
                cartItem.quantity = quantity;
                cartItem.totalPrice = response.totalPrice;
            }

            // Cập nhật giá trong DOM
            const cartItemElement = $(`.cart-item[data-cart-product-id="${cartProductId}"]`);
            const priceElement = cartItemElement.find('.cart-price');
            if (priceElement.length > 0) {
                priceElement.text(CartUtils.formatCurrency(response.totalPrice));
            }

            this.updateCartSummary();

            // Update header cart badge
            if (window.app && window.app.forceUpdateCartDisplay) {
                window.app.forceUpdateCartDisplay();
            }
        } catch (error) {
            CartUtils.showToast('Không thể cập nhật số lượng sản phẩm', 'error');
        }
    }

    async updateCartProductSelection(cartProductId, isSelected) {
        try {
            // Lấy quantity hiện tại từ DOM
            const cartItem = $(`.cart-item[data-cart-product-id="${cartProductId}"]`);
            const currentQuantity = parseInt(cartItem.find('.quantity-input').val()) || 1;


            const response = await this.apiCall(
                `/CartProduct/${this.cartId}/${cartProductId}`,
                'PUT',
                {
                    choose: isSelected,
                    quantity: currentQuantity
                }
            );

            // Cập nhật dữ liệu local
            const localCartItem = this.cartItems.find(item => item.idCartProduct === cartProductId);
            if (localCartItem) {
                localCartItem.choose = isSelected;
            }
        } catch (error) {
            CartUtils.showToast('Không thể cập nhật trạng thái chọn sản phẩm', 'error');
        }
    }

    async removeCartProduct(cartProductId, cartItemElement) {
        try {
            await this.apiCall(
                `/CartProduct/${this.cartId}/${cartProductId}`,
                'DELETE'
            );

            // Xóa khỏi dữ liệu local
            this.cartItems = this.cartItems.filter(item => item.idCartProduct !== cartProductId);

            // Animation xóa
            this.removeItemWithAnimation(cartItemElement);

            // Update header cart badge
            if (window.app && window.app.forceUpdateCartDisplay) {
                window.app.forceUpdateCartDisplay();
            }

        } catch (error) {
            this.showToast('Không thể xóa sản phẩm khỏi giỏ hàng', 'error');
        }
    }



    async navigateToCheckout() {
        const result = await CartUtils.validateSelectedProducts(
            this.cartId, 
            this.showToast.bind(this), 
            (items) => { 
                this.cartItems = items; 
                this.renderCartItems(); 
            },
            () => {
                // Show loading overlay
                this.showLoading(true);

                // Add smooth transition effect
                $('body').addClass('page-transition');

                // Navigate after a short delay for smooth effect
                setTimeout(() => {
                    window.location.href = '/checkout';
                }, 300);
            }
        );
    }

}

// Initialize cart page when DOM is ready
$(document).ready(() => {
    window.cartPage = new CartPage();
});