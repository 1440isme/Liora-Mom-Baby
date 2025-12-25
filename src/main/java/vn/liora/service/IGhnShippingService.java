package vn.liora.service;

import vn.liora.dto.request.GhnShippingFeeRequest;
import vn.liora.dto.response.GhnShippingFeeResponse;
import vn.liora.dto.response.GhnShopInfoResponse;
import vn.liora.entity.GhnShipping;
import vn.liora.entity.Order;

import java.math.BigDecimal;

public interface IGhnShippingService {
    /**
     * Tính phí vận chuyển
     */
    GhnShippingFeeResponse calculateShippingFee(GhnShippingFeeRequest request);

    /**
     * Tạo đơn hàng vận chuyển trên GHN (simplified for test)
     */
    GhnShipping createShippingOrder(Order order);

    /**
     * Tính phí ship cho đơn hàng
     */
    BigDecimal calculateOrderShippingFee(Order order);

    /**
     * Tính phí vận chuyển dựa theo combobox FE (chỉ dùng khoảng cách)
     */
    BigDecimal calculateFeeByLocation(Integer toDistrictId, String toWardCode);

    /**
     * Lấy thông tin shop từ GHN API
     */
    GhnShopInfoResponse.ShopData getShopInfo();

    /**
     * Lấy GHN Service ID
     */
    Integer getGhnServiceId();
}
