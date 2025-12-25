package vn.liora.controller.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.UserRepository;
import vn.liora.service.IOrderService;
import vn.liora.dto.request.GuestOrderAccessRequest;

@Controller
@RequestMapping("/user")
@RequiredArgsConstructor
@Slf4j
public class OrderDetailController {

    private final IOrderService orderService;
    private final UserRepository userRepository;

    // Các endpoint cụ thể phải đặt TRƯỚC endpoint có path variable
    @GetMapping("/order-detail/access")
    public String guestOrderAccessPage(Model model) {
        return "user/auth/guest-order-access";
    }

    @GetMapping("/order-detail-view")
    public String viewOrderDetailAuthenticated(@RequestParam(required = false) Long orderId,
            HttpServletRequest httpRequest, Model model) {
        try {
            // Lấy orderId từ parameter hoặc session
            if (orderId == null) {
                orderId = (Long) httpRequest.getSession().getAttribute("currentOrderId");
            }

            if (orderId == null) {
                return "error/404";
            }

            // Lấy token từ session
            String token = (String) httpRequest.getSession().getAttribute("authToken");
            if (token == null) {
                return "error/404";
            }

            // Xử lý tương tự như viewOrderDetail nhưng với token từ session
            return viewOrderDetailWithToken(orderId, token, httpRequest, model);

        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.ORDER_NOT_FOUND) {
                return "error/404";
            }
            log.error("Error in viewOrderDetailAuthenticated: {}", e.getMessage(), e);
            return "error/404";
        } catch (Exception e) {
            log.error("Error in viewOrderDetailAuthenticated: {}", e.getMessage(), e);
            return "error/404";
        }
    }

    @PostMapping("/order-detail/set-session")
    public ResponseEntity<String> setSessionOrderId(@RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        try {
            Long orderId = Long.valueOf(request.get("orderId").toString());
            String token = request.get("token") != null ? request.get("token").toString() : null;

            httpRequest.getSession().setAttribute("currentOrderId", orderId);
            if (token != null) {
                httpRequest.getSession().setAttribute("authToken", token);
            }
            return ResponseEntity.ok("Session set successfully");
        } catch (Exception e) {
            log.error("Error setting session: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error setting session");
        }
    }

    @PostMapping("/order-detail/access")
    public String handleGuestOrderAccess(@Valid @RequestBody GuestOrderAccessRequest request,
            HttpServletRequest httpRequest, Model model) {
        try {
            Long orderId = request.getOrderId();
            String guestEmail = request.getGuestEmail();

            log.info("Guest order access attempt - OrderId: {}, Email: {}", orderId, guestEmail);

            // Kiểm tra đơn hàng có tồn tại không
            var orderResponse = orderService.getOrderById(orderId);
            if (orderResponse == null) {
                log.warn("Order not found: {}", orderId);
                model.addAttribute("error", "Đơn hàng không tồn tại");
                return "user/auth/guest-order-access";
            }

            // Kiểm tra email có khớp với đơn hàng không
            if (!guestEmail.equalsIgnoreCase(orderResponse.getEmail())) {
                log.warn("Email mismatch - Provided: {}, Order: {}", guestEmail, orderResponse.getEmail());
                model.addAttribute("error", "Email không khớp với đơn hàng");
                return "user/auth/guest-order-access";
            }

            // Lưu thông tin guest vào session
            httpRequest.getSession().setAttribute("guestEmail", guestEmail);
            httpRequest.getSession().setAttribute("isGuest", true);
            httpRequest.getSession().setAttribute("guestOrderId", orderId);

            log.info("Guest order access granted for order: {}", orderId);

            // Redirect đến trang order detail
            return "redirect:/user/order-detail/" + orderId;

        } catch (Exception e) {
            log.error("Error in handleGuestOrderAccess: {}", e.getMessage(), e);
            model.addAttribute("error", "Có lỗi xảy ra khi truy cập đơn hàng");
            return "user/auth/guest-order-access";
        }
    }

    // Endpoint mới cho tra cứu đơn hàng công khai
    @PostMapping("/order-lookup")
    public ResponseEntity<?> lookupOrder(@RequestBody Map<String, Object> request) {
        try {
            Long orderId = Long.valueOf(request.get("orderId").toString());
            String email = request.get("email").toString();

            log.info("Order lookup request - OrderId: {}, Email: {}", orderId, email);

            // Kiểm tra đơn hàng có tồn tại không
            var orderResponse = orderService.getOrderById(orderId);
            if (orderResponse == null) {
                log.warn("Order not found: {}", orderId);
                return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy đơn hàng"));
            }

            // Kiểm tra email có khớp với đơn hàng không
            if (!email.equalsIgnoreCase(orderResponse.getEmail())) {
                log.warn("Email mismatch - Provided: {}, Order: {}", email, orderResponse.getEmail());
                return ResponseEntity.badRequest().body(Map.of("message", "Email không khớp với đơn hàng"));
            }

            log.info("Order lookup successful for order: {}", orderId);
            return ResponseEntity.ok(Map.of("message", "Tra cứu thành công", "orderId", orderId));

        } catch (Exception e) {
            log.error("Error in order lookup: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", "Có lỗi xảy ra khi tra cứu đơn hàng"));
        }
    }

    private String viewOrderDetailWithToken(Long orderId, String token, HttpServletRequest httpRequest, Model model) {
        try {
            // Xử lý token authentication tương tự như trong viewOrderDetail
            User user = null;

            // Tìm user từ token (tương tự như trong viewOrderDetail)
            if (token != null && !token.isEmpty()) {
                try {
                    // Giả sử có method để validate token và lấy user
                    // user = userService.findByToken(token);
                    // Tạm thời sử dụng logic cũ
                    user = findUserByPrincipal(SecurityContextHolder.getContext().getAuthentication());
                } catch (Exception e) {
                    log.error("Error authenticating with token: {}", e.getMessage());
                }
            }

            if (user == null) {
                log.warn("No user found for token authentication");
                return "error/404";
            }

            // Lấy thông tin đơn hàng
            var orderResponse = orderService.getOrderById(orderId);
            if (orderResponse == null || !orderResponse.getUserId().equals(user.getUserId())) {
                log.warn("Order not found or not owned by user: {}", orderId);
                return "error/404";
            }

            // Lấy danh sách sản phẩm trong đơn hàng
            var orderProducts = orderService.getProductsByOrderId(orderId);

            // Thêm thông tin vào model
            model.addAttribute("order", orderResponse);
            model.addAttribute("orderProducts", orderProducts);
            model.addAttribute("user", user);
            model.addAttribute("isGuest", false); // User đã đăng nhập

            return "user/order/order-detail";

        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.ORDER_NOT_FOUND) {
                return "error/404";
            }
            log.error("Error in viewOrderDetailWithToken: {}", e.getMessage(), e);
            return "error/404";
        } catch (Exception e) {
            log.error("Error in viewOrderDetailWithToken: {}", e.getMessage(), e);
            return "error/404";
        }
    }

    // Endpoint có path variable phải đặt CUỐI CÙNG
    @GetMapping("/order-detail/{orderId}")
    public String viewOrderDetail(@PathVariable Long orderId, @RequestParam(required = false) String token,
            @RequestParam(required = false) String guestEmail, HttpServletRequest httpRequest, Model model) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = null;

            // 1. Kiểm tra nếu là user đã đăng nhập
            if (authentication != null && authentication.isAuthenticated()
                    && !"anonymousUser".equals(authentication.getName())) {
                user = findUserByPrincipal(authentication);
            }

            // 2. Nếu có token, thử xác thực với token
            if (user == null && token != null && !token.isEmpty()) {
                try {
                    org.springframework.security.authentication.UsernamePasswordAuthenticationToken authToken = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            token, null, null);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    user = findUserByPrincipal(authToken);
                } catch (Exception e) {
                    log.error("Error authenticating with token: {}", e.getMessage());
                }
            }

            // 3. Nếu vẫn chưa có user, kiểm tra guest access
            if (user == null) {
                // Kiểm tra session trước
                String sessionGuestEmail = (String) httpRequest.getSession().getAttribute("guestEmail");
                Boolean sessionIsGuest = (Boolean) httpRequest.getSession().getAttribute("isGuest");
                Long sessionGuestOrderId = (Long) httpRequest.getSession().getAttribute("guestOrderId");

                if (sessionIsGuest != null && sessionIsGuest && sessionGuestEmail != null &&
                        sessionGuestOrderId != null && sessionGuestOrderId.equals(orderId)) {
                    log.info("Guest access from session - OrderId: {}, Email: {}", orderId, sessionGuestEmail);
                    return handleGuestOrderAccess(orderId, sessionGuestEmail, model);
                }

                // Fallback: kiểm tra parameter (cho backward compatibility)
                if (guestEmail != null && !guestEmail.isEmpty()) {
                    log.info("Guest access from parameter - OrderId: {}, Email: {}", orderId, guestEmail);
                    return handleGuestOrderAccess(orderId, guestEmail, model);
                }

                // Không có thông tin xác thực
                log.warn("No authentication found for order: {}", orderId);
                return "error/404";
            }

            // Tiếp tục xử lý với user đã xác thực (user đã được xác định ở trên)

            var orderResponse = orderService.getOrderById(orderId);

            // Kiểm tra xem đơn hàng có thuộc về user này không
            if (orderResponse == null || !orderResponse.getUserId().equals(user.getUserId())) {
                model.addAttribute("error", "Đơn hàng không tồn tại hoặc không thuộc về bạn");
                return "error/404";
            }

            // Lấy danh sách sản phẩm trong đơn hàng
            var orderProducts = orderService.getProductsByOrderId(orderId);

            model.addAttribute("order", orderResponse);
            model.addAttribute("orderProducts", orderProducts);
            model.addAttribute("user", user);
            model.addAttribute("isGuest", false); // User đã đăng nhập

            return "user/order/order-detail";

        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.ORDER_NOT_FOUND) {
                return "error/404";
            }
            log.error("Error in viewOrderDetail: {}", e.getMessage(), e);
            model.addAttribute("error", "Không thể tải chi tiết đơn hàng");
            return "error/404";
        } catch (Exception e) {
            log.error("Error in viewOrderDetail: {}", e.getMessage(), e);
            model.addAttribute("error", "Không thể tải chi tiết đơn hàng");
            return "error/404";
        }
    }

    /**
     * Tìm user từ authentication, hỗ trợ cả JWT và OAuth2
     */
    private User findUserByPrincipal(Authentication authentication) {
        String principalName = authentication.getName();

        // 1. Nếu là OAuth2 user, lấy user từ CustomOAuth2User trước
        if (authentication.getPrincipal() instanceof vn.liora.dto.CustomOAuth2User) {
            vn.liora.dto.CustomOAuth2User customOAuth2User = (vn.liora.dto.CustomOAuth2User) authentication
                    .getPrincipal();
            return customOAuth2User.getUser();
        }

        // 2. Nếu là OAuth2User thông thường, thử tìm bằng email từ attributes
        if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
            org.springframework.security.oauth2.core.user.OAuth2User oauth2User = (org.springframework.security.oauth2.core.user.OAuth2User) authentication
                    .getPrincipal();

            // Lấy email từ OAuth2User attributes
            String email = oauth2User.getAttribute("email");

            if (email != null) {
                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    return user;
                }
            }
        }

        // 3. Thử tìm bằng username
        User user = userRepository.findByUsername(principalName).orElse(null);
        if (user != null) {
            return user;
        }

        // 4. Thử tìm bằng email nếu principal name chứa @
        if (principalName != null && principalName.contains("@")) {
            user = userRepository.findByEmail(principalName).orElse(null);
            if (user != null) {
                return user;
            }
        }

        return null;
    }

    /**
     * Xử lý truy cập đơn hàng cho guest
     */
    private String handleGuestOrderAccess(Long orderId, String guestEmail, Model model) {
        try {
            // Lấy thông tin đơn hàng
            var orderResponse = orderService.getOrderById(orderId);
            if (orderResponse == null) {
                model.addAttribute("error", "Đơn hàng không tồn tại");
                return "error/404";
            }

            // Kiểm tra email có khớp với đơn hàng không
            if (!guestEmail.equalsIgnoreCase(orderResponse.getEmail())) {
                model.addAttribute("error", "Bạn không có quyền xem đơn hàng này");
                return "error/404";
            }

            // Lấy danh sách sản phẩm trong đơn hàng
            var orderProducts = orderService.getProductsByOrderId(orderId);

            // Tạo user giả cho guest để hiển thị
            User guestUser = new User();
            guestUser.setUserId(0L);
            guestUser.setUsername("Guest");
            guestUser.setEmail(guestEmail);
            guestUser.setFirstname("Khách");
            guestUser.setLastname("Hàng");

            model.addAttribute("order", orderResponse);
            model.addAttribute("orderProducts", orderProducts);
            model.addAttribute("user", guestUser);
            model.addAttribute("isGuest", true);

            return "user/order/order-detail";

        } catch (Exception e) {
            log.error("Error in handleGuestOrderAccess: {}", e.getMessage(), e);
            model.addAttribute("error", "Không thể tải chi tiết đơn hàng");
            return "error/404";
        }
    }

}