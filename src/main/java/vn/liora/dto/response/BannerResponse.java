package vn.liora.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.liora.entity.Banner;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerResponse {

    private Long id;
    private String title;
    private String imageUrl;
    private String targetLink;
    private Integer sortOrder;
    private Boolean isActive;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructor từ entity
    public BannerResponse(Banner banner) {
        this.id = banner.getId();
        this.title = banner.getTitle();
        this.imageUrl = banner.getImageUrl();
        this.targetLink = banner.getTargetLink();
        this.sortOrder = banner.getSortOrder();
        this.isActive = banner.getIsActive();
        this.startDate = banner.getStartDate();
        this.endDate = banner.getEndDate();
        this.createdAt = banner.getCreatedAt();
        this.updatedAt = banner.getUpdatedAt();
    }

}
