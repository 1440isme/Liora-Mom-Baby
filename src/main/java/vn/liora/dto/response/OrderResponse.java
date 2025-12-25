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
public class OrderResponse {
    Long idOrder;
    String name;
    String phone;
    String addressDetail;
    String email;
    String note;
    LocalDateTime orderDate;
    String orderStatus;
    String paymentStatus;
    String paymentMethod;
    BigDecimal totalDiscount;
    BigDecimal shippingFee;
    BigDecimal total;
    Long userId;
    String customerName;

    Long discountId;
    String discountName;
    BigDecimal discountValue;
    private Boolean hasReview = false;
}
