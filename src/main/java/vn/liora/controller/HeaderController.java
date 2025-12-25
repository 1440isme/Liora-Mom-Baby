package vn.liora.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.response.CategoryResponse;
import vn.liora.service.ICategoryService;

import java.util.List;

@RestController
@RequestMapping("/api/header")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class HeaderController {

    private final ICategoryService categoryService;

    @GetMapping("/categories")
    public String getHeaderCategories(Model model) {
        // Lấy danh mục cha (isParent = true) và active
        model.addAttribute("parentCategories", categoryService.findActiveRootCategories());
        return "fragments/header-categories";
    }

    // API endpoint để lấy categories cho header với cấu trúc 3 tầng
    @GetMapping("/categories/api")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getHeaderCategoriesApi() {
        ApiResponse<List<CategoryResponse>> response = new ApiResponse<>();
        try {
            System.out.println("Loading categories for header...");

            // Lấy cây danh mục với cấu trúc đầy đủ (3 tầng)
            List<CategoryResponse> categoryTree = categoryService.getCategoryTree();

            System.out.println("Found " + categoryTree.size() + " root categories");
            System.out.println("Category names: " + categoryTree.stream().map(cat -> cat.getName()).toList());

            response.setResult(categoryTree);
            response.setMessage("Lấy danh sách danh mục cho header thành công");
            response.setCode(200);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error loading categories: " + e.getMessage());
            e.printStackTrace();

            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh mục cho header: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
