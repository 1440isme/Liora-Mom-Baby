package vn.liora.controller.user;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.OrderCreationRequest;
import vn.liora.dto.response.OrderResponse;
import vn.liora.entity.User;
import vn.liora.repository.UserRepository;
import vn.liora.service.IOrderService;

import java.util.List;

@RestController
@RequestMapping("/order")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserOrderController {

    IOrderService orderService;
    UserRepository userRepository;

    // ✅ 1. Tạo đơn hàng mới (cho cả user và guest)
    @PostMapping("/{idCart}")
    public ResponseEntity<OrderResponse> createOrder(
            @PathVariable Long idCart,
            @Valid @RequestBody OrderCreationRequest request) {
        OrderResponse response = orderService.createOrder(idCart, request);
        return ResponseEntity.ok(response);
    }

    // ✅ 3. Xem chi tiết đơn hàng của chính người dùng
    @GetMapping("/{userId}/{idOrder}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long userId, @PathVariable Long idOrder) {
        OrderResponse response = orderService.getOrderById(idOrder);
        return ResponseEntity.ok(response);
    }

    // ✅ 4. Lấy danh sách đơn hàng của người dùng hiện tại
    @GetMapping("/{userId}")
    public ResponseEntity<List<OrderResponse>> getMyOrders(@PathVariable Long userId) {
        List<OrderResponse> response = orderService.getMyOrders(userId);
        return ResponseEntity.ok(response);
    }

    // ✅ 5. Hủy đơn hàng
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long orderId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            orderService.cancelOrderByUser(orderId, user.getUserId());
            return ResponseEntity.ok().body("Order cancelled successfully");
        } catch (Exception e) {
            log.error("Error cancelling order: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Cannot cancel order: " + e.getMessage());
        }
    }
}
