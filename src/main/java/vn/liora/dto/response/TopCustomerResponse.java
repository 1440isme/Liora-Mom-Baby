package vn.liora.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TopCustomerResponse {
    Long userId;
    String fullName;
    String email;
    Long ordersCount;
    BigDecimal totalSpent;
}
