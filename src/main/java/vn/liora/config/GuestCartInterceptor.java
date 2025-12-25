package vn.liora.config;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import java.util.Arrays;
import java.util.UUID;

@Component
public class GuestCartInterceptor implements HandlerInterceptor {
    public static final String GUEST_CART_ID_COOKIE_NAME = "guest_cart_id";
    private static final int MAX_AGE = 7 * 24 * 60 * 60; // 1 tuần

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        Cookie[] cookies = request.getCookies();
        boolean hasGuestCartId = false;

        if (cookies != null) {
            hasGuestCartId = Arrays.stream(cookies)
                    .anyMatch(cookie -> GUEST_CART_ID_COOKIE_NAME.equals(cookie.getName()));
        }

        // Nếu không tìm thấy cookie, tạo mới và gửi về client
        if (!hasGuestCartId) {
            String guestCartId = UUID.randomUUID().toString();
            Cookie cookie = new Cookie(GUEST_CART_ID_COOKIE_NAME, guestCartId);
            cookie.setPath("/"); // Áp dụng cho toàn bộ domain
            cookie.setMaxAge(MAX_AGE); // Thời gian sống 1 tuần
            // cookie.setHttpOnly(true); // Tăng bảo mật
            response.addCookie(cookie);
        }

        return true; // Tiếp tục xử lý request
    }

}
