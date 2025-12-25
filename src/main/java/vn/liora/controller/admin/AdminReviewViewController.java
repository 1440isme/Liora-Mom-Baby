package vn.liora.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('review.view')")
public class AdminReviewViewController {

    @GetMapping
    public String reviewsPage(Model model) {
        model.addAttribute("pageTitle", "Quản lý đánh giá");
        return "admin/reviews/list";
    }

    @GetMapping("/detail/{id}")
    public String reviewDetailPage(@PathVariable Long id, Model model) {
        model.addAttribute("pageTitle", "Chi tiết đánh giá");
        model.addAttribute("reviewId", id);
        return "admin/reviews/detail";
    }
}