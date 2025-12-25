package vn.liora.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FooterRequest {
    private String brandName;
    private String brandDescription;
    private List<FooterColumnRequest> columns;
    private List<FooterSocialLinkRequest> socialLinks;
}
