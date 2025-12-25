package vn.liora.service;

import java.time.LocalDateTime;
import java.util.List;

public interface IOrderProductService {
    List<Object[]> getRevenueByCategory(LocalDateTime startDate, LocalDateTime endDate);
    List<Object[]> getRevenueByBrand(LocalDateTime startDate, LocalDateTime endDate);
    List<Object[]> getTopSellingProductsByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    
    long countSoldProductsByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    long countSoldBrandsByDateRange(LocalDateTime startDate, LocalDateTime endDate);

}
