package vn.liora.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DiscountUpdateRequest {
    
    @Size(max = 255, message = "VALIDATION_NAME_TOO_LONG")
    private String name;
    
    @Size(max = 500, message = "VALIDATION_DESCRIPTION_TOO_LONG")
    private String description;
    
    @DecimalMin(value = "0.0", message = "VALIDATION_DISCOUNT_VALUE_POSITIVE")
    private BigDecimal discountValue;
    
    @DecimalMin(value = "0.0", message = "VALIDATION_MIN_ORDER_VALUE_POSITIVE")
    private BigDecimal minOrderValue;
    
    @DecimalMin(value = "0.0", message = "VALIDATION_MAX_DISCOUNT_AMOUNT_POSITIVE")
    private BigDecimal maxDiscountAmount;
    
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    
    @Min(value = 0, message = "VALIDATION_USAGE_LIMIT_NON_NEGATIVE")
    private Integer usageLimit;
    
    @Min(value = 0, message = "VALIDATION_USER_USAGE_LIMIT_NON_NEGATIVE")
    private Integer userUsageLimit;
    
    private Boolean isActive;
}