package vn.liora.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReviewCreationRequest {

    // Chỉ cần orderProductId, các thông tin khác sẽ được lấy từ OrderProduct
    @NotNull(message = "OrderProduct ID is required")
    private Long orderProductId;

    @Size(max = 1000, message = "Content must not exceed 1000 characters")
    private String content;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    @Builder.Default
    private Boolean anonymous = false;

}