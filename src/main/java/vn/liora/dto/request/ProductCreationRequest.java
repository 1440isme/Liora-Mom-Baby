package vn.liora.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProductCreationRequest {
    @NotBlank(message = "VALIDATION_REQUIRED_FIELD")
    @Size(max = 255, message = "VALIDATION_NAME_TOO_LONG")
    private String name;

    @NotBlank(message = "VALIDATION_REQUIRED_FIELD")
    private String description;

    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    @DecimalMin(value = "0.0", message = "VALIDATION_PRICE_POSITIVE")
    private BigDecimal price;

    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    private Long brandId;

    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    private Long categoryId;

    @Min(value = 0, message = "VALIDATION_STOCK_NON_NEGATIVE")
    @Builder.Default
    private Integer stock = 0;

    @Builder.Default
    private Boolean available = true;

    @Builder.Default
    private Boolean isActive = true;

}
