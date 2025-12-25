package vn.liora.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/uploads")
public class ImageController {

    @Value("${storage.location}")
    private String storageLocation;

    @GetMapping("/**")
    public ResponseEntity<Resource> getImage(jakarta.servlet.http.HttpServletRequest request) {
        try {
            // Lấy đường dẫn ảnh từ request
            String imagePath = request.getRequestURI().replace("/uploads/", "");
            String fullPath = storageLocation + "/" + imagePath;

            System.out.println("=== ImageController.getImage ===");
            System.out.println("Request URI: " + request.getRequestURI());
            System.out.println("Image path: " + imagePath);
            System.out.println("Full path: " + fullPath);

            Path filePath = Paths.get(fullPath);
            File file = filePath.toFile();

            if (!file.exists() || !file.isFile()) {
                System.out.println("File not found: " + fullPath);
                // Trả về ảnh default nếu không tìm thấy
                Resource defaultResource = new FileSystemResource(
                        "src/main/resources/static/user/img/default-product.jpg");
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(defaultResource);
            }

            System.out.println("File found: " + file.getAbsolutePath() + " (size: " + file.length() + ")");

            // Xác định content type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            Resource resource = new FileSystemResource(file);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                    .body(resource);

        } catch (Exception e) {
            System.err.println("Error serving image: " + e.getMessage());
            e.printStackTrace();
            // Trả về ảnh default nếu có lỗi
            try {
                Resource defaultResource = new FileSystemResource(
                        "src/main/resources/static/user/img/default-product.jpg");
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(defaultResource);
            } catch (Exception ex) {
                return ResponseEntity.notFound().build();
            }
        }
    }
}
