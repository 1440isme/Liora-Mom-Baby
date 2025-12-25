// Review Management System
class ReviewManager {
    static reviews = [
        {
            id: 'rev-001',
            productId: 'skin-001',
            productName: 'Glow Deep Serum',
            customerName: 'Sarah Kim',
            customerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b4f3a22e?w=150&q=80',
            rating: 5,
            title: 'Amazing results!',
            comment: 'This serum has completely transformed my skin! I\'ve been using it for 3 weeks and my dark spots are noticeably lighter. The texture is lightweight and absorbs quickly. Highly recommend! ✨',
            date: '2024-03-15',
            verified: true,
            helpful: 23,
            skinType: 'Combination',
            ageRange: '25-34'
        },
        {
            id: 'rev-002',
            productId: 'make-003',
            productName: 'Lip Sleeping Mask',
            customerName: 'Emma Chen',
            customerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
            rating: 5,
            title: 'Holy grail lip product!',
            comment: 'I wake up with the softest lips every morning! This has been a game-changer for my winter skincare routine. The berry scent is delightful too. Worth every penny! 💕',
            date: '2024-03-12',
            verified: true,
            helpful: 31,
            skinType: 'Dry',
            ageRange: '35-44'
        },
        {
            id: 'rev-003',
            productId: 'skin-002',
            productName: 'Snail 96 Mucin Power Essence',
            customerName: 'Jessica Park',
            customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
            rating: 4,
            title: 'Great for hydration',
            comment: 'Love how hydrating this essence is! It really helps with my dry skin, especially during winter. The texture takes some getting used to, but the results are worth it. My skin feels plumper and more radiant.',
            date: '2024-03-10',
            verified: true,
            helpful: 18,
            skinType: 'Dry',
            ageRange: '25-34'
        },
        {
            id: 'rev-004',
            productId: 'make-001',
            productName: 'Glass Skin Liquid Foundation',
            customerName: 'Mia Rodriguez',
            customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
            rating: 5,
            title: 'Perfect glass skin effect!',
            comment: 'This foundation gives me that coveted glass skin look! The coverage is buildable and it doesn\'t feel heavy. Lasted all day without oxidizing. The shade range is also excellent. 🌟',
            date: '2024-03-08',
            verified: true,
            helpful: 42,
            skinType: 'Normal',
            ageRange: '18-24'
        },
        {
            id: 'rev-005',
            productId: 'skin-003',
            productName: 'Centella Unscented Serum',
            customerName: 'Rachel Lee',
            customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
            rating: 5,
            title: 'Sensitive skin savior!',
            comment: 'Perfect for my sensitive, acne-prone skin! No irritation whatsoever and it actually helps calm redness. I use it both morning and night. The price point is amazing for the quality you get.',
            date: '2024-03-05',
            verified: true,
            helpful: 27,
            skinType: 'Sensitive',
            ageRange: '25-34'
        },
        {
            id: 'rev-006',
            productId: 'make-004',
            productName: 'Lip Tint Water Gel',
            customerName: 'Luna Martinez',
            customerAvatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=150&q=80',
            rating: 4,
            title: 'Long-lasting color',
            comment: 'The color payoff is great and it really does last through meals and drinks! Sometimes it can be a bit drying after several hours, but overall I love the vibrant colors available. Cherry Pink is my favorite! 🍒',
            date: '2024-03-02',
            verified: true,
            helpful: 15,
            skinType: 'Normal',
            ageRange: '18-24'
        },
        {
            id: 'rev-007',
            productId: 'skin-006',
            productName: 'Hyaluronic Acid 2% + B5',
            customerName: 'Sophia Wang',
            customerAvatar: 'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?w=150&q=80',
            rating: 4,
            title: 'Great hydration boost',
            comment: 'Really helps with dehydrated skin! I layer it under my moisturizer and my skin feels so much more plump and hydrated. The price is unbeatable. Just wish the packaging was a bit more user-friendly.',
            date: '2024-02-28',
            verified: true,
            helpful: 22,
            skinType: 'Dehydrated',
            ageRange: '35-44'
        },
        {
            id: 'rev-008',
            productId: 'make-002',
            productName: 'Cushion Compact Foundation',
            customerName: 'Chloe Kim',
            customerAvatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&q=80',
            rating: 5,
            title: 'Perfect for touch-ups!',
            comment: 'Love this cushion foundation! It\'s so convenient for touch-ups throughout the day. The coverage is natural but buildable, and the SPF is a bonus. The shade match is perfect for my skin tone. Definitely repurchasing! ✨',
            date: '2024-02-25',
            verified: true,
            helpful: 19,
            skinType: 'Oily',
            ageRange: '25-34'
        }
    ];

