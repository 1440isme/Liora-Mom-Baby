/**
 * Banner Management JavaScript
 * Handles all banner-related functionality including CRUD operations, drag & drop, and form validation
 */

// Global variables
let sortable;
let deleteBannerId = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeBannerManagement();
    checkUrlParameters();
});

/**
 * Check URL parameters for success/error messages
 */
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    // Check for success parameter
    if (urlParams.has('success')) {
        const successType = urlParams.get('success');
        let message = '';

        switch (successType) {
            case 'add':
                message = 'Thêm banner thành công!';
                break;
            case 'update':
                message = 'Cập nhật banner thành công!';
                break;
            case 'delete':
                message = 'Xóa banner thành công!';
                break;
            case 'reorder':
                message = 'Sắp xếp banner thành công!';
                break;
            default:
                message = 'Thao tác thành công!';
        }

        showAlert('success', message);

        // Clean URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }

    // Check for error parameter
    if (urlParams.has('error')) {
        const errorType = urlParams.get('error');
        let message = '';

        switch (errorType) {
            case 'notfound':
                message = 'Không tìm thấy banner!';
                break;
            case 'delete':
                message = 'Lỗi khi xóa banner!';
                break;
            case 'update':
                message = 'Lỗi khi cập nhật banner!';
                break;
            default:
                message = 'Đã xảy ra lỗi!';
        }

        showAlert('danger', message);

        // Clean URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
}

/**
 * Initialize banner management functionality
 */
function initializeBannerManagement() {
    // Initialize drag and drop for banner list
    initializeDragAndDrop();

    // Initialize form functionality
    initializeFormHandlers();

    // Initialize toggle handlers
    initializeToggleHandlers();

    // Initialize delete handlers
    initializeDeleteHandlers();

    // Initialize preview functionality
    initializePreviewHandlers();

    // Initialize filter functionality
    initializeFilterHandlers();
}

/**
 * Initialize drag and drop functionality for banner list
 */
function initializeDragAndDrop() {
    const bannerList = document.getElementById('bannerList');
    const saveOrderBtn = document.getElementById('saveOrderBtn');

    if (bannerList) {
        sortable = Sortable.create(bannerList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            handle: '.drag-handle',
            onStart: function () {
                if (saveOrderBtn) {
                    saveOrderBtn.style.display = 'inline-block';
                }
            },
            onEnd: function () {
                updateSortOrderNumbers();
            }
        });
    }

    // Save order functionality
    if (saveOrderBtn) {
        saveOrderBtn.addEventListener('click', saveBannerOrder);
    }
}

/**
 * Update sort order numbers after drag and drop
 */
function updateSortOrderNumbers() {
    const cards = document.querySelectorAll('.banner-card');
    cards.forEach((card, index) => {
        const badge = card.querySelector('.sort-order-badge');
        if (badge) {
            badge.textContent = index + 1;
        }
    });
}

/**
 * Save banner order to server
 */
function saveBannerOrder() {
    const cards = document.querySelectorAll('.banner-card');
    const bannerIds = Array.from(cards).map(card => card.dataset.id);

    fetch('/admin/banners/reorder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bannerIds: bannerIds })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('success', 'Sắp xếp banner thành công!');
                const saveOrderBtn = document.getElementById('saveOrderBtn');
                if (saveOrderBtn) {
                    saveOrderBtn.style.display = 'none';
                }
            } else {
                showAlert('danger', 'Lỗi khi sắp xếp: ' + data.message);
            }
        })
        .catch(error => {
            showAlert('danger', 'Lỗi khi sắp xếp banner');
        });
}

/**
 * Initialize form handlers for add/edit forms
 */
function initializeFormHandlers() {
    const bannerForm = document.getElementById('bannerForm');
    if (bannerForm) {
        bannerForm.addEventListener('submit', handleFormSubmit);
    }

    // Clear validation on input
    const titleInput = document.getElementById('title');
    if (titleInput) {
        titleInput.addEventListener('input', function () {
            this.classList.remove('is-invalid');
        });
    }

    // Initialize image upload functionality
    initializeImageUpload();
}

