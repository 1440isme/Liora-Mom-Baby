package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vn.liora.dto.request.GhnShippingFeeRequest;
import vn.liora.dto.response.GhnShippingFeeResponse;
import vn.liora.dto.response.GhnShopInfoResponse;
import vn.liora.entity.GhnShipping;
import vn.liora.entity.Order;
import vn.liora.repository.GhnShippingRepository;
import vn.liora.repository.OrderProductRepository;
import vn.liora.service.IGhnShippingService;
import vn.liora.service.IGhnLocationService;
import vn.liora.dto.response.GhnProvinceResponse;
import vn.liora.dto.response.GhnDistrictResponse;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GhnShippingServiceImpl implements IGhnShippingService {

    private final RestTemplate restTemplate;
    private final GhnShippingRepository ghnShippingRepository;
    private final OrderProductRepository orderProductRepository;
    private final IGhnLocationService ghnLocationService;

    @Value("${ghn.api.base-url}")
    private String ghnBaseUrl;

    @Value("${ghn.api.token}")
    private String ghnToken;

    @Value("${ghn.api.shop-id}")
    private String ghnShopId;

    @Value("${ghn.api.service-id}")
    private Integer ghnServiceId;

    @Value("${ghn.api.from-district-id:3695}")
    private Integer fromDistrictId;
    private Integer cachedFromDistrictId; // auto-resolved when needed

    // Hardcode thông tin shop theo yêu cầu
    private static final Integer SHOP_DISTRICT_ID = 3695;
    private static final String SHOP_WARD_CODE = "90742";
    private static final String SHOP_NAME = "Liora";
    private static final String SHOP_PHONE = "0373801404";
    private static final String SHOP_ADDRESS = "Đ. Võ Văn Ngân, Linh Chiểu, Thủ Đức, Hồ Chí Minh, Việt Nam";

    @Override
    public GhnShippingFeeResponse calculateShippingFee(GhnShippingFeeRequest request) {
        try {
            String url = ghnBaseUrl + "/v2/shipping-order/fee";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.set("ShopId", ghnShopId);
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Bổ sung from_district_id nếu thiếu và tự động lấy service_id nếu chưa có
            if (request.getFromDistrictId() == null) {
                request.setFromDistrictId(getEffectiveFromDistrictId());
            }
            if (request.getServiceId() == null) {
                Integer resolvedServiceId = resolveServiceId(request.getFromDistrictId(), request.getToDistrictId());
                request.setServiceId(resolvedServiceId);
            }

            HttpEntity<GhnShippingFeeRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<GhnShippingFeeResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    GhnShippingFeeResponse.class);

            GhnShippingFeeResponse feeResponse = response.getBody();
            if (feeResponse != null && feeResponse.getData() != null) {
                log.info("Successfully calculated shipping fee: {}", feeResponse.getData().getTotal());
                return feeResponse;
            } else {
                log.warn("Invalid shipping fee response from GHN");
                throw new RuntimeException("Phản hồi tính phí ship không hợp lệ từ GHN");
            }

        } catch (Exception e) {
            log.error("Error calculating shipping fee: {}", e.getMessage());
            throw new RuntimeException("Không thể tính phí vận chuyển từ GHN", e);
        }
    }

    /**
     * Lấy service_id hợp lệ cho tuyến from_district -> to_district từ GHN
     */
    private Integer resolveServiceId(Integer fromDistrict, Integer toDistrict) {
        try {
            String url = ghnBaseUrl + "/v2/shipping-order/available-services";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.set("ShopId", ghnShopId);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("shop_id", Integer.parseInt(ghnShopId));
            body.put("from_district", fromDistrict);
            body.put("to_district", toDistrict);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> res = response.getBody();
            if (res != null && res.get("data") instanceof java.util.List<?> list && !list.isEmpty()) {
                // Ưu tiên service_type_id = 2, nếu không có thì lấy phần tử đầu tiên
                Integer chosen = null;
                for (Object o : list) {
                    if (o instanceof Map<?, ?> m) {
                        Integer sid = (Integer) m.get("service_id");
                        Integer stype = (Integer) m.get("service_type_id");
                        if (stype != null && stype == 2) { // Fast/standard tuỳ cấu hình GHN
                            chosen = sid;
                            break;
                        }
                        if (chosen == null)
                            chosen = sid;
                    }
                }
                if (chosen != null)
                    return chosen;
            }
            log.warn("No available service found for route {} -> {}", fromDistrict, toDistrict);
        } catch (Exception e) {
            log.warn("Failed to resolve service id: {}", e.getMessage());
        }
        // Fallback
        return ghnServiceId;
    }

    /**
     * Trả về fromDistrictId hiệu lực. Nếu cấu hình đã set thì dùng cấu hình,
     * nếu không sẽ tự động tra bằng GHN: tìm Province "Hồ Chí Minh" và District
     * "Thành phố Thủ Đức".
     */
    private Integer getEffectiveFromDistrictId() {
        if (fromDistrictId != null && fromDistrictId > 0)
            return fromDistrictId;
        if (cachedFromDistrictId != null)
            return cachedFromDistrictId;
        try {
            // 1) Lấy danh sách tỉnh qua service chuẩn
            Integer hcmProvinceId = null;
            for (GhnProvinceResponse p : ghnLocationService.getProvinces()) {
                String name = p.getProvinceName() != null ? p.getProvinceName() : "";
                String lower = name.toLowerCase();
                if (lower.contains("hồ chí minh") || lower.contains("ho chi minh") || lower.contains("tp. hồ chí minh")
                        || lower.contains("tp ho chi minh")) {
                    hcmProvinceId = p.getProvinceId();
                    break;
                }
            }

            if (hcmProvinceId == null) {
                log.warn("Cannot resolve HCM province id from GHN provinces list");
                return null;
            }

            // 2) Lấy quận/huyện theo tỉnh HCM và tìm Thành phố Thủ Đức
            for (GhnDistrictResponse d : ghnLocationService.getDistricts(hcmProvinceId)) {
                String dname = d.getDistrictName() != null ? d.getDistrictName() : "";
                String normalized = dname.toLowerCase();
                if (normalized.contains("thủ đức") || normalized.contains("thu duc")) {
                    cachedFromDistrictId = d.getDistrictId();
                    log.info("Resolved GHN from_district_id (Thu Duc): {}", cachedFromDistrictId);
                    return cachedFromDistrictId;
                }
            }
            log.warn("Cannot resolve Thu Duc district id in HCM from GHN");
            return null;
        } catch (Exception e) {
            log.warn("Failed to auto resolve from_district_id: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Lấy thông tin shop từ GHN API
     */
    @Override
    public GhnShopInfoResponse.ShopData getShopInfo() {
        try {
            String url = ghnBaseUrl + "/v2/shop/detail";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.set("ShopId", ghnShopId);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            try {
                body.put("shop_id", Integer.parseInt(ghnShopId));
            } catch (NumberFormatException ignore) {
                body.put("shop_id", ghnShopId);
            }
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<GhnShopInfoResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, GhnShopInfoResponse.class);

            GhnShopInfoResponse responseBody = response.getBody();

            if (responseBody != null && responseBody.getCode() == 200) {
                log.info("Successfully retrieved shop info from GHN");
                return responseBody.getData();
            } else {
                log.warn("Failed to get shop info from GHN: {}", responseBody);
                return null;
            }
        } catch (Exception e) {
            log.error("Error getting shop info from GHN: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public GhnShipping createShippingOrder(Order order) {
        try {
            // Dùng thông tin shop hardcode

            String url = ghnBaseUrl + "/v2/shipping-order/create";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.set("ShopId", ghnShopId);
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("payment_type_id", 1); // COD
            requestBody.put("note", order.getNote() != null ? order.getNote() : "Giao hàng cẩn thận");
            requestBody.put("required_note", "KHONGCHOXEMHANG");

            // From address (shop) - hardcode
            requestBody.put("from_name", SHOP_NAME);
            requestBody.put("from_phone", SHOP_PHONE);
            requestBody.put("from_address", SHOP_ADDRESS);
            requestBody.put("from_ward_code", SHOP_WARD_CODE);
            requestBody.put("from_district_id", SHOP_DISTRICT_ID);

            // To address (customer) - dùng đúng wardCode/districtId từ order
            requestBody.put("to_name", order.getName());
            requestBody.put("to_phone", order.getPhone());
            requestBody.put("to_address", order.getAddressDetail());
            // GHN create API yêu cầu ward_code và district_id
            requestBody.put("to_ward_code", order.getWardCode());
            if (order.getDistrictId() != null) {
                requestBody.put("to_district_id", order.getDistrictId());
            }

            // Nếu đã thanh toán online, COD = 0
            int codAmount = ("PAID".equalsIgnoreCase(order.getPaymentStatus())) ? 0 : order.getTotal().intValue();
            requestBody.put("cod_amount", codAmount);
            requestBody.put("content", "Đơn hàng #" + order.getIdOrder());
            requestBody.put("weight", 1000); // Default weight in grams
            requestBody.put("length", 15);
            requestBody.put("width", 15);
            requestBody.put("height", 15);
            Integer toDistrict = (Integer) requestBody.get("to_district_id");
            requestBody.put("service_id", resolveServiceId(SHOP_DISTRICT_ID, toDistrict));
            requestBody.put("service_type_id", 2);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.get("code").equals(200)) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
                String ghnOrderCode = (String) data.get("order_code");

                // Create GhnShipping entity
                GhnShipping ghnShipping = GhnShipping.builder()
                        .idOrder(order.getIdOrder())
                        .ghnOrderCode(ghnOrderCode)
                        .ghnServiceId((Integer) requestBody.get("service_id"))
                        .toName(order.getName())
                        .toPhone(order.getPhone())
                        .toAddress(order.getAddressDetail())
                        .toWardCode(order.getWardCode())
                        .toDistrictId(order.getDistrictId())
                        .ghnStatus("PENDING")
                        .shippingFee(order.getShippingFee())
                        .build();

                // Save to database
                GhnShipping savedShipping = ghnShippingRepository.save(ghnShipping);
                log.info("Successfully created GHN shipping order: {}", ghnOrderCode);
                return savedShipping;
            } else {
                throw new RuntimeException("GHN API returned error: " + responseBody);
            }

        } catch (Exception e) {
            log.error("Error creating GHN shipping order: {}", e.getMessage());
            throw new RuntimeException("Không thể tạo đơn hàng vận chuyển trên GHN", e);
        }
    }

    @Override
    public BigDecimal calculateOrderShippingFee(Order order) {
        try {
            // Map địa chỉ KH (guest hoặc user)
            // Lấy districtId/wardCode trực tiếp từ Order entity
            Integer toDistrictId = order.getDistrictId();
            String toWardCode = order.getWardCode();

            if (toDistrictId == null || toWardCode == null) {
                log.warn("Order missing district/ward for fee calculation. Using zero fee.");
                return BigDecimal.ZERO;
            }

            // Tính trọng lượng ước lượng từ các sản phẩm trong đơn
            int defaultItemWeight = 300; // gram mỗi sản phẩm (ước lượng)
            int totalWeight = 0;
            try {
                var orderProducts = orderProductRepository.findByOrder(order);
                for (var op : orderProducts) {
                    Integer qty = op.getQuantity() != null ? op.getQuantity() : 1;
                    totalWeight += Math.max(1, qty) * defaultItemWeight;
                }
            } catch (Exception e) {
                log.warn("Failed to compute order weight, using default: {}g. Cause: {}", 1000, e.getMessage());
                totalWeight = 1000;
            }
            if (totalWeight <= 0)
                totalWeight = 1000;

            // Kích thước ước lượng dựa theo số lượng sản phẩm
            int itemCountEstimate = Math.max(1, totalWeight / defaultItemWeight);
            int baseSize = 15;
            int sizeFactor = (int) Math.ceil(Math.sqrt(itemCountEstimate));
            int length = Math.min(50, baseSize * sizeFactor);
            int width = Math.min(50, baseSize * Math.max(1, sizeFactor - 1));
            int height = Math.min(50, baseSize);

            // Bảo hiểm theo tổng tiền đơn hàng (GHN yêu cầu đơn vị VND)
            int insuranceValue = 0;
            try {
                insuranceValue = order.getTotal() != null ? order.getTotal().intValue() : 0;
            } catch (Exception ignore) {
            }

            // Xác định from_district_id hiệu lực và service_id phù hợp tuyến
            Integer effectiveFromDistrict = getEffectiveFromDistrictId();
            Integer effectiveServiceId = resolveServiceId(
                    effectiveFromDistrict != null ? effectiveFromDistrict : fromDistrictId,
                    toDistrictId);

            GhnShippingFeeRequest request = GhnShippingFeeRequest.builder()
                    .serviceId(effectiveServiceId)
                    .fromDistrictId(effectiveFromDistrict != null ? effectiveFromDistrict : fromDistrictId)
                    .toDistrictId(toDistrictId)
                    .toWardCode(toWardCode)
                    .insuranceValue(Math.max(0, insuranceValue))
                    .height(height)
                    .length(length)
                    .weight(totalWeight)
                    .width(width)
                    .build();

            GhnShippingFeeResponse response = calculateShippingFee(request);

            if (response.getCode() == 200 && response.getData() != null) {
                return response.getData().getTotal();
            } else {
                log.warn("GHN shipping fee calculation failed: {}", response.getMessage());
                return BigDecimal.ZERO;
            }

        } catch (Exception e) {
            log.error("Error calculating order shipping fee: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    @Override
    public Integer getGhnServiceId() {
        return ghnServiceId;
    }

    @Override
    public BigDecimal calculateFeeByLocation(Integer toDistrictId, String toWardCode) {
        if (toDistrictId == null || toWardCode == null)
            return BigDecimal.ZERO;

        try {
            Integer effectiveFromDistrict = getEffectiveFromDistrictId();
            Integer effectiveServiceId = resolveServiceId(
                    effectiveFromDistrict != null ? effectiveFromDistrict : fromDistrictId,
                    toDistrictId);

            GhnShippingFeeRequest request = GhnShippingFeeRequest.builder()
                    .serviceId(effectiveServiceId)
                    .fromDistrictId(effectiveFromDistrict != null ? effectiveFromDistrict : fromDistrictId)
                    .toDistrictId(toDistrictId)
                    .toWardCode(toWardCode)
                    .weight(1000)
                    .length(15)
                    .width(15)
                    .height(15)
                    .build();

            GhnShippingFeeResponse response = calculateShippingFee(request);
            if (response.getCode() == 200 && response.getData() != null) {
                return response.getData().getTotal();
            }
        } catch (Exception e) {
            log.warn("calculateFeeByLocation failed: {}", e.getMessage());
        }
        return BigDecimal.ZERO;
    }
}
