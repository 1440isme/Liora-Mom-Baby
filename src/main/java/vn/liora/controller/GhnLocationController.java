package vn.liora.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.response.GhnDistrictResponse;
import vn.liora.dto.response.GhnProvinceResponse;
import vn.liora.dto.response.GhnWardResponse;
import vn.liora.service.IGhnLocationService;

import java.util.List;

@RestController
@RequestMapping("/api/ghn")
@RequiredArgsConstructor
@Slf4j
public class GhnLocationController {

    private final IGhnLocationService ghnLocationService;

    /**
     * Lấy danh sách tất cả tỉnh/thành phố
     */
    @GetMapping("/provinces")
    public ResponseEntity<List<GhnProvinceResponse>> getProvinces() {
        try {
            log.info("Fetching provinces from GHN");
            List<GhnProvinceResponse> provinces = ghnLocationService.getProvinces();
            return ResponseEntity.ok(provinces);
        } catch (Exception e) {
            log.error("Error fetching provinces: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy danh sách quận/huyện theo tỉnh/thành phố
     */
    @GetMapping("/districts/{provinceId}")
    public ResponseEntity<List<GhnDistrictResponse>> getDistricts(@PathVariable Integer provinceId) {
        try {
            log.info("Fetching districts for province {} from GHN", provinceId);
            List<GhnDistrictResponse> districts = ghnLocationService.getDistricts(provinceId);
            return ResponseEntity.ok(districts);
        } catch (Exception e) {
            log.error("Error fetching districts for province {}: {}", provinceId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy danh sách phường/xã theo quận/huyện
     */
    @GetMapping("/wards/{districtId}")
    public ResponseEntity<List<GhnWardResponse>> getWards(@PathVariable Integer districtId) {
        try {
            log.info("Fetching wards for district {} from GHN", districtId);
            List<GhnWardResponse> wards = ghnLocationService.getWards(districtId);
            return ResponseEntity.ok(wards);
        } catch (Exception e) {
            log.error("Error fetching wards for district {}: {}", districtId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
