// Order Detail JavaScript
// Object to store CKEditor instances
window.reviewEditors = {};

// ✅ Helper function to handle video upload for CKEditor
function uploadVideoToEditor(editorId) {
    const editor = window.reviewEditors[editorId];
    if (!editor) {
        console.error('Editor not found:', editorId);
        return;
    }
    
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.style.display = 'none';
    
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) {
            document.body.removeChild(input);
            return;
        }
        
        try {
            // Get current content
            const currentContent = editor.getData();
            
            // Show loading message in editor
            const loadingMsg = `<p><em>📹 Đang tải lên video: ${file.name}...</em></p>`;
            const newContentWithLoading = currentContent + loadingMsg;
            editor.setData(newContentWithLoading);
            
            // Upload video
            const formData = new FormData();
            formData.append('upload', file);
            
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/reviews/upload-media', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token || ''}`
                },
                body: formData,
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'Upload failed');
            }
            
            // Remove loading message and insert video
            const currentEditorContent = editor.getData();
            const cleanedContent = currentEditorContent.replace(/<p><em>📹 Đang tải lên video:.*?<\/em><\/p>/g, '');
            
            // Insert video as a figure element (CKEditor compatible format)
            const videoHtml = `<figure class="media"><video controls src="${data.url}" style="max-width: 100%; height: auto;"></video></figure>`;
            const finalContent = cleanedContent + videoHtml + '<p><br></p>';
            
            editor.setData(finalContent);
            
            console.log('Inserted video HTML:', videoHtml);
            console.log('Final content:', finalContent);
            
            // Wait a moment then check if video was inserted
            setTimeout(() => {
                const editorData = editor.getData();
                console.log('Editor data after insert:', editorData);
                if (!editorData.includes('video')) {
                    console.warn('Video tag was stripped by CKEditor!');
                }
            }, 100);
            
            console.log('Video uploaded successfully:', data.url);
            document.body.removeChild(input);
        } catch (error) {
            console.error('Video upload error:', error);
            alert('Lỗi khi tải lên video: ' + error.message);
            
            // Remove loading message on error
            const currentContent = editor.getData();
            const cleanedContent = currentContent.replace(/<p><em>Đang tải lên video:.*?<\/em><\/p>/g, '');
            editor.setData(cleanedContent);
            
            document.body.removeChild(input);
        }
    };
    
    document.body.appendChild(input);
    input.click();
}

// Initialize CKEditor for review textareas
async function initReviewEditors() {
    // Wait a bit for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('Looking for .review-editor elements, found:', $('.review-editor').length);
    
    $('.review-editor').each(function() {
        const textarea = $(this)[0];
        const editorId = textarea.id;
        
        console.log('Found textarea with ID:', editorId);
        
        // Skip if already initialized
        if (window.reviewEditors && window.reviewEditors[editorId]) {
            console.log('CKEditor already initialized for:', editorId);
            return;
        }
        
        // Check if ClassicEditor is available
        if (typeof ClassicEditor === 'undefined') {
            console.error('ClassicEditor is not defined. CKEditor CDN may not be loaded.');
            return;
        }
        
        console.log('Initializing CKEditor for:', editorId);
        
        // Initialize CKEditor with upload functionality
        ClassicEditor
            .create(textarea, {
                image: {
                    toolbar: ['imageTextAlternative', '|', 'imageStyle:alignLeft', 'imageStyle:alignRight'],
                    styles: ['alignLeft', 'alignRight'],
                    resizeOptions: [
                        {
                            name: 'imageResize:original',
                            label: 'Original',
                            value: null
                        },
                        {
                            name: 'imageResize:50',
                            label: '50%',
                            value: '50'
                        },
                        {
                            name: 'imageResize:75',
                            label: '75%',
                            value: '75'
                        }
                    ]
                },
                toolbar: {
                    items: [
                        'undo', 'redo', '|',
                        'heading', '|',
                        'bold', 'italic', '|',
                        'link', '|',
                        'uploadImage', 'insertTable', 'mediaEmbed', '|',
                        'bulletedList', 'numberedList'
                    ]
                },
                // ✅ Allow HTML elements for video
                htmlSupport: {
                    allow: [
                        {
                            name: 'video',
                            styles: true,
                            attributes: ['src', 'controls', 'width', 'height'],
                            classes: true
                        },
                        {
                            name: 'source',
                            styles: false,
                            attributes: ['src', 'type'],
                            classes: false
                        },
                        {
                            name: 'figure',
                            styles: false,
                            attributes: ['class'],
                            classes: ['media']
                        }
                    ]
                },
                heading: {
                    options: [
                        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
                    ]
                },
                simpleUpload: {
                    uploadUrl: '/api/reviews/upload-media',
                    withCredentials: true,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
                    },
                    allowedTypes: ['image', 'video']
                },
                pasteFromOfficeEnabled: true,
                height: 200
            })
            .then(editor => {
                console.log('CKEditor initialized successfully for:', editorId);
                
                // Configure upload adapter manually after editor is created
                if (editor.plugins.get('FileRepository')) {
                    editor.plugins.get('FileRepository').createUploadAdapter = function(loader) {
                        return {
                            upload: function() {
                                return loader.file
                                    .then(file => {
                                        const formData = new FormData();
                                        formData.append('upload', file);
                                        
                                        return fetch('/api/reviews/upload-media', {
                                            method: 'POST',
                                            headers: {
                                                'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
                                            },
                                            body: formData,
                                            credentials: 'include'
                                        })
                                        .then(response => response.json())
                                        .then(data => {
                                            if (data.error) {
                                                throw new Error(data.error.message || 'Upload failed');
                                            }
                                            return {
                                                default: data.url
                                            };
                                        })
                                        .catch(error => {
                                            console.error('Upload error:', error);
                                            throw error;
                                        });
                                    });
                            },
                            abort: function() {
                                // Handle abort if needed
                            }
                        };
                    };
                }
                
                if (!window.reviewEditors) {
                    window.reviewEditors = {};
                }
                window.reviewEditors[editorId] = editor;
            })
            .catch(error => {
                console.error('Error initializing CKEditor for', editorId, ':', error);
            });
    });
}

// Function to destroy CKEditor instances
function destroyReviewEditors() {
    Object.keys(window.reviewEditors).forEach(editorId => {
        if (window.reviewEditors[editorId]) {
            window.reviewEditors[editorId].destroy()
                .then(() => {
                    console.log('CKEditor destroyed:', editorId);
                })
                .catch(error => {
                    console.error('Error destroying CKEditor:', error);
                });
        }
    });
    window.reviewEditors = {};
}

