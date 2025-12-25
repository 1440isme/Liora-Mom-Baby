package vn.liora.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.liora.dto.response.LowStockProductResponse;
import vn.liora.dto.response.RecentOrderResponse;
import vn.liora.dto.response.TopCustomerResponse;
import vn.liora.dto.response.TopProductResponse;
import vn.liora.entity.Order;
import vn.liora.repository.OrderRepository;
import vn.liora.service.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
public class DashboardServiceImpl implements IDashboardService {
    @Autowired
    private IOrderService orderService;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private IProductService productService;
    @Autowired
    private IUserService userService;
    @Autowired
    private IOrderProductService orderProductService;

    @Override
    public BigDecimal getTotalRevenue() {
        return orderService.getTotalRevenueCompleted();
    }

    @Override
    public BigDecimal getTotalRevenueByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        // Tính tổng doanh thu từ các đơn hàng đã hoàn thành trong khoảng thời gian
        List<Order> orders = orderRepository.findByOrderDateBetweenAndOrderStatus(startDate, endDate, "COMPLETED");
        return orders.stream()
                .map(o -> o.getTotal() != null ? o.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public long getTotalOrders() {
        return orderService.getOrdersByOrderStatus("COMPLETED").size() + orderService.getOrdersByOrderStatus("PENDING").size() +
               orderService.getOrdersByOrderStatus("CONFIRMED").size() + orderService.getOrdersByOrderStatus("CANCELLED").size();
    }

    @Override
    public long getTotalOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        // Đếm tổng số đơn hàng đã COMPLETED trong khoảng thời gian
        List<Order> orders = orderRepository.findByOrderDateBetweenAndOrderStatus(startDate, endDate, "COMPLETED");
        return orders.size();
    }

    @Override
    public long getTotalProducts() {
        return productService.count();
    }

    @Override
    public long getTotalCustomers() {
        return userService.count() - 1; // Trừ 1 tài khoản admin
    }

