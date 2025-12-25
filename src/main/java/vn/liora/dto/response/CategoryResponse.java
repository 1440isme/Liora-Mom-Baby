package vn.liora.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CategoryResponse {
    private Long categoryId;
    private String name;
    private Long parentCategoryId;
    private Boolean isParent;
    private Boolean isActive;
    private List<CategoryResponse> children;
}
