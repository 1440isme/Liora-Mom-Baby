package vn.liora.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecentlyViewedDTO {
    private Long idRecentlyViewed;
    private Long userId;
    private Long productId;
    private String guestId;
    private LocalDateTime viewedAt;
    
    // Product information
    private String productName;
    private String productDescription;
    private BigDecimal price;
    private String mainImageUrl;
    private String brandName;
    private Long brandId;
    private String categoryName;
    private Long categoryId;
    private Integer stock;
    private Integer soldCount;
    private BigDecimal averageRating;
    private Integer ratingCount;
    private Boolean available;
    private Boolean isActive;
    
    // Additional product images
    private List<String> productImages;
    
    // User information (if available)
    private String userName;
    private String userEmail;
}
