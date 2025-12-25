package vn.liora.controller.user;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import vn.liora.config.GuestCartInterceptor;
import vn.liora.dto.response.CartProductResponse;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.UserRepository;
import vn.liora.service.ICartProductService;
import vn.liora.service.ICartService;

import java.util.List;

@Controller
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CartController {

    final ICartService cartService;
    final ICartProductService cartProductService;
    final UserRepository userRepository;

    @GetMapping("/cart")
    public String viewCart() {
        return "user/cart/view-cart";
    }

    /**
     * Test endpoint để kiểm tra authentication
     */
    @GetMapping("/cart/api/test")
    @ResponseBody
    public ResponseEntity<?> testAuth() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            return ResponseEntity.ok().body(new Object() {
                public final String auth = authentication != null ? authentication.toString() : "null";
                public final boolean isAuthenticated = authentication != null && authentication.isAuthenticated();
                public final String name = authentication != null ? authentication.getName() : "null";
            });
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    /**
     * API để lấy thông tin giỏ hàng của user hiện tại
     */
    @GetMapping("/cart/api/current")
    @ResponseBody
    public ResponseEntity<?> getCurrentUserCart(
            @CookieValue(name = GuestCartInterceptor.GUEST_CART_ID_COOKIE_NAME, required = false) String guestCartId,
            HttpServletResponse response) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isGuest = (authentication == null)
                    || !authentication.isAuthenticated()
                    || "anonymousUser".equals(String.valueOf(authentication.getPrincipal()));

            Long userId = null;
            if (!isGuest) {
                String principalName = authentication.getName();
                User user = userRepository.findByUsername(principalName)
                        .orElseGet(() -> {
                            // Fallback: một số provider trả email làm name
                            if (principalName != null && principalName.contains("@")) {
                                return userRepository.findByEmail(principalName).orElse(null);
                            }
                            return null;
                        });
                if (user == null) {
                    throw new AppException(ErrorCode.USER_NOT_FOUND);
                }
                userId = user.getUserId();
            }

            // Nếu là khách và chưa có guestCartId (request đầu tiên), tạo ngay cookie để
            // dùng
            if (isGuest && guestCartId == null) {
                String newGuestId = java.util.UUID.randomUUID().toString();
                jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie(
                        GuestCartInterceptor.GUEST_CART_ID_COOKIE_NAME, newGuestId);
                cookie.setPath("/");
                cookie.setMaxAge(7 * 24 * 60 * 60);
                response.addCookie(cookie);
                guestCartId = newGuestId;
            }

            var cartResponse = cartService.getCart(guestCartId, userId);

            // Nếu đã đăng nhập và có guestCartId thì đã merge -> xóa cookie guest trên
            // client
            if (userId != null && guestCartId != null) {
                Cookie clear = new Cookie(
                        GuestCartInterceptor.GUEST_CART_ID_COOKIE_NAME, "");
                clear.setPath("/");
                clear.setMaxAge(0);
                response.addCookie(clear);
            }

            return ResponseEntity.ok().body(java.util.Map.of(
                    "cartId", cartResponse.getIdCart(),
                    "message", "Cart found"));

        } catch (AppException e) {
            log.error("Error getting current user cart: ", e);
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error getting current user cart: ", e);
            return ResponseEntity.status(500).body("Unable to get cart information: " + e.getMessage());
        }
    }

    /**
     * API để lấy danh sách sản phẩm trong giỏ hàng
     */
    @GetMapping("/cart/api/{cartId}/items")
    @ResponseBody
    public ResponseEntity<List<CartProductResponse>> getCartItems(@PathVariable Long cartId) {
        try {
            List<CartProductResponse> cartItems = cartProductService.getAllProductsInCart(cartId);
            return ResponseEntity.ok(cartItems);
        } catch (Exception e) {
            log.error("Error getting cart items: ", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * API để lấy số lượng sản phẩm trong giỏ hàng (cho header)
     */
    @GetMapping("/cart/api/{cartId}/count")
    @ResponseBody
    public ResponseEntity<Integer> getCartItemCount(@PathVariable Long cartId) {
        try {
            int count = cartProductService.getCartItemCount(cartId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Error getting cart item count: ", e);
            return ResponseEntity.ok(0);
        }
    }

    /**
     * API để lấy tổng giá trị giỏ hàng
     */
    @GetMapping("/cart/api/{cartId}/total")
    @ResponseBody
    public ResponseEntity<Double> getCartTotal(@PathVariable Long cartId) {
        try {
            double total = cartProductService.getCartTotal(cartId);
            return ResponseEntity.ok(total);
        } catch (Exception e) {
            log.error("Error getting cart total: ", e);
            return ResponseEntity.ok(0.0);
        }
    }
}
