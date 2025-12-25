package vn.liora.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Collections;

import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.ProductCreationRequest;
import vn.liora.dto.request.ProductUpdateRequest;
import vn.liora.dto.response.ImageResponse;
import vn.liora.dto.response.ProductResponse;
import vn.liora.entity.Image;
import vn.liora.entity.Product;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.ProductMapper;
import vn.liora.service.IImageService;
import vn.liora.service.IProductService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.format.annotation.DateTimeFormat;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/api/products")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor // tự động tạo constructor cho các final fields
@PreAuthorize("hasAuthority('product.view')")
public class AdminProductController {

    private final IProductService productService;
    private final ProductMapper productMapper;
    private final IImageService imageService;

    // ============== BASIC CRUD ==============
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('product.create')")
    public ResponseEntity<ApiResponse<ProductResponse>> createProductWithImages(
            @RequestParam("name") String name,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam("brandId") Long brandId,
            @RequestParam("price") BigDecimal price,
            @RequestParam("stock") Integer stock,
            @RequestParam("description") String description,
            @RequestParam(value = "isActive", defaultValue = "true") Boolean isActive,
            @RequestParam(value = "productImages", required = true) MultipartFile[] productImages) {
        ApiResponse<ProductResponse> response = new ApiResponse<>();
        try {
            // Validation
            if (price.compareTo(BigDecimal.ZERO) <= 0) {
                response.setCode(400);
                response.setMessage("Giá sản phẩm phải lớn hơn 0");
                return ResponseEntity.badRequest().body(response);
            }

            if (stock < 0) {
                response.setCode(400);
                response.setMessage("Số lượng tồn kho không được âm");
                return ResponseEntity.badRequest().body(response);
            }

            // Validation: Kiểm tra bắt buộc phải có ít nhất 1 ảnh
            if (productImages == null || productImages.length == 0) {
                response.setCode(400);
                response.setMessage("Vui lòng chọn ít nhất một hình ảnh cho sản phẩm");
                return ResponseEntity.badRequest().body(response);
            }

            // Tự động set available dựa vào stock
            Boolean available = stock > 0;

            // Tạo ProductCreationRequest từ form data
            ProductCreationRequest request = ProductCreationRequest.builder()
                    .name(name)
                    .categoryId(categoryId)
                    .brandId(brandId)
                    .price(price)
                    .stock(stock)
                    .description(description)
                    .available(available)
                    .isActive(isActive)
                    .build();

            // Tạo sản phẩm
            Product product = productService.createProduct(request);

            // Xử lý upload tất cả hình ảnh bằng IImageService
            if (productImages != null && productImages.length > 0) {
                try {
                    imageService.uploadMultipleProductImages(product.getProductId(), productImages);
                } catch (Exception e) {
                    // Log lỗi nhưng không throw exception
                    System.err.println("Error uploading images: " + e.getMessage());
                    // Có thể thêm response message về việc upload hình ảnh thất bại
                }
            }

            ProductResponse productResponse = productMapper.toProductResponse(product);
            response.setResult(productResponse);
            response.setMessage("Tạo sản phẩm thành công");
            return ResponseEntity.ok(response);

        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('product.view')")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String stockStatus,
            @RequestParam(required = false) String available,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minStock,
            @RequestParam(required = false) Integer maxStock,
            @RequestParam(required = false) String dateFilter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String sortBy,
            Pageable pageable) {
        ApiResponse<Page<ProductResponse>> response = new ApiResponse<>();
        try {
            // Xử lý sort - không cần tạo sortPageable vì đã áp dụng sorting sau khi lọc

            // Tìm kiếm và lọc - lấy tất cả sản phẩm trước khi lọc
            Page<Product> allProducts;
            if (search != null && !search.trim().isEmpty()) {
                allProducts = productService.findByNameContaining(search.trim(), Pageable.unpaged());
            } else {
                allProducts = productService.findAll(Pageable.unpaged());
            }

            List<Product> filteredProducts = new ArrayList<>(allProducts.getContent());

            // Lọc theo trạng thái (active/inactive)
            if (status != null && !status.isEmpty()) {
                filteredProducts = filteredProducts.stream()
                        .filter(product -> {
                            if ("active".equals(status))
                                return product.getIsActive();
                            if ("inactive".equals(status))
                                return !product.getIsActive();
                            return true;
                        })
                        .toList();
            }

            // Lọc theo trạng thái tồn kho
            if (stockStatus != null && !stockStatus.isEmpty()) {
                filteredProducts = filteredProducts.stream()
                        .filter(product -> {
                            if ("IN_STOCK".equals(stockStatus))
                                return product.getStock() > 0;
                            if ("OUT_OF_STOCK".equals(stockStatus))
                                return product.getStock() == 0 || product.getStock() == null;
                            return true;
                        })
                        .toList();
            }

            // Lọc theo available
            if (available != null && !available.isEmpty()) {
                filteredProducts = filteredProducts.stream()
                        .filter(product -> {
                            if ("true".equals(available))
                                return product.getAvailable();
                            if ("false".equals(available))
                                return !product.getAvailable();
                            return true;
                        })
                        .toList();
            }

            // lọc theo giá
            if (minPrice != null || maxPrice != null) {
                filteredProducts = filteredProducts.stream()
                        .filter(product -> {
                            BigDecimal price = product.getPrice();
                            if (minPrice != null && price.compareTo(minPrice) < 0)
                                return false;
                            if (maxPrice != null && price.compareTo(maxPrice) > 0)
                                return false;
                            return true;
                        })
                        .toList();
            }

            // lọc theo stock
            if (minStock != null || maxStock != null) {
                filteredProducts = filteredProducts.stream()
                        .filter(product -> {
                            Integer stock = product.getStock();
                            if (minStock != null && stock < minStock)
                                return false;
                            if (maxStock != null && stock > maxStock)
                                return false;
                            return true;
                        })
                        .toList();
            }

            // lọc theo brand
            if (brandId != null) {
                filteredProducts = filteredProducts.stream()
                    .filter(product -> product.getBrand().getBrandId().equals(brandId))
                    .toList();
            }

            // lọc theo category
            if (categoryId != null) {
                filteredProducts = filteredProducts.stream()
                    .filter(product -> product.getCategory().getCategoryId().equals(categoryId))
                    .toList();
            }

            // Lọc theo thời gian tạo (createdDate)
            if (dateFilter != null && !dateFilter.isEmpty() || startDate != null || endDate != null) {
                filteredProducts = filteredProducts.stream()
                    .filter(product -> {
                        if (product.getCreatedDate() == null) {
                            return false;
                        }
                        
                        LocalDate productDate = product.getCreatedDate().toLocalDate();
                        LocalDate filterStartDate = startDate;
                        LocalDate filterEndDate = endDate;
                        
                        // Nếu có dateFilter preset nhưng chưa có startDate/endDate, tính toán từ preset
                        if (dateFilter != null && !dateFilter.isEmpty() && (filterStartDate == null || filterEndDate == null)) {
                            LocalDate today = LocalDate.now();
                            switch (dateFilter) {
                                case "TODAY":
                                    filterStartDate = today;
                                    filterEndDate = today;
                                    break;
                                case "THIS_WEEK":
                                    filterStartDate = today.minusDays(today.getDayOfWeek().getValue() - 1);
                                    filterEndDate = today;
                                    break;
                                case "THIS_MONTH":
                                    filterStartDate = today.withDayOfMonth(1);
                                    filterEndDate = today;
                                    break;
                                case "THIS_YEAR":
                                    filterStartDate = today.withDayOfYear(1);
                                    filterEndDate = today;
                                    break;
                            }
                        }
                        
                        // Filter logic
                        if (filterStartDate != null && productDate.isBefore(filterStartDate)) {
                            return false;
                        }
                        if (filterEndDate != null && productDate.isAfter(filterEndDate)) {
                            return false;
                        }
                        
                        return true;
                    })
                    .toList();
            }

            // Áp dụng sorting sau khi lọc
            if (sortBy != null && !sortBy.isEmpty()) {
                filteredProducts = this.applySorting(filteredProducts, sortBy);
            }

            // Tạo PageImpl cuối cùng với pagination
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), filteredProducts.size());
            
            // Kiểm tra start có hợp lệ không
            List<Product> pageContent;
            if (start >= filteredProducts.size() || start < 0) {
                // Nếu start vượt quá size hoặc âm, trả về danh sách rỗng
                pageContent = Collections.emptyList();
            } else {
                // Lấy sublist an toàn
                pageContent = filteredProducts.subList(start, end);
            }
            
            Page<Product> products = new PageImpl<>(
                    pageContent, pageable, filteredProducts.size()
            );

            Page<ProductResponse> productResponses = products.map(product -> {
                ProductResponse productResponse = productMapper.toProductResponse(product);

                // Load main image
                try {
                    Optional<Image> mainImage = imageService.findMainImageByProductId(product.getProductId());
                    if (mainImage.isPresent()) {
                        productResponse.setMainImageUrl(mainImage.get().getImageUrl());
                    }
                } catch (Exception e) {
                    System.err.println(
                            "Error loading image for product " + product.getProductId() + ": " + e.getMessage());
                }

                return productResponse;
            });
            response.setResult(productResponses);
            response.setMessage("Lấy danh sách sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ApiResponse<ProductResponse> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            ProductResponse productResponse = productService.findById(id);
            response.setResult(productResponse);
            response.setMessage("Lấy thông tin sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy thông tin sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('product.update')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request) {
        ApiResponse<ProductResponse> response = new ApiResponse<>();
        try {
            // Validation ID
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            ProductResponse productResponse = productService.updateProduct(id, request);
            response.setResult(productResponse);
            response.setMessage("Cập nhật sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi cập nhật sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('product.delete')")
    public ResponseEntity<ApiResponse<String>> deleteProduct(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }

            // Lấy thông tin sản phẩm trước khi xóa để báo lỗi chi tiết
            Product product = productService.findByIdOptional(id).orElse(null);
            String productName = product != null ? product.getName() : "ID: " + id;

            productService.deleteById(id);
            response.setMessage("Xóa sản phẩm '" + productName + "' thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.PRODUCT_HAS_ORDERS) {
                // Lấy thông tin sản phẩm để báo lỗi chi tiết
                try {
                    Product product = productService.findByIdOptional(id).orElse(null);
                    String productName = product != null ? product.getName() : "ID: " + id;
                    response.setCode(e.getErrorCode().getCode());
                    response.setMessage("Không thể xóa sản phẩm '" + productName + "' vì đã có lịch sử bán hàng");
                } catch (Exception ex) {
                    response.setCode(e.getErrorCode().getCode());
                    response.setMessage("Không thể xóa sản phẩm vì đã có lịch sử bán hàng");
                }
            } else {
                response.setCode(e.getErrorCode().getCode());
                response.setMessage(e.getErrorCode().getMessage());
            }
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi xóa sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== STATUS MANAGEMENT ==========
    @PutMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('product.update')")
    public ResponseEntity<ApiResponse<String>> activateProduct(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }

            productService.activateProduct(id);
            response.setMessage("Kích hoạt sản phầm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi kích hoạt sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('product.update')")
    public ResponseEntity<ApiResponse<String>> deactivateProduct(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }

            productService.deactivateProduct(id);
            response.setMessage("Ngừng hoạt động sản phầm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi ngừng hoạt động sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/available")
    @PreAuthorize("hasAuthority('product.update')")
    public ResponseEntity<ApiResponse<String>> availableProduct(
            @PathVariable Long id,
            @RequestParam Boolean available) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }

            productService.setAvailable(id, available);
            String message = available ? "Đặt sản phẩm còn hàng thành công" : "Đặt sản phẩm hết hàng thành công";
            response.setMessage(message);
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi cập nhật trạng thái sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== STOCK MANAGEMENT ==========
    @PutMapping("/{id}/stock")
    @PreAuthorize("hasAuthority('product.update')")
    public ResponseEntity<ApiResponse<String>> updateStock(
            @PathVariable Long id,
            @RequestParam Integer stock) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            productService.updateStock(id, stock);
            response.setMessage("Cập nhật số lượng tồn kho thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi cập nhật tồn kho: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/sold-count")
    @PreAuthorize("hasAuthority('product.update')")
    public ResponseEntity<ApiResponse<String>> updateSoldCount(
            @PathVariable Long id,
            @RequestParam Integer soldCount) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            productService.updateSoldCount(id, soldCount);
            response.setMessage("Cập nhật số lượng đã bán thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi cập nhật số lượng đã bán: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== BULK OPERATIONS ==========
    @PutMapping("/bulk/activate")
    @PreAuthorize("hasAuthority('product.update')")
    public ResponseEntity<ApiResponse<String>> bulkActivateProducts(@RequestBody List<Long> productIds) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (productIds == null || productIds.isEmpty()) {
                response.setCode(400);
                response.setMessage("Danh sách sản phẩm không được trống");
                return ResponseEntity.badRequest().body(response);
            }

            // Xử lý bulk
            for (Long id : productIds) {
                if (id <= 0)
                    continue; // Skip invalid IDs
                productService.activateProduct(id);
            }
            response.setMessage("Kích hoạt hàng loạt sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi kích hoạt hàng loạt sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/bulk/deactivate")
    @PreAuthorize("hasAuthority('product.update')")
    public ResponseEntity<ApiResponse<String>> bulkDeactivateProducts(@RequestBody List<Long> productIds) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (productIds == null || productIds.isEmpty()) {
                response.setCode(400);
                response.setMessage("Danh sách sản phẩm không được trống");
                return ResponseEntity.badRequest().body(response);
            }

            // Xử lý bulk
            for (Long id : productIds) {
                if (id <= 0)
                    continue; // Skip invalid IDs
                productService.deactivateProduct(id);
            }
            response.setMessage("Ngừng hoạt động hàng loạt sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi ngừng hoạt động hàng loạt sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/bulk")
    @PreAuthorize("hasAuthority('product.delete')")
    public ResponseEntity<ApiResponse<String>> bulkDeleteProducts(@RequestBody List<Long> productIds) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (productIds == null || productIds.isEmpty()) {
                response.setCode(400);
                response.setMessage("Danh sách sản phẩm không được trống");
                return ResponseEntity.badRequest().body(response);
            }

            int successCount = 0;
            int failCount = 0;
            StringBuilder errorMessages = new StringBuilder();

            // Xử lý bulk với kiểm tra từng sản phẩm
            for (Long id : productIds) {
                if (id <= 0) {
                    failCount++;
                    continue; // Skip invalid IDs
                }

                try {
                    productService.deleteById(id);
                    successCount++;
                } catch (AppException e) {
                    failCount++;
                    if (e.getErrorCode() == ErrorCode.PRODUCT_HAS_ORDERS) {
                        // Lấy tên sản phẩm để báo lỗi chi tiết
                        try {
                            Product product = productService.findByIdOptional(id).orElse(null);
                            String productName = product != null ? product.getName() : "ID: " + id;
                            errorMessages.append(productName).append(" (đã được bán), ");
                        } catch (Exception ex) {
                            errorMessages.append("ID: ").append(id).append(" (đã được bán), ");
                        }
                    }
                }
            }

            if (failCount > 0) {
                String errorMsg = errorMessages.toString();
                if (errorMsg.endsWith(", ")) {
                    errorMsg = errorMsg.substring(0, errorMsg.length() - 2);
                }
                response.setCode(207); // Multi-Status
                response.setMessage(
                        String.format("Xóa thành công %d sản phẩm, thất bại %d sản phẩm. Sản phẩm không thể xóa: %s",
                                successCount, failCount, errorMsg));
            } else {
                response.setCode(200);
                response.setMessage(String.format("Xóa hàng loạt thành công %d sản phẩm", successCount));
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi xóa hàng loạt sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== STATISTICS ==========
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Object>> getProductStatistics() {
        ApiResponse<Object> response = new ApiResponse<>();
        try {
            Long totalCount = productService.count();
            Long activeCount = productService.countActiveProducts();
            Long activeAvailableCount = productService.countActiveAvailableProducts();
            Long outOfStockCount = productService.countOutOfStockProducts();

            var statistics = new Object() {
                public final Long totalProducts = totalCount;
                public final Long activeProducts = activeCount;
                public final Long activeAvailableProducts = activeAvailableCount;
                public final Long outOfStockProducts = outOfStockCount;
                public final Long inactiveProducts = totalProducts - activeProducts;
                public final Long unavailableProducts = activeProducts - activeAvailableProducts;
            };

            response.setResult(statistics);
            response.setMessage("Lấy thống kê sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy thống kê sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/statistics/by-brand/{brandId}")
    public ResponseEntity<ApiResponse<Long>> getProductCountByBrand(@PathVariable Long brandId) {
        ApiResponse<Long> response = new ApiResponse<>();
        try {
            if (brandId <= 0) {
                response.setCode(400);
                response.setMessage("ID thương hiệu không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            Long count = productService.countByBrand(brandId);
            response.setResult(count);
            response.setMessage("Lấy số lượng sản phẩm theo thương hiệu thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy số lượng sản phẩm theo thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== BUSINESS QUERIES ==========
    @GetMapping("/top-selling")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getTopSellingProducts(Pageable pageable) {
        ApiResponse<List<ProductResponse>> response = new ApiResponse<>();
        try {
            List<Product> products = productService.findTopSellingInStockProducts(pageable);
            List<ProductResponse> productResponses = products.stream()
                    .map(productMapper::toProductResponse)
                    .toList();
            response.setResult(productResponses);
            response.setMessage("Lấy danh sách sản phẩm bán chạy thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách sản phẩm bán chạy: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/high-rated")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getHighRatedProducts(
            @RequestParam(defaultValue = "4.0") BigDecimal minRating,
            Pageable pageable) {
        ApiResponse<List<ProductResponse>> response = new ApiResponse<>();
        try {
            List<Product> products = productService.findHighRatedProductsWithPagination(minRating, pageable);
            List<ProductResponse> productResponses = products.stream()
                    .map(productMapper::toProductResponse)
                    .toList();
            response.setResult(productResponses);
            response.setMessage("Lấy danh sách sản phẩm đánh giá cao thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách sản phẩm đánh giá cao: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/newest")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getNewestProducts(Pageable pageable) {
        ApiResponse<List<ProductResponse>> response = new ApiResponse<>();
        try {
            List<Product> products = productService.findNewestProducts(pageable);
            List<ProductResponse> productResponses = products.stream()
                    .map(productMapper::toProductResponse)
                    .toList();
            response.setResult(productResponses);
            response.setMessage("Lấy danh sách sản phẩm mới nhất thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách sản phẩm mới nhất: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/out-of-stock")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getOutOfStockProducts() {
        ApiResponse<List<ProductResponse>> response = new ApiResponse<>();
        try {
            List<Product> products = productService.findOutOfStockProducts();
            List<ProductResponse> productResponses = products.stream()
                    .map(productMapper::toProductResponse)
                    .toList();
            response.setResult(productResponses);
            response.setMessage("Lấy danh sách sản phẩm hết hàng thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách sản phẩm hết hàng: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== HELPER METHODS ==========
    private List<Product> applySorting(List<Product> products, String sortBy) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            return products;
        }
        
        switch (sortBy) {
            case "id_desc":
                return products.stream()
                        .sorted((p1, p2) -> Long.compare(p2.getProductId(), p1.getProductId()))
                        .toList();
            case "id":
                return products.stream()
                        .sorted((p1, p2) -> Long.compare(p1.getProductId(), p2.getProductId()))
                        .toList();
            case "name_desc":
                return products.stream()
                        .sorted((p1, p2) -> p2.getName().compareToIgnoreCase(p1.getName()))
                        .toList();
            case "name":
                return products.stream()
                        .sorted((p1, p2) -> p1.getName().compareToIgnoreCase(p2.getName()))
                        .toList();
            case "price_desc":
                return products.stream()
                        .sorted((p1, p2) -> p2.getPrice().compareTo(p1.getPrice()))
                        .toList();
            case "price":
                return products.stream()
                        .sorted((p1, p2) -> p1.getPrice().compareTo(p2.getPrice()))
                        .toList();
            case "stock_desc":
                return products.stream()
                        .sorted((p1, p2) -> Integer.compare(p2.getStock(), p1.getStock()))
                        .toList();
            case "stock":
                return products.stream()
                        .sorted((p1, p2) -> Integer.compare(p1.getStock(), p2.getStock()))
                        .toList();
            case "soldCount_desc":
                return products.stream()
                        .sorted((p1, p2) -> Integer.compare(p2.getSoldCount(), p1.getSoldCount()))
                        .toList();
            case "soldCount":
                return products.stream()
                        .sorted((p1, p2) -> Integer.compare(p1.getSoldCount(), p2.getSoldCount()))
                        .toList();
            case "createdDate_desc":
                return products.stream()
                        .sorted((p1, p2) -> p2.getCreatedDate().compareTo(p1.getCreatedDate()))
                        .toList();
            case "createdDate":
                return products.stream()
                        .sorted((p1, p2) -> p1.getCreatedDate().compareTo(p2.getCreatedDate()))
                        .toList();
            default:
                return products;
        }
    }

    private Pageable createSortedPageable(Pageable pageable, String sortBy) {
        // Thêm validation nếu null thì trả về trang hiện tại
        if (sortBy == null || sortBy.trim().isEmpty()) {
            return pageable;
        }
        switch (sortBy) {
            case "id_desc":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("id").descending());
            case "id":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("id").ascending());
            case "name_desc":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("name").descending());

            case "name":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("name").ascending());
            case "price_desc":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("price").descending());
            case "price":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("price").ascending());
            case "created_desc":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("createdDate").descending());
            case "created":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("createdDate").ascending());
            case "stock_desc":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("stock").descending());
            case "stock":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("stock").ascending());
            case "sold_desc":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("soldCount").descending());
            case "sold":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("soldCount").ascending());
            case "rating_desc":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("averageRating").descending());
            case "rating":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("averageRating").ascending());
            default:
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("createdDate").descending());
        }
    }

    // ========== IMAGE MANAGEMENT ==========
    @GetMapping("/{id}/images")
    public ResponseEntity<ApiResponse<List<ImageResponse>>> getProductImages(@PathVariable Long id) {
        ApiResponse<List<ImageResponse>> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }

            List<Image> images = imageService.findByProductIdOrderByDisplayOrder(id);
            // Convert to DTO
            List<ImageResponse> imageResponses = images.stream()
                    .map(image -> ImageResponse.builder()
                            .imageId(image.getImageId())
                            .imageUrl(image.getImageUrl())
                            .isMain(image.getIsMain())
                            .displayOrder(image.getDisplayOrder())
                            .build())
                    .collect(Collectors.toList());

            response.setResult(imageResponses);
            response.setMessage("Lấy danh sách hình ảnh thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách hình ảnh: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{productId}/images/{imageId}/set-main")
    @PreAuthorize("hasAuthority('product.manage_images')")
    public ResponseEntity<ApiResponse<String>> setMainImage(
            @PathVariable Long productId,
            @PathVariable Long imageId) {
        ApiResponse<String> response = new ApiResponse<>();

        try {
            // Kiểm tra product tồn tại
            Optional<Product> productOpt = productService.findByIdOptional(productId);
            if (productOpt.isEmpty()) {
                response.setCode(404);
                response.setMessage("Không tìm thấy sản phẩm");
                return ResponseEntity.notFound().build();
            }

            // Set image làm main
            imageService.setMainImage(productId, imageId);

            // Update product timestamp
            Product product = productOpt.get();
            product.setUpdatedDate(LocalDateTime.now());
            productService.save(product);

            response.setCode(200);
            response.setMessage("Đặt làm ảnh chính thành công");
            response.setResult("success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi đặt làm ảnh chính: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{productId}/update-timestamp")
    @PreAuthorize("hasAuthority('product.update')")
    public ResponseEntity<ApiResponse<String>> updateProductTimestamp(
            @PathVariable Long productId) {
        ApiResponse<String> response = new ApiResponse<>();

        try {
            // Kiểm tra product tồn tại
            Optional<Product> productOpt = productService.findByIdOptional(productId);
            if (productOpt.isEmpty()) {
                response.setCode(404);
                response.setMessage("Không tìm thấy sản phẩm");
                return ResponseEntity.notFound().build();
            }

            // Update timestamp
            Product product = productOpt.get();
            product.setUpdatedDate(LocalDateTime.now());
            productService.save(product);

            response.setCode(200);
            response.setMessage("Cập nhật thời gian thành công");
            response.setResult("success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi cập nhật thời gian: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/{productId}/images/{imageId}")
    @PreAuthorize("hasAuthority('product.manage_images')")
    public ResponseEntity<ApiResponse<String>> deleteImage(
            @PathVariable Long productId,
            @PathVariable Long imageId) {
        ApiResponse<String> response = new ApiResponse<>();

        try {
            // Kiểm tra product tồn tại
            Optional<Product> productOpt = productService.findByIdOptional(productId);
            if (productOpt.isEmpty()) {
                response.setCode(404);
                response.setMessage("Không tìm thấy sản phẩm");
                return ResponseEntity.notFound().build();
            }

            // Xóa ảnh
            imageService.deleteImage(imageId);

            // Update product timestamp
            Product product = productOpt.get();
            product.setUpdatedDate(LocalDateTime.now());
            productService.save(product);

            response.setCode(200);
            response.setMessage("Xóa hình ảnh thành công");
            response.setResult("success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi xóa hình ảnh: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/toggle-status")
    @PreAuthorize("hasAuthority('product.update')")
    public ResponseEntity<ApiResponse<String>> toggleProductStatus(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();

        try {
            // Lấy thông tin product hiện tại
            ProductResponse productResponse = productService.findById(id);
            if (productResponse == null) {
                response.setCode(404);
                response.setMessage("Không tìm thấy sản phẩm");
                return ResponseEntity.notFound().build();
            }

            // Toggle status dựa trên trạng thái hiện tại
            if (productResponse.getIsActive()) {
                // Nếu đang active → deactivate
                productService.deactivateProduct(id);
                response.setMessage("Tạm dừng sản phẩm thành công");
            } else {
                // Nếu đang inactive → activate
                productService.activateProduct(id);
                response.setMessage("Kích hoạt sản phẩm thành công");
            }

            response.setCode(200);
            response.setResult("success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi thay đổi trạng thái: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