function cancelOrder(orderId) {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Bạn không thể thực hiện thao tác này');
            return;
        }

        fetch(`/order/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (response.ok) {
                    alert('Hủy đơn hàng thành công!');
                    window.location.reload();
                } else {
                    return response.json().then(errorData => {
                        alert('Lỗi: ' + (errorData.message || 'Không thể hủy đơn hàng'));
                    });
                }
            })
            .catch(error => {
                alert('Có lỗi xảy ra khi hủy đơn hàng');
            });
    }
}

// Enhanced reorder function with modal (from order-detail.js)
async function reorderOrder(orderId) {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            showToast('Bạn không thể thực hiện thao tác này', 'error');
            return;
        }

        // Lấy danh sách sản phẩm từ đơn hàng
        const orderItemsResponse = await fetch(`/api/orders/${orderId}/items`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!orderItemsResponse.ok) {
            throw new Error('Không thể lấy thông tin sản phẩm từ đơn hàng');
        }

        const orderItems = await orderItemsResponse.json();
        if (!orderItems || orderItems.length === 0) {
            showToast('Đơn hàng không có sản phẩm nào', 'error');
            return;
        }

        // Lấy thông tin trạng thái sản phẩm hiện tại
        const enrichedItems = await enrichOrderItemsWithCurrentStatus(orderItems, token);

        // Phân loại sản phẩm
        const validItems = [];
        const invalidItems = [];

        enrichedItems.forEach(item => {
            const productStatus = getProductStatus(item);
            if (productStatus === 'available') {
                validItems.push(item);
            } else {
                invalidItems.push(item);
            }
        });


        // Nếu tất cả sản phẩm đều hợp lệ
        if (validItems.length === enrichedItems.length && validItems.length > 0) {
            // Thêm tất cả vào giỏ hàng và chuyển đến cart
            await addItemsToCartDirectly(validItems);
            return;
        }

        // Nếu tất cả sản phẩm đều không hợp lệ
        if (invalidItems.length === enrichedItems.length) {
            showToast('Tất cả sản phẩm trong đơn hàng đều không hợp lệ (hết hàng hoặc ngừng kinh doanh)', 'error');
            return;
        }

        // Nếu có cả sản phẩm hợp lệ và không hợp lệ, hiển thị modal
        showReorderModal(enrichedItems);

    } catch (error) {
        console.error('Error reordering:', error);
        showToast('Có lỗi xảy ra khi thực hiện mua lại', 'error');
    }
}

// Helper functions for enhanced reorder
async function enrichOrderItemsWithCurrentStatus(orderItems, token) {
    const enrichedItems = [];

    for (const item of orderItems) {
        try {
            // Gọi API lấy thông tin sản phẩm hiện tại
            const productResponse = await fetch(`/api/products/${item.idProduct}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (productResponse.ok) {
                const productData = await productResponse.json();
                const product = productData.result;

                // Kết hợp thông tin từ order và thông tin sản phẩm hiện tại
                enrichedItems.push({
                    ...item,
                    isActive: product.isActive,
                    available: product.available,
                    stock: product.stock
                });
            } else {
                // Nếu không lấy được thông tin sản phẩm, giữ nguyên
                enrichedItems.push(item);
            }
        } catch (error) {
            console.error('Error fetching product info for:', item.idProduct, error);
            // Nếu có lỗi, giữ nguyên thông tin cũ
            enrichedItems.push(item);
        }
    }

    return enrichedItems;
}

async function addItemsToCartDirectly(items) {
    let successCount = 0;
    let failedItems = [];

    for (const item of items) {
        try {
            if (window.app && typeof window.app.addProductToCartBackend === 'function') {
                await window.app.addProductToCartBackend(item.idProduct, item.quantity, false);
                successCount++;
            }
        } catch (error) {
            console.error('Error adding product to cart:', error);
            failedItems.push({
                productId: item.idProduct,
                quantity: item.quantity,
                error: error.message || 'Không thể thêm vào giỏ hàng'
            });
        }
    }

    if (successCount > 0) {
        showToast(`Đã thêm ${successCount} sản phẩm vào giỏ hàng`, 'success');
        // Chuyển đến trang giỏ hàng sau 1.5 giây
        setTimeout(() => {
            window.location.href = '/cart';
        }, 1500);
    }

    if (failedItems.length > 0) {
        showToast(`Không thể thêm ${failedItems.length} sản phẩm vào giỏ hàng`, 'error');
    }
}

function getProductStatus(item) {
    // Debug: Log dữ liệu để kiểm tra
    console.log('Product status check:', {
        productName: item.productName,
        isActive: item.isActive,
        available: item.available,
        stock: item.stock,
        isActiveType: typeof item.isActive,
        availableType: typeof item.available,
        stockType: typeof item.stock
    });

    // Nếu không có thông tin trạng thái (chưa được enrich), coi như available
    if (item.isActive === undefined && item.available === undefined && item.stock === undefined) {
        console.log('Status: available (no status info)');
        return 'available';
    }

    // Kiểm tra trạng thái sản phẩm - hết hàng trước
    if (item.stock !== undefined && item.stock <= 0) {
        console.log('Status: out_of_stock (stock <= 0)');
        return 'out_of_stock';
    }
    if ((item.available !== undefined && !item.available) || (item.isActive !== undefined && !item.isActive)) {
        console.log('Status: deactivated (!available || !isActive)');
        return 'deactivated';
    }
    console.log('Status: available');
    return 'available';
}

function getProductStatusText(status) {
    switch (status) {
        case 'deactivated':
            return 'Ngừng kinh doanh';
        case 'out_of_stock':
            return 'Hết hàng';
        case 'available':
            return 'Có thể thêm';
        default:
            return 'Có thể thêm';
    }
}

function getProductStatusBadgeClass(status) {
    switch (status) {
        case 'deactivated':
            return 'bg-danger';
        case 'out_of_stock':
            return 'bg-secondary';
        case 'available':
            return 'bg-success';
        default:
            return 'bg-success';
    }
}

