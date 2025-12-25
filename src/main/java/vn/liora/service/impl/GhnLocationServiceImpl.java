package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vn.liora.dto.response.GhnApiResponse;
import vn.liora.dto.response.GhnDistrictResponse;
import vn.liora.dto.response.GhnProvinceResponse;
import vn.liora.dto.response.GhnWardResponse;
import vn.liora.service.IGhnLocationService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GhnLocationServiceImpl implements IGhnLocationService {

    private final RestTemplate restTemplate;

    @Value("${ghn.api.base-url}")
    private String ghnBaseUrl;

    @Value("${ghn.api.token}")
    private String ghnToken;

    @Override
    public List<GhnProvinceResponse> getProvinces() {
        try {
            String url = ghnBaseUrl + "/master-data/province";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<GhnApiResponse<List<GhnProvinceResponse>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<GhnApiResponse<List<GhnProvinceResponse>>>() {
                    });

            GhnApiResponse<List<GhnProvinceResponse>> body = response.getBody();
            if (body != null && body.getCode() != null && body.getCode() == 200 && body.getData() != null) {
                log.info("Successfully fetched {} provinces from GHN", body.getData().size());
                return body.getData();
            }
            log.warn("No provinces returned from GHN API or invalid response");
            return List.of();

        } catch (Exception e) {
            log.error("Error fetching provinces from GHN: {}", e.getMessage());
            throw new RuntimeException("Không thể lấy danh sách tỉnh/thành phố từ GHN", e);
        }
    }

    @Override
    public List<GhnDistrictResponse> getDistricts(Integer provinceId) {
        try {
            String url = ghnBaseUrl + "/master-data/district?province_id=" + provinceId;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<GhnApiResponse<List<GhnDistrictResponse>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<GhnApiResponse<List<GhnDistrictResponse>>>() {
                    });

            GhnApiResponse<List<GhnDistrictResponse>> body = response.getBody();
            if (body != null && body.getCode() != null && body.getCode() == 200 && body.getData() != null) {
                log.info("Successfully fetched {} districts for province {} from GHN", body.getData().size(),
                        provinceId);
                return body.getData();
            }
            log.warn("No districts returned from GHN API for province {} or invalid response", provinceId);
            return List.of();

        } catch (Exception e) {
            log.error("Error fetching districts for province {} from GHN: {}", provinceId, e.getMessage());
            throw new RuntimeException("Không thể lấy danh sách quận/huyện từ GHN", e);
        }
    }

    @Override
    public List<GhnWardResponse> getWards(Integer districtId) {
        try {
            String url = ghnBaseUrl + "/master-data/ward?district_id=" + districtId;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<GhnApiResponse<List<GhnWardResponse>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<GhnApiResponse<List<GhnWardResponse>>>() {
                    });

            GhnApiResponse<List<GhnWardResponse>> body = response.getBody();
            if (body != null && body.getCode() != null && body.getCode() == 200 && body.getData() != null) {
                log.info("Successfully fetched {} wards for district {} from GHN", body.getData().size(), districtId);
                return body.getData();
            }
            log.warn("No wards returned from GHN API for district {} or invalid response", districtId);
            return List.of();

        } catch (Exception e) {
            log.error("Error fetching wards for district {} from GHN: {}", districtId, e.getMessage());
            throw new RuntimeException("Không thể lấy danh sách phường/xã từ GHN", e);
        }
    }
}
