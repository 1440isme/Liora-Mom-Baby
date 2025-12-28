package vn.liora.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletTransactionResponse {
    Long transactionId;
    String type;
    BigDecimal amount;
    BigDecimal balanceBefore;
    BigDecimal balanceAfter;
    Long orderId;
    String description;
    LocalDateTime createdDate;
}
