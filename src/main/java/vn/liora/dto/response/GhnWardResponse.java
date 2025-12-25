package vn.liora.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GhnWardResponse {
    @JsonProperty("WardCode")
    String wardCode;

    @JsonProperty("DistrictID")
    Integer districtId;

    @JsonProperty("WardName")
    String wardName;

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

    @JsonProperty("WhiteListWard")
    Object whiteListWard;
}
