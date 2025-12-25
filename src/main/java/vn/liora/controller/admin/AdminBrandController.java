package vn.liora.controller.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.BrandCreationRequest;
import vn.liora.dto.request.BrandUpdateRequest;
import vn.liora.dto.response.BrandResponse;
import vn.liora.entity.Brand;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.BrandMapper;
import vn.liora.service.IBrandService;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/admin/api/brands")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('brand.view')")
public class AdminBrandController {

    private final IBrandService brandService;
    private final BrandMapper brandMapper;

    @PostMapping
    @PreAuthorize("hasAuthority('brand.create')")
    public ResponseEntity<ApiResponse<BrandResponse>> addBrand(@Valid @RequestBody BrandCreationRequest request) {
        ApiResponse<BrandResponse> response = new ApiResponse<>();
        try {
            Brand brand = brandService.createBrand(request);
            BrandResponse brandResponse = brandMapper.toBrandResponse(brand);
            response.setResult(brandResponse);
            response.setMessage("Tạo thương hiệu thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi tạo thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BrandResponse>>> getAllBrands(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sortBy,
            Pageable pageable) {
        ApiResponse<Page<BrandResponse>> response = new ApiResponse<>();
        try {
            Page<Brand> brands;

            // Xử lý sort
            if (sortBy != null && !sortBy.isEmpty()) {
                pageable = this.createSortedPageable(pageable, sortBy);
            }

            // Nếu có search, dùng search method
            if (search != null && !search.trim().isEmpty()) {
                brands = brandService.findByNameContaining(search.trim(), pageable);
            }
            // Nếu có filter status
            else if (status != null && !status.isEmpty()) {
                if ("ACTIVE".equals(status)) {
                    brands = brandService.findActiveBrands(pageable);
                } else if ("INACTIVE".equals(status)) {
                    brands = brandService.findInactiveBrands(pageable);
                } else {
                    brands = brandService.findAll(pageable);
                }
            }
            // Mặc định
            else {
                brands = brandService.findAll(pageable);
            }

            // Convert to BrandResponse
            Page<BrandResponse> brandResponses = brands.map(brandMapper::toBrandResponse);
            response.setResult(brandResponses);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    private Pageable createSortedPageable(Pageable pageable, String sortBy) {
        switch (sortBy) {
            case "name_desc":
                return org.springframework.data.domain.PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        org.springframework.data.domain.Sort.by("name").descending());
            case "name":
            default:
                return org.springframework.data.domain.PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        org.springframework.data.domain.Sort.by("name").ascending());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<BrandResponse>>> getAllBrands() {
        ApiResponse<List<BrandResponse>> response = new ApiResponse<>();
        try {
            // Trả về tất cả brands (bao gồm cả inactive) để form edit có thể hiển thị brand hiện tại
            List<Brand> brands = brandService.findAll();

            // Sort brands alphabetically by name
            brands.sort(Comparator.comparing(Brand::getName));

            List<BrandResponse> brandResponses = brands.stream()
                    .map(brandMapper::toBrandResponse)
                    .toList();
            response.setResult(brandResponses);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BrandResponse>> getBrandById(@PathVariable Long id) {
        ApiResponse<BrandResponse> response = new ApiResponse<>();
        try {
            BrandResponse brandResponse = brandService.findById(id);
            response.setResult(brandResponse);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(404);
            response.setMessage("Không tìm thấy thương hiệu với ID: " + id);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<BrandResponse>>> searchBrands(@RequestParam String name, Pageable pageable) {
        ApiResponse<Page<BrandResponse>> response = new ApiResponse<>();
        try {
            Page<Brand> brands = brandService.findByNameContaining(name, pageable);
            Page<BrandResponse> brandResponses = brands.map(brandMapper::toBrandResponse);
            response.setResult(brandResponses);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi tìm kiếm thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('brand.update')")
    public ResponseEntity<ApiResponse<BrandResponse>> updateBrand(
            @PathVariable Long id,
            @Valid @RequestBody BrandUpdateRequest request) {
        ApiResponse<BrandResponse> response = new ApiResponse<>();
        try {
            BrandResponse brandResponse = brandService.updateBrand(id, request);
            response.setResult(brandResponse);
            response.setMessage("Cập nhật thương hiệu thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi cập nhật thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('brand.delete')")
    public ResponseEntity<ApiResponse<String>> deleteBrand(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            // Lấy thông tin thương hiệu trước khi xóa để báo lỗi chi tiết
            Brand brand = brandService.findByIdOptional(id).orElse(null);
            String brandName = brand != null ? brand.getName() : "ID: " + id;

            brandService.deleteById(id);
            response.setResult("Xóa thương hiệu '" + brandName + "' thành công");
            response.setMessage("Xóa thương hiệu '" + brandName + "' thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.BRAND_HAS_PRODUCTS) {
                // Lấy thông tin thương hiệu để báo lỗi chi tiết
                try {
                    Brand brand = brandService.findByIdOptional(id).orElse(null);
                    String brandName = brand != null ? brand.getName() : "ID: " + id;
                    response.setCode(e.getErrorCode().getCode());
                    response.setMessage("Không thể xóa thương hiệu '" + brandName
                            + "' vì đang có sản phẩm sử dụng. Vui lòng ngừng hoạt động thay vì xóa.");
                } catch (Exception ex) {
                    response.setCode(e.getErrorCode().getCode());
                    response.setMessage(
                            "Không thể xóa thương hiệu vì đang có sản phẩm sử dụng. Vui lòng ngừng hoạt động thay vì xóa.");
                }
            } else {
                response.setCode(e.getErrorCode().getCode());
                response.setMessage(e.getErrorCode().getMessage());
            }
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi xóa thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('brand.update')")
    public ResponseEntity<ApiResponse<String>> activateBrand(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            brandService.activateBrand(id);
            response.setResult("Kích hoạt thương hiệu thành công");
            response.setMessage("Kích hoạt thương hiệu thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi kích hoạt thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('brand.update')")
    public ResponseEntity<ApiResponse<String>> deactivateBrand(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            brandService.deactivateBrand(id);
            response.setResult("Vô hiệu hóa thương hiệu thành công");
            response.setMessage("Vô hiệu hóa thương hiệu thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi vô hiệu hóa thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Thêm endpoints cho user (read-only)
    @GetMapping("/public/active")
    public ResponseEntity<ApiResponse<List<BrandResponse>>> getActiveBrandsForUser() {
        ApiResponse<List<BrandResponse>> response = new ApiResponse<>();
        try {
            // Tạo Pageable để lấy tất cả brands
            Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
            Page<Brand> brandPage = brandService.findActiveBrands(pageable);
            List<Brand> brands = brandPage.getContent();

            List<BrandResponse> brandResponses = brands.stream()
                    .map(brandMapper::toBrandResponse)
                    .toList();
            response.setResult(brandResponses);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

}