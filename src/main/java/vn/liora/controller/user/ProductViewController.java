package vn.liora.controller.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import vn.liora.dto.response.ProductResponse;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.service.ICategoryService;
import vn.liora.service.IProductService;

@Controller
@RequestMapping("/product")
@RequiredArgsConstructor
public class ProductViewController {

    private final ICategoryService categoryService;
    private final IProductService productService;

    @GetMapping("/view/category/{categoryId}")
    public String getProductsByCategory(@PathVariable Long categoryId, Model model) {
        try {
            // Get category info for display
            var category = categoryService.findById(categoryId);
            
            // Check if category is active
            if (category.getIsActive() == null || !category.getIsActive()) {
                model.addAttribute("errorMessage", "Danh mục không khả dụng");
                model.addAttribute("errorTitle", "Danh mục tạm ngưng hoạt động");
                model.addAttribute("errorDescription", "Danh mục \"" + category.getName() + "\" hiện đang tạm ngưng hoạt động. Vui lòng quay lại sau.");
                return "error/category-unavailable";
            }
            
            model.addAttribute("categoryId", categoryId);
            model.addAttribute("categoryName", category.getName());
            model.addAttribute("categoryDescription", "Sản phẩm trong danh mục " + category.getName());
            
            return "user/categories/category-products";
        } catch (Exception e) {
            // If category not found, show 404
            return "error/404";
        }
    }

    @GetMapping("/bestseller-products")
    public String getBestsellerProducts(Model model) {
        try {
            // Add categories for navigation
            model.addAttribute("parentCategories", categoryService.getCategoryTree());
            return "user/products/bestseller-products";
        } catch (Exception e) {
            // If error, show 404
            return "error/404";
        }
    }

    @GetMapping("/newest-products")
    public String getNewestProducts(Model model) {
        try {
            // Add categories for navigation
            model.addAttribute("parentCategories", categoryService.getCategoryTree());
            return "user/products/newest-products";
        } catch (Exception e) {
            // If error, show 404
            return "error/404";
        }
    }

    @GetMapping("/similar-products/{productId}")
    public String getSimilarProducts(@PathVariable Long productId, Model model) {
        try {
            // Get original product info
            ProductResponse originalProduct = productService.findById(productId);
            if (originalProduct == null) {
                return "error/404";
            }
            
            model.addAttribute("originalProduct", originalProduct);
            model.addAttribute("productId", productId);
            
            return "user/products/similar-products";
        } catch (Exception e) {
            // If error, show 404
            return "error/404";
        }
    }
    @GetMapping("/featured-category/{categoryId}")
    public String getFeaturedCategoryProducts(@PathVariable Long categoryId, Model model) {
        try {
            // Get category info for display
            var category = categoryService.findById(categoryId);
            
            // Check if category is active
            if (category.getIsActive() == null || !category.getIsActive()) {
                model.addAttribute("errorMessage", "Danh mục không khả dụng");
                model.addAttribute("errorTitle", "Danh mục tạm ngưng hoạt động");
                model.addAttribute("errorDescription", "Danh mục \"" + category.getName() + "\" hiện đang tạm ngưng hoạt động. Vui lòng quay lại sau.");
                return "error/category-unavailable";
            }
            
            model.addAttribute("categoryId", categoryId);
            model.addAttribute("categoryName", category.getName());
            model.addAttribute("categoryDescription", "Tất cả sản phẩm trong danh mục " + category.getName());
            
            return "user/categories/featured-category-products";
        } catch (Exception e) {
            // If category not found, show 404
            return "error/404";
        }
    }

    @GetMapping("/{id}")
    public String productDetail(@PathVariable Long id, 
                               @RequestParam(required = false) String from,
                               @RequestParam(required = false) Long brandId,
                               @RequestParam(required = false) Long categoryId,
                               Model model) {
        try {
            ProductResponse productResponse = productService.findById(id);
            if (productResponse == null) {
                return "error/404";
            }
            
            model.addAttribute("product", productResponse);
            
            // DEBUG: Log parameters
            System.out.println("=== PRODUCT DETAIL DEBUG ===");
            System.out.println("Product ID: " + id);
            System.out.println("From: " + from);
            System.out.println("Brand ID: " + brandId);
            System.out.println("Category ID: " + categoryId);
            System.out.println("Product Brand Name: " + productResponse.getBrandName());
            System.out.println("Product Category Name: " + productResponse.getCategoryName());
            
            // Add navigation context for breadcrumb
            if ("brand".equals(from) && brandId != null) {
                System.out.println("Setting fromBrand = true for brandId: " + brandId + ", brandName: " + productResponse.getBrandName());
                model.addAttribute("fromBrand", true);
                model.addAttribute("brandId", brandId);
                model.addAttribute("brandName", productResponse.getBrandName());
            } else if ("category".equals(from) && categoryId != null) {
                System.out.println("Setting fromCategory = true for categoryId: " + categoryId + ", categoryName: " + productResponse.getCategoryName());
                model.addAttribute("fromCategory", true);
                model.addAttribute("categoryId", categoryId);
                model.addAttribute("categoryName", productResponse.getCategoryName());
            } else {
                System.out.println("No specific navigation context (fromBrand or fromCategory) set.");
            }
            System.out.println("=== END DEBUG ===");
            return "user/products/product-detail";
        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.PRODUCT_NOT_FOUND) {
                return "error/404";
            }
            return "error/404";
        } catch (Exception e) {
            return "error/404";
        }
    }

}
