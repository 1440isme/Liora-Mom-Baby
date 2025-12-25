package vn.liora.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.liora.enums.FooterLinkType;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeaderNavigationItemRequest {
    private Long id; // New field for temporary ID mapping
    private String title;
    private String url;
    private FooterLinkType linkType;
    private Integer itemOrder;
    private Long staticPageId;
    private Boolean isCategoryParent = false;
    private Long parentItemId;
    private List<HeaderNavigationItemRequest> subItems;
}
