package vn.liora.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import vn.liora.dto.request.ApiResponse;

/**
 * Global Exception Handler
 * Xử lý các exception toàn cục trong ứng dụng
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Xử lý lỗi Access Denied (403 Forbidden)
     * Chỉ xử lý khi CustomAccessDeniedHandler không xử lý được
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<String>> handleAccessDenied(AccessDeniedException ex,
            jakarta.servlet.http.HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        String acceptHeader = request.getHeader("Accept");

        // Check if it's an API request
        boolean isApiRequest = requestURI.startsWith("/api/")
                || requestURI.startsWith("/admin/api/")
                || (acceptHeader != null && acceptHeader.contains("application/json"));

        if (isApiRequest) {
            // Return JSON for API requests
            ApiResponse<String> response = ApiResponse.<String>builder()
                    .code(403)
                    .message("Bạn không có quyền thực hiện thao tác này")
                    .result("Access Denied")
                    .build();
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } else {
            // For web requests, redirect to 403 page
            // This will be handled by ErrorController
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", "/403")
                    .build();
        }
    }

    /**
     * Xử lý lỗi AppException
     */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<String>> handleAppException(AppException ex) {
        ApiResponse<String> response = ApiResponse.<String>builder()
                .code(ex.getErrorCode().getCode())
                .message(ex.getMessage())
                .result("Error")
                .build();

        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (ex.getErrorCode() == ErrorCode.INVALID_KEY) {
            status = HttpStatus.BAD_REQUEST;
        } else if (ex.getErrorCode() == ErrorCode.USER_NOT_FOUND) {
            status = HttpStatus.NOT_FOUND;
        }

        return ResponseEntity.status(status).body(response);
    }

    /**
     * Xử lý lỗi IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<String>> handleIllegalArgument(IllegalArgumentException ex) {
        ApiResponse<String> response = ApiResponse.<String>builder()
                .code(400)
                .message("Dữ liệu không hợp lệ: " + ex.getMessage())
                .result("Bad Request")
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Xử lý lỗi RuntimeException
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<String>> handleRuntimeException(RuntimeException ex) {
        ApiResponse<String> response = ApiResponse.<String>builder()
                .code(500)
                .message("Lỗi hệ thống: " + ex.getMessage())
                .result("Internal Server Error")
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    /**
     * Xử lý lỗi Exception chung
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleException(Exception ex) {
        ApiResponse<String> response = ApiResponse.<String>builder()
                .code(500)
                .message("Đã xảy ra lỗi không xác định")
                .result("Internal Server Error")
                .build();

        // Log error for debugging
        System.err.println("Unexpected error: " + ex.getMessage());
        ex.printStackTrace();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}