/**
 * Handle form submission
 */
function handleFormSubmit(e) {
    const title = document.getElementById('title').value.trim();
    const imageFile = document.getElementById('imageInput').files[0];

    if (!title) {
        e.preventDefault();
        document.getElementById('title').classList.add('is-invalid');
        showAlert('danger', 'Vui lòng nhập tiêu đề banner');
        return;
    }

    // For add form, check if image is selected
    if (document.getElementById('bannerForm').action.includes('/add') && !imageFile) {
        e.preventDefault();
        showAlert('danger', 'Vui lòng chọn ảnh banner');
        return;
    }

    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang xử lý...';
        submitBtn.disabled = true;

        // Re-enable after 10 seconds as fallback
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 10000);
    }
}

/**
 * Initialize toggle handlers for active status
 */
function initializeToggleHandlers() {
    document.querySelectorAll('.toggle-active').forEach(toggle => {
        toggle.addEventListener('change', function () {
            const bannerId = this.dataset.id;
            const isActive = this.checked;
            const originalState = !isActive;

            // Show loading state
            this.disabled = true;

            fetch(`/admin/banners/toggle-active/${bannerId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showAlert('success', 'Cập nhật trạng thái thành công!');
                    } else {
                        this.checked = originalState;
                        showAlert('danger', 'Lỗi khi cập nhật trạng thái: ' + data.message);
                    }
                })
                .catch(error => {
                    this.checked = originalState;
                    showAlert('danger', 'Lỗi khi cập nhật trạng thái');
                })
                .finally(() => {
                    this.disabled = false;
                });
        });
    });
}

/**
 * Initialize delete handlers
 */
function initializeDeleteHandlers() {
    // Delete banner buttons
    document.querySelectorAll('.delete-banner').forEach(btn => {
        btn.addEventListener('click', function () {
            deleteBannerId = this.dataset.id;
            const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
            modal.show();
        });
    });

    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteBanner);
    }
}

/**
 * Confirm and execute banner deletion
 */
function confirmDeleteBanner() {
    if (deleteBannerId) {
        fetch(`/admin/banners/delete/${deleteBannerId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('success', 'Xóa banner thành công!');
                    // Remove the card from DOM
                    const card = document.querySelector(`[data-id="${deleteBannerId}"]`);
                    if (card) {
                        card.closest('.banner-item').remove();
                    }
                    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
                    if (modal) {
                        modal.hide();
                    }
                } else {
                    showAlert('danger', 'Lỗi khi xóa: ' + data.message);
                }
            })
            .catch(error => {
                showAlert('danger', 'Lỗi khi xóa banner');
            });
    }
}

/**
 * Initialize image upload and preview functionality
 */
function initializeImageUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImageBtn = document.getElementById('removeImage');

    if (uploadArea && imageInput) {
        // Click to upload
        uploadArea.addEventListener('click', () => {
            imageInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });

        // File input change
        imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            if (imageInput) imageInput.value = '';
            if (uploadPlaceholder) uploadPlaceholder.style.display = 'flex';
            if (imagePreview) imagePreview.style.display = 'none';
            if (previewImg) previewImg.src = '';

            // Ensure the upload placeholder has fixed dimensions
            if (uploadPlaceholder) {
                uploadPlaceholder.style.width = '100%';
                uploadPlaceholder.style.height = '200px';
            }
        });
    }
}

/**
 * Handle file selection for image upload
 */
function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
        showAlert('danger', 'Vui lòng chọn file ảnh hợp lệ');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showAlert('danger', 'File ảnh không được vượt quá 5MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImg = document.getElementById('previewImg');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const imagePreview = document.getElementById('imagePreview');

        if (previewImg) previewImg.src = e.target.result;
        if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
        if (imagePreview) imagePreview.style.display = 'block';

        // Ensure the preview container has fixed dimensions
        const previewContainer = document.querySelector('.image-preview-container');
        if (previewContainer) {
            previewContainer.style.width = '100%';
            previewContainer.style.height = '200px';
            previewContainer.style.overflow = 'hidden';
            previewContainer.style.display = 'flex';
            previewContainer.style.alignItems = 'center';
            previewContainer.style.justifyContent = 'center';
        }
    };
    reader.readAsDataURL(file);
}

