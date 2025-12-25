package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.entity.Order;
import vn.liora.entity.VnpayPayment;
import vn.liora.entity.MomoPayment;
import vn.liora.entity.Discount;
import vn.liora.entity.Product;
import vn.liora.entity.OrderProduct;
import vn.liora.dto.response.OrderResponse;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.mapper.OrderMapper;
import vn.liora.mapper.OrderProductMapper;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.OrderRepository;
import vn.liora.repository.VnpayPaymentRepository;
import vn.liora.repository.MomoPaymentRepository;
import vn.liora.repository.OrderProductRepository;
import vn.liora.repository.DiscountRepository;
import vn.liora.service.PaymentService;
import vn.liora.service.IProductService;
import vn.liora.service.EmailService;
import vn.liora.util.VnpayUtil;
import vn.liora.util.MomoUtil;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = false)
public class PaymentServiceImpl implements PaymentService {

    final OrderRepository orderRepository;
    final VnpayPaymentRepository vnpayPaymentRepository;
    final MomoPaymentRepository momoPaymentRepository;
    final OrderProductRepository orderProductRepository;
    final IProductService productService;
    final DiscountRepository discountRepository;
    final EmailService emailService;
    final OrderMapper orderMapper;
    final OrderProductMapper orderProductMapper;
    final RestTemplate restTemplate;

    @Value("${vnpay.tmnCode}")
    String vnpTmnCode;
    @Value("${vnpay.hashSecret}")
    String vnpHashSecret;
    @Value("${vnpay.payUrl}")
    String vnpPayUrl;
    @Value("${vnpay.returnUrl}")
    String vnpReturnUrl;
    @Value("${vnpay.ipnUrl}")
    String vnpIpnUrl;
    @Value("${vnpay.version}")
    String vnpVersion;
    @Value("${vnpay.command}")
    String vnpCommand;
    @Value("${vnpay.currCode}")
    String vnpCurrCode;
    @Value("${vnpay.locale:vn}")
    String vnpLocale;

    @Value("${vnpay.sendIpnParam:false}")
    boolean vnpSendIpnParam;

    // MOMO Configuration
    @Value("${momo.partnerCode}")
    String momoPartnerCode;
    @Value("${momo.accessKey}")
    String momoAccessKey;
    @Value("${momo.secretKey}")
    String momoSecretKey;
    @Value("${momo.api.endpoint}")
    String momoApiEndpoint;
    @Value("${momo.api.endpoint.query}")
    String momoApiEndpointQuery;
    @Value("${momo.returnUrl}")
    String momoReturnUrl;
    @Value("${momo.notifyUrl}")
    String momoIpnUrl;
    @Value("${momo.requestType}")
    String momoRequestType;
    @Value("${momo.orderType}")
    String momoOrderType;
    @Value("${momo.timeout:30000}")
    int momoTimeout;

