package vn.liora.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BannerRequest {

    @NotBlank(message = "Tiêu đề banner không được để trống")
    private String title;

    private String imageUrl;

    private String targetLink;

    @NotNull(message = "Thứ tự sắp xếp không được để trống")
    @PositiveOrZero(message = "Thứ tự sắp xếp phải là số dương hoặc 0")
    private Integer sortOrder;

    @NotNull(message = "Trạng thái hoạt động không được để trống")
    private Boolean isActive;

    private LocalDateTime startDate;

    private LocalDateTime endDate;
}
