package vn.liora.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LowStockProductResponse
{
    private Long productId;
    private String name;
    private String categoryName;
    private Integer stock;
    private Boolean isActive;
}
