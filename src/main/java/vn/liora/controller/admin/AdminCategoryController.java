package vn.liora.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.CategoryCreationRequest;
import vn.liora.dto.request.CategoryUpdateRequest;
import vn.liora.dto.response.CategoryResponse;
import vn.liora.entity.Category;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.CategoryMapper;
import vn.liora.service.ICategoryService;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/api/categories")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('category.view')")
public class AdminCategoryController {

    private final ICategoryService categoryService;
    private final CategoryMapper categoryMapper;

    @PostMapping
    @PreAuthorize("hasAuthority('category.create')")
    public ResponseEntity<ApiResponse<CategoryResponse>> addCategory(
            @Valid @RequestBody CategoryCreationRequest request) {
        ApiResponse<CategoryResponse> response = new ApiResponse<>();
        try {
            Category category = categoryService.createCategory(request);
            CategoryResponse categoryResponse = categoryMapper.toCategoryResponse(category);
            response.setResult(categoryResponse);
            response.setMessage("Tạo danh mục thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi tạo danh mục: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CategoryResponse>>> getAllCategories(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sortBy,
            Pageable pageable) {

        ApiResponse<Page<CategoryResponse>> response = new ApiResponse<>();
        try {
            Page<Category> categories;

            // Xử lý sort
            if (sortBy != null && !sortBy.isEmpty()) {
                pageable = this.createSortedPageable(pageable, sortBy);
            }

            // Tìm kiếm và lọc
            if (search != null && !search.trim().isEmpty()) {
                categories = categoryService.findByNameContaining(search, pageable);
            } else {
                categories = categoryService.findAll(pageable);
            }

            // Lọc theo trạng thái
            if (status != null && !status.isEmpty()) {
                List<Category> filteredCategories = categories.getContent().stream()
                        .filter(category -> {
                            if ("active".equals(status))
                                return category.getIsActive();
                            if ("inactive".equals(status))
                                return !category.getIsActive();
                            return true;
                        })
                        .toList();

                // Tạo Page mới với dữ liệu đã lọc
                categories = new org.springframework.data.domain.PageImpl<>(
                        filteredCategories,
                        pageable,
                        filteredCategories.size());
            }

            Page<CategoryResponse> categoryResponses = categories.map(categoryMapper::toCategoryResponse);
            response.setResult(categoryResponses);
            response.setMessage("Lấy danh sách danh mục thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách danh mục: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllActiveCategories() {
        ApiResponse<List<CategoryResponse>> response = new ApiResponse<>();
        try {
            // Trả về tất cả categories (bao gồm cả inactive) để form edit có thể hiển thị category hiện tại
            List<Category> categories = categoryService.findAll();

            // Sort categories alphabetically by name
            categories.sort(Comparator.comparing(Category::getName));

            List<CategoryResponse> categoryResponses = categories.stream()
                    .map(categoryMapper::toCategoryResponse)
                    .collect(Collectors.toList());

            response.setResult(categoryResponses);
            response.setMessage("Lấy danh sách danh mục thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable Long id) {
        ApiResponse<CategoryResponse> response = new ApiResponse<>();
        try {
            CategoryResponse categoryResponse = categoryService.findById(id);
            response.setResult(categoryResponse);
            response.setMessage("Lấy thông tin danh mục thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy thông tin danh mục: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('category.update')")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryUpdateRequest request) {
        ApiResponse<CategoryResponse> response = new ApiResponse<>();
        try {
            CategoryResponse categoryResponse = categoryService.updateCategory(id, request);
            response.setResult(categoryResponse);
            response.setMessage("Cập nhật danh mục thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi cập nhật danh mục: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('category.delete')")
    public ResponseEntity<ApiResponse<String>> deleteCategory(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            // Lấy thông tin danh mục trước khi xóa để báo lỗi chi tiết
            Category category = categoryService.findByIdOptional(id).orElse(null);
            String categoryName = category != null ? category.getName() : "ID: " + id;

            categoryService.deleteById(id);
            response.setResult("Xóa danh mục '" + categoryName + "' thành công");
            response.setMessage("Xóa danh mục '" + categoryName + "' thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.CATEGORY_HAS_PRODUCTS) {
                // Lấy thông tin danh mục để báo lỗi chi tiết
                try {
                    Category category = categoryService.findByIdOptional(id).orElse(null);
                    String categoryName = category != null ? category.getName() : "ID: " + id;
                    response.setCode(e.getErrorCode().getCode());
                    response.setMessage("Không thể xóa danh mục '" + categoryName
                            + "' vì đang có sản phẩm sử dụng. Vui lòng ngừng hoạt động thay vì xóa.");
                } catch (Exception ex) {
                    response.setCode(e.getErrorCode().getCode());
                    response.setMessage(
                            "Không thể xóa danh mục vì đang có sản phẩm sử dụng. Vui lòng ngừng hoạt động thay vì xóa.");
                }
            } else {
                response.setCode(e.getErrorCode().getCode());
                response.setMessage(e.getErrorCode().getMessage());
            }
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi xóa danh mục: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('category.update')")
    public ResponseEntity<ApiResponse<String>> activateCategory(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            categoryService.activateCategory(id);
            response.setResult("Kích hoạt danh mục và tất cả danh mục con thành công");
            response.setMessage("Kích hoạt danh mục và tất cả danh mục con thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            if (e.getMessage().contains("parent category is inactive")) {
                response.setMessage("Không thể kích hoạt danh mục con khi danh mục cha đang bị ngừng hoạt động");
            } else {
                response.setMessage("Lỗi khi kích hoạt danh mục: " + e.getMessage());
            }
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('category.update')")
    public ResponseEntity<ApiResponse<String>> deactivateCategory(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            categoryService.deactivateCategory(id);
            response.setResult("Ngừng hoạt động danh mục và tất cả danh mục con thành công");
            response.setMessage("Ngừng hoạt động danh mục và tất cả danh mục con thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi ngừng hoạt động danh mục: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategoryTree() {
        ApiResponse<List<CategoryResponse>> response = new ApiResponse<>();
        try {
            // Lấy TẤT CẢ root categories (cả active và inactive)
            List<Category> rootCategories = categoryService.findAllRootCategories();
            List<CategoryResponse> categoryResponses = rootCategories.stream()
                    .map(this::buildCategoryTree)
                    .toList();
            response.setResult(categoryResponses);
            response.setMessage("Lấy cây danh mục thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy cây danh mục: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    private CategoryResponse buildCategoryTree(Category category) {
        CategoryResponse response = categoryMapper.toCategoryResponse(category);

        // Lấy TẤT CẢ danh mục con (cả active và inactive)
        List<Category> children = categoryService.findChildCategories(category.getCategoryId());
        if (!children.isEmpty()) {
            List<CategoryResponse> childResponses = children.stream()
                    .map(this::buildCategoryTree)
                    .toList();
            response.setChildren(childResponses);
        }

        return response;
    }

    private Pageable createSortedPageable(Pageable pageable, String sortBy) {
        // Implement sorting logic based on sortBy parameter
        // This is a simplified version - you might want to add more sorting options
        return pageable;
    }
}
