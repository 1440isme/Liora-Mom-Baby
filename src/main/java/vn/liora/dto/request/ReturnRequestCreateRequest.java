package vn.liora.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReturnRequestCreateRequest {

    // OrderId sẽ được set từ path variable, không cần validation ở đây
    Long orderId;

    @NotBlank(message = "Lý do trả hàng không được để trống")
    String reason;
}
