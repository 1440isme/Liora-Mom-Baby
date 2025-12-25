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
import org.springframework.web.multipart.MultipartFile;
import vn.liora.dto.request.BannerRequest;
import vn.liora.dto.request.BannerSortRequest;
import vn.liora.dto.response.BannerResponse;
import vn.liora.entity.Banner;
import vn.liora.repository.BannerRepository;
import vn.liora.service.BannerService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/admin/banners")
@PreAuthorize("hasAuthority('banner.view')")
public class BannerManagementController {

    @Autowired
    private BannerService bannerService;

    @Autowired
    private BannerRepository bannerRepository;

    // Trang danh sách banner
    @GetMapping
    public String listBanners(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "sortOrder") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            Model model) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<BannerResponse> banners;

        if (search != null && !search.trim().isEmpty()) {
            banners = bannerService.searchBannersByTitle(search, pageable);
        } else if (isActive != null) {
            banners = bannerService.getBannersByActiveStatus(isActive, pageable);
        } else {
            banners = bannerService.getAllBanners(pageable);
        }

        model.addAttribute("banners", banners);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", banners.getTotalPages());
        model.addAttribute("totalElements", banners.getTotalElements());
        model.addAttribute("search", search);
        model.addAttribute("isActive", isActive);
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("sortDir", sortDir);

        return "admin/banners/list";
    }

    // Trang thêm banner
    @GetMapping("/add")
    public String addBannerForm(Model model) {
        model.addAttribute("bannerRequest", new BannerRequest());
        return "admin/banners/add";
    }

    // Xử lý thêm banner
    @PostMapping("/add")
    @PreAuthorize("hasAuthority('banner.create')")
    public String addBanner(@Valid @ModelAttribute BannerRequest bannerRequest,
            BindingResult result,
            @RequestParam("image") MultipartFile image,
            Model model) {
        if (result.hasErrors()) {
            return "admin/banners/add";
        }

        // Validate ảnh
        if (image.isEmpty()) {
            model.addAttribute("error", "Vui lòng chọn ảnh banner");
            return "admin/banners/add";
        }

        try {
            // Upload ảnh qua FileUploadController
            String imageUrl = uploadImageViaAPI(image);
            bannerRequest.setImageUrl(imageUrl);

            bannerService.createBanner(bannerRequest);
            return "redirect:/admin/banners?success=add";
        } catch (Exception e) {
            model.addAttribute("error", "Lỗi khi thêm banner: " + e.getMessage());
            return "admin/banners/add";
        }
    }

    // Trang chỉnh sửa banner
    @GetMapping("/edit/{id}")
    public String editBannerForm(@PathVariable Long id, Model model) {
        try {
            BannerResponse banner = bannerService.getBannerById(id);
            BannerRequest bannerRequest = new BannerRequest();
            bannerRequest.setTitle(banner.getTitle());
            bannerRequest.setImageUrl(banner.getImageUrl());
            bannerRequest.setTargetLink(banner.getTargetLink());
            bannerRequest.setSortOrder(banner.getSortOrder());
            bannerRequest.setIsActive(banner.getIsActive());
            bannerRequest.setStartDate(banner.getStartDate());
            bannerRequest.setEndDate(banner.getEndDate());

            model.addAttribute("bannerRequest", bannerRequest);
            model.addAttribute("banner", banner);
            model.addAttribute("bannerId", id);
            return "admin/banners/edit";
        } catch (Exception e) {
            return "redirect:/admin/banners?error=notfound";
        }
    }

    // Xử lý cập nhật banner
    @PostMapping("/edit/{id}")
    @PreAuthorize("hasAuthority('banner.update')")
    public String updateBanner(@PathVariable Long id,
            @Valid @ModelAttribute BannerRequest bannerRequest,
            BindingResult result,
            @RequestParam(value = "image", required = false) MultipartFile image,
            Model model) {

        System.out.println("=== UPDATE BANNER REQUEST ===");
        System.out.println("Banner ID: " + id);
        System.out.println("Title: " + bannerRequest.getTitle());
        System.out.println("Image file: " + (image != null ? image.getOriginalFilename() : "null"));
        System.out.println("Validation errors: " + result.hasErrors());

        if (result.hasErrors()) {
            System.out.println("Validation errors found: " + result.getAllErrors());
            model.addAttribute("bannerId", id);
            return "admin/banners/edit";
        }

        try {
            // Upload ảnh mới nếu có
            if (image != null && !image.isEmpty()) {
                String imageUrl = uploadImageViaAPI(image);
                bannerRequest.setImageUrl(imageUrl);
            } else {
                // Nếu không có ảnh mới, giữ nguyên ảnh cũ
                // Lấy banner hiện tại để giữ nguyên imageUrl
                BannerResponse currentBanner = bannerService.getBannerById(id);
                if (currentBanner.getImageUrl() != null) {
                    bannerRequest.setImageUrl(currentBanner.getImageUrl());
                }
            }

            bannerService.updateBanner(id, bannerRequest);
            return "redirect:/admin/banners?success=update";
        } catch (Exception e) {
            model.addAttribute("error", "Lỗi khi cập nhật banner: " + e.getMessage());
            model.addAttribute("bannerId", id);
            return "admin/banners/edit";
        }
    }

    // Xóa banner
    @PostMapping("/delete/{id}")
    @ResponseBody
    @PreAuthorize("hasAuthority('banner.delete')")
    public ResponseEntity<Map<String, Object>> deleteBanner(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        try {
            bannerService.deleteBanner(id);
            response.put("success", true);
            response.put("message", "Xóa banner thành công");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi xóa banner: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // Chuyển đổi trạng thái active
    @PostMapping("/toggle-active/{id}")
    @ResponseBody
    @PreAuthorize("hasAuthority('banner.update')")
    public ResponseEntity<Map<String, Object>> toggleActiveStatus(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        try {
            BannerResponse banner = bannerService.toggleActiveStatus(id);
            response.put("success", true);
            response.put("message", "Cập nhật trạng thái thành công");
            response.put("isActive", banner.getIsActive());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi cập nhật trạng thái: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // Sắp xếp lại thứ tự banner
    @PostMapping("/reorder")
    @ResponseBody
    @PreAuthorize("hasAuthority('banner.update')")
    public ResponseEntity<Map<String, Object>> reorderBanners(@RequestBody BannerSortRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            bannerService.reorderBanners(request);
            response.put("success", true);
            response.put("message", "Sắp xếp banner thành công");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi sắp xếp banner: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // API lấy danh sách banner active (cho frontend)
    @GetMapping("/api/active")
    @ResponseBody
    public ResponseEntity<List<BannerResponse>> getActiveBanners() {
        try {
            System.out.println("=== API: Getting active banners ===");

            // Lấy tất cả banner trực tiếp từ repository
            List<Banner> allBanners = bannerRepository.findAll();
            System.out.println("=== API: Total banners in DB: " + allBanners.size() + " ===");

            // Lọc banner active
            List<Banner> activeBanners = allBanners.stream()
                    .filter(banner -> banner.getIsActive() != null && banner.getIsActive())
                    .sorted((a, b) -> {
                        Integer orderA = a.getSortOrder() != null ? a.getSortOrder() : 0;
                        Integer orderB = b.getSortOrder() != null ? b.getSortOrder() : 0;
                        return orderA.compareTo(orderB);
                    })
                    .collect(Collectors.toList());

            System.out.println("=== API: Active banners found: " + activeBanners.size() + " ===");

            // Convert to response
            List<BannerResponse> result = activeBanners.stream()
                    .map(BannerResponse::new)
                    .collect(Collectors.toList());

            System.out.println("=== API: Returning " + result.size() + " banners ===");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("=== API ERROR: " + e.getMessage() + " ===");
            e.printStackTrace();
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    // API lấy thống kê banner
    @GetMapping("/api/stats")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getBannerStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalActive", bannerService.countActiveBanners());
        return ResponseEntity.ok(stats);
    }

    // API test - lấy tất cả banner
    @GetMapping("/api/test")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> testBanners() {
        Map<String, Object> result = new HashMap<>();
        try {
            List<BannerResponse> allBanners = bannerService.getAllBanners(PageRequest.of(0, 10)).getContent();
            result.put("success", true);
            result.put("count", allBanners.size());
            result.put("banners", allBanners);
            System.out.println("=== TEST API: Found " + allBanners.size() + " banners ===");
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            System.err.println("=== TEST API ERROR: " + e.getMessage() + " ===");
        }
        return ResponseEntity.ok(result);
    }

    @Autowired
    private FileUploadController fileUploadController;

    // Upload ảnh qua FileUploadController API
    private String uploadImageViaAPI(MultipartFile file) throws Exception {
        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File không được để trống");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Chỉ cho phép file ảnh");
        }

        // Validate file size (5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File không được vượt quá 5MB");
        }

        // Gọi FileUploadController
        org.springframework.http.ResponseEntity<Map<String, Object>> response = fileUploadController
                .uploadBannerImage(file);

        if (response.getStatusCode().is2xxSuccessful()) {
            Map<String, Object> body = response.getBody();
            if (body != null && (Boolean) body.get("success")) {
                return (String) body.get("url");
            } else {
                String message = body != null ? (String) body.get("message") : "Lỗi không xác định";
                throw new RuntimeException(message);
            }
        } else {
            throw new RuntimeException("Lỗi khi upload ảnh");
        }
    }
}
