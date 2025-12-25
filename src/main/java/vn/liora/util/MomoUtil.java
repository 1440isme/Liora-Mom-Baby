package vn.liora.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Slf4j
public class MomoUtil {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Tạo signature cho MOMO API
     */
    public static String createSignature(String accessKey, String secretKey, String partnerCode,
            String orderId, String requestId, BigDecimal amount,
            String orderInfo, String redirectUrl, String ipnUrl,
            String requestType, String extraData) {
        try {
            // Tạo raw data string theo format C# (partnerCode trước)
            String rawData = String.format(
                    "partnerCode=%s&accessKey=%s&requestId=%s&amount=%s&orderId=%s&orderInfo=%s&returnUrl=%s&notifyUrl=%s&extraData=%s",
                    partnerCode,
                    accessKey,
                    requestId,
                    String.valueOf(amount.longValue()), // Chuyển thành string không có dấu chấm thập phân
                    orderId,
                    orderInfo != null ? orderInfo : "",
                    redirectUrl != null ? redirectUrl : "",
                    ipnUrl != null ? ipnUrl : "",
                    extraData != null ? extraData : "");

            // Tạo HMAC SHA256 signature
            Mac hmac256 = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac256.init(secretKeySpec);
            byte[] bytes = hmac256.doFinal(rawData.getBytes(StandardCharsets.UTF_8));

            StringBuilder hash = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                hash.append(String.format("%02x", b));
            }

            String signature = hash.toString();
            return signature;

        } catch (Exception e) {
            log.error("Error creating MOMO signature", e);
            throw new RuntimeException("Error creating MOMO signature", e);
        }
    }

    /**
     * Verify signature từ MOMO webhook
     */
    public static boolean verifySignature(String accessKey, String secretKey, Map<String, Object> params) {
        try {
            String receivedSignature = (String) params.get("signature");
            if (receivedSignature == null) {
                return false;
            }

            // Tạo raw data từ params (chỉ lấy các fields cần thiết cho signature)
            Map<String, Object> dataForSign = new HashMap<>();

            // Chỉ lấy các fields cần thiết cho signature verification
            String[] requiredFields = { "accessKey", "amount", "errorCode", "extraData", "message",
                    "orderId", "orderInfo", "orderType", "partnerCode", "payType",
                    "requestId", "responseTime", "transId" };

            for (String field : requiredFields) {
                if (params.containsKey(field)) {
                    dataForSign.put(field, params.get(field));
                }
            }

            // Loại bỏ signature nếu có
            dataForSign.remove("signature");

            // Sắp xếp theo key
            TreeMap<String, Object> sortedParams = new TreeMap<>(dataForSign);

            StringBuilder rawData = new StringBuilder();
            boolean first = true;
            for (Map.Entry<String, Object> entry : sortedParams.entrySet()) {
                if (!first) {
                    rawData.append("&");
                }
                rawData.append(entry.getKey()).append("=")
                        .append(entry.getValue() != null ? entry.getValue().toString() : "");
                first = false;
            }

            // Tạo signature
            Mac hmac256 = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac256.init(secretKeySpec);
            byte[] bytes = hmac256.doFinal(rawData.toString().getBytes(StandardCharsets.UTF_8));

            StringBuilder hash = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                hash.append(String.format("%02x", b));
            }

            String expectedSignature = hash.toString();
            return expectedSignature.equals(receivedSignature);

        } catch (Exception e) {
            log.error("Error verifying MOMO signature", e);
            return false;
        }
    }

    /**
     * Tạo requestId unique
     */
    public static String generateRequestId() {
        return "REQ" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * Tạo orderId từ order ID theo spec MOMO
     * orderId phải: không dễ đoán, không dài quá 64 byte, không chứa thông tin nhạy
     * cảm
     */
    public static String generateOrderId(Long orderId) {
        return "ORDER_" + orderId + "_" + System.currentTimeMillis();
    }

    /**
     * Convert object to JSON string
     */
    public static String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Error converting to JSON", e);
            return "{}";
        }
    }

    /**
     * Parse JSON string to Map
     */
    @SuppressWarnings("unchecked")
    public static Map<String, Object> parseJson(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            log.error("Error parsing JSON", e);
            return new HashMap<>();
        }
    }

    /**
     * Tạo MD5 hash (nếu cần)
     */
    public static String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] messageDigest = md.digest(input.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : messageDigest) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("Error creating MD5 hash", e);
            return "";
        }
    }
}
