package vn.liora.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.liora.dto.response.CategoryResponse;
import vn.liora.service.ICategoryService;

@Controller
@RequestMapping("/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('category.view')")
public class CategoryViewController {

    private final ICategoryService categoryService;

    private void addCurrentUserToModel(Model model) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            model.addAttribute("currentUser", authentication.getName());
        }
    }

    @GetMapping
    public String listCategories(Model model) {
        addCurrentUserToModel(model);
        return "admin/categories/list";
    }

    @GetMapping("/add")
    public String addCategory(Model model) {
        addCurrentUserToModel(model);
        return "admin/categories/add";
    }

    @GetMapping("/{id}/edit")
    public String editCategory(@PathVariable Long id, Model model) {
        try {
            addCurrentUserToModel(model);
            CategoryResponse category = categoryService.findById(id);
            model.addAttribute("category", category);
            return "admin/categories/edit";
        } catch (Exception e) {
            return "redirect:/admin/categories?error=notfound";
        }
    }
}
