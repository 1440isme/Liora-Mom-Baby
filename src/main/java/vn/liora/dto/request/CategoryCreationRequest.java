package vn.liora.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CategoryCreationRequest {
    @NotBlank(message = "VALIDATION_REQUIRED_FIELD")
    @Size(max = 255, message = "VALIDATION_NAME_TOO_LONG")
    private String name;

    private Long parentCategoryId;

    private Boolean isParent;

    @Builder.Default
    private Boolean isActive = true;
}
