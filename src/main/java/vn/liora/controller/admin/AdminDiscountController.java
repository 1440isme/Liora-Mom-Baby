package vn.liora.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.ApplyDiscountRequest;
import vn.liora.dto.request.DiscountCreationRequest;
import vn.liora.dto.request.DiscountUpdateRequest;
import vn.liora.dto.response.DiscountResponse;
import vn.liora.entity.Discount;
import vn.liora.exception.AppException;
import vn.liora.mapper.DiscountMapper;
import vn.liora.service.IDiscountService;
import vn.liora.service.IOrderService;
import vn.liora.service.impl.OrderServiceImpl;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/discounts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('discount.view')")
public class AdminDiscountController {

    private final IDiscountService discountService;
    private final DiscountMapper discountMapper;

    // ========== BASIC CRUD ==========
    @PostMapping
    @PreAuthorize("hasAuthority('discount.create')")
    public ResponseEntity<ApiResponse<DiscountResponse>> createDiscount(
            @Valid @RequestBody DiscountCreationRequest request) {
        ApiResponse<DiscountResponse> response = new ApiResponse<>();
        try {
            Discount discount = discountService.createDiscount(request);
            DiscountResponse discountResponse = discountMapper.toDiscountResponse(discount);
            response.setResult(discountResponse);
            response.setMessage("Tạo mã giảm giá thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DiscountResponse>>> getAllDiscounts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            Pageable pageable) {
        ApiResponse<Page<DiscountResponse>> response = new ApiResponse<>();
        try {
            Page<Discount> discounts;

            // Xử lý sort
            if (sortBy != null && !sortBy.isEmpty()) {
                pageable = this.createSortedPageable(pageable, sortBy, sortDir);
            }

            // Tìm kiếm theo tên
            if (search != null && !search.trim().isEmpty()) {
                discounts = discountService.findByNameContaining(search.trim(), pageable);
            } else {
                discounts = discountService.findAll(pageable);
            }

            // Lọc theo trạng thái
            if (status != null && !status.isEmpty()) {
                List<Discount> filteredDiscounts = discounts.getContent().stream()
                        .filter(discount -> {
                            if ("active".equals(status))
                                return discount.getIsActive();
                            if ("inactive".equals(status))
                                return !discount.getIsActive();
                            if ("expired".equals(status))
                                return discountService.isDiscountExpired(discount.getDiscountId());
                            if ("upcoming".equals(status))
                                return discount.getStartDate().isAfter(java.time.LocalDateTime.now());
                            return true;
                        })
                        .toList();

                // Tạo Page mới với filtered content
                discounts = new PageImpl<>(filteredDiscounts, pageable, filteredDiscounts.size());
            }

            Page<DiscountResponse> discountResponses = discounts.map(discountMapper::toDiscountResponse);
            response.setResult(discountResponses);
            response.setMessage("Lấy danh sách mã giảm giá thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DiscountResponse>> getDiscountById(@PathVariable Long id) {
        ApiResponse<DiscountResponse> response = new ApiResponse<>();
        try {
            DiscountResponse discountResponse = discountService.findById(id);
            response.setResult(discountResponse);
            response.setMessage("Lấy thông tin mã giảm giá thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('discount.update')")
    public ResponseEntity<ApiResponse<DiscountResponse>> updateDiscount(
            @PathVariable Long id,
            @Valid @RequestBody DiscountUpdateRequest request) {
        ApiResponse<DiscountResponse> response = new ApiResponse<>();
        try {
            DiscountResponse discountResponse = discountService.updateDiscount(id, request);
            response.setResult(discountResponse);
            response.setMessage("Cập nhật mã giảm giá thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('discount.delete')")
    public ResponseEntity<ApiResponse<String>> deleteDiscount(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            discountService.deleteById(id);
            response.setResult("Mã giảm giá đã được xóa");
            response.setMessage("Xóa mã giảm giá thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== ADVANCED SEARCH ==========
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<DiscountResponse>>> searchDiscounts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            Pageable pageable) {
        ApiResponse<Page<DiscountResponse>> response = new ApiResponse<>();
        try {
            Page<Discount> discounts;

            // Xử lý sort
            if (sortBy != null && !sortBy.isEmpty()) {
                pageable = this.createSortedPageable(pageable, sortBy, sortDir);
            }

            // Tìm kiếm theo tên
            if (name != null && !name.trim().isEmpty()) {
                discounts = discountService.findByNameContaining(name.trim(), pageable);
            } else {
                discounts = discountService.findAll(pageable);
            }

            // Lọc theo trạng thái
            if (status != null && !status.isEmpty()) {
                List<Discount> filteredDiscounts = discounts.getContent().stream()
                        .filter(discount -> {
                            if ("active".equals(status))
                                return discount.getIsActive();
                            if ("inactive".equals(status))
                                return !discount.getIsActive();
                            if ("expired".equals(status))
                                return discountService.isDiscountExpired(discount.getDiscountId());
                            if ("upcoming".equals(status))
                                return discount.getStartDate().isAfter(java.time.LocalDateTime.now());
                            return true;
                        })
                        .toList();

                discounts = new PageImpl<>(filteredDiscounts, pageable, filteredDiscounts.size());
            }

            Page<DiscountResponse> discountResponses = discounts.map(discountMapper::toDiscountResponse);
            response.setResult(discountResponses);
            response.setMessage("Tìm kiếm mã giảm giá thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== STATUS MANAGEMENT ==========
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<DiscountResponse>>> getActiveDiscounts() {
        ApiResponse<List<DiscountResponse>> response = new ApiResponse<>();
        try {
            List<Discount> discounts = discountService.findActiveDiscounts();
            List<DiscountResponse> discountResponses = discounts.stream()
                    .map(discountMapper::toDiscountResponse)
                    .toList();
            response.setResult(discountResponses);
            response.setMessage("Lấy danh sách mã giảm giá đang hoạt động thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/inactive")
    public ResponseEntity<ApiResponse<List<DiscountResponse>>> getInactiveDiscounts() {
        ApiResponse<List<DiscountResponse>> response = new ApiResponse<>();
        try {
            List<Discount> discounts = discountService.findInactiveDiscounts();
            List<DiscountResponse> discountResponses = discounts.stream()
                    .map(discountMapper::toDiscountResponse)
                    .toList();
            response.setResult(discountResponses);
            response.setMessage("Lấy danh sách mã giảm giá ngưng hoạt động thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/expired")
    public ResponseEntity<ApiResponse<List<DiscountResponse>>> getExpiredDiscounts() {
        ApiResponse<List<DiscountResponse>> response = new ApiResponse<>();
        try {
            List<Discount> discounts = discountService.findExpiredDiscounts();
            List<DiscountResponse> discountResponses = discounts.stream()
                    .map(discountMapper::toDiscountResponse)
                    .toList();
            response.setResult(discountResponses);
            response.setMessage("Lấy danh sách mã giảm giá đã hết hạn thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<DiscountResponse>>> getUpcomingDiscounts() {
        ApiResponse<List<DiscountResponse>> response = new ApiResponse<>();
        try {
            List<Discount> discounts = discountService.findUpcomingDiscounts();
            List<DiscountResponse> discountResponses = discounts.stream()
                    .map(discountMapper::toDiscountResponse)
                    .toList();
            response.setResult(discountResponses);
            response.setMessage("Lấy danh sách mã giảm giá sắp diễn ra thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== STATISTICS ==========
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDiscountStatistics() {
        ApiResponse<Map<String, Object>> response = new ApiResponse<>();
        try {
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalDiscounts", discountService.count());
            statistics.put("activeDiscounts", discountService.countActiveDiscounts());
            statistics.put("inactiveDiscounts", discountService.countInactiveDiscounts());

            response.setResult(statistics);
            response.setMessage("Lấy thống kê mã giảm giá thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{id}/usage")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDiscountUsage(@PathVariable Long id) {
        ApiResponse<Map<String, Object>> response = new ApiResponse<>();
        try {
            Map<String, Object> usage = new HashMap<>();
            usage.put("totalUsage", discountService.getTotalUsageCount(id));
            usage.put("isActive", discountService.isDiscountActive(id));
            usage.put("isExpired", discountService.isDiscountExpired(id));
            usage.put("hasReachedLimit", discountService.hasReachedUsageLimit(id));

            response.setResult(usage);
            response.setMessage("Lấy thông tin sử dụng mã giảm giá thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @Autowired
    private IOrderService orderService;

    // ========== ORDER DISCOUNT MANAGEMENT ==========
    @PostMapping("/apply")
    @PreAuthorize("hasAuthority('discount.apply')")
    public ResponseEntity<ApiResponse<String>> applyDiscountToOrder(@Valid @RequestBody ApplyDiscountRequest request) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            orderService.applyDiscountToOrder(request.getOrderId(), request.getDiscountId());
            response.setResult("Áp dụng mã giảm giá thành công");
            response.setMessage("Mã giảm giá đã được áp dụng vào đơn hàng");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/remove/order/{orderId}/discount/{discountId}")
    @PreAuthorize("hasAuthority('discount.remove')")
    public ResponseEntity<ApiResponse<String>> removeDiscountFromOrder(
            @PathVariable Long orderId,
            @PathVariable Long discountId) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            orderService.removeDiscountFromOrder(orderId, discountId);
            response.setResult("Xóa mã giảm giá khỏi đơn hàng thành công");
            response.setMessage("Mã giảm giá đã được xóa khỏi đơn hàng");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== HELPER METHODS ==========
    private Pageable createSortedPageable(Pageable pageable, String sortBy, String sortDir) {
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;

        // Map sortBy to actual field names
        String actualSortBy = switch (sortBy.toLowerCase()) {
            case "name" -> "name";
            case "discountvalue" -> "discountValue";
            case "startdate" -> "startDate";
            case "enddate" -> "endDate";
            case "createdat" -> "createdAt";
            case "usedcount" -> "usedCount";
            default -> "createdAt";
        };

        Sort sort = Sort.by(direction, actualSortBy);
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }

}
