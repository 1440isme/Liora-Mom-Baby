package vn.liora.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DashboardStatsResponse {
    BigDecimal totalRevenue;
    Long totalOrders;
    Long totalProducts;
    Long totalCustomers;
    Long pendingOrders;
    Long lowStockProducts;
    BigDecimal todayRevenue;
    Double conversionRate;
}