    @Override
    public String createVnpayPaymentUrl(Order order, String clientIp) {
        if (order == null || order.getIdOrder() == null) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        // Build params theo đúng sample VNPAY (TreeMap + URLEncoder US_ASCII)
        Map<String, String> fields = new TreeMap<>();
        fields.put("vnp_Version", vnpVersion);
        fields.put("vnp_Command", vnpCommand);
        fields.put("vnp_TmnCode", vnpTmnCode);
        // amount = VND x 100 (integer)
        BigDecimal amount = order.getTotal() == null ? BigDecimal.ZERO : order.getTotal();
        String vnpAmount = amount.multiply(BigDecimal.valueOf(100)).setScale(0, java.math.RoundingMode.DOWN)
                .toPlainString();
        fields.put("vnp_Amount", vnpAmount);
        fields.put("vnp_CurrCode", vnpCurrCode);
        fields.put("vnp_TxnRef", generateOrReuseTxnRef(order));
        fields.put("vnp_OrderInfo", "Thanh toan don hang #" + order.getIdOrder());
        fields.put("vnp_OrderType", "other");
        fields.put("vnp_Locale", (vnpLocale == null || vnpLocale.isBlank()) ? "vn" : vnpLocale);
        fields.put("vnp_ReturnUrl", vnpReturnUrl);
        // Chỉ gửi tham số vnp_IpnUrl khi được bật qua cấu hình để tránh lỗi không tương
        // thích cấu hình merchant
        if (vnpSendIpnParam && vnpIpnUrl != null && !vnpIpnUrl.isBlank()) {
            fields.put("vnp_IpnUrl", vnpIpnUrl);
        }
        String ip = (clientIp == null || clientIp.isBlank()) ? "127.0.0.1" : clientIp;
        fields.put("vnp_IpAddr", ip);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String create = LocalDateTime.now().format(formatter);
        fields.put("vnp_CreateDate", create);
        String expire = LocalDateTime.now().plusMinutes(15).format(formatter);
        fields.put("vnp_ExpireDate", expire);

        // Dựng hashData và query giống hệt sample JSP
        StringBuilder hashData = new StringBuilder();
        StringBuilder querySb = new StringBuilder();
        for (Map.Entry<String, String> e : fields.entrySet()) {
            String k = e.getKey();
            String v = e.getValue();
            if (v == null || v.isEmpty())
                continue;
            if (hashData.length() > 0) {
                hashData.append('&');
                querySb.append('&');
            }
            hashData.append(k).append('=')
                    .append(java.net.URLEncoder.encode(v, java.nio.charset.StandardCharsets.US_ASCII));
            querySb.append(java.net.URLEncoder.encode(k, java.nio.charset.StandardCharsets.US_ASCII))
                    .append('=')
                    .append(java.net.URLEncoder.encode(v, java.nio.charset.StandardCharsets.US_ASCII));
        }
        String signData = hashData.toString();
        String query = querySb.toString();
        String secureHash = VnpayUtil.hmacSHA512(vnpHashSecret, signData);
        String paymentUrl = vnpPayUrl + "?" + query + "&vnp_SecureHash=" + secureHash;

        // Debug logs (mask secret)
        try {
            String maskedSecret = vnpHashSecret == null ? "null"
                    : ("***" + vnpHashSecret.substring(Math.max(0, vnpHashSecret.length() - 4)));
            log.info("[VNPAY] TMN={}, Amount={}, SignData={}, Hash(secret={}):{}", vnpTmnCode, vnpAmount, signData,
                    maskedSecret, secureHash);
            log.info("[VNPAY] PaymentURL={}", paymentUrl);
        } catch (Exception ignore) {
        }

        return paymentUrl;
    }

    private String generateOrReuseTxnRef(Order order) {
        // Check if VnpayPayment already exists for this order
        VnpayPayment existingPayment = vnpayPaymentRepository.findByIdOrder(order.getIdOrder()).orElse(null);
        if (existingPayment != null) {
            return existingPayment.getVnpTxnRef();
        }

        String txnRef = String.format("%s%06d", DateTimeFormatter.ofPattern("yyMMdd").format(LocalDateTime.now()),
                order.getIdOrder());

        // Create new VnpayPayment entity
        VnpayPayment vnpayPayment = VnpayPayment.builder()
                .idOrder(order.getIdOrder())
                .vnpTxnRef(txnRef)
                .vnpAmount(order.getTotal())
                .build();

        vnpayPaymentRepository.save(vnpayPayment);
        return txnRef;
    }

