package vn.liora.controller.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.response.ReviewResponse;
import vn.liora.service.IReviewService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/reviews")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAuthority('review.view')")
public class AdminReviewController {

    private final IReviewService reviewService;

    /**
     * Lấy danh sách review với phân trang và lọc
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Boolean isVisible) {

        try {
            // Tạo Pageable
            Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);

            // Gọi service để lấy dữ liệu
            Page<ReviewResponse> reviews = reviewService.findAllReviewsForAdminWithFilters(
                    pageable, search, rating, brandId, categoryId, productId, isVisible);

            // Tạo response
            Map<String, Object> response = new HashMap<>();
            response.put("reviews", reviews.getContent());
            response.put("currentPage", reviews.getNumber());
            response.put("totalItems", reviews.getTotalElements());
            response.put("totalPages", reviews.getTotalPages());
            response.put("pageSize", reviews.getSize());
            response.put("hasNext", reviews.hasNext());
            response.put("hasPrevious", reviews.hasPrevious());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting reviews: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy thống kê review
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getReviewStatistics(
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long productId) {

        try {
            Map<String, Object> statistics = reviewService.getReviewStatistics(
                    rating, brandId, categoryId, productId);
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("Error getting review statistics: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy chi tiết review
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReviewResponse> getReviewById(@PathVariable Long id) {
        try {
            ReviewResponse review = reviewService.findById(id);
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            log.error("Error getting review by id: ", e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Cập nhật trạng thái hiển thị review
     */
    @PutMapping("/{id}/visibility")
    @PreAuthorize("hasAuthority('review.manage')")
    public ResponseEntity<Map<String, Object>> updateReviewVisibility(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestBody) {
        try {
            Boolean isVisible = (Boolean) requestBody.get("isVisible");
            if (isVisible == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "isVisible parameter is required"));
            }

            reviewService.updateReviewVisibility(id, isVisible);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", isVisible ? "Review đã được hiển thị" : "Review đã được ẩn");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating review visibility: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy danh sách brands cho filter
     */
    @GetMapping("/brands")
    public ResponseEntity<?> getBrands() {
        try {
            return ResponseEntity.ok(reviewService.getBrandsForFilter());
        } catch (Exception e) {
            log.error("Error getting brands: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy danh sách categories cho filter
     */
    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        try {
            return ResponseEntity.ok(reviewService.getCategoriesForFilter());
        } catch (Exception e) {
            log.error("Error getting categories: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy danh sách products cho filter
     */
    @GetMapping("/products")
    public ResponseEntity<?> getProducts(
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId) {
        try {
            return ResponseEntity.ok(reviewService.getProductsForFilter(brandId, categoryId));
        } catch (Exception e) {
            log.error("Error getting products: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}