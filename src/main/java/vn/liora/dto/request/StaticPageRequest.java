package vn.liora.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class StaticPageRequest {

    @NotBlank(message = "Tiêu đề trang không được để trống")
    private String title;

    @NotBlank(message = "Slug không được để trống")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug chỉ được chứa chữ thường, số và dấu gạch ngang")
    private String slug;

    private String content;

    private String seoTitle;

    private String seoDescription;

    private String seoKeywords;

    // Nhóm của trang tĩnh để gom vào trang tổng hợp
    private String sectionSlug;

    @NotNull(message = "Trạng thái hoạt động không được để trống")
    private Boolean isActive;

    @NotNull(message = "Trạng thái xuất bản không được để trống")
    private Boolean isPublished;
}
