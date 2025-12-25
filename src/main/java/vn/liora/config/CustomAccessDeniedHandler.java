package vn.liora.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException, ServletException {

        String requestURI = request.getRequestURI();
        String acceptHeader = request.getHeader("Accept");

        // Check if it's an API request
        boolean isApiRequest = requestURI.startsWith("/api/")
                || requestURI.startsWith("/admin/api/")
                || (acceptHeader != null && acceptHeader.contains("application/json"));

        if (isApiRequest) {
            // Return JSON for API requests
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"code\":403,\"message\":\"Bạn không có quyền thực hiện thao tác này\",\"result\":\"Access Denied\"}");
        } else {
            // Forward to 403 page for web requests
            request.getRequestDispatcher("/403").forward(request, response);
        }
    }
}
