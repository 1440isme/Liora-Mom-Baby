package vn.liora.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.liora.dto.request.ReviewCreationRequest;
import vn.liora.dto.request.ReviewUpdateRequest;
import vn.liora.dto.response.ReviewResponse;
import vn.liora.entity.Review;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface IReviewService {
    
    // ========== BASIC CRUD ==========
    ReviewResponse createReview(ReviewCreationRequest request, Long userId);
    ReviewResponse findById(Long id);
    ReviewResponse updateReview(Long id, ReviewUpdateRequest request);
    void deleteById(Long id);
    long count();
    
    // ========== FIND ALL ==========
    List<Review> findAll();
    Page<Review> findAll(Pageable pageable);
    List<ReviewResponse> findAllAsResponse();
    Page<ReviewResponse> findAllAsResponse(Pageable pageable);
    
    // ========== BY PRODUCT ==========
    List<ReviewResponse> findVisibleReviewsByProductId(Long productId);
    Page<ReviewResponse> findVisibleReviewsByProductId(Long productId, Pageable pageable);
    Page<ReviewResponse> findVisibleReviewsByProductIdWithRating(Long productId, Integer rating, Pageable pageable);
    
    // Methods to get all reviews (including hidden) for display with hidden content
    List<ReviewResponse> findReviewsByProductId(Long productId);
    Page<ReviewResponse> findReviewsByProductId(Long productId, Pageable pageable);
    Page<ReviewResponse> findReviewsByProductIdWithRating(Long productId, Integer rating, Pageable pageable);
    
    // ========== BY USER ==========
    List<ReviewResponse> findByUserId(Long userId);
    Page<ReviewResponse> findByUserId(Long userId, Pageable pageable);
    List<ReviewResponse> findVisibleReviewsByUserId(Long userId);
    Page<ReviewResponse> findVisibleReviewsByUserId(Long userId, Pageable pageable);
    
    // ========== BY ORDER PRODUCT ==========
    Optional<Review> findByOrderProductId(Long orderProductId);
    boolean existsByOrderProductId(Long orderProductId);
    
    // ========== STATISTICS ==========
    Double getAverageRatingByProductId(Long productId);
    Long getReviewCountByProductId(Long productId);
    Long getTotalReviewCountByProductId(Long productId);
    Map<String, Object> getProductReviewStatistics(Long productId);
    
    Map<String, Object> getMultipleProductsReviewStatistics(List<Long> productIds);
    
    // ========== ADMIN FUNCTIONS ==========
    List<ReviewResponse> findAllReviewsForAdmin();
    Page<ReviewResponse> findAllReviewsForAdmin(Pageable pageable);
    List<ReviewResponse> searchReviewsByContent(String keyword);
    Page<ReviewResponse> searchReviewsByContent(String keyword, Pageable pageable);
    List<ReviewResponse> findReviewsByUserForAdmin(Long userId);
    Page<ReviewResponse> findReviewsByUserForAdmin(Long userId, Pageable pageable);
    List<ReviewResponse> findReviewsByProductForAdmin(Long productId);
    Page<ReviewResponse> findReviewsByProductForAdmin(Long productId, Pageable pageable);
    ReviewResponse toggleReviewVisibility(Long reviewId);
    ReviewResponse hideReview(Long reviewId);
    ReviewResponse showReview(Long reviewId);

    // ========== ADMIN FUNCTIONS WITH FILTERS ==========
    Page<ReviewResponse> findAllReviewsForAdminWithFilters(
            Pageable pageable,
            String search,
            Integer rating,
            Long brandId,
            Long categoryId,
            Long productId,
            Boolean isVisible);

    Map<String, Object> getReviewStatistics(
            Integer rating,
            Long brandId,
            Long categoryId,
            Long productId);

    List<Map<String, Object>> getBrandsForFilter();
    List<Map<String, Object>> getCategoriesForFilter();
    List<Map<String, Object>> getProductsForFilter(Long brandId, Long categoryId);

    void updateReviewVisibility(Long reviewId, Boolean isVisible);
    boolean existsByOrderProductIdAndUserId(Long orderProductId, Long userId);
    ReviewResponse findByOrderProductIdAndUserId(Long orderProductId, Long userId);
}