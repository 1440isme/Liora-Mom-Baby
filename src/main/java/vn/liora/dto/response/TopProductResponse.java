package vn.liora.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TopProductResponse {
    private Long id;
    private String name;
    private String categoryName;
    private Long soldQuantity;
    private BigDecimal revenue;
    private BigDecimal rating;
}
