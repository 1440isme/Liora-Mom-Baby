package vn.liora.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GhnShippingFeeResponse {
    @JsonProperty("code")
    Integer code;

    @JsonProperty("message")
    String message;

    @JsonProperty("data")
    GhnShippingFeeData data;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GhnShippingFeeData {
        @JsonProperty("total")
        BigDecimal total;

        @JsonProperty("service_fee")
        BigDecimal serviceFee;

        @JsonProperty("insurance_fee")
        BigDecimal insuranceFee;

        @JsonProperty("pick_station_fee")
        BigDecimal pickStationFee;

        @JsonProperty("coupon_value")
        BigDecimal couponValue;

        @JsonProperty("r2s_fee")
        BigDecimal r2sFee;

        @JsonProperty("return_again")
        BigDecimal returnAgain;

        @JsonProperty("document_return")
        BigDecimal documentReturn;

        @JsonProperty("double_check")
        BigDecimal doubleCheck;

        @JsonProperty("cod_fee")
        BigDecimal codFee;

        @JsonProperty("pick_remote_areas_fee")
        BigDecimal pickRemoteAreasFee;

        @JsonProperty("deliver_remote_areas_fee")
        BigDecimal deliverRemoteAreasFee;

        @JsonProperty("cod_failed_fee")
        BigDecimal codFailedFee;

        @JsonProperty("pick_remote_areas_fee_return")
        BigDecimal pickRemoteAreasFeeReturn;

        @JsonProperty("deliver_remote_areas_fee_return")
        BigDecimal deliverRemoteAreasFeeReturn;

        @JsonProperty("cod_failed_fee_return")
        BigDecimal codFailedFeeReturn;

        @JsonProperty("pick_remote_areas_fee_return_again")
        BigDecimal pickRemoteAreasFeeReturnAgain;

        @JsonProperty("deliver_remote_areas_fee_return_again")
        BigDecimal deliverRemoteAreasFeeReturnAgain;

        @JsonProperty("cod_failed_fee_return_again")
        BigDecimal codFailedFeeReturnAgain;

        @JsonProperty("pick_remote_areas_fee_return_again_2")
        BigDecimal pickRemoteAreasFeeReturnAgain2;

        @JsonProperty("deliver_remote_areas_fee_return_again_2")
        BigDecimal deliverRemoteAreasFeeReturnAgain2;

        @JsonProperty("cod_failed_fee_return_again_2")
        BigDecimal codFailedFeeReturnAgain2;

        @JsonProperty("pick_remote_areas_fee_return_again_3")
        BigDecimal pickRemoteAreasFeeReturnAgain3;

        @JsonProperty("deliver_remote_areas_fee_return_again_3")
        BigDecimal deliverRemoteAreasFeeReturnAgain3;

        @JsonProperty("cod_failed_fee_return_again_3")
        BigDecimal codFailedFeeReturnAgain3;

        @JsonProperty("pick_remote_areas_fee_return_again_4")
        BigDecimal pickRemoteAreasFeeReturnAgain4;

        @JsonProperty("deliver_remote_areas_fee_return_again_4")
        BigDecimal deliverRemoteAreasFeeReturnAgain4;

        @JsonProperty("cod_failed_fee_return_again_4")
        BigDecimal codFailedFeeReturnAgain4;

        @JsonProperty("pick_remote_areas_fee_return_again_5")
        BigDecimal pickRemoteAreasFeeReturnAgain5;

        @JsonProperty("deliver_remote_areas_fee_return_again_5")
        BigDecimal deliverRemoteAreasFeeReturnAgain5;

        @JsonProperty("cod_failed_fee_return_again_5")
        BigDecimal codFailedFeeReturnAgain5;

        @JsonProperty("pick_remote_areas_fee_return_again_6")
        BigDecimal pickRemoteAreasFeeReturnAgain6;

        @JsonProperty("deliver_remote_areas_fee_return_again_6")
        BigDecimal deliverRemoteAreasFeeReturnAgain6;

        @JsonProperty("cod_failed_fee_return_again_6")
        BigDecimal codFailedFeeReturnAgain6;

        @JsonProperty("pick_remote_areas_fee_return_again_7")
        BigDecimal pickRemoteAreasFeeReturnAgain7;

        @JsonProperty("deliver_remote_areas_fee_return_again_7")
        BigDecimal deliverRemoteAreasFeeReturnAgain7;

        @JsonProperty("cod_failed_fee_return_again_7")
        BigDecimal codFailedFeeReturnAgain7;

        @JsonProperty("pick_remote_areas_fee_return_again_8")
        BigDecimal pickRemoteAreasFeeReturnAgain8;

        @JsonProperty("deliver_remote_areas_fee_return_again_8")
        BigDecimal deliverRemoteAreasFeeReturnAgain8;

        @JsonProperty("cod_failed_fee_return_again_8")
        BigDecimal codFailedFeeReturnAgain8;

        @JsonProperty("pick_remote_areas_fee_return_again_9")
        BigDecimal pickRemoteAreasFeeReturnAgain9;

        @JsonProperty("deliver_remote_areas_fee_return_again_9")
        BigDecimal deliverRemoteAreasFeeReturnAgain9;

        @JsonProperty("cod_failed_fee_return_again_9")
        BigDecimal codFailedFeeReturnAgain9;

        @JsonProperty("pick_remote_areas_fee_return_again_10")
        BigDecimal pickRemoteAreasFeeReturnAgain10;

        @JsonProperty("deliver_remote_areas_fee_return_again_10")
        BigDecimal deliverRemoteAreasFeeReturnAgain10;

        @JsonProperty("cod_failed_fee_return_again_10")
        BigDecimal codFailedFeeReturnAgain10;
    }
}
