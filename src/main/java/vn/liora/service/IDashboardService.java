package vn.liora.service;

import vn.liora.dto.response.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface IDashboardService {
    BigDecimal getTotalRevenue();
    BigDecimal getTotalRevenueByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    long getTotalOrders();
    long getTotalOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    long getTotalProducts();
    long getTotalCustomers();
    long getTotalCustomersByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    long getPendingOrders();
    long getLowStockProducts();
    BigDecimal getTodayRevenue();
    double getConversionRate();

    List<RecentOrderResponse> getRecentOrders(int limit);
    List<RecentOrderResponse> getRecentOrdersByDateRange(int limit, LocalDateTime startDate, LocalDateTime endDate);
    List<TopProductResponse> getTopProducts(int limit);
    List<TopProductResponse> getTopProductsByDateRange(int limit, LocalDateTime startDate, LocalDateTime endDate);
    List<LowStockProductResponse> getLowStockProductsList(int threshold);

    Map<String, Double> getRevenueByTime(String type, LocalDateTime startDate, LocalDateTime endDate);
    Map<String, Double> getRevenueByCategory(LocalDateTime startDate, LocalDateTime endDate);
    Map<String, Double> getRevenueByBrand(LocalDateTime startDate, LocalDateTime endDate);

    long getNewCustomersThisMonth();
    long getNewCustomersByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    double getReturningCustomers();
    double getReturningCustomersByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    List<TopCustomerResponse> getTopCustomers(int limit);
    List<TopCustomerResponse> getTopCustomersByDateRange(int limit, LocalDateTime startDate, LocalDateTime endDate);
    
    long countSoldProductsByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    long countSoldBrandsByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    
    Map<String, Long> getNewCustomersByMonth();

}