    @Override
    @Transactional
    public void handleVnpayIpn(Map<String, String> params) {
        // Extract and verify signature
        String receivedHash = params.get("vnp_SecureHash");
        Map<String, String> dataForSign = new HashMap<>(params);
        dataForSign.remove("vnp_SecureHash");
        dataForSign.remove("vnp_SecureHashType");
        String signData = VnpayUtil.buildQuery(dataForSign);
        String expectedHash = VnpayUtil.hmacSHA512(vnpHashSecret, signData);
        if (log.isInfoEnabled()) {
            try {
                String maskedSecret = vnpHashSecret == null ? "null"
                        : ("***" + vnpHashSecret.substring(Math.max(0, vnpHashSecret.length() - 4)));
                log.info("[VNPAY IPN] SignData={}, LocalHash(secret={}):{}, ReceivedHash={}", signData, maskedSecret,
                        expectedHash, receivedHash);
            } catch (Exception ignore) {
            }
        }
        if (receivedHash == null || !receivedHash.equalsIgnoreCase(expectedHash)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        String txnRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionNo = params.get("vnp_TransactionNo");
        String bankCode = params.get("vnp_BankCode");
        String amountStr = params.get("vnp_Amount");

        VnpayPayment vnpayPayment = vnpayPaymentRepository.findByVnpTxnRef(txnRef)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        Order order = orderRepository.findById(vnpayPayment.getIdOrder())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Idempotent: if already PAID, ignore
        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            log.info("Order {} already PAID, ignore IPN", order.getIdOrder());
            return;
        }

        BigDecimal paidAmount = BigDecimal.ZERO;
        try {
            if (amountStr != null) {
                paidAmount = new BigDecimal(amountStr).divide(BigDecimal.valueOf(100));
            }
        } catch (NumberFormatException e) {
            log.warn("Invalid vnp_Amount: {}", amountStr);
        }

        if ("00".equals(responseCode)) {
            order.setPaymentStatus("PAID");
            // orderStatus vẫn là PENDING, đợi admin duyệt đơn để tạo GHN

            // Update VnpayPayment entity
            vnpayPayment.setVnpTransactionNo(transactionNo);
            vnpayPayment.setVnpBankCode(bankCode);
            vnpayPayment.setVnpResponseCode(responseCode);
            vnpayPayment.setPaidAmount(paidAmount);
            vnpayPayment.setPaidAt(LocalDateTime.now());
            vnpayPayment.setFailureReason(null);
        } else if ("24".equals(responseCode)) { // 24: User cancel payment at VNPAY
            order.setPaymentStatus("CANCELLED");
            order.setOrderStatus("CANCELLED"); // Đơn hàng cũng chuyển thành đã hủy

            // ✅ HOÀN LẠI DISCOUNT NẾU CÓ
            if (order.getDiscount() != null) {
                try {
                    Discount discount = order.getDiscount();
                    if (discount.getUsedCount() > 0) {
                        discount.setUsedCount(discount.getUsedCount() - 1);
                        discountRepository.save(discount);
                        log.info("Rolled back discount usage for order {} (payment cancelled)", order.getIdOrder());
                    }
                } catch (Exception e) {
                    log.warn("Failed to rollback discount for cancelled payment: {}", e.getMessage());
                }
            }

            // ✅ HOÀN LẠI STOCK
            try {
                restoreStockForOrder(order);
            } catch (Exception e) {
                log.warn("Failed to restore stock for cancelled payment: {}", e.getMessage());
            }

            // Update VnpayPayment entity
            vnpayPayment.setVnpResponseCode(responseCode);
            vnpayPayment.setFailureReason("VNPAY user cancelled (code=24)");

            // ✅ GỬI EMAIL THÔNG BÁO HỦY ĐƠN HÀNG
            try {
                sendCancellationEmail(order);
            } catch (Exception e) {
                log.warn("Failed to send cancellation email: {}", e.getMessage());
            }
        } else {
            order.setPaymentStatus("FAILED");

            // Update VnpayPayment entity
            vnpayPayment.setVnpResponseCode(responseCode);
            vnpayPayment.setFailureReason("VNPAY code=" + responseCode);
        }

        orderRepository.save(order);
        vnpayPaymentRepository.save(vnpayPayment);
    }

