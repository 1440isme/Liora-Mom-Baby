package vn.liora.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandUpdateRequest {
    @Size(max = 255, message = "VALIDATION_NAME_TOO_LONG")
    private String name;
    private String logoUrl;
    private Boolean isActive;
}
