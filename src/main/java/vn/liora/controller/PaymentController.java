package vn.liora.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import lombok.AccessLevel;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import lombok.experimental.NonFinal;
import org.springframework.web.bind.annotation.*;
import vn.liora.entity.Order;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.OrderRepository;
import vn.liora.repository.VnpayPaymentRepository;
import vn.liora.service.PaymentService;
import vn.liora.service.IGhnShippingService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment/vnpay")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PaymentController {

    PaymentService paymentService;
    OrderRepository orderRepository;
    VnpayPaymentRepository vnpayPaymentRepository;
    IGhnShippingService ghnShippingService;

    @NonFinal
    @Value("${vnpay.trustReturnWhenIpnMissing:false}")
    Boolean trustReturnWhenIpnMissing;

    @PostMapping("/create/{orderId}")
    public ResponseEntity<Map<String, String>> createPayment(@PathVariable Long orderId,
            HttpServletRequest request) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        String clientIp = getClientIp(request);
        String url = paymentService.createVnpayPaymentUrl(order, clientIp);
        Map<String, String> resp = new HashMap<>();
        resp.put("paymentUrl", url);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/return")
    public org.springframework.web.servlet.view.RedirectView returnPage(@RequestParam Map<String, String> params) {
        String code = params.getOrDefault("vnp_ResponseCode", "");
        String orderRef = params.getOrDefault("vnp_TxnRef", "");
        String bankCode = params.getOrDefault("vnp_BankCode", "");
        String amount = params.getOrDefault("vnp_Amount", "");

        boolean processed = false;
        try {
            // Best-effort: xử lý IPN ngay khi user được redirect về (dev/local có thể không
            // có IPN)
            paymentService.handleVnpayIpn(params);
            processed = true;
        } catch (Exception e) {
            // Không chặn luồng hiển thị kết quả cho user
            log.warn("Return handler could not process IPN inline: {}", e.getMessage());
        }

        // Fallback DEV ONLY (cấu hình): nếu chưa xử lý được nhưng thấy code=00/24, cập
        // nhật tối thiểu để không kẹt UI
        if (!processed && Boolean.TRUE.equals(trustReturnWhenIpnMissing) && ("00".equals(code) || "24".equals(code))) {
            try {
                vnpayPaymentRepository.findByVnpTxnRef(orderRef).ifPresent(vnp -> {
                    var orderOpt = orderRepository.findById(vnp.getIdOrder());
                    if (orderOpt.isPresent()) {
                        var order = orderOpt.get();
                        if ("00".equals(code)) {
                            if (!"PAID".equalsIgnoreCase(order.getPaymentStatus())) {
                                order.setPaymentStatus("PAID");

                                // Tạo GHN ngay trong fallback dev nếu đủ thông tin địa chỉ
                                try {
                                    if (order.getDistrictId() != null && order.getWardCode() != null) {
                                        ghnShippingService.createShippingOrder(order);
                                    }
                                } catch (Exception ignore) {
                                }
                                orderRepository.save(order);
                            }
                        } else if ("24".equals(code)) {
                            if (!"CANCELLED".equalsIgnoreCase(order.getPaymentStatus())) {
                                order.setPaymentStatus("CANCELLED");
                                // Giữ orderStatus hiện tại (thường là PENDING)
                                orderRepository.save(order);
                            }
                        }
                    }
                });
            } catch (Exception ex) {
                log.warn("DEV fallback failed: {}", ex.getMessage());
            }
        }
        // Map orderRef (vnp_TxnRef) -> orderId để view có thể điều hướng đúng
        Long orderId = vnpayPaymentRepository.findByVnpTxnRef(orderRef)
                .map(vnpayPayment -> vnpayPayment.getIdOrder())
                .orElse(null);
        String redirectUrl = String.format("/payment/result?code=%s&orderRef=%s&orderId=%s&bank=%s&amount=%s",
                urlEncode(code), urlEncode(orderRef),
                urlEncode(orderId == null ? "" : String.valueOf(orderId)),
                urlEncode(bankCode), urlEncode(amount));
        return new org.springframework.web.servlet.view.RedirectView(redirectUrl);
    }

    @GetMapping("/ipn")
    public ResponseEntity<String> ipn(@RequestParam Map<String, String> params) {
        paymentService.handleVnpayIpn(params);
        // Theo spec VNPAY: nên trả về chuỗi "OK" nếu xử lý thành công
        return ResponseEntity.ok("OK");
    }

    @GetMapping("/status/{orderId}")
    public ResponseEntity<Map<String, String>> status(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        Map<String, String> resp = new HashMap<>();
        resp.put("paymentStatus", order.getPaymentStatus());
        resp.put("orderStatus", order.getOrderStatus());
        return ResponseEntity.ok(resp);
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty())
            ip = request.getRemoteAddr();
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    private String urlEncode(String s) {
        try {
            return java.net.URLEncoder.encode(s == null ? "" : s, java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20");
        } catch (Exception e) {
            return "";
        }
    }
}
