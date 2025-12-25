package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.ReviewCreationRequest;
import vn.liora.dto.request.ReviewUpdateRequest;
import vn.liora.dto.response.ReviewResponse;
import vn.liora.entity.OrderProduct;
import vn.liora.entity.Product;
import vn.liora.entity.Review;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.ReviewMapper;
import vn.liora.repository.*;
import vn.liora.service.IReviewService;
import vn.liora.service.IProductService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReviewServiceImpl implements IReviewService {

    ReviewRepository reviewRepository;
    OrderProductRepository orderProductRepository;
    ReviewMapper reviewMapper;
    BrandRepository brandRepository; // Thêm vào constructor
    CategoryRepository categoryRepository; // Thêm vào constructor
    ProductRepository productRepository; // Thêm vào constructor
    IProductService productService; // Thêm vào constructor

    // ========== BASIC CRUD ==========
    
    @Override
    @Transactional
    public ReviewResponse createReview(ReviewCreationRequest request, Long userId) {
        // Kiểm tra OrderProduct có tồn tại không
        OrderProduct orderProduct = orderProductRepository.findById(request.getOrderProductId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_PRODUCT_NOT_FOUND));

        // Kiểm tra user có phải là chủ sở hữu của order không
        if (!orderProduct.getOrder().getUser().getUserId().equals(userId)) {
            throw new AppException(ErrorCode.REVIEW_ACCESS_DENIED);
        }

        // THÊM: Kiểm tra đơn hàng đã được giao chưa
        String orderStatus = orderProduct.getOrder().getOrderStatus();
        if (!"DELIVERED".equals(orderStatus) && !"COMPLETED".equals(orderStatus)) {
            throw new AppException(ErrorCode.ORDER_NOT_DELIVERED);
        }

        // Kiểm tra đã review chưa
        if (reviewRepository.existsByOrderProduct_IdOrderProduct(request.getOrderProductId())) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        // Tạo review entity
        Review review = reviewMapper.toReview(request);
        review.setOrderProduct(orderProduct);
        review.setUserId(userId);
        review.setProductId(orderProduct.getProduct().getProductId());
        review.setCreatedAt(LocalDateTime.now());
        review.setLastUpdate(LocalDateTime.now());
        review.setIsVisible(true);

        // Lưu review
        Review savedReview = reviewRepository.save(review);

        // Cập nhật average rating cho product
        try {
            productService.updateProductAverageRating(orderProduct.getProduct().getProductId());
        } catch (Exception e) {
            log.error("Error updating product average rating: {}", e.getMessage());
            // Không throw exception để không ảnh hưởng đến việc tạo review
        }

        return reviewMapper.toReviewResponse(savedReview);
    }

    @Override
    public ReviewResponse findById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        return reviewMapper.toReviewResponse(review);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long id, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

        reviewMapper.updateReview(review, request);
        review.setLastUpdate(LocalDateTime.now());

        Review savedReview = reviewRepository.save(review);

        // Cập nhật average rating cho product
        try {
            productService.updateProductAverageRating(review.getProductId());
        } catch (Exception e) {
            log.error("Error updating product average rating: {}", e.getMessage());
        }

        return reviewMapper.toReviewResponse(savedReview);
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        
        Long productId = review.getProductId();
        reviewRepository.delete(review);
        
        // Cập nhật average rating cho product
        try {
            productService.updateProductAverageRating(productId);
        } catch (Exception e) {
            log.error("Error updating product average rating: {}", e.getMessage());
        }
    }

    @Override
    public long count() {
        return reviewRepository.count();
    }

    // ========== FIND ALL ==========
    
    @Override
    public List<Review> findAll() {
        return reviewRepository.findAll();
    }

    @Override
    public Page<Review> findAll(Pageable pageable) {
        return reviewRepository.findAll(pageable);
    }

    @Override
    public List<ReviewResponse> findAllAsResponse() {
        return reviewMapper.toReviewResponseList(reviewRepository.findAll());
    }

    @Override
    public Page<ReviewResponse> findAllAsResponse(Pageable pageable) {
        Page<Review> reviews = reviewRepository.findAll(pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    // ========== BY PRODUCT ==========
    
    @Override
    public List<ReviewResponse> findVisibleReviewsByProductId(Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdAndIsVisibleTrue(productId);
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> findVisibleReviewsByProductId(Long productId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByProductIdAndIsVisibleTrue(productId, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    @Override
    public Page<ReviewResponse> findVisibleReviewsByProductIdWithRating(Long productId, Integer rating, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByProductIdAndRatingAndIsVisibleTrue(productId, rating, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    // Methods to get all reviews (including hidden) for display with hidden content
    @Override
    public List<ReviewResponse> findReviewsByProductId(Long productId) {
        List<Review> reviews = reviewRepository.findByProductId(productId);
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> findReviewsByProductId(Long productId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByProductId(productId, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    @Override
    public Page<ReviewResponse> findReviewsByProductIdWithRating(Long productId, Integer rating, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByProductIdAndRating(productId, rating, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    // ========== BY USER ==========
    
    @Override
    public List<ReviewResponse> findByUserId(Long userId) {
        List<Review> reviews = reviewRepository.findByUserId(userId);
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> findByUserId(Long userId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByUserId(userId, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    @Override
    public List<ReviewResponse> findVisibleReviewsByUserId(Long userId) {
        List<Review> reviews = reviewRepository.findByUserIdAndIsVisibleTrue(userId);
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> findVisibleReviewsByUserId(Long userId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByUserIdAndIsVisibleTrue(userId, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    // ========== BY ORDER PRODUCT ==========
    
    @Override
    public Optional<Review> findByOrderProductId(Long orderProductId) {
        return reviewRepository.findByOrderProduct_IdOrderProduct(orderProductId);
    }

    @Override
    public boolean existsByOrderProductId(Long orderProductId) {
        return reviewRepository.existsByOrderProduct_IdOrderProduct(orderProductId);
    }

    // ========== STATISTICS ==========
    
    @Override
    public Double getAverageRatingByProductId(Long productId) {
        return reviewRepository.getAverageRatingByProductId(productId);
    }

    @Override
    public Long getReviewCountByProductId(Long productId) {
        return reviewRepository.getReviewCountByProductId(productId);
    }

    @Override
    public Long getTotalReviewCountByProductId(Long productId) {
        return reviewRepository.getTotalReviewCountByProductId(productId);
    }

    @Override
    public Map<String, Object> getProductReviewStatistics(Long productId) {
        Map<String, Object> statistics = new HashMap<>();
        
        // Lấy điểm trung bình
        Double averageRating = reviewRepository.getAverageRatingByProductId(productId);
        statistics.put("averageRating", averageRating != null ? averageRating : 0.0);
        
        // Lấy tổng số review (bao gồm cả ẩn) để hiển thị đúng count
        Long totalReviews = reviewRepository.getTotalReviewCountByProductId(productId);
        statistics.put("totalReviews", totalReviews != null ? totalReviews : 0L);
        
        // Lấy số review theo từng rating (1-5 sao)
        Map<Integer, Long> ratingCounts = new HashMap<>();
        for (int rating = 1; rating <= 5; rating++) {
            Long count = reviewRepository.getReviewCountByProductIdAndRating(productId, rating);
            ratingCounts.put(rating, count != null ? count : 0L);
        }
        statistics.put("ratingCounts", ratingCounts);
        
        // Tính phần trăm cho mỗi rating
        Map<Integer, Double> ratingPercentages = new HashMap<>();
        if (totalReviews != null && totalReviews > 0) {
            for (int rating = 1; rating <= 5; rating++) {
                Long count = ratingCounts.get(rating);
                double percentage = (double) count / totalReviews * 100;
                ratingPercentages.put(rating, percentage);
            }
        } else {
            for (int rating = 1; rating <= 5; rating++) {
                ratingPercentages.put(rating, 0.0);
            }
        }
        statistics.put("ratingPercentages", ratingPercentages);
        
        return statistics;
    }

    @Override
    public Map<String, Object> getMultipleProductsReviewStatistics(List<Long> productIds) {
        Map<String, Object> result = new HashMap<>();
        
        // Validate input
        if (productIds == null || productIds.isEmpty()) {
            log.warn("getMultipleProductsReviewStatistics called with empty productIds list");
            return result;
        }
        
        log.debug("Getting statistics for {} products", productIds.size());
        
        for (Long productId : productIds) {
            // Skip null product IDs
            if (productId == null) {
                log.warn("Skipping null product ID in getMultipleProductsReviewStatistics");
                continue;
            }
            
            try {
                Map<String, Object> productStats = new HashMap<>();
                
                // Lấy điểm trung bình
                Double averageRating = reviewRepository.getAverageRatingByProductId(productId);
                productStats.put("averageRating", averageRating != null ? averageRating : 0.0);
                
                // Lấy tổng số review (bao gồm cả ẩn) để hiển thị đúng count
                Long totalReviews = reviewRepository.getTotalReviewCountByProductId(productId);
                productStats.put("totalReviews", totalReviews != null ? totalReviews : 0L);
                
                result.put(productId.toString(), productStats);
                
                log.debug("Got statistics for product {}: averageRating={}, totalReviews={}", 
                          productId, averageRating, totalReviews);
            } catch (Exception e) {
                log.error("Error getting statistics for product {}: {}", productId, e.getMessage(), e);
                // Continue processing other products even if one fails
                Map<String, Object> errorStats = new HashMap<>();
                errorStats.put("averageRating", 0.0);
                errorStats.put("totalReviews", 0L);
                result.put(productId.toString(), errorStats);
            }
        }
        
        return result;
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    @Override
    public List<ReviewResponse> findAllReviewsForAdmin() {
        List<Review> reviews = reviewRepository.findAll();
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> findAllReviewsForAdmin(Pageable pageable) {
        Page<Review> reviews = reviewRepository.findAll(pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    @Override
    public List<ReviewResponse> searchReviewsByContent(String keyword) {
        List<Review> reviews = reviewRepository.findByContentContainingIgnoreCase(keyword);
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> searchReviewsByContent(String keyword, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByContentContainingIgnoreCase(keyword, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    @Override
    public List<ReviewResponse> findReviewsByUserForAdmin(Long userId) {
        List<Review> reviews = reviewRepository.findByUserId(userId);
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> findReviewsByUserForAdmin(Long userId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByUserId(userId, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    @Override
    public List<ReviewResponse> findReviewsByProductForAdmin(Long productId) {
        List<Review> reviews = reviewRepository.findByProductId(productId);
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> findReviewsByProductForAdmin(Long productId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByProductId(productId, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    @Override
    @Transactional
    public ReviewResponse toggleReviewVisibility(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        
        review.setIsVisible(!review.getIsVisible());
        review.setLastUpdate(LocalDateTime.now());
        
        Review savedReview = reviewRepository.save(review);
        return reviewMapper.toReviewResponse(savedReview);
    }

    @Override
    @Transactional
    public ReviewResponse hideReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        
        review.setIsVisible(false);
        review.setLastUpdate(LocalDateTime.now());
        
        Review savedReview = reviewRepository.save(review);
        return reviewMapper.toReviewResponse(savedReview);
    }

    @Override
    @Transactional
    public ReviewResponse showReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        
        review.setIsVisible(true);
        review.setLastUpdate(LocalDateTime.now());
        
        Review savedReview = reviewRepository.save(review);
        return reviewMapper.toReviewResponse(savedReview);
    }

    // ========== ADMIN FUNCTIONS WITH FILTERS ==========

    @Override
    public Page<ReviewResponse> findAllReviewsForAdminWithFilters(
            Pageable pageable,
            String search,
            Integer rating,
            Long brandId,
            Long categoryId,
            Long productId,
            Boolean isVisible) {

        Page<Review> reviews = reviewRepository.findAllReviewsWithFilters(
                search, rating, brandId, categoryId, productId, isVisible, pageable);

        return reviews.map(reviewMapper::toReviewResponse);
    }

    @Override
    public Map<String, Object> getReviewStatistics(
            Integer rating,
            Long brandId,
            Long categoryId,
            Long productId) {

        Map<String, Object> statistics = new HashMap<>();

        // Lấy điểm trung bình
        Double averageRating = reviewRepository.getAverageRatingWithFilters(
                rating, brandId, categoryId, productId);
        statistics.put("averageRating", averageRating != null ? averageRating : 0.0);

        // Lấy tổng số review
        Long totalReviews = reviewRepository.getReviewCountWithFilters(
                rating, brandId, categoryId, productId);
        statistics.put("totalReviews", totalReviews != null ? totalReviews : 0L);

        // Lấy số review 5 sao
        Long fiveStarReviews = reviewRepository.getFiveStarReviewCountWithFilters(
                rating, brandId, categoryId, productId);
        statistics.put("fiveStarReviews", fiveStarReviews != null ? fiveStarReviews : 0L);

        // Tính phần trăm 5 sao
        double fiveStarPercentage = 0.0;
        if (totalReviews != null && totalReviews > 0 && fiveStarReviews != null) {
            fiveStarPercentage = (double) fiveStarReviews / totalReviews * 100;
        }
        statistics.put("fiveStarPercentage", fiveStarPercentage);

        return statistics;
    }

    @Override
    public List<Map<String, Object>> getBrandsForFilter() {
        return brandRepository.findByIsActiveTrue().stream()
                .map(brand -> {
                    Map<String, Object> brandMap = new HashMap<>();
                    brandMap.put("brandId", brand.getBrandId());
                    brandMap.put("name", brand.getName());
                    return brandMap;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getCategoriesForFilter() {
        return categoryRepository.findByIsActiveTrue().stream()
                .map(category -> {
                    Map<String, Object> categoryMap = new HashMap<>();
                    categoryMap.put("categoryId", category.getCategoryId());
                    categoryMap.put("name", category.getName());
                    return categoryMap;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getProductsForFilter(Long brandId, Long categoryId) {
        List<Product> products;

        if (brandId != null && categoryId != null) {
            products = productRepository.findByBrandBrandIdAndCategoryCategoryIdAndIsActiveTrue(brandId, categoryId);
        } else
        if (brandId != null) {
            products = productRepository.findByBrandBrandIdAndIsActiveTrue(brandId);
        } else if (categoryId != null) {
            products = productRepository.findByCategoryCategoryIdAndIsActiveTrue(categoryId);
        } else {
            products = productRepository.findByIsActiveTrue();
        }

        return products.stream()
                .map(product -> {
                    Map<String, Object> productMap = new HashMap<>();
                    productMap.put("productId", product.getProductId());
                    productMap.put("name", product.getName());
                    return productMap;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateReviewVisibility(Long reviewId, Boolean isVisible) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

        review.setIsVisible(isVisible);
        review.setLastUpdate(LocalDateTime.now());

        reviewRepository.save(review);
    }

    @Override
    public boolean existsByOrderProductIdAndUserId(Long orderProductId, Long userId) {
        return reviewRepository.existsByOrderProductIdOrderProductAndUserId(orderProductId, userId);
    }

    @Override
    public ReviewResponse findByOrderProductIdAndUserId(Long orderProductId, Long userId) {
        Review review = reviewRepository.findByOrderProductIdOrderProductAndUserId(orderProductId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        return reviewMapper.toReviewResponse(review);
    }
}
