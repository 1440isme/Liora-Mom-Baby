package vn.liora.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

public class AddressUpdateRequest {
    @NotBlank(message = "VALIDATION_REQUIRED_FIELD")
    String name;

    @NotBlank(message = "VALIDATION_REQUIRED_FIELD")
    @Size(min = 10, max = 10, message = "VALIDATION_PHONE_INVALID_LENGTH")
    String phone;

    @NotBlank(message = "VALIDATION_REQUIRED_FIELD")
    String addressDetail;

    // GHN 3-level
    Integer provinceId;
    Integer districtId;
    String wardCode;

    Boolean isDefault;

}
