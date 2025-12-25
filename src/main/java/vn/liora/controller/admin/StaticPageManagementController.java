package vn.liora.controller.admin;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.StaticPageRequest;
import vn.liora.dto.response.StaticPageResponse;
import vn.liora.service.StaticPageService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.text.Normalizer;

@Controller
@RequestMapping("/admin/static-pages")
@PreAuthorize("hasAuthority('static_page.view')")
public class StaticPageManagementController {

    @Autowired
    private StaticPageService staticPageService;

    // Trang danh sách static page
    @GetMapping
    public String listStaticPages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Boolean isPublished,
            Model model) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<StaticPageResponse> staticPages = staticPageService.getStaticPages(search, isActive, isPublished,
                pageable);

        model.addAttribute("staticPages", staticPages);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", staticPages.getTotalPages());
        model.addAttribute("totalElements", staticPages.getTotalElements());
        model.addAttribute("search", search);
        model.addAttribute("isActive", isActive);
        model.addAttribute("isPublished", isPublished);
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("sortDir", sortDir);

        return "admin/static-pages/list";
    }

    // Trang thêm static page
    @GetMapping("/add")
    public String addStaticPageForm(Model model) {
        model.addAttribute("staticPageRequest", new StaticPageRequest());
        return "admin/static-pages/add";
    }

    // Xử lý thêm static page
    @PostMapping("/add")
    @PreAuthorize("hasAuthority('static_page.create')")
    public String addStaticPage(@Valid @ModelAttribute StaticPageRequest staticPageRequest,
            BindingResult result, Model model) {
        if (result.hasErrors()) {
            return "admin/static-pages/add";
        }

        try {
            // Defensive defaults
            if (staticPageRequest.getIsActive() == null) {
                staticPageRequest.setIsActive(false);
            }
            if (staticPageRequest.getIsPublished() == null) {
                staticPageRequest.setIsPublished(false);
            }
            if (staticPageRequest.getSlug() == null || staticPageRequest.getSlug().isBlank()) {
                if (staticPageRequest.getTitle() != null) {
                    String slug = Normalizer.normalize(staticPageRequest.getTitle().toLowerCase(), Normalizer.Form.NFD)
                            .replaceAll("[\\u0300-\\u036f]", "")
                            .replaceAll("[^a-z0-9\\s-]", "")
                            .replaceAll("\\s+", "-")
                            .replaceAll("-+", "-")
                            .trim();
                    staticPageRequest.setSlug(slug);
                }
            }
            if (staticPageRequest.getContent() == null) {
                staticPageRequest.setContent("");
            }

            staticPageService.createStaticPage(staticPageRequest);
            return "redirect:/admin/static-pages?success=add";
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("error", "Lỗi khi thêm trang: " + e.getMessage());
            return "admin/static-pages/add";
        }
    }

    // Trang chỉnh sửa static page
    @GetMapping("/edit/{id}")
    public String editStaticPageForm(@PathVariable Long id, Model model) {
        try {
            StaticPageResponse staticPage = staticPageService.getStaticPageById(id);
            StaticPageRequest staticPageRequest = new StaticPageRequest();
            staticPageRequest.setTitle(staticPage.getTitle());
            staticPageRequest.setSlug(staticPage.getSlug());
            staticPageRequest.setContent(staticPage.getContent());
            staticPageRequest.setSeoTitle(staticPage.getSeoTitle());
            staticPageRequest.setSeoDescription(staticPage.getSeoDescription());
            staticPageRequest.setSeoKeywords(staticPage.getSeoKeywords());
            staticPageRequest.setSectionSlug(staticPage.getSectionSlug());
            staticPageRequest.setIsActive(staticPage.getIsActive());
            staticPageRequest.setIsPublished(staticPage.getIsPublished());

            model.addAttribute("staticPageRequest", staticPageRequest);
            model.addAttribute("staticPageId", id);
            model.addAttribute("staticPage", staticPage);
            return "admin/static-pages/edit";
        } catch (Exception e) {
            return "redirect:/admin/static-pages?error=notfound";
        }
    }

    // Xử lý cập nhật static page
    @PostMapping("/edit/{id}")
    @PreAuthorize("hasAuthority('static_page.update')")
    public String updateStaticPage(@PathVariable Long id,
            @Valid @ModelAttribute StaticPageRequest staticPageRequest,
            BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("staticPageId", id);
            return "admin/static-pages/edit";
        }

        try {
            // Defensive defaults for booleans to avoid null => false issues from form
            if (staticPageRequest.getIsActive() == null) {
                staticPageRequest.setIsActive(false);
            }
            if (staticPageRequest.getIsPublished() == null) {
                staticPageRequest.setIsPublished(false);
            }
            staticPageService.updateStaticPage(id, staticPageRequest);
            return "redirect:/admin/static-pages?success=update";
        } catch (Exception e) {
            model.addAttribute("error", "Lỗi khi cập nhật trang: " + e.getMessage());
            model.addAttribute("staticPageId", id);
            return "admin/static-pages/edit";
        }
    }

    // Xóa static page
    @PostMapping("/delete/{id}")
    @ResponseBody
    @PreAuthorize("hasAuthority('static_page.delete')")
    public ResponseEntity<Map<String, Object>> deleteStaticPage(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        try {
            staticPageService.deleteStaticPage(id);
            response.put("success", true);
            response.put("message", "Xóa trang thành công");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi xóa trang: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // Chuyển đổi trạng thái active
    @PostMapping("/toggle-active/{id}")
    @ResponseBody
    @PreAuthorize("hasAuthority('static_page.update')")
    public ResponseEntity<Map<String, Object>> toggleActiveStatus(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        try {
            StaticPageResponse staticPage = staticPageService.toggleActiveStatus(id);
            response.put("success", true);
            response.put("message", "Cập nhật trạng thái hoạt động thành công");
            response.put("isActive", staticPage.getIsActive());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi cập nhật trạng thái: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // Chuyển đổi trạng thái published
    @PostMapping("/toggle-published/{id}")
    @ResponseBody
    @PreAuthorize("hasAuthority('static_page.update')")
    public ResponseEntity<Map<String, Object>> togglePublishedStatus(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        try {
            StaticPageResponse staticPage = staticPageService.togglePublishedStatus(id);
            response.put("success", true);
            response.put("message", "Cập nhật trạng thái xuất bản thành công");
            response.put("isPublished", staticPage.getIsPublished());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi cập nhật trạng thái: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // Tạo slug từ title
    @PostMapping("/generate-slug")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> generateSlug(@RequestParam String title) {
        Map<String, Object> response = new HashMap<>();

        try {
            String slug = staticPageService.generateSlugFromTitle(title);
            response.put("success", true);
            response.put("slug", slug);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi tạo slug: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // API lấy danh sách static page active (cho frontend)
    @GetMapping("/api/active")
    @ResponseBody
    public ResponseEntity<List<StaticPageResponse>> getActiveStaticPages() {
        List<StaticPageResponse> staticPages = staticPageService.getActiveStaticPages();
        return ResponseEntity.ok(staticPages);
    }

    // API lấy static page theo slug (cho frontend)
    @GetMapping("/api/slug/{slug}")
    @ResponseBody
    public ResponseEntity<StaticPageResponse> getStaticPageBySlug(@PathVariable String slug) {
        try {
            StaticPageResponse staticPage = staticPageService.getStaticPageBySlug(slug);
            return ResponseEntity.ok(staticPage);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // API tìm kiếm static page theo từ khóa
    @GetMapping("/api/search")
    @ResponseBody
    public ResponseEntity<List<StaticPageResponse>> searchStaticPages(@RequestParam String keyword) {
        List<StaticPageResponse> staticPages = staticPageService.searchStaticPagesByKeyword(keyword);
        return ResponseEntity.ok(staticPages);
    }

    // API lấy thống kê static page
    @GetMapping("/api/stats")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getStaticPageStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalActive", staticPageService.countActiveStaticPages());
        stats.put("totalPublished", staticPageService.countPublishedStaticPages());
        return ResponseEntity.ok(stats);
    }
}
