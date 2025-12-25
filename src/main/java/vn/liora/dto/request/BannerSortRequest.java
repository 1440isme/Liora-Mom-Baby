package vn.liora.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BannerSortRequest {

    @NotNull(message = "Danh sách ID banner không được để trống")
    private List<Long> bannerIds;
}
