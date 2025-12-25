// Product Rating Utilities
class ProductRatingUtils {
    static async loadReviewStatistics(productIds) {
        if (!productIds || productIds.length === 0) {
            console.log('No product IDs provided');
            return {};
        }


        try {
            const response = await fetch('/api/reviews/products/statistics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productIds)
            });


            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                const errorText = await response.text();
                console.warn('Failed to load review statistics:', response.status, errorText);
                return {};
            }
        } catch (error) {
            console.error('Error loading review statistics:', error);
            return {};
        }
    }

    static createStarRatingHTML(averageRating, reviewCount) {
        const rating = averageRating || 0;
        const count = reviewCount || 0;

        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                // Full star
                starsHTML += `<i class="fas fa-star" style="color: #ffc107 !important;"></i>`;
            } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
                // Half star
                starsHTML += `<i class="fas fa-star-half-alt" style="color: #ffc107 !important;"></i>`;
            } else {
                // Empty star
                starsHTML += `<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>`;
            }
        }

        return `
            <span class="stars">
                ${starsHTML}
            </span>
            <span class="rating-count">(${count})</span>
        `;
    }

    static updateProductCardRating(cardElement, productId, statistics) {
        const productStats = statistics[productId.toString()];
        if (!productStats) {
            console.log('No stats found for product:', productId);
            return;
        }

        const averageRating = productStats.averageRating || 0;
        const reviewCount = productStats.totalReviews || 0;


        // Tìm rating container - tìm cả .product-rating và .rating
        let ratingContainer = cardElement.querySelector('.product-rating') || cardElement.querySelector('.rating');
        console.log('Found rating container:', ratingContainer);
        
        if (!ratingContainer) {
            // Tạo rating container mới
            const cardBody = cardElement.querySelector('.card-body');
            if (cardBody) {
                const title = cardBody.querySelector('.card-title, .product-title');
                if (title) {
                    ratingContainer = document.createElement('div');
                    ratingContainer.className = 'product-rating mb-2';
                    title.insertAdjacentElement('afterend', ratingContainer);
                }
            }
        }

        if (ratingContainer) {
            const newHTML = this.createStarRatingHTML(averageRating, reviewCount);
            ratingContainer.innerHTML = newHTML;
        } else {
            console.error('Could not find or create rating container for product:', productId);
        }
    }

    static async loadAndUpdateProductCards(productCards) {
        if (!productCards || productCards.length === 0) return;


        // Lấy danh sách product IDs
        const productIds = Array.from(productCards).map(card => {
            const productId = card.dataset.productId ||
                card.querySelector('[data-product-id]')?.dataset.productId ||
                card.querySelector('a[href*="/product/"]')?.href.match(/\/product\/(\d+)/)?.[1];
            return productId ? parseInt(productId) : null;
        }).filter(id => id !== null);


        if (productIds.length === 0) {
            return;
        }

        // Load review statistics
        const statistics = await this.loadReviewStatistics(productIds);

        // Update each card
        productCards.forEach(card => {
            const productId = card.dataset.productId ||
                card.querySelector('[data-product-id]')?.dataset.productId ||
                card.querySelector('a[href*="/product/"]')?.href.match(/\/product\/(\d+)/)?.[1];

            if (productId) {
                this.updateProductCardRating(card, parseInt(productId), statistics);
            }
        });
    }

    static async updateQuickViewReviewData(productId, modalId = 'quickViewModal') {

        try {
            // Load review statistics for this product
            const statistics = await this.loadReviewStatistics([productId]);

            const productStats = statistics[productId.toString()];
            if (!productStats) {
                return;
            }

            const averageRating = productStats.averageRating || 0;
            const reviewCount = productStats.totalReviews || 0;


            // Find the modal
            const modal = document.getElementById(modalId);
            if (!modal) {
                return;
            }

            // Find rating container in modal
            const ratingContainer = modal.querySelector('.rating .stars');
            const reviewCountSpan = modal.querySelector('.rating .review-count') || modal.querySelector('.review-count');


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
            }

            if (reviewCountSpan) {
                reviewCountSpan.textContent = `(${reviewCount} đánh giá)`;
            } else {
            }

        } catch (error) {
            console.error('Error updating quick view review data:', error);
        }
    }
}

// Auto-load ratings for product cards on page load
document.addEventListener('DOMContentLoaded', function () {

    // Delay để đảm bảo các script khác đã load xong
    setTimeout(function () {
        loadExistingProductCards();
        setupMutationObserver();
    }, 1000);
});

function loadExistingProductCards() {
    const productCards = document.querySelectorAll('.product-card, .card.product-card');

    if (productCards.length > 0) {
        ProductRatingUtils.loadAndUpdateProductCards(productCards);
    }
}

function setupMutationObserver() {

    // Observer để load ratings cho product cards được thêm động
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType === 1) { // Element node
                    const newProductCards = node.querySelectorAll ?
                        node.querySelectorAll('.product-card, .card.product-card') : [];

                    if (newProductCards.length > 0) {
                        ProductRatingUtils.loadAndUpdateProductCards(newProductCards);
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Export function để có thể gọi từ bên ngoài
window.loadProductRatings = loadExistingProductCards;
