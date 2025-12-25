package vn.liora.controller.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.liora.service.ICategoryService;
import vn.liora.service.IBrandService;
import vn.liora.service.StaticPageService;
import vn.liora.service.IDiscountService;
import vn.liora.dto.response.StaticPageResponse;
import vn.liora.dto.response.DiscountResponse;
import vn.liora.mapper.DiscountMapper;
import vn.liora.entity.Discount;
import java.util.List;

@Controller
@RequestMapping({ "/", "/home" })
@RequiredArgsConstructor
public class HomeController {

    private final ICategoryService categoryService;
    private final IBrandService brandService;
    private final StaticPageService staticPageService;
    private final IDiscountService discountService;
    private final DiscountMapper discountMapper;

    // Dashboard
    @GetMapping()
    public String dashboard(Model model) {
        // Thêm danh mục cha với cây con vào model để sử dụng trong header
        model.addAttribute("parentCategories", categoryService.getCategoryTree());
        // Thêm danh sách thương hiệu active cho section thương hiệu
        model.addAttribute("activeBrands", brandService.findActiveBrands());

        // Lấy 3 bài viết mới nhất của section "lam-dep-cung-liora"
        List<StaticPageResponse> beautyPages = staticPageService.getPublishedPagesBySection("lam-dep-cung-liora");
        if (beautyPages != null && beautyPages.size() > 3) {
            beautyPages = beautyPages.subList(0, 3);
        }
        model.addAttribute("latestBeautyPages", beautyPages);

        // Lấy danh sách mã giảm giá đang hoạt động (tối đa 4 mã)
        // Sử dụng cùng logic như trong UserProductController
        List<Discount> activeDiscounts = discountService.findActiveNow();
        System.out.println("DEBUG: Found " + activeDiscounts.size() + " active discounts");

        List<DiscountResponse> availableDiscounts = activeDiscounts.stream()
                .map(discountMapper::toDiscountResponse)
                .limit(4)
                .toList();
        model.addAttribute("availableDiscounts", availableDiscounts);
        return "user/index";
    }

    // Auth pages
    @GetMapping("/login")
    public String login() {
        return "/";
    }

    @GetMapping("/info")
    public String info(Model model) {
        // Thêm danh mục cha với cây con vào model để sử dụng trong header
        model.addAttribute("parentCategories", categoryService.getCategoryTree());
        return "user/user/info";
    }

    @GetMapping("/search-results")
    public String searchResults(Model model) {
        // Thêm danh mục cha với cây con vào model để sử dụng trong header
        model.addAttribute("parentCategories", categoryService.getCategoryTree());
        // Thêm danh sách thương hiệu active cho filter
        model.addAttribute("activeBrands", brandService.findActiveBrands());
        return "user/search-results";
    }

}