    @Override
    public String createMomoPaymentUrl(Order order, String clientIp) {
        if (order == null || order.getIdOrder() == null) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        try {
            // Generate unique IDs
            String orderId = MomoUtil.generateOrderId(order.getIdOrder());
            String requestId = MomoUtil.generateRequestId();

            // Check if orderId already exists
            if (momoPaymentRepository.existsByOrderId(orderId)) {
                orderId = MomoUtil.generateOrderId(order.getIdOrder());
            }

            // Prepare payment data
            BigDecimal amount = order.getTotal() == null ? BigDecimal.ZERO : order.getTotal();
            String orderInfo = "Thanh toan don hang #" + order.getIdOrder();
            String extraData = "";

            // Create signature
            String signature = MomoUtil.createSignature(
                    momoAccessKey, momoSecretKey, momoPartnerCode,
                    orderId, requestId, amount, orderInfo, momoReturnUrl, momoIpnUrl,
                    momoRequestType, extraData);

            // Check if MomoPayment already exists for this order
            MomoPayment momoPayment = momoPaymentRepository.findByOrderId(orderId).orElse(null);

            if (momoPayment == null) {
                // Create new MomoPayment entity
                momoPayment = MomoPayment.builder()
                        .idOrder(order.getIdOrder())
                        .partnerCode(momoPartnerCode)
                        .orderId(orderId)
                        .requestId(requestId)
                        .amount(amount)
                        .orderInfo(orderInfo)
                        .redirectUrl(momoReturnUrl)
                        .ipnUrl(momoIpnUrl)
                        .extraData(extraData)
                        .requestType(momoRequestType)
                        .signature(signature)
                        .build();
            } else {
                // Update existing MomoPayment
                momoPayment.setRequestId(requestId);
                momoPayment.setAmount(amount);
                momoPayment.setOrderInfo(orderInfo);
                momoPayment.setSignature(signature);
                momoPayment.setUpdatedAt(LocalDateTime.now());
            }

            // Save to database
            momoPaymentRepository.save(momoPayment);

            // Prepare request body for MOMO API theo đúng thứ tự raw data
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("partnerCode", momoPartnerCode);
            requestBody.put("accessKey", momoAccessKey);
            requestBody.put("requestId", requestId);
            requestBody.put("amount", String.valueOf(amount.longValue())); // Chuyển thành string
            requestBody.put("orderId", orderId);
            requestBody.put("orderInfo", orderInfo);
            requestBody.put("returnUrl", momoReturnUrl);
            requestBody.put("notifyUrl", momoIpnUrl);
            requestBody.put("extraData", extraData);
            requestBody.put("requestType", momoRequestType);
            requestBody.put("signature", signature);

            // Call MOMO API
            String response = callMomoApi(momoApiEndpoint, requestBody);
            Map<String, Object> responseData = MomoUtil.parseJson(response);

            // Check response
            Integer errorCode = (Integer) responseData.get("errorCode");
            String message = (String) responseData.get("message");
            String payUrl = (String) responseData.get("payUrl");

            if (errorCode != null && errorCode == 0 && payUrl != null) {
                // Update MomoPayment with response
                momoPayment.setResultCode(errorCode);
                momoPayment.setMessage(message);
                momoPayment.setPayUrl(payUrl);
                momoPaymentRepository.save(momoPayment);

                return payUrl;
            } else {
                log.error("MOMO API error: errorCode={}, message={}", errorCode, message);
                throw new AppException(ErrorCode.PAYMENT_CREATION_FAILED);
            }

        } catch (Exception e) {
            log.error("Error creating MOMO payment URL for Order {}", order.getIdOrder(), e);
            throw new AppException(ErrorCode.PAYMENT_CREATION_FAILED);
        }
    }

