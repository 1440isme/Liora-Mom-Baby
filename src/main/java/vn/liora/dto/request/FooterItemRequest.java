package vn.liora.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.liora.enums.FooterLinkType;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FooterItemRequest {
    private String title;
    private String url;
    private FooterLinkType linkType;
    private Integer itemOrder = 1;
    private Long staticPageId;
    private Long categoryId;
}
