package vn.liora.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.GhnShippingFeeRequest;
import vn.liora.dto.response.GhnShippingFeeResponse;
import vn.liora.dto.response.GhnShopInfoResponse;
import vn.liora.service.IGhnShippingService;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/ghn/shipping")
@RequiredArgsConstructor
@Slf4j
public class GhnShippingController {

    private final IGhnShippingService ghnShippingService;

    /**
     * Tính phí vận chuyển
     */
    @PostMapping("/calculate-fee")
    public ResponseEntity<GhnShippingFeeResponse> calculateShippingFee(@RequestBody GhnShippingFeeRequest request) {
        try {
            log.info("Calculating shipping fee for request: {}", request);
            GhnShippingFeeResponse response = ghnShippingService.calculateShippingFee(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error calculating shipping fee: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Tính phí vận chuyển đơn giản (cho frontend)
     */
    @GetMapping("/calculate-fee-simple")
    public ResponseEntity<BigDecimal> calculateShippingFeeSimple(
            @RequestParam Integer toDistrictId,
            @RequestParam String toWardCode,
            @RequestParam(defaultValue = "1000") Integer weight,
            @RequestParam(defaultValue = "15") Integer length,
            @RequestParam(defaultValue = "15") Integer width,
            @RequestParam(defaultValue = "15") Integer height) {
        try {
            log.info("Calculating simple shipping fee for district: {}, ward: {}", toDistrictId, toWardCode);
            BigDecimal fee = ghnShippingService.calculateFeeByLocation(toDistrictId, toWardCode);
            return ResponseEntity.ok(fee);
        } catch (Exception e) {
            log.error("Error calculating simple shipping fee: {}", e.getMessage());
            return ResponseEntity.ok(BigDecimal.ZERO);
        }
    }

    /**
     * Lấy thông tin shop từ GHN API
     */
    @GetMapping("/shop/info")
    public ResponseEntity<GhnShopInfoResponse.ShopData> getShopInfo() {
        try {
            log.info("Getting shop info from GHN API");
            GhnShopInfoResponse.ShopData shopInfo = ghnShippingService.getShopInfo();
            if (shopInfo != null) {
                return ResponseEntity.ok(shopInfo);
            } else {
                return ResponseEntity.internalServerError().build();
            }
        } catch (Exception e) {
            log.error("Error getting shop info: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
