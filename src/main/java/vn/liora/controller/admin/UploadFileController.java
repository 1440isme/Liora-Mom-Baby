package vn.liora.controller.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.liora.dto.request.ApiResponse;
import vn.liora.entity.Image;
import vn.liora.entity.Product;
import vn.liora.repository.ImageRepository;
import vn.liora.repository.ProductRepository;
import vn.liora.service.IImageOptimizationService;
import vn.liora.service.IStorageService;
import vn.liora.service.IDirectoryStructureService;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@RestController
@RequestMapping("/admin/api/upload")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAuthority('product.manage_images')")
public class UploadFileController {

    @Autowired
    private IStorageService storageService;

    @Autowired
    private IImageOptimizationService imageOptimizationService;

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private IDirectoryStructureService directoryStructureService;

    // Cấu hình kích thước và chất lượng mặc định
    private static final int MAX_WIDTH = 1200;
    private static final int MAX_HEIGHT = 1200;
    private static final int THUMBNAIL_SIZE = 300;
    private static final float QUALITY = 0.8f;
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * Upload ảnh cho thương hiệu
     */
    @PostMapping(value = "/brands", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadBrandImage(
            @RequestParam("file") MultipartFile file) {
        try {
            System.out.println("=== UPLOAD BRAND IMAGE START ===");
            System.out.println("File name: " + file.getOriginalFilename());
            System.out.println("File size: " + file.getSize() + " bytes");
            System.out.println("Content type: " + file.getContentType());

            // Validation
            if (!validateFile(file)) {
                System.err.println("File validation failed");
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("File không hợp lệ hoặc quá lớn"));
            }

            // Tạo đường dẫn có tổ chức
            String filename = generateUniqueFilename(file.getOriginalFilename());
            String relativePath = directoryStructureService.createFullPath("brands", filename, false);
            String thumbnailPath = directoryStructureService.createFullPath("brands", filename, true);

            // Tối ưu hóa ảnh chính
            Path mainImagePath = Paths.get(storageService.getStorageLocation(), relativePath);
            imageOptimizationService.optimizeImage(file, mainImagePath, MAX_WIDTH, MAX_HEIGHT, QUALITY);

            // Tạo thumbnail
            Path thumbnailImagePath = Paths.get(storageService.getStorageLocation(), thumbnailPath);
            Files.createDirectories(thumbnailImagePath.getParent());
            imageOptimizationService.createThumbnail(file, thumbnailImagePath, THUMBNAIL_SIZE);

            Map<String, String> result = new HashMap<>();
            result.put("originalUrl", "/uploads/" + relativePath);
            result.put("thumbnailUrl", "/uploads/" + thumbnailPath);
            result.put("filename", filename);

            return ResponseEntity.ok(ApiResponse.success("Upload thành công", result));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi khi upload: " + e.getMessage()));
        }
    }

    /**
     * Upload ảnh cho sản phẩm
     */
    @PostMapping(value = "/products", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadProductImages(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "productId", required = false) Long productId) {
        try {
            if (files == null || files.length == 0) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Không có file nào được chọn"));
            }

            List<Map<String, String>> uploadedImages = new ArrayList<>();

            for (MultipartFile file : files) {
                if (!validateFile(file)) {
                    continue; // Bỏ qua file không hợp lệ
                }

                String filename = generateUniqueFilename(file.getOriginalFilename());
                String relativePath = directoryStructureService.createFullPath("products", filename, false);
                String thumbnailPath = directoryStructureService.createFullPath("products", filename, true);

                // Tối ưu hóa ảnh chính
                Path mainImagePath = Paths.get(storageService.getStorageLocation(), relativePath);
                imageOptimizationService.optimizeImage(file, mainImagePath, MAX_WIDTH, MAX_HEIGHT, QUALITY);

                // Tạo thumbnail
                Path thumbnailImagePath = Paths.get(storageService.getStorageLocation(), thumbnailPath);
                Files.createDirectories(thumbnailImagePath.getParent());
                imageOptimizationService.createThumbnail(file, thumbnailImagePath, THUMBNAIL_SIZE);

                // Lưu vào database nếu có productId
                if (productId != null) {
                    Product product = productRepository.findById(productId).orElse(null);
                    if (product != null) {
                        Image image = new Image();
                        image.setImageUrl("/uploads/" + relativePath);
                        image.setProduct(product);

                        // Set displayOrder dựa trên số ảnh hiện tại của sản phẩm
                        Long currentImageCount = imageRepository.countByProductProductId(productId);
                        image.setDisplayOrder(currentImageCount.intValue()); // 0, 1, 2, 3...

                        imageRepository.save(image);
                    }
                }

                Map<String, String> imageInfo = new HashMap<>();
                imageInfo.put("originalUrl", "/uploads/" + relativePath);
                imageInfo.put("thumbnailUrl", "/uploads/" + thumbnailPath);
                imageInfo.put("filename", filename);
                uploadedImages.add(imageInfo);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("images", uploadedImages);
            result.put("count", uploadedImages.size());

            return ResponseEntity.ok(ApiResponse.success("Upload thành công", result));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi khi upload: " + e.getMessage()));
        }
    }

