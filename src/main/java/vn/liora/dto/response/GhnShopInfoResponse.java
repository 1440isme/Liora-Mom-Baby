package vn.liora.dto.response;

import lombok.Data;

@Data
public class GhnShopInfoResponse {
    private Integer code;
    private String message;
    private ShopData data;

    @Data
    public static class ShopData {
        private Integer shopId;
        private String shopName;
        private String shopPhone;
        private String shopAddress;
        private String wardCode;
        private Integer districtId;
        private Integer provinceId;
        private String wardName;
        private String districtName;
        private String provinceName;
    }
}
