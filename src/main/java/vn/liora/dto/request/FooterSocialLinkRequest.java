package vn.liora.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FooterSocialLinkRequest {
    private String platform;
    private String url;
    private String iconClass;
    private Integer displayOrder = 1;
}
