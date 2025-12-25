package vn.liora.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class VnpayUtil {

    public static String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                hash.append(String.format("%02x", b));
            }
            return hash.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error while calculating HMAC SHA512", e);
        }
    }

    public static String buildQuery(Map<String, String> params) {
        // Sort by field name ascending
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < fieldNames.size(); i++) {
            String field = fieldNames.get(i);
            String value = params.get(field);
            if (value != null && value.length() > 0) {
                sb.append(urlEncodeAscii(field));
                sb.append('=');
                sb.append(urlEncodeAscii(value));
                if (i < fieldNames.size() - 1)
                    sb.append('&');
            }
        }
        return sb.toString();
    }

    public static String urlEncode(String input) {
        // Follow VNPAY sample: encode then only replace '+' with '%20'
        return URLEncoder.encode(input, StandardCharsets.UTF_8).replace("+", "%20");
    }

    // VNPAY sample (JSP) dùng US_ASCII khi ký dữ liệu
    public static String urlEncodeAscii(String input) {
        return URLEncoder.encode(input, java.nio.charset.StandardCharsets.US_ASCII).replace("+", "%20");
    }
}