    // Get all reviews
    static getAllReviews() {
        return [...this.reviews];
    }

    // Get reviews by product ID
    static getReviewsByProduct(productId) {
        return this.reviews.filter(review => review.productId === productId);
    }

    // Get recent reviews (for carousel)
    static getRecentReviews(limit = 6) {
        return this.reviews
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    // Get featured reviews (high rating and helpful)
    static getFeaturedReviews(limit = 8) {
        return this.reviews
            .filter(review => review.rating >= 4 && review.helpful >= 15)
            .sort((a, b) => (b.rating * b.helpful) - (a.rating * a.helpful))
            .slice(0, limit);
    }

    // Get review statistics for a product
    static getProductReviewStats(productId) {
        const productReviews = this.getReviewsByProduct(productId);
        
        if (productReviews.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            };
        }

        const totalReviews = productReviews.length;
        const averageRating = productReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
        
        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        productReviews.forEach(review => {
            ratingDistribution[review.rating]++;
        });

        return {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews,
            ratingDistribution
        };
    }

    // Add a new review
    static addReview(reviewData) {
        const newReview = {
            id: `rev-${String(Date.now()).slice(-3)}`,
            date: new Date().toISOString().split('T')[0],
            verified: false,
            helpful: 0,
            ...reviewData
        };

        this.reviews.unshift(newReview); // Add to beginning
        return newReview;
    }

    // Mark review as helpful
    static markHelpful(reviewId) {
        const review = this.reviews.find(r => r.id === reviewId);
        if (review) {
            review.helpful++;
            return review;
        }
        return null;
    }

    // Filter reviews
    static filterReviews(criteria) {
        let filtered = [...this.reviews];

        if (criteria.productId) {
            filtered = filtered.filter(review => review.productId === criteria.productId);
        }

        if (criteria.rating) {
            filtered = filtered.filter(review => review.rating === criteria.rating);
        }

        if (criteria.verified !== undefined) {
            filtered = filtered.filter(review => review.verified === criteria.verified);
        }

        if (criteria.skinType) {
            filtered = filtered.filter(review => review.skinType === criteria.skinType);
        }

        if (criteria.ageRange) {
            filtered = filtered.filter(review => review.ageRange === criteria.ageRange);
        }

        return filtered;
    }

    // Sort reviews
    static sortReviews(reviews, sortBy = 'newest') {
        const sortedReviews = [...reviews];

        switch (sortBy) {
            case 'newest':
                return sortedReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
            case 'oldest':
                return sortedReviews.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'highest-rating':
                return sortedReviews.sort((a, b) => b.rating - a.rating);
            case 'lowest-rating':
                return sortedReviews.sort((a, b) => a.rating - b.rating);
            case 'most-helpful':
                return sortedReviews.sort((a, b) => b.helpful - a.helpful);
            default:
                return sortedReviews;
        }
    }

    // Generate review statistics
    static getOverallStats() {
        const totalReviews = this.reviews.length;
        const averageRating = this.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
        const verifiedCount = this.reviews.filter(review => review.verified).length;
        
        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        this.reviews.forEach(review => {
            ratingDistribution[review.rating]++;
        });

        const skinTypeDistribution = {};
        this.reviews.forEach(review => {
            if (review.skinType) {
                skinTypeDistribution[review.skinType] = (skinTypeDistribution[review.skinType] || 0) + 1;
            }
        });

        return {
            totalReviews,
            averageRating: Math.round(averageRating * 10) / 10,
            verifiedPercentage: Math.round((verifiedCount / totalReviews) * 100),
            ratingDistribution,
            skinTypeDistribution
        };
    }

