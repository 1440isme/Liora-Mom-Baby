package vn.liora.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {

        String requestURI = request.getRequestURI();
        String acceptHeader = request.getHeader("Accept");

        // Check if it's an API request
        boolean isApiRequest = requestURI.startsWith("/api/")
                || requestURI.startsWith("/admin/api/")
                || (acceptHeader != null && acceptHeader.contains("application/json"));

        if (isApiRequest) {
            // Return JSON for API requests
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"code\":401,\"message\":\"Bạn cần đăng nhập để thực hiện thao tác này\",\"result\":\"Unauthorized\"}");
        } else {
            // Redirect to home page for web requests
            response.sendRedirect("/home");
        }
    }
}