    /**
     * Upload ảnh cho danh mục
     */
    @PostMapping(value = "/categories", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadCategoryImage(
            @RequestParam("file") MultipartFile file) {
        try {
            if (!validateFile(file)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("File không hợp lệ hoặc quá lớn"));
            }

            String filename = generateUniqueFilename(file.getOriginalFilename());
            String relativePath = directoryStructureService.createFullPath("categories", filename, false);
            String thumbnailPath = directoryStructureService.createFullPath("categories", filename, true);

            // Tối ưu hóa ảnh chính
            Path mainImagePath = Paths.get(storageService.getStorageLocation(), relativePath);
            imageOptimizationService.optimizeImage(file, mainImagePath, MAX_WIDTH, MAX_HEIGHT, QUALITY);

            // Tạo thumbnail
            Path thumbnailImagePath = Paths.get(storageService.getStorageLocation(), thumbnailPath);
            Files.createDirectories(thumbnailImagePath.getParent());
            imageOptimizationService.createThumbnail(file, thumbnailImagePath, THUMBNAIL_SIZE);

            Map<String, String> result = new HashMap<>();
            result.put("originalUrl", "/uploads/" + relativePath);
            result.put("thumbnailUrl", "/uploads/" + thumbnailPath);
            result.put("filename", filename);

            return ResponseEntity.ok(ApiResponse.success("Upload thành công", result));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi khi upload: " + e.getMessage()));
        }
    }

    /**
     * Upload ảnh đại diện cho người dùng
     */
    @PostMapping(value = "/users/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadUserAvatar(
            @RequestParam("file") MultipartFile file) {
        try {
            if (!validateFile(file)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("File không hợp lệ hoặc quá lớn"));
            }

            String filename = generateUniqueFilename(file.getOriginalFilename());
            String relativePath = directoryStructureService.createFullPath("users", filename, false);

            // Tối ưu hóa ảnh (kích thước nhỏ hơn cho avatar)
            Path mainImagePath = Paths.get(storageService.getStorageLocation(), relativePath);
            imageOptimizationService.optimizeImage(file, mainImagePath, 400, 400, 0.9f);

            Map<String, String> result = new HashMap<>();
            result.put("avatarUrl", "/uploads/" + relativePath);
            result.put("filename", filename);

            return ResponseEntity.ok(ApiResponse.success("Upload avatar thành công", result));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi khi upload avatar: " + e.getMessage()));
        }
    }

    /**
     * Xóa ảnh
     */
    @DeleteMapping("/{filename}")
    @PreAuthorize("hasAuthority('product.manage_images')")
    public ResponseEntity<ApiResponse<String>> deleteImage(@PathVariable String filename) {
        try {
            // Tìm và xóa ảnh trong database
            List<Image> images = imageRepository.findAll();
            for (Image image : images) {
                if (image.getImageUrl().contains(filename)) {
                    imageRepository.delete(image);
                    break;
                }
            }

            // Xóa file từ storage
            storageService.delete(filename);

            return ResponseEntity.ok(ApiResponse.success("Xóa ảnh thành công", null));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi khi xóa ảnh: " + e.getMessage()));
        }
    }

    /**
     * Lấy thông tin ảnh
     */
    @GetMapping("/info/{filename}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getImageInfo(@PathVariable String filename) {
        try {
            Path imagePath = storageService.load(filename);
            if (!Files.exists(imagePath)) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> info = new HashMap<>();
            info.put("filename", filename);
            info.put("size", Files.size(imagePath));
            info.put("lastModified", Files.getLastModifiedTime(imagePath));
            info.put("url", "/uploads/" + filename);

            return ResponseEntity.ok(ApiResponse.success("Thông tin ảnh", info));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi khi lấy thông tin ảnh: " + e.getMessage()));
        }
    }

    /**
     * Validation file upload
     */
    private boolean validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return false;
        }

        return imageOptimizationService.isValidImageFile(file);
    }

    /**
     * Tạo tên file duy nhất
     */
    private String generateUniqueFilename(String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return UUID.randomUUID().toString() + extension;
    }
}
