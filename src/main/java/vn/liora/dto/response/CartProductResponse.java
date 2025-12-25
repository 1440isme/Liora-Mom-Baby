package vn.liora.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartProductResponse {
    Long idCart;
    Long idProduct;
    Long idCartProduct;
    Integer quantity;
    Boolean choose;
    BigDecimal totalPrice;
    
    // Thông tin sản phẩm
    String productName;
    BigDecimal productPrice;
    String mainImageUrl;
    String brandName;
    Long brandId;
    
    // Thông tin trạng thái sản phẩm
    Boolean available;
    Boolean isActive;
    Integer stock;
}
