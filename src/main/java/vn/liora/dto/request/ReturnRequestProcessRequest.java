package vn.liora.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReturnRequestProcessRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(regexp = "^(ACCEPTED|REJECTED)$", message = "Trạng thái chỉ có thể là ACCEPTED hoặc REJECTED")
    String status;

    String adminNote; // Ghi chú của admin (optional)
}