function showReorderModal(orderItems) {
    console.log('showReorderModal called with items:', orderItems);

    // Lưu orderItems để sử dụng trong addAllValidItemsToCart
    window.lastOrderItems = orderItems;

    // Tạo modal HTML
    const modalHTML = `
        <div class="modal fade" id="reorderModal" tabindex="-1" aria-labelledby="reorderModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="reorderModalLabel">
                            <i class="fas fa-shopping-cart me-2"></i>Mua lại đơn hàng
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="reorder-items-list">
                            ${orderItems.map((item, index) => {
        const productStatus = getProductStatus(item);
        const isProductValid = productStatus === 'available';

        return `
                                    <div class="card mb-3 ${!isProductValid ? 'opacity-50' : ''}" id="reorder-item-${index}">
                                        <div class="card-body">
                                            <div class="row align-items-center">
                                                <div class="col-auto">
                                                    <img src="${item.mainImageUrl || '/user/img/default-product.jpg'}" 
                                                         class="img-thumbnail" 
                                                         alt="${item.productName}"
                                                         style="width: 60px; height: 60px; object-fit: cover;"
                                                         onerror="this.src='https://placehold.co/60x60'">
                                                </div>
                                                <div class="col">
                                                    <h6 class="mb-1">${item.productName || 'Sản phẩm không xác định'}</h6>
                                                    <small class="text-muted">${item.brandName || ''}</small>
                                                    ${productStatus !== 'available' ? `
                                                        <div class="mt-1">
                                                            <span class="badge ${getProductStatusBadgeClass(productStatus)}">${getProductStatusText(productStatus)}</span>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                                <div class="col-auto text-end">
                                                    <span class="text-muted">x${item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
    }).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success w-100" onclick="addAllValidItemsToCart()">
                            <i class="fas fa-shopping-cart me-1"></i>
                            Thêm (${orderItems.filter(item => getProductStatus(item) === 'available').length}) sản phẩm vào giỏ hàng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Thêm modal vào body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('Modal HTML added to body');

    // Hiển thị modal
    const modalElement = document.getElementById('reorderModal');
    console.log('Modal element found:', modalElement);

    if (modalElement) {
        // Kiểm tra Bootstrap có sẵn không
        if (typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(modalElement);
            console.log('Bootstrap modal created:', modal);
            modal.show();
            console.log('Modal show() called');
        } else {
            // Fallback: hiển thị modal bằng CSS
            console.log('Bootstrap not available, using CSS fallback');
            modalElement.style.display = 'block';
            modalElement.classList.add('show');
            modalElement.setAttribute('aria-modal', 'true');
            modalElement.setAttribute('role', 'dialog');

            // Thêm backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.id = 'reorderModalBackdrop';
            document.body.appendChild(backdrop);
        }
    } else {
        console.error('Modal element not found');
        showToast('Không thể tạo modal. Vui lòng thử lại.', 'error');
    }

    // Xóa modal khi đóng
    const closeModal = () => {
        const modal = document.getElementById('reorderModal');
        const backdrop = document.getElementById('reorderModalBackdrop');
        if (modal) modal.remove();
        if (backdrop) backdrop.remove();
    };

    // Xử lý đóng modal
    modalElement.addEventListener('hidden.bs.modal', closeModal);

    // Thêm event listener cho nút đóng
    const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"], .btn-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    // Thêm event listener cho backdrop
    modalElement.addEventListener('click', (e) => {
        if (e.target === modalElement) {
            closeModal();
        }
    });
}

async function addAllValidItemsToCart() {
    console.log('addAllValidItemsToCart called');

    // Lấy tất cả sản phẩm hợp lệ từ lastOrderItems
    const orderItems = window.lastOrderItems || [];
    console.log('Last order items:', orderItems);
    const validItems = [];

    orderItems.forEach((item, index) => {
        const productStatus = getProductStatus(item);
        if (productStatus === 'available') {
            validItems.push({
                productId: item.idProduct,
                quantity: item.quantity,
                index: index
            });
        }
    });

    if (validItems.length === 0) {
        showToast('Không có sản phẩm nào có thể thêm vào giỏ hàng', 'error');
        return;
    }

    console.log('Adding valid items to cart:', validItems);
    let successCount = 0;
    let failedItems = [];

    for (const item of validItems) {
        try {
            if (window.app && typeof window.app.addProductToCartBackend === 'function') {
                await window.app.addProductToCartBackend(item.productId, item.quantity, true);
                successCount++;

                console.log(`Successfully added product ${item.productId} with quantity ${item.quantity}`);
            }
        } catch (error) {
            console.error('Error adding product to cart:', error);
            failedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                error: error.message || 'Không thể thêm vào giỏ hàng'
            });
        }
    }

    if (successCount > 0) {
        showToast(`Đã thêm ${successCount} sản phẩm vào giỏ hàng`, 'success');
        // Tự động đóng modal sau khi thêm thành công
        setTimeout(() => {
            const modal = document.getElementById('reorderModal');
            if (modal) {
                const backdrop = document.getElementById('reorderModalBackdrop');
                if (backdrop) backdrop.remove();
                modal.remove();
            }
            // Chuyển đến trang giỏ hàng
            window.location.href = '/cart';
        }, 1500);
    }

    if (failedItems.length > 0) {
        showToast(`Không thể thêm ${failedItems.length} sản phẩm vào giỏ hàng`, 'error');
    }
}

function showReorderSuccess(count) {
    // Tạo modal thông báo thành công với tick
    const modalHtml = `
        <div class="modal fade" id="reorderSuccessModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body text-center py-4">
                        <div class="mb-3">
                            <i class="fas fa-check-circle text-success" style="font-size: 3rem;"></i>
                        </div>
                        <h5 class="text-success mb-3">Mua lại thành công!</h5>
                        <p class="mb-3">Đã thêm ${count} sản phẩm vào giỏ hàng của bạn.</p>
                        <div class="d-flex gap-2 justify-content-center">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                Tiếp tục mua sắm
                            </button>
                            <a href="/cart" class="btn btn-primary">
                                <i class="fas fa-shopping-cart me-1"></i> Xem giỏ hàng
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Xóa modal cũ nếu có
    const existingModal = document.getElementById('reorderSuccessModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Thêm modal mới
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('reorderSuccessModal'));
    modal.show();

    // Tự động ẩn modal sau 5 giây
    setTimeout(() => {
        modal.hide();
    }, 5000);
}

// Review functionality
let currentOrderId = null;
let orderProducts = [];

// Check if we should open review modal or reorder modal on page load
$(document).ready(function () {
    // Get order ID - Priority: 1) Query param, 2) URL path
    let orderId = null;
    
    // Try to get from query parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('orderId');
    
    if (orderIdParam && !isNaN(orderIdParam)) {
        orderId = orderIdParam;
        console.log('Got orderId from query parameter:', orderId);
    } else {
        // Fallback: get from URL path
        const pathParts = window.location.pathname.split('/');
        orderId = pathParts[pathParts.length - 1];
        console.log('Got orderId from URL path:', orderId);
    }
    
    console.log('Page load - URL:', window.location.href);
    console.log('Page load - Hash:', window.location.hash);
    console.log('Page load - OrderId:', orderId);

    if (orderId && !isNaN(orderId)) {
        // Check if URL has #review hash
        if (window.location.hash === '#review') {
            console.log('Hash #review detected on page load');
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
                openReviewModal(parseInt(orderId));
            }, 500);
        }
        // Check if URL has #reorder hash
        else if (window.location.hash === '#reorder') {
            console.log('Hash #reorder detected on page load');
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
                reorderOrder(parseInt(orderId));
            }, 500);
        }
    }

    // Also listen for hash changes
    window.addEventListener('hashchange', function () {
        console.log('Hash changed to:', window.location.hash);
        
        // Get order ID with same priority as before
        let orderId = null;
        const urlParams = new URLSearchParams(window.location.search);
        const orderIdParam = urlParams.get('orderId');
        
        if (orderIdParam && !isNaN(orderIdParam)) {
            orderId = orderIdParam;
        } else {
            const pathParts = window.location.pathname.split('/');
            orderId = pathParts[pathParts.length - 1];
        }
        
        console.log('Hash change - OrderId:', orderId);

        if (orderId && !isNaN(orderId)) {
            if (window.location.hash === '#review') {
                console.log('Hash change: #review detected');
                setTimeout(() => {
                    openReviewModal(parseInt(orderId));
                }, 100);
            }
            else if (window.location.hash === '#reorder') {
                console.log('Hash change: #reorder detected');
                setTimeout(() => {
                    reorderOrder(parseInt(orderId));
                }, 100);
            }
        }
    });
});

