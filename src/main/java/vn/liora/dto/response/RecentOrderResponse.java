package vn.liora.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RecentOrderResponse {
    Long id;
    String customerName;
    BigDecimal totalAmount;
    String status;
    String paymentStatus;
    LocalDateTime createdAt;
}
