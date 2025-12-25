package vn.liora.service;

import vn.liora.dto.response.GhnDistrictResponse;
import vn.liora.dto.response.GhnProvinceResponse;
import vn.liora.dto.response.GhnWardResponse;

import java.util.List;

public interface IGhnLocationService {
    /**
     * Lấy danh sách tất cả tỉnh/thành phố
     */
    List<GhnProvinceResponse> getProvinces();

    /**
     * Lấy danh sách quận/huyện theo tỉnh/thành phố
     */
    List<GhnDistrictResponse> getDistricts(Integer provinceId);

    /**
     * Lấy danh sách phường/xã theo quận/huyện
     */
    List<GhnWardResponse> getWards(Integer districtId);
}