function openReviewModal(orderId) {
    console.log('openReviewModal called with orderId:', orderId);
    currentOrderId = orderId;
    loadOrderProductsForReview(orderId);
}

async function loadOrderProductsForReview(orderId) {
    console.log('loadOrderProductsForReview called with orderId:', orderId);

    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('Vui lòng đăng nhập để đánh giá');
        return;
    }

    try {
        const response = await fetch(`/api/orders/${orderId}/items`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const products = await response.json();
            console.log('Loaded products:', products);

            // Kiểm tra review đã tồn tại cho từng sản phẩm
            for (let product of products) {
                const reviewCheckResponse = await fetch(`/api/reviews/check/${product.idOrderProduct}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (reviewCheckResponse.ok) {
                    const reviewData = await reviewCheckResponse.json();
                    product.hasReview = reviewData.exists;
                    product.existingReview = reviewData.review;
                } else {
                    product.hasReview = false;
                }
            }

            orderProducts = products;
            console.log('Rendering review products:', products);
            renderReviewProducts(products);
            console.log('Showing modal');

            // Đảm bảo modal được khởi tạo trước khi show
            if (ensureModalInitialized()) {
                $('#reviewModal').modal('show');
            } else {
                console.error('Cannot show modal - not properly initialized');
                alert('Không thể mở modal đánh giá. Vui lòng tải lại trang.');
            }
        } else {
            console.error('Failed to fetch order items');
            alert('Không thể tải danh sách sản phẩm');
        }
    } catch (error) {
        console.error('Error loading order products:', error);
        alert('Có lỗi xảy ra khi tải danh sách sản phẩm');
    }
}

function renderReviewProducts(products) {
    // ✅ FIX: Destroy all CKEditor instances before rendering new content
    destroyReviewEditors();
    
    const container = $('#reviewProductsList');
    container.empty();

    if (!products || products.length === 0) {
        container.html('<p class="text-muted">Không có sản phẩm nào để đánh giá</p>');
        return;
    }

    products.forEach((product, index) => {
        const isReviewed = product.hasReview;
        const existingReview = product.existingReview;

        const productHtml = `
            <div class="card mb-4 ${isReviewed ? 'border-success' : ''}" data-order-product-id="${product.idOrderProduct}">
                <div class="card-body">
                    <!-- Hình ảnh và tên sản phẩm -->
                    <div class="row align-items-center mb-3">
                        <div class="col-md-2">
                            <img src="${product.mainImageUrl || 'https://placehold.co/300x300'}" 
                                 alt="${product.productName}" 
                                 class="img-thumbnail" 
                                 style="width: 100px; height: 100px; object-fit: cover;">
                        </div>
                        <div class="col-md-10">
                            <h6 class="mb-1 fw-bold">${product.productName}</h6>
                            <small class="text-muted">${product.brandName || ''}</small>
                            ${isReviewed ? '<span class="badge bg-success ms-2">Đã đánh giá</span>' : ''}
                        </div>
                    </div>
                    
                    ${isReviewed ? `
                        <!-- Hiển thị review đã có (READ-ONLY) -->
                        <div class="review-display">
                            <div class="mb-3">
                                <label class="form-label fw-medium">Đánh giá:</label>
                                <div class="star-rating-display">
                                    ${[1, 2, 3, 4, 5].map(star => `
                                        <div class="star-display ${star <= existingReview.rating ? 'filled' : ''}">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                            </svg>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label fw-medium">Nhận xét:</label>
                                <div class="review-content p-3 bg-light rounded">
                                    ${existingReview.content || '<em class="text-muted">Không có nhận xét</em>'}
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" ${existingReview.anonymous ? 'checked' : ''} disabled>
                                    <label class="form-check-label text-muted small">
                                        Đánh giá ẩn danh
                                    </label>
                                </div>
                            </div>
                            
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-primary btn-sm edit-btn" data-order-product-id="${product.idOrderProduct}">
                                    <i class="fas fa-edit"></i> Sửa
                                </button>
                            </div>
                        </div>
                    ` : `
                        <!-- Form đánh giá cho sản phẩm chưa đánh giá -->
                        <div class="mb-3">
                            <label class="form-label fw-medium">Đánh giá:</label>
                            <div class="star-rating">
                                <div class="star" data-rating="1">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                    </svg>
                                </div>
                                <div class="star" data-rating="2">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                    </svg>
                                </div>
                                <div class="star" data-rating="3">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                    </svg>
                                </div>
                                <div class="star" data-rating="4">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                    </svg>
                                </div>
                                <div class="star" data-rating="5">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <label class="form-label fw-medium mb-0">Nhận xét:</label>
                                <button type="button" class="btn btn-sm btn-outline-primary" onclick="uploadVideoToEditor('review-editor-${product.idOrderProduct}')" title="Upload video">
                                    <i class="fas fa-video"></i> Upload video
                                </button>
                            </div>
                            <div class="review-editor-container" data-order-product-id="${product.idOrderProduct}">
                                <textarea class="review-editor form-control"
                                          id="review-editor-${product.idOrderProduct}"
                                          rows="3"
                                          placeholder="Nhập nhận xét của bạn..."
                                          data-order-product-id="${product.idOrderProduct}"></textarea>
                            </div>
                        </div>
                        
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" 
                                   id="anonymous_${product.idOrderProduct}" 
                                   data-order-product-id="${product.idOrderProduct}">
                            <label class="form-check-label text-muted small" 
                                   for="anonymous_${product.idOrderProduct}">
                                Ẩn danh khi đánh giá
                            </label>
                        </div>
                    `}
                </div>
            </div>
        `;
        container.append(productHtml);
        
        // ✅ FIX: Lưu existing review data vào data attribute của card
        if (isReviewed && existingReview) {
            const card = $(`.card[data-order-product-id="${product.idOrderProduct}"]`);
            card.data('existing-review', existingReview);
        }
    });

    // Add star rating functionality - chỉ cho sản phẩm chưa đánh giá
    $(document).off('click', '.star-rating .star').on('click', '.star-rating .star', function () {
        const card = $(this).closest('.card');
        const rating = $(this).data('rating');
        const stars = $(this).parent().find('.star');

        console.log('Star clicked, rating:', rating);

        // Update star states
        stars.each(function (index) {
            const starElement = $(this);
            if (index < rating) {
                starElement.addClass('filled');
            } else {
                starElement.removeClass('filled');
            }
        });

        // Store rating
        card.data('rating', rating);
        console.log('Rating stored:', card.data('rating'));
    });
    
    // ✅ FIX: Add click handler for "Sửa" button using event delegation
    $(document).off('click', '.edit-btn').on('click', '.edit-btn', function () {
        const orderProductId = $(this).data('order-product-id');
        if (orderProductId) {
            editReview(orderProductId);
        }
    });

    // ✅ FIX: Always show both buttons (Đóng and Gửi đánh giá)
    $('.modal-footer').html(`
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-primary" onclick="submitAllReviews()">Gửi đánh giá</button>
    `);

    // Khởi tạo CKEditor sau khi render HTML
    setTimeout(() => {
        console.log('Initializing CKEditor after render');
        initReviewEditors();
    }, 500);
}

// Thêm function kiểm tra review status
async function checkReviewStatusAndOpen(orderId) {
    console.log('checkReviewStatusAndOpen called with orderId:', orderId);

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Vui lòng đăng nhập');
            return;
        }

        // Đảm bảo currentOrderId được set
        currentOrderId = orderId;

        // Lấy danh sách sản phẩm
        const response = await fetch(`/api/orders/${orderId}/items`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const products = await response.json();
            let hasAnyReview = false;

            // Kiểm tra từng sản phẩm
            for (let product of products) {
                const reviewCheckResponse = await fetch(`/api/reviews/check/${product.idOrderProduct}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (reviewCheckResponse.ok) {
                    const reviewData = await reviewCheckResponse.json();
                    if (reviewData.exists) {
                        hasAnyReview = true;
                        break; // Chỉ cần 1 sản phẩm có review là đủ
                    }
                }
            }

            if (hasAnyReview) {
                // Có review -> mở modal xem đánh giá (có thể xem và sửa)
                console.log('Opening view review modal');
                openViewReviewModal(orderId);
            } else {
                // Chưa có review -> mở modal đánh giá mới
                console.log('Opening new review modal');
                openReviewModal(orderId);
            }
        } else {
            console.error('Failed to fetch order items');
            alert('Không thể tải thông tin đơn hàng');
        }
    } catch (error) {
        console.error('Error checking review status:', error);
        openReviewModal(orderId); // Fallback
    }
}

// Thêm function xem review
async function openViewReviewModal(orderId) {
    console.log('openViewReviewModal called with orderId:', orderId);
    currentOrderId = orderId;

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`/api/orders/${orderId}/items`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const products = await response.json();

            // Load existing reviews
            for (let product of products) {
                const reviewCheckResponse = await fetch(`/api/reviews/check/${product.idOrderProduct}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (reviewCheckResponse.ok) {
                    const reviewData = await reviewCheckResponse.json();
                    product.hasReview = reviewData.exists;
                    product.existingReview = reviewData.review;
                }
            }

            renderViewReviewProducts(products);
            console.log('Showing modal');

            // Đảm bảo modal được khởi tạo trước khi show
            if (ensureModalInitialized()) {
                $('#reviewModal').modal('show');
            } else {
                console.error('Cannot show modal - not properly initialized');
                alert('Không thể mở modal đánh giá. Vui lòng tải lại trang.');
            }
        } else {
            console.error('Failed to fetch order items for view modal');
            alert('Không thể tải thông tin đơn hàng');
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        alert('Lỗi khi tải đánh giá');
    }
}

function renderViewReviewProducts(products) {
    // ✅ FIX: Destroy all CKEditor instances before rendering new content
    destroyReviewEditors();
    
    const container = $('#reviewProductsList');
    container.empty();

    products.forEach((product, index) => {
        const existingReview = product.existingReview;
        const hasReview = product.hasReview;

        const productHtml = `
            <div class="card mb-4 ${hasReview ? 'border-success' : 'border-warning'}" data-order-product-id="${product.idOrderProduct}">
                <div class="card-body">
                    <div class="row align-items-center mb-3">
                        <div class="col-auto">
                            <img src="${product.mainImageUrl || 'https://placehold.co/80x80'}" 
                                 alt="${product.productName}" 
                                 class="rounded" 
                                 style="width: 80px; height: 80px; object-fit: cover;">
                        </div>
                        <div class="col">
                            <h6 class="mb-1">${product.productName}</h6>
                            <p class="text-muted mb-0">Số lượng: ${product.quantity}</p>
                            ${hasReview ? '<span class="badge bg-success ms-2">Đã đánh giá</span>' : ''}
                        </div>
                    </div>
                    
                    ${hasReview ? `
                    <!-- Hiển thị review đã có -->
                    <div class="review-display">
                        <div class="mb-3">
                            <label class="form-label fw-medium">Đánh giá:</label>
                            <div class="star-rating-display">
                                ${[1, 2, 3, 4, 5].map(star => `
                                    <div class="star-display ${star <= existingReview.rating ? 'filled' : ''}">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                        </svg>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label fw-medium">Nhận xét:</label>
                            <div class="review-content p-3 bg-light rounded">
                                ${existingReview.isVisible === false ?
                    '<div class="review-hidden-content"><i class="fas fa-eye-slash me-2"></i>Nội dung đánh giá đã bị ẩn</div>' :
                    (existingReview.content || '<em class="text-muted">Không có nhận xét</em>')
                }
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" ${existingReview.anonymous ? 'checked' : ''} disabled>
                                <label class="form-check-label text-muted small">
                                    Đánh giá ẩn danh
                                </label>
                            </div>
                        </div>
                        
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm edit-btn" data-order-product-id="${product.idOrderProduct}">
                                <i class="fas fa-edit"></i> Sửa
                            </button>
                        </div>
                    </div>
                    ` : `
                    <!-- Form đánh giá cho sản phẩm chưa đánh giá -->
                    <div class="review-form">
                        <div class="mb-3">
                            <label class="form-label fw-medium">Đánh giá:</label>
                            <div class="star-rating">
                                <div class="star" data-rating="1">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                    </svg>
                                </div>
                                <div class="star" data-rating="2">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                    </svg>
                                </div>
                                <div class="star" data-rating="3">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                    </svg>
                                </div>
                                <div class="star" data-rating="4">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                    </svg>
                                </div>
                                <div class="star" data-rating="5">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <label class="form-label fw-medium mb-0">Nhận xét:</label>
                                <button type="button" class="btn btn-sm btn-outline-primary" onclick="uploadVideoToEditor('review-editor-view-${product.idOrderProduct}')" title="Upload video">
                                    <i class="fas fa-video"></i> Upload video
                                </button>
                            </div>
                            <div class="review-editor-container" data-order-product-id="${product.idOrderProduct}">
                                <textarea class="review-editor form-control"
                                          id="review-editor-view-${product.idOrderProduct}"
                                          rows="3"
                                          placeholder="Nhập nhận xét của bạn..."
                                          data-order-product-id="${product.idOrderProduct}"></textarea>
                            </div>
                        </div>

                        <div class="form-check">
                            <input class="form-check-input" type="checkbox"
                                   id="anonymous_${product.idOrderProduct}"
                                   data-order-product-id="${product.idOrderProduct}">
                            <label class="form-check-label text-muted small"
                                   for="anonymous_${product.idOrderProduct}">
                                Ẩn danh khi đánh giá
                            </label>
                        </div>
                    </div>
                    `}
                </div>
            </div>
        `;
        container.append(productHtml);

        // ✅ FIX: Lưu existing review data vào data attribute của card
        if (hasReview && existingReview) {
            const card = $(`.card[data-order-product-id="${product.idOrderProduct}"]`);
            card.data('existing-review', existingReview);
        }
    });

    // Add star rating functionality for new reviews - sử dụng event delegation
    $(document).off('click', '.star-rating .star').on('click', '.star-rating .star', function () {
        const card = $(this).closest('.card');
        const rating = $(this).data('rating');
        const stars = $(this).parent().find('.star');

        console.log('Star clicked in view modal, rating:', rating);

        // Update star states
        stars.each(function (index) {
            const starElement = $(this);
            if (index < rating) {
                starElement.addClass('filled');
            } else {
                starElement.removeClass('filled');
            }
        });

        // Store rating
        card.data('rating', rating);
        console.log('Rating stored in view modal:', card.data('rating'));
    });
    
    // ✅ FIX: Add click handler for "Sửa" button using event delegation
    $(document).off('click', '.edit-btn').on('click', '.edit-btn', function () {
        const orderProductId = $(this).data('order-product-id');
        if (orderProductId) {
            editReview(orderProductId);
        }
    });

    // ✅ FIX: Always show both buttons (Đóng and Gửi đánh giá)
    $('#reviewModalLabel').html('<i class="fas fa-star me-2"></i>Đánh giá sản phẩm');
    
    // Always show both buttons
    $('.modal-footer').html(`
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-primary" onclick="submitAllReviews()">Gửi đánh giá</button>
    `);

    // Đảm bảo tất cả nút "Sửa" đều hiển thị khi reload
    $('.edit-btn').show();

    // Khởi tạo CKEditor sau khi render HTML
    setTimeout(() => {
        console.log('Initializing CKEditor after render in view mode');
        initReviewEditors();
    }, 500);
}

// Thêm function edit review
function editReview(orderProductId) {
    const card = $(`.card[data-order-product-id="${orderProductId}"]`);
    const existingReview = card.data('existing-review');

    // Chuyển sang edit mode
    card.find('.review-display').html(`
        <div class="review-edit">
            <div class="mb-3">
                <label class="form-label fw-medium">Đánh giá:</label>
                <div class="star-rating">
                    <div class="star" data-rating="1">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                        </svg>
                    </div>
                    <div class="star" data-rating="2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                        </svg>
                    </div>
                    <div class="star" data-rating="3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                        </svg>
                    </div>
                    <div class="star" data-rating="4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                        </svg>
                    </div>
                    <div class="star" data-rating="5">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <label class="form-label fw-medium mb-0">Nhận xét:</label>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="uploadVideoToEditor('review-editor-edit-${orderProductId}')" title="Upload video">
                        <i class="fas fa-video"></i> Upload video
                    </button>
                </div>
                <div class="review-editor-container" data-order-product-id="${orderProductId}">
                    <textarea class="review-editor form-control"
                              id="review-editor-edit-${orderProductId}"
                              rows="3"
                              placeholder="Nhập nhận xét của bạn...">${existingReview.content || ''}</textarea>
                </div>
            </div>
            
            <div class="mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" ${existingReview.anonymous ? 'checked' : ''}>
                    <label class="form-check-label text-muted small">
                        Đánh giá ẩn danh
                    </label>
                </div>
            </div>
            
            <div class="d-flex gap-2">
                <button class="btn btn-secondary btn-sm" onclick="cancelEdit(${orderProductId})">
                    <i class="fas fa-times"></i> Hủy
                </button>
            </div>
        </div>
    `);

    // Set existing rating
    const stars = card.find('.star');
    stars.each(function (index) {
        if (index < existingReview.rating) {
            $(this).addClass('filled');
        }
    });
    // Lưu rating vào card data ngay lập tức
    card.data('rating', existingReview.rating);
    
    // DEBUG: Log để kiểm tra
    console.log('Edit review - Set initial rating:', existingReview.rating);

    // Add click handlers - sử dụng event delegation
    card.off('click', '.star').on('click', '.star', function () {
        const rating = $(this).data('rating');
        const stars = $(this).parent().find('.star');

        console.log('Star clicked in edit mode, rating:', rating);

        stars.each(function (index) {
            const starElement = $(this);
            if (index < rating) {
                starElement.addClass('filled');
            } else {
                starElement.removeClass('filled');
            }
        });
        card.data('rating', rating);
        console.log('Rating stored in edit mode:', card.data('rating'));

        // Lưu thay đổi rating
        saveReviewChanges(orderProductId);
    });

    // Add change handlers để lưu thay đổi vào pending-changes
    card.find('textarea').on('input', function () {
        saveReviewChanges(orderProductId);
    });

    card.find('input[type="checkbox"]').on('change', function () {
        saveReviewChanges(orderProductId);
    });

    // Ẩn nút "Sửa" khi đang edit
    card.find('.edit-btn').hide();

    // Khởi tạo CKEditor cho textarea mới
    setTimeout(() => {
        initReviewEditors();
        // Lưu thay đổi ban đầu sau khi CKEditor khởi tạo
        setTimeout(() => {
            saveReviewChanges(orderProductId);
        }, 200);
    }, 100);
}

// Function để lưu thay đổi review (chỉ lưu vào data, không gửi API)
function saveReviewChanges(orderProductId) {
    const card = $(`.card[data-order-product-id="${orderProductId}"]`);
    const rating = card.data('rating');
    const existingReview = card.data('existing-review');
    
    // Try to get content from CKEditor first
    let content = '';
    const editorId = `review-editor-edit-${orderProductId}`;
    
    try {
        if (window.reviewEditors && window.reviewEditors[editorId]) {
            content = window.reviewEditors[editorId].getData();
            // Keep HTML content (including images) for display
            if (content) {
                content = content.trim();
            }
            console.log('Got content from CKEditor, length:', content.length);
        } else {
            // Fallback to textarea value
            content = card.find('textarea').val();
            if (content) {
                content = content.trim();
            }
            console.log('Got content from textarea, length:', content ? content.length : 0);
        }
    } catch (error) {
        console.error('Error getting content in saveReviewChanges:', error);
        content = '';
    }
    
    const anonymous = card.find('input[type="checkbox"]').is(':checked');

    // Nếu rating không được set (user không chọn lại star), dùng rating cũ
    const finalRating = rating || existingReview?.rating || 0;
    
    console.log('Saving review changes for product:', orderProductId);
    console.log('- Rating:', finalRating);
    console.log('- Content length:', content ? content.length : 0);
    console.log('- Anonymous:', anonymous);

    // Lưu thay đổi vào data của card
    card.data('pending-changes', {
        rating: finalRating,
        content: content || '',
        anonymous: anonymous
    });

    return true;
}

// Thêm function cancel edit review
function cancelEdit(orderProductId) {
    const card = $(`.card[data-order-product-id="${orderProductId}"]`);

    // Xóa pending changes
    card.removeData('pending-changes');

    // Hiện lại nút "Sửa"
    card.find('.edit-btn').show();

    // Reload view để quay về trạng thái ban đầu
    openViewReviewModal(currentOrderId);
}

function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        // Tạo container nếu chưa có để tránh lỗi trên các trang không có sẵn
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    const toastId = 'toast-' + Date.now();

    const toastHTML = `
        <div id="${toastId}" class="toast ${type}" role="alert">
            <div class="toast-header">
                <i class="fas fa-${type === 'success' ? 'check-circle text-success' : type === 'error' ? 'exclamation-circle text-danger' : 'info-circle text-info'} me-2"></i>
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

async function updateReviewButtonStatus(orderId) {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch(`/api/orders/${orderId}/items`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const products = await response.json();
            let hasAnyReview = false;
            let allReviewed = true;

            // Kiểm tra trạng thái review của tất cả sản phẩm
            for (let product of products) {
                const reviewCheckResponse = await fetch(`/api/reviews/check/${product.idOrderProduct}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (reviewCheckResponse.ok) {
                    const reviewData = await reviewCheckResponse.json();
                    if (reviewData.exists) {
                        hasAnyReview = true;
                    } else {
                        allReviewed = false;
                    }
                } else {
                    allReviewed = false;
                }
            }

            // Cập nhật nút đánh giá
            const reviewButton = document.getElementById('reviewButton');
            const reviewButtonText = document.getElementById('reviewButtonText');

            if (reviewButton && reviewButtonText) {
                // Trang order-detail: luôn hiển thị "Đánh giá" (đơn giản)
                reviewButtonText.textContent = 'Đánh giá';
                reviewButton.className = 'btn btn-primary me-2';
            }
        }
    } catch (error) {
        console.error('Error updating review button status:', error);
    }
}

// Function để đảm bảo modal được khởi tạo
function ensureModalInitialized() {
    const modal = document.getElementById('reviewModal');
    if (!modal) {
        console.error('Review modal not found in DOM');
        return false;
    }

    // Kiểm tra xem modal có được khởi tạo với Bootstrap không
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        // Modal đã được khởi tạo với Bootstrap
        return true;
    } else {
        console.error('Bootstrap not available or modal not initialized');
        return false;
    }
}

// Gọi function này khi trang load
$(document).ready(function () {
    console.log('Document ready - initializing order detail page');

    // Lấy order ID từ URL
    const pathParts = window.location.pathname.split('/');
    const orderId = pathParts[pathParts.length - 1];

    if (orderId && !isNaN(orderId)) {
        console.log('Order ID found:', orderId);
        // Cập nhật trạng thái nút đánh giá
        updateReviewButtonStatus(parseInt(orderId));
    }

    // Đảm bảo modal được khởi tạo
    setTimeout(() => {
        ensureModalInitialized();
    }, 100);

    // Check if URL has #review hash
    if (window.location.hash === '#review') {
        console.log('Review hash found, opening modal');
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
            openReviewModal(parseInt(orderId));
        }, 500);
    }
});

async function submitAllReviews() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('Vui lòng đăng nhập để đánh giá');
        return;
    }

    const newReviews = [];
    const updatedReviews = [];
    let hasValidReview = false;
    let hasInvalidReview = false;

    $('.card[data-order-product-id]').each(function () {
        const orderProductId = $(this).data('order-product-id');
        let rating = $(this).data('rating');
        const existingReview = $(this).data('existing-review');
        const pendingChanges = $(this).data('pending-changes');
        const card = $(this);

                 // Xử lý review đã sửa (có pending changes)
         if (pendingChanges) {
             // Lấy rating cuối cùng - ưu tiên pendingChanges, sau đó card data, cuối cùng existingReview
             let finalRating = pendingChanges.rating;
             if (!finalRating || finalRating < 1) {
                 finalRating = card.data('rating');
             }
             if (!finalRating || finalRating < 1) {
                 finalRating = existingReview?.rating;
             }
             
             // Nếu vẫn không có rating hợp lệ, báo lỗi
             if (!finalRating || finalRating < 1) {
                 console.log('No valid rating found for product:', orderProductId);
                 hasInvalidReview = true;
                 return;
             }
             
                           // DEBUG: Kiểm tra content từ CKEditor trước khi submit
              const editorId = `review-editor-edit-${orderProductId}`;
              let finalContent = pendingChanges.content || '';
              
              // Lấy content mới nhất từ CKEditor nếu có
              if (window.reviewEditors && window.reviewEditors[editorId]) {
                  try {
                      const latestContent = window.reviewEditors[editorId].getData();
                      if (latestContent && latestContent.trim()) {
                          finalContent = latestContent.trim();
                          console.log('Got latest content from CKEditor:', editorId);
                          console.log('Content length:', finalContent.length);
                      } else {
                          console.log('CKEditor content is empty, using pendingChanges');
                          // Nếu CKEditor rỗng, giữ nguyên content cũ
                          if (pendingChanges.content) {
                              finalContent = pendingChanges.content;
                          }
                      }
                  } catch (error) {
                      console.error('Error getting content from CKEditor:', error);
                      // Fallback to pendingChanges content
                      if (pendingChanges.content) {
                          finalContent = pendingChanges.content;
                      }
                  }
              } else {
                  console.log('CKEditor not initialized, using pendingChanges content');
              }

              console.log('Final content length:', finalContent ? finalContent.length : 0);

             updatedReviews.push({
                 reviewId: existingReview.reviewId,
                 rating: finalRating,
                 content: finalContent || '',
                 anonymous: pendingChanges.anonymous
             });
             hasValidReview = true;
             console.log('Added review to update list:', { reviewId: existingReview.reviewId, rating: finalRating, contentLength: finalContent?.length });
             return;
         }

        // Chỉ xét điều kiện với sản phẩm chưa đánh giá (không có class border-success)
        const isAlreadyReviewed = card.hasClass('border-success');
        if (isAlreadyReviewed) {
            return; // Bỏ qua sản phẩm đã đánh giá
        }

        // Chỉ xử lý sản phẩm có form đánh giá (có textarea)
        const textarea = card.find('textarea');
        if (textarea.length === 0) {
            return; // Bỏ qua sản phẩm không có form đánh giá
        }

        // Try to get content from CKEditor first
        let content = '';
        const textareaId = textarea.attr('id');
        if (textareaId && window.reviewEditors && window.reviewEditors[textareaId]) {
            content = window.reviewEditors[textareaId].getData();
            // Keep HTML content (including images) for display
            content = content.trim();
        } else {
            content = textarea.val() ? textarea.val().trim() : '';
        }
        
        const anonymous = card.find('input[type="checkbox"]').is(':checked');

        // Debug: Log để kiểm tra
        console.log('Product:', orderProductId, 'Rating:', rating, 'Content:', content);
        console.log('Card data rating:', card.data('rating'));
        console.log('Card has rating data:', card.data('rating') !== undefined);

        // Lấy rating từ card data nếu không có từ data attribute
        if (!rating && card.data('rating')) {
            rating = card.data('rating');
            console.log('Using rating from card data:', rating);
        }

        // Kiểm tra nếu có nội dung mà không có rating
        if (content && (!rating || rating < 1 || rating > 5)) {
            console.log('Invalid: có nội dung nhưng không có rating hợp lệ');
            hasInvalidReview = true;
            return;
        }

        // Chỉ submit nếu có rating (nội dung có thể để trống)
        if (rating && rating >= 1 && rating <= 5) {
            console.log('Valid review:', { orderProductId, rating, content, anonymous });
            newReviews.push({
                orderProductId: orderProductId,
                rating: rating,
                content: content || '',
                anonymous: anonymous
            });
            hasValidReview = true;
        } else if (content) {
            // Nếu có nội dung nhưng không có rating hợp lệ
            console.log('Invalid: có nội dung nhưng rating không hợp lệ:', rating);
            hasInvalidReview = true;
            return;
        }
    });

    // Validation
    if (hasInvalidReview) {
        alert('Lỗi: Bạn không thể ghi nội dung mà không đánh giá sao. Vui lòng chọn số sao hoặc xóa nội dung.');
        return;
    }

    if (!hasValidReview) {
        // Kiểm tra nếu có reviews đang được edit (có pendingChanges)
        let hasAnyPendingChanges = false;
        $('.card[data-order-product-id]').each(function () {
            if ($(this).data('pending-changes')) {
                hasAnyPendingChanges = true;
                return false; // break loop
            }
        });

        if (hasAnyPendingChanges) {
            alert('Vui lòng chọn ít nhất 1 sao để cập nhật đánh giá');
        } else {
            alert('Vui lòng đánh giá ít nhất một sản phẩm hoặc sửa đánh giá hiện có');
        }
        return;
    }

    try {
        // Submit new reviews
        for (const review of newReviews) {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(review)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể gửi đánh giá mới');
            }
        }

        // Update existing reviews
        for (const review of updatedReviews) {
            const response = await fetch(`/api/reviews/${review.reviewId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rating: review.rating,
                    content: review.content,
                    anonymous: review.anonymous
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể cập nhật đánh giá');
            }
        }

                 // Đóng modal
         $('#reviewModal').modal('hide');

         // Hiển thị toast thông báo thành công
         const message = newReviews.length > 0 && updatedReviews.length > 0
             ? 'Đánh giá và cập nhật thành công! ✨'
             : newReviews.length > 0
                 ? 'Đánh giá thành công! ✨'
                 : 'Cập nhật đánh giá thành công! ✨';
         showToast(message, 'success');

         // Reload trang để hiển thị dữ liệu mới
         setTimeout(() => {
             window.location.reload();
         }, 1500);

    } catch (error) {
        console.error('Error submitting reviews:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Global functions để có thể gọi từ HTML
window.cancelOrder = cancelOrder;
window.reorderOrder = reorderOrder;
window.checkReviewStatusAndOpen = checkReviewStatusAndOpen;
window.submitAllReviews = submitAllReviews;
window.editReview = editReview;
window.cancelEdit = cancelEdit;