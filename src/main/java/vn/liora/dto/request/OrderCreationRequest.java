package vn.liora.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

public class OrderCreationRequest {

    @NotBlank(message = "VALIDATION_REQUIRED_FIELD")
    String paymentMethod;
    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    String name;
    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    String phone;
    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    String addressDetail;
    String email;
    String note;

    Long discountId;
    String discountCode;

    // Thông tin địa chỉ để tính phí & lưu Order
    // districtId: GHN DistrictID, wardCode: GHN WardCode, provinceId: GHN
    // ProvinceID
    Integer districtId;
    String wardCode;
    Integer provinceId;
    
    Long cartId;

    // Tổng tiền FE sẽ KHÔNG gửi nữa; BE tự tính và lưu duy nhất.
}
