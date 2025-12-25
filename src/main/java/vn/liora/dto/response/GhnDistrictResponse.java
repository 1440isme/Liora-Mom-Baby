package vn.liora.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GhnDistrictResponse {
    @JsonProperty("DistrictID")
    Integer districtId;

    @JsonProperty("ProvinceID")
    Integer provinceId;

    @JsonProperty("DistrictName")
    String districtName;

    @JsonProperty("Code")
    String code;

    @JsonProperty("Type")
    Integer type;

    @JsonProperty("SupportType")
    Integer supportType;

    @JsonProperty("NameExtension")
    String[] nameExtension;

    @JsonProperty("IsEnable")
    Integer isEnable;

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

    @JsonProperty("WhiteListClient")
    Object whiteListClient;

    @JsonProperty("WhiteListDistrict")
    Object whiteListDistrict;
}
