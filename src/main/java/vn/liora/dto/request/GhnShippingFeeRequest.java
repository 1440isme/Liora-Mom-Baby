package vn.liora.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GhnShippingFeeRequest {
    @Builder.Default
    @JsonProperty("service_id")
    Integer serviceId = 53321; // Standard service

    @JsonProperty("service_type_id")
    Integer serviceTypeId;

    @Builder.Default
    @JsonProperty("insurance_value")
    Integer insuranceValue = 0;

    @JsonProperty("coupon")
    String coupon;

    @JsonProperty(value = "from_district_id")
    Integer fromDistrictId;

    @JsonProperty(value = "to_district_id")
    Integer toDistrictId;

    @JsonProperty(value = "to_ward_code")
    String toWardCode;

    @JsonProperty("height")
    Integer height;

    @JsonProperty("length")
    Integer length;

    @JsonProperty("weight")
    Integer weight;

    @JsonProperty("width")
    Integer width;
}
