package vn.liora.controller.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.FooterRequest;
import vn.liora.dto.response.StaticPageResponse;
import vn.liora.entity.*;
import vn.liora.service.FooterService;
import vn.liora.service.StaticPageService;
import vn.liora.service.ICategoryService;

import java.util.List;

@Controller
@RequestMapping("/admin/footer")
@PreAuthorize("hasAuthority('footer.manage')")
public class FooterController {

    @Autowired
    private FooterService footerService;

    @Autowired
    private StaticPageService staticPageService;

    @Autowired
    private ICategoryService categoryService;

    @GetMapping
    public String footerManagement(Model model) {
        Footer activeFooter = footerService.getActiveFooter();
        List<StaticPageResponse> staticPages = staticPageService.getActiveStaticPages();
        List<Category> parentCategories = categoryService.findActiveRootCategories();

        model.addAttribute("footer", activeFooter);
        model.addAttribute("staticPages", staticPages);
        model.addAttribute("parentCategories", parentCategories);
        model.addAttribute("footerRequest", new FooterRequest());

        return "admin/footer/manage";
    }

    @PostMapping("/save")
    @PreAuthorize("hasAuthority('footer.manage')")
    public String saveFooter(@ModelAttribute FooterRequest footerRequest) {
        try {
            footerService.saveOrUpdateFooter(footerRequest);
            return "redirect:/admin/footer";
        } catch (Exception e) {
            System.err.println("Error saving footer: " + e.getMessage());
            e.printStackTrace();
            return "redirect:/admin/footer";
        }
    }

    @GetMapping("/preview")
    public String previewFooter(Model model) {
        Footer activeFooter = footerService.getActiveFooter();
        if (activeFooter != null) {
            List<FooterColumn> columns = footerService.getActiveColumns(activeFooter.getId());
            List<FooterSocialLink> socialLinks = footerService.getActiveSocialLinks(activeFooter.getId());

            model.addAttribute("footer", activeFooter);
            model.addAttribute("columns", columns);
            model.addAttribute("socialLinks", socialLinks);
        }
        return "admin/footer/preview";
    }

    @GetMapping("/init")
    public String initializeDefaultFooter() {
        footerService.initializeDefaultFooter();
        return "redirect:/admin/footer";
    }
}
