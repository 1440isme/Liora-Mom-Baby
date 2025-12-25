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
import org.springframework.web.bind.annotation.RequestParam;
import vn.liora.dto.response.DiscountResponse;
import vn.liora.service.IDiscountService;

@Controller
@RequestMapping("/admin/discounts")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('discount.view')")
public class AdminDiscountViewController {

    private final IDiscountService discountService;

    private void addCurrentUserToModel(Model model) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            model.addAttribute("currentUser", authentication.getName());
        }
    }

    // ========== LIST DISCOUNTS ==========
    @GetMapping
    public String listDiscounts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        addCurrentUserToModel(model);

        // Add filter parameters to model for form persistence
        model.addAttribute("search", search);
        model.addAttribute("status", status);
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("sortDir", sortDir);
        model.addAttribute("currentPage", page);
        model.addAttribute("pageSize", size);

        // Add status options for filter dropdown
        model.addAttribute("statusOptions", new String[] { "active", "inactive", "expired", "upcoming" });

        return "admin/discounts/list";
    }

    // ========== ADD DISCOUNT ==========
    @GetMapping("/add")
    public String addDiscount(Model model) {
        addCurrentUserToModel(model);
        return "admin/discounts/add";
    }

    // ========== EDIT DISCOUNT ==========
    @GetMapping("/{id}/edit")
    public String editDiscount(@PathVariable Long id, Model model) {
        try {
            addCurrentUserToModel(model);
            DiscountResponse discount = discountService.findById(id);
            model.addAttribute("discount", discount);
            return "admin/discounts/edit";
        } catch (Exception e) {
            return "redirect:/admin/discounts?error=notfound";
        }
    }

    // ========== DISCOUNT DETAIL ==========
    @GetMapping("/{id}/detail")
    public String discountDetail(@PathVariable Long id, Model model) {
        try {
            addCurrentUserToModel(model);
            DiscountResponse discount = discountService.findById(id);
            model.addAttribute("discount", discount);
            return "admin/discounts/detail";
        } catch (Exception e) {
            return "redirect:/admin/discounts?error=notfound";
        }
    }

    // ========== ACTIVE DISCOUNTS ==========
    @GetMapping("/active")
    public String activeDiscounts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        addCurrentUserToModel(model);
        model.addAttribute("currentPage", page);
        model.addAttribute("pageSize", size);
        model.addAttribute("filterType", "active");

        return "admin/discounts/list";
    }

    // ========== INACTIVE DISCOUNTS ==========
    @GetMapping("/inactive")
    public String inactiveDiscounts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        addCurrentUserToModel(model);
        model.addAttribute("currentPage", page);
        model.addAttribute("pageSize", size);
        model.addAttribute("filterType", "inactive");

        return "admin/discounts/list";
    }

    // ========== EXPIRED DISCOUNTS ==========
    @GetMapping("/expired")
    public String expiredDiscounts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        addCurrentUserToModel(model);
        model.addAttribute("currentPage", page);
        model.addAttribute("pageSize", size);
        model.addAttribute("filterType", "expired");

        return "admin/discounts/list";
    }

    // ========== UPCOMING DISCOUNTS ==========
    @GetMapping("/upcoming")
    public String upcomingDiscounts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        addCurrentUserToModel(model);
        model.addAttribute("currentPage", page);
        model.addAttribute("pageSize", size);
        model.addAttribute("filterType", "upcoming");

        return "admin/discounts/list";
    }
}