    // Load reviews into carousel
    static loadReviews() {
        const carousel = document.getElementById('reviewsCarousel');
        if (!carousel) return;

        const carouselInner = carousel.querySelector('.carousel-inner');
        const featuredReviews = this.getFeaturedReviews(6);
        
        // Group reviews by 3 for each slide (2 for mobile)
        const reviewsPerSlide = window.innerWidth < 768 ? 1 : 3;
        const slides = [];
        
        for (let i = 0; i < featuredReviews.length; i += reviewsPerSlide) {
            slides.push(featuredReviews.slice(i, i + reviewsPerSlide));
        }

        carouselInner.innerHTML = slides.map((slideReviews, index) => `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <div class="container">
                    <div class="row justify-content-center">
                        ${slideReviews.map(review => `
                            <div class="col-lg-4 col-md-6 mb-4">
                                ${this.renderReviewCard(review)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        // Add indicators
        const indicators = carousel.querySelector('.carousel-indicators');
        if (indicators) {
            indicators.innerHTML = slides.map((_, index) => `
                <button type="button" data-bs-target="#reviewsCarousel" data-bs-slide-to="${index}" 
                        class="${index === 0 ? 'active' : ''}" 
                        aria-label="Slide ${index + 1}"></button>
            `).join('');
        }
    }

    // Render a single review card
    static renderReviewCard(review) {
        // Kiểm tra xem review có bị ẩn không
        const isHidden = review.isVisible === false;
        
        return `
            <div class="review-card ${isHidden ? 'review-hidden' : ''}">
                <div class="d-flex align-items-center mb-3">
                    <img src="${review.customerAvatar}" alt="${review.customerName}" class="review-avatar me-3">
                    <div>
                        <h6 class="review-author mb-1">${review.customerName}</h6>
                        <div class="rating-stars mb-1">
                            ${this.renderStars(review.rating)}
                        </div>
                        ${review.verified ? '<small class="text-success"><i class="fas fa-check-circle me-1"></i>Verified Purchase</small>' : ''}
                    </div>
                </div>
                
                <h6 class="fw-semibold mb-2">${review.title}</h6>
                <div class="review-text mb-3">
                    ${isHidden ? 
                        '<div class="review-hidden-content"><i class="fas fa-eye-slash me-2"></i>Nội dung đánh giá đã bị ẩn</div>' : 
                        `"${review.comment}"`
                    }
                </div>
                
                <div class="d-flex justify-content-between align-items-center text-small">
                    <span class="review-product text-muted">${review.productName}</span>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary me-2" onclick="ReviewManager.markHelpful('${review.id}')">
                            <i class="fas fa-thumbs-up me-1"></i>${review.helpful}
                        </button>
                        <small class="text-muted">${this.formatDate(review.date)}</small>
                    </div>
                </div>
            </div>
        `;
    }

    // Render star ratings
    static renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return [
            ...Array(fullStars).fill('<i class="fas fa-star"></i>'),
            ...(hasHalfStar ? ['<i class="fas fa-star-half-alt"></i>'] : []),
            ...Array(emptyStars).fill('<i class="far fa-star"></i>')
        ].join('');
    }

    // Format date for display
    static formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
        
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    // Load product reviews (for product detail pages)
    static loadProductReviews(productId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const reviews = this.getReviewsByProduct(productId);
        const stats = this.getProductReviewStats(productId);

        container.innerHTML = `
            <div class="reviews-summary mb-4">
                <h4>Customer Reviews</h4>
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <div class="d-flex align-items-center mb-2">
                            <span class="display-6 fw-bold me-3">${stats.averageRating}</span>
                            <div>
                                <div class="rating-stars mb-1">
                                    ${this.renderStars(stats.averageRating)}
                                </div>
                                <small class="text-muted">Based on ${stats.totalReviews} reviews</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="rating-breakdown">
                            ${Object.entries(stats.ratingDistribution).reverse().map(([rating, count]) => `
                                <div class="d-flex align-items-center mb-1">
                                    <span class="me-2">${rating}★</span>
                                    <div class="progress flex-grow-1 me-2" style="height: 8px;">
                                        <div class="progress-bar" style="width: ${(count / stats.totalReviews) * 100}%"></div>
                                    </div>
                                    <small class="text-muted">${count}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <div class="reviews-list">
                ${reviews.map(review => `
                    <div class="review-item border-bottom py-4">
                        ${this.renderReviewCard(review)}
                    </div>
                `).join('')}
                
                ${reviews.length === 0 ? '<p class="text-center text-muted">No reviews yet. Be the first to review this product!</p>' : ''}
            </div>
        `;
    }

    // Initialize review system
    static init() {
        // Load reviews into carousel if present
        this.loadReviews();

        // Handle window resize for responsive carousel
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.loadReviews();
            }, 250);
        });
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ReviewManager.init();
});

// Export for use in other scripts
window.ReviewManager = ReviewManager;