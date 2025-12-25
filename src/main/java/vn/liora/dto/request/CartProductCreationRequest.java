package vn.liora.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

public class CartProductCreationRequest {
    @NotNull(message = "VALIDATION_REQUIRED_FIELD")

    Long idProduct;
    @Min(value = 1, message = "VALIDATION_QUANTITY_MIN_ONE")
    Integer quantity;
}
