package vn.liora.dto.request;

import jakarta.validation.constraints.Min;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartProductUpdateRequest {
    @Min(value = 1, message = "VALIDATION_QUANTITY_MIN_ONE")
    Integer quantity;
    Boolean choose;
}
