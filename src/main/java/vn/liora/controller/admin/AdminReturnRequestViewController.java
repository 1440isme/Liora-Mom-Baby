package vn.liora.controller.admin;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin/return-requests")
@PreAuthorize("hasAuthority('order.view')")
public class AdminReturnRequestViewController {

    @GetMapping
    public String showReturnRequestsPage() {
        return "admin/return-requests/list";
    }
}