    @Override
    @Transactional
    public void handleMomoIpn(Map<String, Object> params) {
        try {
            // Skip signature verification for testing
            // if (!MomoUtil.verifySignature(momoAccessKey, momoSecretKey, params)) {
            // log.error("MOMO IPN signature verification failed");
            // throw new AppException(ErrorCode.UNAUTHORIZED);
            // }

            String orderId = (String) params.get("orderId");
            // MOMO IPN uses errorCode, not resultCode - convert String to Integer
            String errorCodeStr = (String) params.get("errorCode");
            Integer resultCode = errorCodeStr != null ? Integer.parseInt(errorCodeStr) : null;
            String message = (String) params.get("message");
            String transId = (String) params.get("transId");
            String orderType = (String) params.get("orderType");
            // MOMO sends responseTime as String, convert to Long safely
            String responseTimeStr = (String) params.get("responseTime");
            Long responseTime = null;
            if (responseTimeStr != null && !responseTimeStr.isEmpty()) {
                try {
                    // Try to parse as timestamp first
                    responseTime = Long.parseLong(responseTimeStr);
                } catch (NumberFormatException e) {
                    // If it's a date string like "2025-10-26 01:57:31", just log it
                    log.warn("MOMO responseTime is not a number: {}", responseTimeStr);
                    responseTime = null;
                }
            }

            if (orderId == null) {
                log.error("MOMO IPN missing orderId");
                throw new AppException(ErrorCode.ORDER_NOT_FOUND);
            }

            MomoPayment momoPayment = momoPaymentRepository.findByOrderId(orderId)
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

            Order order = orderRepository.findById(momoPayment.getIdOrder())
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

            // Idempotent: if already PAID, ignore
            if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
                log.info("Order {} already PAID, ignore MOMO IPN", order.getIdOrder());
                return;
            }

            // Update MomoPayment with IPN data
            momoPayment.setResultCode(resultCode);
            momoPayment.setMessage(message);
            momoPayment.setTransId(transId);
            momoPayment.setOrderType(orderType);
            momoPayment.setResponseTime(responseTime);

            // Handle additional MOMO IPN fields if present
            String payUrl = (String) params.get("payUrl");
            if (payUrl != null) {
                momoPayment.setPayUrl(payUrl);
            }

            if (resultCode != null && resultCode == 0) {
                // Payment successful
                order.setPaymentStatus("PAID");
                // orderStatus vẫn là PENDING, đợi admin duyệt đơn để tạo GHN

                momoPayment.setPaidAmount(order.getTotal());
                momoPayment.setPaidAt(LocalDateTime.now());
                momoPayment.setFailureReason(null);
            } else if (resultCode != null && (resultCode == 42 || resultCode == 24)) {
                // Payment cancelled by user (42: Bad request, 24: Cancelled)
                order.setPaymentStatus("CANCELLED");
                order.setOrderStatus("CANCELLED"); // Đơn hàng cũng chuyển thành đã hủy

                // ✅ HOÀN LẠI DISCOUNT NẾU CÓ
                if (order.getDiscount() != null) {
                    try {
                        Discount discount = order.getDiscount();
                        if (discount.getUsedCount() > 0) {
                            discount.setUsedCount(discount.getUsedCount() - 1);
                            discountRepository.save(discount);
                            log.info("Rolled back discount usage for order {} (payment cancelled)", order.getIdOrder());
                        }
                    } catch (Exception e) {
                        log.warn("Failed to rollback discount for cancelled payment: {}", e.getMessage());
                    }
                }

                // ✅ HOÀN LẠI STOCK
                try {
                    restoreStockForOrder(order);
                } catch (Exception e) {
                    log.warn("Failed to restore stock for cancelled payment: {}", e.getMessage());
                }

                momoPayment.setFailureReason(
                        "MOMO errorCode=" + resultCode + ", message=" + message + " (User cancelled)");

                // ✅ GỬI EMAIL THÔNG BÁO HỦY ĐƠN HÀNG
                try {
                    sendCancellationEmail(order);
                } catch (Exception e) {
                    log.warn("Failed to send cancellation email: {}", e.getMessage());
                }
            } else {
                // Payment failed for other reasons
                order.setPaymentStatus("FAILED");
                momoPayment.setFailureReason("MOMO errorCode=" + resultCode + ", message=" + message);
            }

            orderRepository.save(order);
            momoPaymentRepository.save(momoPayment);

        } catch (Exception e) {
            log.error("Error processing MOMO IPN", e);
            throw e;
        }
    }

    private String callMomoApi(String endpoint, Map<String, Object> requestBody) {
        try {
            String jsonBody = MomoUtil.toJson(requestBody);
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json; charset=UTF-8");

            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, entity, String.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling MOMO API", e);
            throw new RuntimeException("Error calling MOMO API", e);
        }
    }

    /**
     * Gửi email thông báo hủy đơn hàng
     */
    private void sendCancellationEmail(Order order) {
        try {
            OrderResponse orderResponse = orderMapper.toOrderResponse(order);
            List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
            List<OrderProductResponse> orderProductResponses = orderProducts.stream()
                    .map(orderProductMapper::toOrderProductResponse)
                    .collect(java.util.stream.Collectors.toList());

            if (order.getUser() != null) {
                // User đã đăng nhập
                emailService.sendOrderCancellationEmail(
                        order.getUser().getEmail(),
                        order.getUser().getFirstname() + " " + order.getUser().getLastname(),
                        orderResponse,
                        orderProductResponses);
            } else {
                // Guest user
                emailService.sendGuestOrderCancellationEmail(
                        order.getEmail(),
                        orderResponse,
                        orderProductResponses);
            }
        } catch (Exception e) {
            log.error("Failed to send cancellation email: {}", e.getMessage());
        }
    }

    /**
     * Hoàn lại stock cho các sản phẩm trong đơn hàng bị hủy
     */
    private void restoreStockForOrder(Order order) {
        try {
            var orderProducts = orderProductRepository.findByOrder(order);
            for (var orderProduct : orderProducts) {
                try {
                    Product product = orderProduct.getProduct();
                    Integer currentStock = product.getStock();
                    Integer quantity = orderProduct.getQuantity();
                    Integer newStock = currentStock + quantity;

                    productService.updateStock(product.getProductId(), newStock);

                    log.info("Restored stock for product {}: {} -> {} (quantity: {})",
                            product.getProductId(), currentStock, newStock, quantity);
                } catch (Exception e) {
                    log.error("Error restoring stock for product {}: {}",
                            orderProduct.getProduct().getProductId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error restoring stock for order {}: {}", order.getIdOrder(), e.getMessage());
        }
    }

    @Override
    public Optional<MomoPayment> findMomoPaymentByOrderId(String orderId) {
        return momoPaymentRepository.findByOrderId(orderId);
    }

}
