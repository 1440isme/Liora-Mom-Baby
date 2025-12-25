package vn.liora.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GhnProvinceResponse {
    @JsonProperty("ProvinceID")
    Integer provinceId;

    @JsonProperty("ProvinceName")
    String provinceName;

    @JsonProperty("Code")
    String code;

    @JsonProperty("CountryID")
    Integer countryId;

    @JsonProperty("NameExtension")
    String[] nameExtension;

    @JsonProperty("IsEnable")
    Integer isEnable;

    @JsonProperty("RegionID")
    Integer regionId;

    @JsonProperty("RegionCP")
    Integer regionCP;

    @JsonProperty("UpdatedBy")
    Integer updatedBy;

    @JsonProperty("CreatedAt")
    String createdAt;

    @JsonProperty("UpdatedAt")
    String updatedAt;

    @JsonProperty("CanUpdateCOD")
    Boolean canUpdateCOD;

    @JsonProperty("Status")
    Integer status;
}
