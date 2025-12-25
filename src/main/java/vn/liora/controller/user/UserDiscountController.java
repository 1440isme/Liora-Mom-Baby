package vn.liora.controller.user;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
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
import vn.liora.service.impl.DiscountServiceImpl;
import vn.liora.service.impl.OrderServiceImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/discounts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserDiscountController {

    private final IDiscountService discountService;
    private final DiscountMapper discountMapper;
    private final vn.liora.repository.UserRepository userRepository;

    // ========== PUBLIC DISCOUNT ACCESS ==========
    @GetMapping
    public ResponseEntity<ApiResponse<List<DiscountResponse>>> getAvailableDiscounts() {
        ApiResponse<List<DiscountResponse>> response = new ApiResponse<>();
        try {
            List<Discount> discounts = discountService.findAvailableDiscounts();
            List<DiscountResponse> discountResponses = discounts.stream()
                    .map(discountMapper::toDiscountResponse)
                    .toList();
            response.setResult(discountResponses);
            response.setMessage("Lấy danh sách mã giảm giá khả dụng thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<DiscountResponse>>> searchAvailableDiscounts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) BigDecimal orderTotal) {
        ApiResponse<List<DiscountResponse>> response = new ApiResponse<>();
        try {
            List<Discount> discounts;

            if (name != null && !name.trim().isEmpty()) {
                // Tìm kiếm theo tên trong danh sách available
                List<Discount> allAvailable = discountService.findAvailableDiscounts();
                discounts = allAvailable.stream()
                        .filter(discount -> discount.getName().toLowerCase().contains(name.toLowerCase()))
                        .toList();
            } else {
                discounts = discountService.findAvailableDiscounts();
            }

            // Lọc theo order total nếu có
            if (orderTotal != null && orderTotal.compareTo(BigDecimal.ZERO) > 0) {
                discounts = discountService.findAvailableDiscountsForOrder(orderTotal);
            }

            List<DiscountResponse> discountResponses = discounts.stream()
                    .map(discountMapper::toDiscountResponse)
                    .toList();
            response.setResult(discountResponses);
            response.setMessage("Tìm kiếm mã giảm giá thành công");
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

            // Kiểm tra xem discount có available không
            if (!discountService.isDiscountActive(id)) {
                response.setCode(400);
                response.setMessage("Mã giảm giá không khả dụng");
                return ResponseEntity.badRequest().body(response);
            }

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

    // ========== DISCOUNT CALCULATION ==========
    @GetMapping("/{id}/calculate/{orderTotal}")
    public ResponseEntity<ApiResponse<BigDecimal>> calculateDiscountAmount(
            @PathVariable Long id,
            @PathVariable BigDecimal orderTotal) {
        ApiResponse<BigDecimal> response = new ApiResponse<>();
        try {
            BigDecimal discountAmount = discountService.calculateDiscountAmount(id, orderTotal);
            response.setResult(discountAmount);
            response.setMessage("Tính toán mã giảm giá thành công");
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

    @GetMapping("/{id}/can-apply/user/{userId}/order-total/{orderTotal}")
    public ResponseEntity<ApiResponse<Boolean>> canApplyDiscount(
            @PathVariable Long id,
            @PathVariable Long userId,
            @PathVariable BigDecimal orderTotal) {
        ApiResponse<Boolean> response = new ApiResponse<>();
        try {
            boolean canApply = discountService.canApplyDiscount(id, userId, orderTotal);
            response.setResult(canApply);
            response.setMessage(canApply ? "Có thể áp dụng mã giảm giá" : "Không thể áp dụng mã giảm giá");
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

    @GetMapping("/available/order-total/{orderTotal}")
    public ResponseEntity<ApiResponse<List<DiscountResponse>>> getAvailableDiscountsForOrder(
            @PathVariable BigDecimal orderTotal) {
        ApiResponse<List<DiscountResponse>> response = new ApiResponse<>();
        try {
            List<Discount> discounts = discountService.findAvailableDiscountsForOrder(orderTotal);
            List<DiscountResponse> discountResponses = discounts.stream()
                    .map(discountMapper::toDiscountResponse)
                    .toList();
            response.setResult(discountResponses);
            response.setMessage("Lấy danh sách mã giảm giá phù hợp với đơn hàng thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    IOrderService orderService;
    // ========== ORDER DISCOUNT MANAGEMENT ==========
    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<Map<String, Object>>> applyDiscountByCode(@RequestBody ApplyDiscountRequest request) {
        // Kiểm tra authentication
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            ApiResponse<Map<String, Object>> response = new ApiResponse<>();
            response.setCode(400);
            response.setMessage("Chỉ dùng mã giảm giá khi đã đăng nhập");
            return ResponseEntity.badRequest().body(response);
        }
        ApiResponse<Map<String, Object>> response = new ApiResponse<>();
        try {
            // Tìm discount theo code (name)
            Discount discount = discountService.findAvailableDiscountByCode(request.getDiscountCode());

            if (discount == null) {
                response.setCode(400);
                response.setMessage("Mã giảm giá không hợp lệ hoặc đã hết hạn");
                return ResponseEntity.badRequest().body(response);
            }

            // ✅ THÊM: Kiểm tra điều kiện áp dụng
            if (request.getOrderTotal() == null || request.getOrderTotal().compareTo(discount.getMinOrderValue()) < 0) {
                response.setCode(400);
                response.setMessage(String.format("Đơn hàng phải có giá trị tối thiểu %s để áp dụng mã này",
                        discount.getMinOrderValue()));
                return ResponseEntity.badRequest().body(response);
            }

            // ✅ Kiểm tra per-user và các điều kiện có thể áp dụng
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Long userId = null;
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
                userId = userRepository.findByUsername(authentication.getName())
                        .map(u -> u.getUserId())
                        .orElse(null);
            }

            // Kiểm tra điều kiện áp dụng mã giảm giá
            if (userId != null) {
                // Kiểm tra mã còn hiệu lực không
                if (!discountService.isDiscountActive(discount.getDiscountId())) {
                    response.setCode(400);
                    response.setMessage("Mã giảm giá này đã hết hạn hoặc chưa đến thời gian sử dụng.");
                    return ResponseEntity.badRequest().body(response);
                }
                
                // Kiểm tra tổng lượt sử dụng của mã
                if (discountService.hasReachedUsageLimit(discount.getDiscountId())) {
                    response.setCode(400);
                    response.setMessage("Mã giảm giá này đã hết lượt sử dụng.");
                    return ResponseEntity.badRequest().body(response);
                }

                // Kiểm tra lượt sử dụng của user
                if (discountService.hasReachedUserUsageLimit(discount.getDiscountId(), userId)) {
                    response.setCode(400);
                    response.setMessage("Bạn đã hết lượt dùng mã giảm giá này.");
                    return ResponseEntity.badRequest().body(response);
                }
            }

            // Tính số tiền giảm giá
            BigDecimal discountAmount = discountService.calculateDiscountAmount(discount.getDiscountId(), request.getOrderTotal());

            Map<String, Object> result = new HashMap<>();
            result.put("discountId", discount.getDiscountId());
            result.put("discountCode", discount.getName());
            result.put("discountAmount", discountAmount);
            result.put("discountValue", discount.getDiscountValue());
            result.put("message", "Áp dụng mã giảm giá thành công");

            response.setResult(result);
            response.setMessage("Áp dụng mã giảm giá thành công");
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

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<List<DiscountResponse>>> getDiscountsByOrder(@PathVariable Long orderId) {
        ApiResponse<List<DiscountResponse>> response = new ApiResponse<>();
        try {
            List<Discount> discounts = discountService.getDiscountsByOrder(orderId);
            List<DiscountResponse> discountResponses = discounts.stream()
                    .map(discountMapper::toDiscountResponse)
                    .toList();
            response.setResult(discountResponses);
            response.setMessage("Lấy mã giảm giá của đơn hàng thành công");
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
}
