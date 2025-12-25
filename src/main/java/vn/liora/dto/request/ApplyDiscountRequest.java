package vn.liora.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApplyDiscountRequest {

    @NotBlank(message = "Mã giảm giá không được để trống")
    private String discountCode;

    private BigDecimal orderTotal;

    // Giữ lại các field cũ để tương thích với admin controller
    private Long orderId;
    private Long discountId;
}