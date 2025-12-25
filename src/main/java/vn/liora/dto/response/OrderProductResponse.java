package vn.liora.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderProductResponse {
    Long idOrderProduct;
    Long idProduct;
    Long idOrder;
    Integer quantity;
    BigDecimal totalPrice;
    String productName;
    String productDescription;
    BigDecimal productPrice;
    String mainImageUrl;
    String categoryName;
    String brandName;
    Long brandId;
}
