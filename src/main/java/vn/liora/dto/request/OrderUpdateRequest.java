package vn.liora.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderUpdateRequest {

    @NotBlank(message = "Trạng thái đơn hàng không được để trống")
    @Pattern(regexp = "^(PENDING|CONFIRMED|COMPLETED|CANCELLED)$", message = "Trạng thái đơn hàng không hợp lệ")
    String orderStatus;

    @Pattern(regexp = "^(PENDING|PAID|FAILED|CANCELLED|REFUNDED)$", message = "Trạng thái thanh toán không hợp lệ")
    String paymentStatus;
}
