package vn.liora.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FooterColumnRequest {
    private String title;
    private Integer columnOrder = 1;
    private List<FooterItemRequest> items;
}
