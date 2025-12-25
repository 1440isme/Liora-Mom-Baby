package vn.liora.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import lombok.AccessLevel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import vn.liora.entity.Order;
import vn.liora.entity.MomoPayment;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.OrderRepository;
import vn.liora.service.PaymentService;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/payment/momo")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MomoController {

    PaymentService paymentService;
    OrderRepository orderRepository;

    @PostMapping("/create/{orderId}")
    public ResponseEntity<Map<String, String>> createPayment(@PathVariable Long orderId,
            HttpServletRequest request) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

            String clientIp = getClientIp(request);
            String url = paymentService.createMomoPaymentUrl(order, clientIp);

            Map<String, String> resp = new HashMap<>();
            resp.put("paymentUrl", url);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Error creating MOMO payment for order {}: {}", orderId, e.getMessage());
            throw new AppException(ErrorCode.PAYMENT_CREATION_FAILED);
        }
    }

    @GetMapping("/return")
    public org.springframework.web.servlet.view.RedirectView returnPage(@RequestParam Map<String, String> params) {
        String resultCode = params.getOrDefault("resultCode", "");
        String orderId = params.getOrDefault("orderId", "");
        String message = params.getOrDefault("message", "");
        String transId = params.getOrDefault("transId", "");

        try {
            Map<String, Object> ipnParams = new HashMap<>();
            for (Map.Entry<String, String> entry : params.entrySet()) {
                ipnParams.put(entry.getKey(), entry.getValue());
            }
            paymentService.handleMomoIpn(ipnParams);
        } catch (Exception e) {
            log.warn("Return handler could not process MOMO IPN: {}", e.getMessage());
        }

        // Convert MOMO orderId to database orderId
        Long databaseOrderId = null;
        try {
            // Find MomoPayment by MOMO orderId to get database orderId
            var momoPaymentOpt = paymentService.findMomoPaymentByOrderId(orderId);
            if (momoPaymentOpt.isPresent()) {
                databaseOrderId = momoPaymentOpt.get().getIdOrder();
            }
        } catch (Exception e) {
            log.warn("Could not find database orderId for MOMO orderId: {}", orderId);
        }

        // Get amount from MOMO payment record
        String amount = "";
        try {
            Optional<MomoPayment> momoPaymentOpt = paymentService.findMomoPaymentByOrderId(orderId);
            if (momoPaymentOpt.isPresent() && momoPaymentOpt.get().getAmount() != null) {
                amount = momoPaymentOpt.get().getAmount().toString();
            }
        } catch (Exception e) {
            log.warn("Could not get amount for MOMO orderId: {}", orderId);
        }

        // Redirect to payment result page (similar to VNPAY pattern)
        String redirectUrl = String.format(
                "/payment/result?code=%s&orderRef=%s&orderId=%s&message=%s&transId=%s&amount=%s",
                urlEncode(resultCode),
                urlEncode(orderId), // MOMO orderId as orderRef
                urlEncode(databaseOrderId == null ? "" : String.valueOf(databaseOrderId)), // Database orderId
                urlEncode(message),
                urlEncode(transId),
                urlEncode(amount));

        return new org.springframework.web.servlet.view.RedirectView(redirectUrl);
    }

    @PostMapping("/ipn")
    public ResponseEntity<String> ipn(@RequestBody Map<String, Object> params) {
        try {
            paymentService.handleMomoIpn(params);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("MOMO IPN processing failed", e);
            return ResponseEntity.status(500).body("ERROR");
        }
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