/**
 * Initialize preview functionality
 */
function initializePreviewHandlers() {
    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', showBannerPreview);
    }
}

/**
 * Show banner preview modal
 */
function showBannerPreview() {
    const title = document.getElementById('title').value || 'Tiêu đề Banner';
    const targetLink = document.getElementById('targetLink').value || 'Link đích';
    const previewImg = document.getElementById('previewImg');
    const imageSrc = previewImg ? previewImg.src : '';

    if (!imageSrc || imageSrc.includes('data:image/svg+xml')) {
        showAlert('warning', 'Vui lòng chọn ảnh trước khi xem trước');
        return;
    }

    const previewTitle = document.getElementById('previewTitle');
    const previewLink = document.getElementById('previewLink');
    const previewModalImg = document.getElementById('previewModalImg');

    if (previewTitle) previewTitle.textContent = title;
    if (previewLink) previewLink.textContent = targetLink;
    if (previewModalImg) previewModalImg.src = imageSrc;

    const modal = new bootstrap.Modal(document.getElementById('previewModal'));
    modal.show();
}

/**
 * Initialize filter handlers for auto-apply
 */
function initializeFilterHandlers() {
    const searchInput = document.getElementById('searchInput');
    const statusSelect = document.getElementById('statusSelect');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    // Debounce function to limit API calls
    let searchTimeout;

    // Search input handler with debounce
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFilters();
            }, 500); // Wait 500ms after user stops typing
        });
    }

    // Status select handler - immediate apply
    if (statusSelect) {
        statusSelect.addEventListener('change', function () {
            applyFilters();
        });
    }

    // Clear filters button handler
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function () {
            clearFilters();
        });
    }
}

/**
 * Clear all filters and reload page
 */
function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusSelect = document.getElementById('statusSelect');
    const filterForm = document.getElementById('filterForm');

    // Clear form values
    if (searchInput) {
        searchInput.value = '';
    }
    if (statusSelect) {
        statusSelect.value = '';
    }

    // Show loading state
    if (filterForm) {
        filterForm.classList.add('filter-loading');
    }

    // Navigate to clean URL (only page parameter if exists)
    const url = new URL(window.location);
    url.search = ''; // Remove all parameters

    // Navigate to clean URL
    window.location.href = url.toString();
}

/**
 * Apply filters and reload page
 */
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusSelect = document.getElementById('statusSelect');
    const filterForm = document.getElementById('filterForm');

    const searchValue = searchInput ? searchInput.value.trim() : '';
    const statusValue = statusSelect ? statusSelect.value : '';

    // Show loading state
    if (filterForm) {
        filterForm.classList.add('filter-loading');
    }

    // Build URL with current parameters
    const url = new URL(window.location);

    // Update search parameter
    if (searchValue) {
        url.searchParams.set('search', searchValue);
    } else {
        url.searchParams.delete('search');
    }

    // Update status parameter
    if (statusValue) {
        url.searchParams.set('isActive', statusValue);
    } else {
        url.searchParams.delete('isActive');
    }

    // Remove page parameter to go to first page
    url.searchParams.delete('page');

    // Navigate to new URL
    window.location.href = url.toString();
}

/**
 * Show toast notification
 */
function showAlert(type, message) {
    const toast = document.getElementById('bannerToast');
    const toastBody = toast.querySelector('.toast-body');

    // Remove all existing type classes
    toast.classList.remove('admin-toast-success', 'admin-toast-error', 'admin-toast-warning', 'admin-toast-info');

    // Map danger to error for consistency
    const toastType = type === 'danger' ? 'error' : type;

    // Add the correct type class
    toast.classList.add(`admin-toast-${toastType}`);

    // Update message
    toastBody.textContent = message;

    // Show toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 4000
    });

    // Ensure toast is visible
    toast.classList.add('show');
    bsToast.show();
}
