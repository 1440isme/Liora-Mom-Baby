package vn.liora.controller.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.liora.service.IStorageService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/api/upload")
@PreAuthorize("hasAuthority('banner.create')")
public class FileUploadController {

    @Autowired
    private IStorageService storageService;

    @PostMapping("/banner")
    public ResponseEntity<Map<String, Object>> uploadBannerImage(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Validate file
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "File không được để trống");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.put("success", false);
                response.put("message", "Chỉ được upload file ảnh");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file size (5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                response.put("success", false);
                response.put("message", "Kích thước file không được vượt quá 5MB");
                return ResponseEntity.badRequest().body(response);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String uniqueFilename = UUID.randomUUID().toString() + extension;

            // Create directory structure: uploads/banners/YYYY/MM/DD/
            LocalDateTime now = LocalDateTime.now();
            String year = String.valueOf(now.getYear());
            String month = String.format("%02d", now.getMonthValue());
            String day = String.format("%02d", now.getDayOfMonth());

            Path bannerDir = Paths.get(storageService.getStorageLocation(), "banners", year, month, day);
            Files.createDirectories(bannerDir);

            // Save file
            Path filePath = bannerDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath);

            // Generate URL
            String fileUrl = "/uploads/banners/" + year + "/" + month + "/" + day + "/" + uniqueFilename;

            response.put("success", true);
            response.put("message", "Upload thành công");
            response.put("url", fileUrl);
            response.put("filename", uniqueFilename);
            response.put("originalName", originalFilename);
            response.put("size", file.getSize());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Lỗi khi upload file: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi không xác định: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/image")
    public ResponseEntity<Map<String, Object>> uploadImage(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Validate file
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "File không được để trống");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.put("success", false);
                response.put("message", "Chỉ được upload file ảnh");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file size (10MB for general images)
            if (file.getSize() > 10 * 1024 * 1024) {
                response.put("success", false);
                response.put("message", "Kích thước file không được vượt quá 10MB");
                return ResponseEntity.badRequest().body(response);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String uniqueFilename = UUID.randomUUID().toString() + extension;

            // Create directory structure: uploads/images/YYYY/MM/DD/
            LocalDateTime now = LocalDateTime.now();
            String year = String.valueOf(now.getYear());
            String month = String.format("%02d", now.getMonthValue());
            String day = String.format("%02d", now.getDayOfMonth());

            Path imageDir = Paths.get(storageService.getStorageLocation(), "images", year, month, day);
            Files.createDirectories(imageDir);

            // Save file
            Path filePath = imageDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath);

            // Generate URL
            String fileUrl = "/uploads/images/" + year + "/" + month + "/" + day + "/" + uniqueFilename;

            response.put("success", true);
            response.put("message", "Upload thành công");
            response.put("url", fileUrl);
            response.put("filename", uniqueFilename);
            response.put("originalName", originalFilename);
            response.put("size", file.getSize());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Lỗi khi upload file: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi không xác định: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/file")
    @PreAuthorize("hasAuthority('banner.delete')")
    public ResponseEntity<Map<String, Object>> deleteFile(@RequestParam("url") String fileUrl) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Remove leading slash and convert to file path
            String filePath = fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
            Path path = Paths.get(storageService.getStorageLocation(), filePath);

            if (Files.exists(path)) {
                Files.delete(path);
                response.put("success", true);
                response.put("message", "Xóa file thành công");
            } else {
                response.put("success", false);
                response.put("message", "File không tồn tại");
            }

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Lỗi khi xóa file: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi không xác định: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