    @Override
    public long getTotalCustomersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        // Đếm tổng số khách hàng CÓ ĐƠN HÀNG trong khoảng thời gian
        List<Order> ordersInRange = orderRepository.findByOrderDateBetweenAndOrderStatus(startDate, endDate, "COMPLETED");
        return ordersInRange.stream()
                .map(o -> o.getUser() != null ? o.getUser().getUserId() : null)
                .filter(userId -> userId != null)
                .distinct()
                .count();
    }

    @Override
    public long getPendingOrders() {
        return orderService.getOrdersByOrderStatus("PENDING").size();
    }

    @Override
    public long getLowStockProducts() {
        // Chỉ đếm sản phẩm sắp hết hàng (1-10), không bao gồm sản phẩm đã hết hàng (stock = 0)
        return productService.findByStockLessThanEqual(10).stream()
                .filter(p -> p.getStock() > 0)
                .count();
    }

    @Override
    public BigDecimal getTodayRevenue() {
        return orderService.getRevenueByDate(LocalDate.now());
    }

    @Override
    public double getConversionRate() {
        // Đếm số khách hàng đã có ít nhất 1 đơn hàng COMPLETED
        long customersWhoOrdered = orderService.countCustomersWithCompletedOrders();
        
        // Tổng số khách hàng (trừ admin)
        long totalCustomers = userService.count() - 1;
        
        if (totalCustomers == 0) {
            return 0.0;
        }
        
        // Conversion Rate = (Số khách hàng đã mua / Tổng số khách hàng) × 100%
        return ((double) customersWhoOrdered / totalCustomers) * 100.0;
    }

    @Override
    public List<RecentOrderResponse> getRecentOrders(int limit) {
        // ✅ Gọi qua orderService để lấy danh sách đơn hàng mới nhất
        List<Order> recentOrders = orderService.getRecentOrders(limit);

        return recentOrders.stream()
                    .map(o -> {
                        String customerName;
                        if (o.getUser() != null) {
                            if (o.getUser().getLastname() != null) {
                                String firstname = o.getUser().getFirstname() != null ? o.getUser().getFirstname() + " " : "";
                                customerName = firstname + o.getUser().getLastname();
                            } else {
                                customerName = o.getUser().getUsername();
                            }
                        } else {
                            customerName = "Ẩn danh";
                        }
                        return RecentOrderResponse.builder()
                                .id(o.getIdOrder())
                                .customerName(customerName)
                                .totalAmount(Optional.ofNullable(o.getTotal()).orElse(BigDecimal.ZERO))
                                .status(o.getOrderStatus())
                                .paymentStatus(o.getPaymentStatus())
                                .createdAt(o.getOrderDate())
                                .build();
                    })
                    .collect(Collectors.toList());
    }

    @Override
    public List<TopProductResponse> getTopProducts(int limit) {
        return productService.getTopSellingProducts(limit);
    }

    @Override
    public List<TopProductResponse> getTopProductsByDateRange(int limit, LocalDateTime startDate, LocalDateTime endDate) {
        List<Object[]> results = orderProductService.getTopSellingProductsByDateRange(startDate, endDate);
        
        return results.stream()
                .limit(limit)
                .map(row -> TopProductResponse.builder()
                        .id(((Number) row[0]).longValue())
                        .name((String) row[1])
                        .categoryName((String) row[2])
                        .soldQuantity(((Number) row[3]).longValue())
                        .revenue(BigDecimal.valueOf(((Number) row[4]).doubleValue()))
                        .rating(row[5] != null ? BigDecimal.valueOf(((Number) row[5]).doubleValue()) : BigDecimal.ZERO)
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<RecentOrderResponse> getRecentOrdersByDateRange(int limit, LocalDateTime startDate, LocalDateTime endDate) {
        List<Order> allOrders = orderService.getOrdersByDateRange(startDate, endDate)
                .stream()
                .map(orderResponse -> {
                    try {
                        Order order = orderRepository.findById(orderResponse.getIdOrder())
                                .orElse(null);
                        return order;
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(order -> order != null)
                .sorted((o1, o2) -> o2.getOrderDate().compareTo(o1.getOrderDate()))
                .limit(limit)
                .collect(Collectors.toList());

        return allOrders.stream()
                .map(o -> {
                    String customerName;
                    if (o.getUser() != null) {
                        if (o.getUser().getLastname() != null) {
                            String firstname = o.getUser().getFirstname() != null ? o.getUser().getFirstname() + " " : "";
                            customerName = firstname + o.getUser().getLastname();
                        } else {
                            customerName = o.getUser().getUsername();
                        }
                    } else {
                        customerName = "Ẩn danh";
                    }
                    return RecentOrderResponse.builder()
                            .id(o.getIdOrder())
                            .customerName(customerName)
                            .totalAmount(Optional.ofNullable(o.getTotal()).orElse(BigDecimal.ZERO))
                            .status(o.getOrderStatus())
                            .paymentStatus(o.getPaymentStatus())
                            .createdAt(o.getOrderDate())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<LowStockProductResponse> getLowStockProductsList(int threshold) {
        return productService.findByStockLessThanEqual(threshold).stream()
                .filter(product -> product.getStock() > 0) // Chỉ lấy sản phẩm sắp hết hàng, không lấy sản phẩm đã hết hàng
                .map(product -> LowStockProductResponse.builder()
                        .productId(product.getProductId())
                        .name(product.getName())
                        .stock(product.getStock())
                        .categoryName(product.getCategory().getName())
                        .isActive(product.getIsActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Double> getRevenueByTime(String groupType, LocalDateTime startDate, LocalDateTime endDate) {
        List<Object[]> results;
        Map<String, Double> data = new LinkedHashMap<>();

        switch (groupType.toLowerCase()) {
            case "month" -> {
                results = orderService.getRevenueByMonth(startDate, endDate);
                for (Object[] row : results)
                    data.put("Tháng " + row[0], ((Number) row[1]).doubleValue());
            }
            case "year" -> {
                results = orderService.getRevenueByYear(startDate, endDate);
                for (Object[] row : results)
                    data.put("Năm " + row[0], ((Number) row[1]).doubleValue());
            }
            default -> {
                results = orderService.getRevenueByDay(startDate, endDate);
                for (Object[] row : results)
                    data.put(row[0].toString(), ((Number) row[1]).doubleValue());
            }
        }
        return data;
    }

    @Override
    public Map<String, Double> getRevenueByCategory(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Double> data = new LinkedHashMap<>();
        List<Object[]> results = orderProductService.getRevenueByCategory(startDate, endDate);
        for (Object[] row : results)
            data.put((String) row[0], ((Number) row[1]).doubleValue());
        return data;
    }

    @Override
    public Map<String, Double> getRevenueByBrand(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Double> data = new LinkedHashMap<>();
        List<Object[]> results = orderProductService.getRevenueByBrand(startDate, endDate);
        for (Object[] row : results)
            data.put((String) row[0], ((Number) row[1]).doubleValue());
        return data;
    }

    @Override
    public long getNewCustomersThisMonth() {
        return userService.countNewCustomersThisMonth();
    }

    @Override
    public long getNewCustomersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return userService.countNewCustomersByDateRange(startDate, endDate);
    }

    @Override
    public double getReturningCustomers() {
        long returningCustomers = orderService.countReturningCustomers();
        long totalCustomers = userService.count() - 1; // Trừ 1 tài khoản admin
        if (totalCustomers == 0) {
            return 0;
        }
        return ((double) returningCustomers / totalCustomers) * 100;
    }

    @Override
    public double getReturningCustomersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        // Khách hàng đã đặt đơn trong khoảng thời gian (chỉ tính orders đã COMPLETED)
        List<Order> ordersInRange = orderRepository.findByOrderDateBetweenAndOrderStatus(startDate, endDate, "COMPLETED");
        
        // Tổng số khách hàng có đơn hàng (tính trong khoảng thời gian)
        long totalCustomersInRange = ordersInRange.stream()
                .map(o -> o.getUser() != null ? o.getUser().getUserId() : null)
                .filter(userId -> userId != null)
                .distinct()
                .count();
        
        if (totalCustomersInRange == 0) {
            return 0;
        }
        
        // Khách hàng quay lại = khách hàng có > 1 đơn hàng trong khoảng thời gian
        long returningCustomers = ordersInRange.stream()
                .collect(Collectors.groupingBy(o -> o.getUser() != null ? o.getUser().getUserId() : null))
                .values()
                .stream()
                .filter(orderList -> orderList.size() > 1)
                .count();
        
        return ((double) returningCustomers / totalCustomersInRange) * 100;
    }

    @Override
    public List<TopCustomerResponse> getTopCustomers(int limit) {
        return orderService.getTopSpenders(limit);
    }

    @Override
    public List<TopCustomerResponse> getTopCustomersByDateRange(int limit, LocalDateTime startDate, LocalDateTime endDate) {
        // Lấy top khách hàng chi tiêu cao nhất trong khoảng thời gian (chỉ tính orders đã COMPLETED)
        List<Order> ordersInRange = orderRepository.findByOrderDateBetweenAndOrderStatus(startDate, endDate, "COMPLETED");
        
        // Group by user and calculate total spent
        Map<Long, TopCustomerResponse> customerMap = new LinkedHashMap<>();
        
        for (Order order : ordersInRange) {
            if (order.getUser() == null || order.getTotal() == null) {
                continue;
            }
            
            Long userId = order.getUser().getUserId();
            if (!customerMap.containsKey(userId)) {
                // Handle null firstname and lastname
                String firstName = order.getUser().getFirstname() != null ? order.getUser().getFirstname() : "";
                String lastName = order.getUser().getLastname() != null ? order.getUser().getLastname() : "";
                String fullName = (firstName + " " + lastName).trim();
                if (fullName.isEmpty()) {
                    fullName = order.getUser().getUsername() != null ? order.getUser().getUsername() : "Không có tên";
                }
                
                // Handle null email
                String email = order.getUser().getEmail();
                if (email == null || email.isEmpty()) {
                    email = "N/A";
                }
                
                customerMap.put(userId, TopCustomerResponse.builder()
                        .userId(userId)
                        .fullName(fullName)
                        .email(email)
                        .ordersCount(0L)
                        .totalSpent(BigDecimal.ZERO)
                        .build());
            }
            
            TopCustomerResponse customer = customerMap.get(userId);
            customer.setOrdersCount(customer.getOrdersCount() + 1);
            customer.setTotalSpent(customer.getTotalSpent().add(order.getTotal()));
        }
        
        // Sort by total spent descending and limit
        return customerMap.values().stream()
                .sorted((a, b) -> b.getTotalSpent().compareTo(a.getTotalSpent()))
                .limit(limit)
                .collect(Collectors.toList());
    }
    
    @Override
    public Map<String, Long> getNewCustomersByMonth() {
        Map<String, Long> result = new LinkedHashMap<>();
        
        // Lấy dữ liệu 12 tháng gần nhất
        LocalDateTime startDate = LocalDateTime.now().minusMonths(11).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        List<Object[]> data = userService.getNewCustomersByMonth(startDate);
        
        // Tạo map đầy đủ 12 tháng (điền 0 cho tháng không có data)
        LocalDateTime current = LocalDateTime.now().minusMonths(11).withDayOfMonth(1);
        for (int i = 0; i < 12; i++) {
            String key = String.format("Tháng %d/%d", current.getMonthValue(), current.getYear());
            result.put(key, 0L);
            current = current.plusMonths(1);
        }
        
        // Điền data thực vào
        for (Object[] row : data) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            long count = ((Number) row[2]).longValue();
            String key = String.format("Tháng %d/%d", month, year);
            result.put(key, count);
        }
        
        return result;
    }
    
    @Override
    public long countSoldProductsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return orderProductService.countSoldProductsByDateRange(startDate, endDate);
    }
    
    @Override
    public long countSoldBrandsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return orderProductService.countSoldBrandsByDateRange(startDate, endDate);
    }
}

