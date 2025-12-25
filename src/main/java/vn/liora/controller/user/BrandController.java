package vn.liora.controller.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import vn.liora.entity.Brand;
import vn.liora.entity.Category;
import vn.liora.repository.BrandRepository;
import vn.liora.repository.CategoryRepository;

import java.util.List;
import java.util.Optional;

@Controller
public class BrandController {

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping("/brand/{brandId}")
    public String getBrandProducts(@PathVariable Long brandId, Model model) {
        // Get brand information
        Optional<Brand> brandOpt = brandRepository.findById(brandId);
        if (brandOpt.isEmpty()) {
            return "error/404";
        }
        
        Brand brand = brandOpt.get();
        model.addAttribute("brand", brand);
        
        // Get all categories for filter
        List<Category> categories = categoryRepository.findAll();
        model.addAttribute("categories", categories);
        
        return "user/brands/brand-products";
    }
}
