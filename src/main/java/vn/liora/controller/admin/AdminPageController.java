package vn.liora.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.response.TopCustomerResponse;
import vn.liora.service.IBrandService;
import vn.liora.service.ICategoryService;
import vn.liora.service.IDashboardService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminPageController {

    private final ICategoryService categoryService;
    private final IBrandService brandService;
    private final IDashboardService dashboardService;

    private void addCurrentUserToModel(Model model) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            model.addAttribute("currentUser", authentication.getName());
        }
    }

    @GetMapping("/revenue")
    @ResponseBody
    public Map<String, Double> getRevenueData(
            @RequestParam String type, // time/category/brand
            @RequestParam(required = false, defaultValue = "day") String groupType, // chỉ dùng cho "time"
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        return switch (type.toLowerCase()) {
            case "category" -> dashboardService.getRevenueByCategory(startDate, endDate);
            case "brand" -> dashboardService.getRevenueByBrand(startDate, endDate);
            default -> dashboardService.getRevenueByTime(groupType, startDate, endDate);
        };
    }

    // API lấy đơn hàng gần đây theo khoảng thời gian
    @GetMapping("/analytics/recent-orders")
    @ResponseBody
    public List<Object> getRecentOrdersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "15") int limit) {
        return dashboardService.getRecentOrdersByDateRange(limit, startDate, endDate).stream()
                .map(order -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", order.getId());
                    map.put("customerName", order.getCustomerName());
                    map.put("totalAmount", order.getTotalAmount());
                    map.put("status", order.getStatus());
                    map.put("paymentStatus", order.getPaymentStatus());
                    map.put("createdAt", order.getCreatedAt());
                    return map;
                })
                .collect(Collectors.toList());
    }

    // API lấy sản phẩm bán chạy theo khoảng thời gian
    @GetMapping("/analytics/top-products")
    @ResponseBody
    public List<Object> getTopProductsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "15") int limit) {
        return dashboardService.getTopProductsByDateRange(limit, startDate, endDate).stream()
                .map(product -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", product.getId());
                    map.put("name", product.getName());
                    map.put("categoryName", product.getCategoryName());
                    map.put("soldQuantity", product.getSoldQuantity());
                    map.put("revenue", product.getRevenue());
                    map.put("rating", product.getRating());
                    return map;
                })
                .collect(Collectors.toList());
    }

    // API lấy tổng doanh thu theo khoảng thời gian
    @GetMapping("/analytics/total-revenue")
    @ResponseBody
    public Map<String, Object> getTotalRevenueByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("totalRevenue", dashboardService.getTotalRevenueByDateRange(startDate, endDate));
        return result;
    }

    // API lấy tổng đơn hàng theo khoảng thời gian
    @GetMapping("/analytics/total-orders")
    @ResponseBody
    public Map<String, Object> getTotalOrdersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("totalOrders", dashboardService.getTotalOrdersByDateRange(startDate, endDate));
        return result;
    }

    // API lấy tổng số khách hàng theo khoảng thời gian
    @GetMapping("/analytics/total-customers")
    @ResponseBody
    public Map<String, Object> getTotalCustomersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("totalCustomers", dashboardService.getTotalCustomersByDateRange(startDate, endDate));
        return result;
    }

    // API lấy Tổng doanh thu gộp (Gross Revenue)
    @GetMapping("/analytics/gross-revenue")
    @ResponseBody
    public Map<String, Object> getGrossRevenueByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("grossRevenue", dashboardService.getGrossRevenue(startDate, endDate));
        return result;
    }

    // API lấy Chi phí Marketing (Marketing Spend)
    @GetMapping("/analytics/marketing-spend")
    @ResponseBody
    public Map<String, Object> getMarketingSpendByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("marketingSpend", dashboardService.getMarketingSpend(startDate, endDate));
        return result;
    }

    // API lấy Doanh thu thực tế (Net Revenue)
    @GetMapping("/analytics/net-revenue")
    @ResponseBody
    public Map<String, Object> getNetRevenueByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("netRevenue", dashboardService.getNetRevenue(startDate, endDate));
        return result;
    }

    // API lấy Average Order Value (AOV)
    @GetMapping("/analytics/average-order-value")
    @ResponseBody
    public Map<String, Object> getAverageOrderValueByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("averageOrderValue", dashboardService.getAverageOrderValue(startDate, endDate));
        return result;
    }

    // API lấy Return Rate
    @GetMapping("/analytics/return-rate")
    @ResponseBody
    public Map<String, Object> getReturnRateByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("returnRate", dashboardService.getReturnRate(startDate, endDate));
        return result;
    }

    // API lấy Revenue by Payment Method
    @GetMapping("/analytics/revenue-by-payment-method")
    @ResponseBody
    public Map<String, Object> getRevenueByPaymentMethodByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("revenueByPaymentMethod", dashboardService.getRevenueByPaymentMethod(startDate, endDate));
        return result;
    }

    // API lấy Order Status Distribution
    @GetMapping("/analytics/order-status-distribution")
    @ResponseBody
    public Map<String, Object> getOrderStatusDistributionByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("orderStatusDistribution", dashboardService.getOrderStatusDistribution(startDate, endDate));
        return result;
    }

    // API lấy Repeat Purchase Rate
    @GetMapping("/analytics/repeat-purchase-rate")
    @ResponseBody
    public Map<String, Object> getRepeatPurchaseRateByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("repeatPurchaseRate", dashboardService.getRepeatPurchaseRate(startDate, endDate));
        return result;
    }

    // API lấy Revenue per Customer
    @GetMapping("/analytics/revenue-per-customer")
    @ResponseBody
    public Map<String, Object> getRevenuePerCustomerByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("revenuePerCustomer", dashboardService.getRevenuePerCustomer(startDate, endDate));
        return result;
    }

    // API lấy dữ liệu khách hàng mới theo tháng
    @GetMapping("/customers/new-by-month")
    @ResponseBody
    public Map<String, Long> getNewCustomersByMonth() {
        return dashboardService.getNewCustomersByMonth();
    }

    // API lấy số sản phẩm được bán theo khoảng thời gian
    @GetMapping("/analytics/total-products-sold")
    @ResponseBody
    public Map<String, Object> getTotalProductsSoldByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("totalProductsSold", dashboardService.countSoldProductsByDateRange(startDate, endDate));
        return result;
    }

    // API lấy số thương hiệu được bán theo khoảng thời gian
    @GetMapping("/analytics/total-brands-sold")
    @ResponseBody
    public Map<String, Object> getTotalBrandsSoldByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("totalBrandsSold", dashboardService.countSoldBrandsByDateRange(startDate, endDate));
        return result;
    }

    // API lấy dữ liệu thống kê khách hàng theo khoảng thời gian
    @GetMapping("/analytics/customer-stats")
    @ResponseBody
    public Map<String, Object> getCustomerStatsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        result.put("newCustomers", dashboardService.getNewCustomersByDateRange(startDate, endDate));
        result.put("returningCustomers", dashboardService.getReturningCustomersByDateRange(startDate, endDate));

        // Convert List<TopCustomerResponse> to List<Map>
        List<TopCustomerResponse> topCustomers = dashboardService.getTopCustomersByDateRange(10, startDate, endDate);
        result.put("topCustomers", topCustomers.stream()
                .map(c -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("userId", c.getUserId());
                    map.put("fullName", c.getFullName());
                    map.put("email", c.getEmail());
                    map.put("ordersCount", c.getOrdersCount());
                    map.put("totalSpent", c.getTotalSpent());
                    return map;
                })
                .collect(Collectors.toList()));

        return result;
    }

    // Dashboard
    @GetMapping({ "", "/", "/dashboard" })
    public String dashboard(Model model) {
        addCurrentUserToModel(model);

        // Quick stats - các thông số quan trọng để xem nhanh
        model.addAttribute("todayRevenue", dashboardService.getTodayRevenue());
        model.addAttribute("thisWeekRevenue", dashboardService.getThisWeekRevenue());
        model.addAttribute("thisMonthRevenue", dashboardService.getThisMonthRevenue());
        model.addAttribute("todayOrders", dashboardService.getTodayOrders());
        model.addAttribute("newCustomersThisMonth", dashboardService.getNewCustomersThisMonth()); // Đồng bộ với
                                                                                                  // analytics
        model.addAttribute("pendingOrders", dashboardService.getPendingOrders());
        model.addAttribute("confirmedOrders", dashboardService.getConfirmedOrders());
        model.addAttribute("lowStockProducts", dashboardService.getLowStockProductsList(10));

        model.addAttribute("recentOrders", dashboardService.getRecentOrders(5));
        model.addAttribute("topProducts", dashboardService.getTopProducts(5));

        return "admin/dashboard/index";
    }

    // Auth pages
    @GetMapping("/login")
    public String login() {
        return "admin/auth/login";
    }

    @GetMapping("/profile")
    public String profile(Model model) {
        addCurrentUserToModel(model);
        return "admin/auth/profile";
    }

    // Products
    @GetMapping("/products")
    public String productsList(Model model) {
        addCurrentUserToModel(model);
        return "admin/products/list";
    }

    @GetMapping("/products/add")
    public String productsAdd(Model model) {
        addCurrentUserToModel(model);
        // Thêm dữ liệu categories và brands vào model
        model.addAttribute("categories", categoryService.findActiveCategories());
        model.addAttribute("brands", brandService.findActiveBrands());
        return "admin/products/add";
    }

    @GetMapping("/products/{id}")
    public String productsDetail(@PathVariable("id") Long id, Model model) {
        addCurrentUserToModel(model);
        return "admin/products/detail";
    }

    @GetMapping("/products/{id}/edit")
    public String productsEdit(@PathVariable("id") Long id, Model model) {
        addCurrentUserToModel(model);
        return "admin/products/edit";
    }

    // Categories - Removed duplicate mappings (handled by CategoryViewController)

    // Brands
    @GetMapping("/brands")
    public String brandsList(Model model) {
        addCurrentUserToModel(model);
        return "admin/brands/list";
    }

    @GetMapping("/brands/add")
    public String brandsAdd(Model model) {
        addCurrentUserToModel(model);
        return "admin/brands/add";
    }

    @GetMapping("/brands/{id}/edit")
    public String brandsEdit(@PathVariable("id") Long id, Model model) {
        addCurrentUserToModel(model);
        return "admin/brands/edit";
    }

    // Orders
    @GetMapping("/orders")
    public String ordersList(Model model) {
        addCurrentUserToModel(model);
        return "admin/orders/list";
    }

    @GetMapping("/orders/detail/{id}")
    public String ordersDetail(@PathVariable Long id, Model model) {
        addCurrentUserToModel(model);
        model.addAttribute("orderId", id);
        return "admin/orders/detail";
    }

    // Users
    @GetMapping("/users")
    @PreAuthorize("hasAuthority('user.view')")
    public String usersList(Model model) {
        addCurrentUserToModel(model);
        return "admin/users/list";
    }

    @GetMapping("/users/add")
    @PreAuthorize("hasAuthority('user.create')")
    public String usersAdd(Model model) {
        addCurrentUserToModel(model);
        return "admin/users/add";
    }

    @GetMapping("/users/{id}/edit")
    @PreAuthorize("hasAuthority('user.update')")
    public String usersEdit(@PathVariable("id") Long id, Model model) {
        addCurrentUserToModel(model);
        model.addAttribute("userId", id);
        return "admin/users/edit";
    }

    @GetMapping("/users/wallet")
    @PreAuthorize("hasAuthority('wallet.view')")
    public String userWallet(@RequestParam Long userId, Model model) {
        addCurrentUserToModel(model);
        model.addAttribute("userId", userId);
        return "admin/users/wallet";
    }

    // Roles
    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('role.view')")
    public String rolesList(Model model) {
        addCurrentUserToModel(model);
        return "admin/roles/list";
    }

    @GetMapping("/roles/manage")
    @PreAuthorize("hasAuthority('role.manage_permissions')")
    public String rolesManage(Model model) {
        addCurrentUserToModel(model);
        return "admin/roles/manage";
    }

    // Permissions
    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('permission.view')")
    public String permissionsList(Model model) {
        addCurrentUserToModel(model);
        return "admin/permissions/list";
    }

    @GetMapping("/permissions/manage")
    @PreAuthorize("hasAuthority('permission.manage')")
    public String permissionsManage(Model model) {
        addCurrentUserToModel(model);
        return "admin/permissions/manage";
    }

    // Analytics
    @GetMapping("/analytics")
    public String analytics(Model model) {
        addCurrentUserToModel(model);
        model.addAttribute("totalRevenue", dashboardService.getTotalRevenue());
        model.addAttribute("totalOrders", dashboardService.getTotalOrders());
        model.addAttribute("totalProducts", dashboardService.getTotalProducts());
        model.addAttribute("totalBrands", brandService.count());
        model.addAttribute("totalCustomers", dashboardService.getTotalCustomers());
        model.addAttribute("returningCustomers", dashboardService.getReturningCustomers());
        model.addAttribute("newCustomersThisMonth", dashboardService.getNewCustomersThisMonth());

        model.addAttribute("recentOrders", dashboardService.getRecentOrders(15));
        model.addAttribute("topProducts", dashboardService.getTopProducts(15));
        model.addAttribute("lowStockProducts", dashboardService.getLowStockProductsList(10));
        model.addAttribute("topCustomers", dashboardService.getTopCustomers(10));
        return "admin/analytics/index";
    }
}
