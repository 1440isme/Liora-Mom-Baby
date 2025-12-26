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
public class WalletResponse {
    Long walletId;
    Long userId;
    String username;
    String firstname;
    String lastname;
    BigDecimal balance;
    LocalDateTime createdDate;
    LocalDateTime updatedDate;
}
