package vn.liora.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.liora.entity.Image;
import vn.liora.repository.ImageRepository;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/debug")
@RequiredArgsConstructor
public class DebugController {

    private final ImageRepository imageRepository;

    @Value("${storage.location}")
    private String storageLocation;

    @GetMapping("/images/check")
    public ResponseEntity<Map<String, Object>> checkImages() {
        Map<String, Object> result = new HashMap<>();

        try {
            // Lấy một vài ảnh từ database
            List<Image> images = imageRepository.findAll().stream().limit(5).toList();

            result.put("totalImages", imageRepository.count());
            result.put("sampleImages", images.stream().map(img -> {
                Map<String, Object> imgInfo = new HashMap<>();
                imgInfo.put("id", img.getImageId());
                imgInfo.put("url", img.getImageUrl());
                imgInfo.put("productId", img.getProduct() != null ? img.getProduct().getProductId() : null);

                // Kiểm tra file có tồn tại không
                String filePath = storageLocation + img.getImageUrl().replace("/uploads/", "/");
                Path path = Paths.get(filePath);
                File file = path.toFile();

                imgInfo.put("filePath", filePath);
                imgInfo.put("fileExists", file.exists());
                imgInfo.put("fileReadable", file.canRead());
                imgInfo.put("fileSize", file.exists() ? file.length() : 0);

                return imgInfo;
            }).toList());

            // Kiểm tra thư mục storage
            Path storagePath = Paths.get(storageLocation);
            result.put("storageLocation", storageLocation);
            result.put("storageExists", Files.exists(storagePath));
            result.put("storageReadable", Files.isReadable(storagePath));

            // Liệt kê các thư mục con
            if (Files.exists(storagePath)) {
                result.put("subdirectories", Files.list(storagePath)
                        .filter(Files::isDirectory)
                        .map(Path::getFileName)
                        .map(Path::toString)
                        .toList());
            }

            result.put("status", "success");
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", e.getMessage());
            result.put("stackTrace", e.getStackTrace());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }

    @GetMapping("/images/test/{imageId}")
    public ResponseEntity<Map<String, Object>> testImage(@PathVariable Long imageId) {
        Map<String, Object> result = new HashMap<>();

        try {
            Image image = imageRepository.findById(imageId).orElse(null);
            if (image == null) {
                result.put("status", "error");
                result.put("message", "Image not found");
                return ResponseEntity.notFound().build();
            }

            String filePath = storageLocation + image.getImageUrl().replace("/uploads/", "/");
            Path path = Paths.get(filePath);

            result.put("imageId", imageId);
            result.put("imageUrl", image.getImageUrl());
            result.put("filePath", filePath);
            result.put("fileExists", Files.exists(path));
            result.put("fileReadable", Files.isReadable(path));

            if (Files.exists(path)) {
                result.put("fileSize", Files.size(path));
                result.put("lastModified", Files.getLastModifiedTime(path).toString());
            }

            // Thử đọc file
            try {
                Resource resource = new UrlResource(path.toUri());
                result.put("resourceExists", resource.exists());
                result.put("resourceReadable", resource.isReadable());
            } catch (Exception e) {
                result.put("resourceError", e.getMessage());
            }

            result.put("status", "success");
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }

    @GetMapping("/images/check-directory")
    public ResponseEntity<Map<String, Object>> checkDirectory(@RequestParam String directoryPath) {
        Map<String, Object> result = new HashMap<>();

        try {
            Path path = Paths.get(storageLocation, directoryPath);

            result.put("directoryPath", path.toString());
            result.put("exists", Files.exists(path));
            result.put("isDirectory", Files.isDirectory(path));
            result.put("isReadable", Files.isReadable(path));

            if (Files.exists(path) && Files.isDirectory(path)) {
                try {
                    result.put("files", Files.list(path)
                            .map(Path::getFileName)
                            .map(Path::toString)
                            .limit(10)
                            .toList());
                    result.put("fileCount", Files.list(path).count());
                } catch (Exception e) {
                    result.put("listError", e.getMessage());
                }
            }

            result.put("status", "success");
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
}
