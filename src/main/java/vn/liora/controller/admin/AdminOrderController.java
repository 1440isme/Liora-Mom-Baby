package vn.liora.controller.admin;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.OrderUpdateRequest;
import vn.liora.dto.response.OrderResponse;
import vn.liora.repository.UserRepository;
import vn.liora.service.IOrderService;

import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasAuthority('order.view')")
public class AdminOrderController {
    final IOrderService orderService;
    final UserRepository userRepository;

    @PutMapping("/{idOrder}")
    @PreAuthorize("hasAuthority('order.update_status')")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long idOrder,
            @Valid @RequestBody OrderUpdateRequest request) {
        OrderResponse response = orderService.updateOrderStatus(idOrder, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        List<OrderResponse> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{idOrder}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long idOrder) {
        OrderResponse order = orderService.getOrderById(idOrder);
        return ResponseEntity.ok(order);
    }

    // Lấy đơn hàng theo trạng thái đơn hàng
    @GetMapping("/order-status")
    public ResponseEntity<List<OrderResponse>> getOrdersByOrderStatus(@RequestParam String orderStatus) {
        List<OrderResponse> orders = orderService.getOrdersByOrderStatus(orderStatus);
        return ResponseEntity.ok(orders);
    }

    // Lấy đơn hàng theo khoảng thời gian
    @GetMapping("/date-range")
    public ResponseEntity<List<OrderResponse>> getOrdersByDateRange(
            @RequestParam String start,
            @RequestParam String end) {
        LocalDateTime startDate = LocalDateTime.parse(start);
        LocalDateTime endDate = LocalDateTime.parse(end);
        List<OrderResponse> orders = orderService.getOrdersByDateRange(startDate, endDate);
        return ResponseEntity.ok(orders);
    }

    // Lấy tổng số đơn hàng của một user
    @GetMapping("/count/user/{userId}")
    public ResponseEntity<Long> countByUser(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .map(user -> ResponseEntity.ok(orderService.countByUser(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    // Lấy tổng doanh thu
    @GetMapping("/revenue")
    public ResponseEntity<BigDecimal> getTotalRevenue() {
        BigDecimal total = orderService.getTotalRevenue();
        return ResponseEntity.ok(total);
    }

    // Lấy tổng doanh thu theo user
    @GetMapping("/revenue/user/{userId}")
    public ResponseEntity<BigDecimal> getTotalRevenueByUser(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .map(user -> ResponseEntity.ok(orderService.getTotalRevenueByUser(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    // Lấy thống kê đơn hàng
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getOrderStatistics(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        try {
            Map<String, Object> statistics = new HashMap<>();

            // Lấy tất cả đơn hàng hoặc filter theo thời gian
            List<OrderResponse> allOrders = orderService.getAllOrders();

            // Filter theo thời gian nếu có
            if (dateFrom != null || dateTo != null) {
                LocalDateTime startDate = null;
                LocalDateTime endDate = null;

                if (dateFrom != null) {
                    startDate = LocalDateTime.parse(dateFrom + "T00:00:00");
                }
                if (dateTo != null) {
                    endDate = LocalDateTime.parse(dateTo + "T23:59:59");
                }

                allOrders = orderService.getOrdersByDateRange(startDate, endDate);
            }

            // Tổng số đơn hàng
            statistics.put("totalOrders", (long) allOrders.size());

            // Đơn hàng theo trạng thái
            long pendingCount = allOrders.stream().filter(o -> "PENDING".equals(o.getOrderStatus())).count();
            long confirmedCount = allOrders.stream().filter(o -> "CONFIRMED".equals(o.getOrderStatus())).count();
            long completedCount = allOrders.stream().filter(o -> "COMPLETED".equals(o.getOrderStatus())).count();
            long cancelledCount = allOrders.stream().filter(o -> "CANCELLED".equals(o.getOrderStatus())).count();

            statistics.put("pendingOrders", pendingCount);
            statistics.put("confirmedOrders", confirmedCount);
            statistics.put("completedOrders", completedCount);
            statistics.put("cancelledOrders", cancelledCount);

            // Tổng doanh thu từ tất cả đơn hàng
            BigDecimal totalRevenue = allOrders.stream()
                    .map(OrderResponse::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            statistics.put("totalRevenue", totalRevenue);

            // Doanh thu từ đơn hàng hoàn tất
            BigDecimal completedRevenue = allOrders.stream()
                    .filter(o -> "COMPLETED".equals(o.getOrderStatus()))
                    .map(OrderResponse::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            statistics.put("completedRevenue", completedRevenue);

            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("Error getting order statistics: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

}
