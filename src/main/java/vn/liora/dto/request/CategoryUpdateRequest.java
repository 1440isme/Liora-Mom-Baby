package vn.liora.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CategoryUpdateRequest {
    @Size(max = 255, message = "VALIDATION_NAME_TOO_LONG")
    private String name;

    private Long parentCategoryId;

    private Boolean isParent;

    private Boolean isActive;
}
