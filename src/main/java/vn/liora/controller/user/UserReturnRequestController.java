package vn.liora.controller.user;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.liora.dto.request.ReturnRequestCreateRequest;
import vn.liora.dto.response.ReturnRequestResponse;
import vn.liora.service.IReturnRequestService;
import vn.liora.service.IImageOptimizationService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserReturnRequestController {

    IReturnRequestService returnRequestService;
    vn.liora.repository.UserRepository userRepository;
    IImageOptimizationService imageOptimizationService;

    /**
     * Tạo yêu cầu trả hàng mới
     */
    @PostMapping("/{orderId}/return")
    public ResponseEntity<ReturnRequestResponse> createReturnRequest(
            @PathVariable Long orderId,
            @Valid @RequestBody ReturnRequestCreateRequest request) {

        // Lấy user ID từ authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        // Tìm user để lấy ID
        Long userId = userRepository.findByUsername(username)
                .map(vn.liora.entity.User::getUserId)
                .orElse(null);

        if (userId == null) {
            log.warn("User not found for username: {}", username);
        }

        // Set orderId từ path variable
        request.setOrderId(orderId);

        // Gọi service với userId thực
        ReturnRequestResponse response = returnRequestService.createReturnRequest(request, userId);

        log.info("User {} (ID: {}) created return request for order {}", username, userId, orderId);
        return ResponseEntity.ok(response);
    }

    /**
     * Upload ảnh minh chứng cho yêu cầu trả hàng
     */
    @PostMapping("/return/upload-image")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> uploadReturnRequestImage(
            @RequestParam("upload") MultipartFile file) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Validate file
            if (file.isEmpty()) {
                response.put("error", Map.of("message", "File không được để trống"));
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file type - only images
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.put("error", Map.of("message", "Chỉ được upload file ảnh"));
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file size (5MB max)
            if (file.getSize() > 5 * 1024 * 1024) {
                response.put("error", Map.of("message", "Kích thước file không được vượt quá 5MB"));
                return ResponseEntity.badRequest().body(response);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String uniqueFilename = UUID.randomUUID().toString() + extension;

            // Create directory structure: uploads/returns/YYYY/MM/DD/
            LocalDateTime now = LocalDateTime.now();
            String year = String.valueOf(now.getYear());
            String month = String.format("%02d", now.getMonthValue());
            String day = String.format("%02d", now.getDayOfMonth());

            Path returnDir = Paths.get("uploads", "returns", year, month, day);
            Files.createDirectories(returnDir);

            // Save file with optimization
            Path filePath = returnDir.resolve(uniqueFilename);

            try {
                // Optimize image (max 800px width, 85% quality)
                imageOptimizationService.optimizeImage(file, filePath, 800, 800, 0.85f);
            } catch (Exception e) {
                // Fallback to normal save if optimization fails
                Files.copy(file.getInputStream(), filePath);
            }

            // Generate URL
            String fileUrl = "/uploads/returns/" + year + "/" + month + "/" + day + "/" + uniqueFilename;

            // CKEditor expects specific format
            response.put("url", fileUrl);
            response.put("uploaded", true);

            log.info("Return request image uploaded successfully: {}", fileUrl);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Error uploading return request image", e);
            response.put("error", Map.of("message", "Lỗi khi upload file: " + e.getMessage()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            log.error("Unexpected error uploading return request image", e);
            response.put("error", Map.of("message", "Lỗi không xác định: " + e.getMessage()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
