package vn.liora.service;

import vn.liora.entity.Order;
import vn.liora.entity.MomoPayment;

import java.util.Optional;

public interface PaymentService {
    String createVnpayPaymentUrl(Order order, String clientIp);

    void handleVnpayIpn(java.util.Map<String, String> params);

    // MOMO Payment methods
    String createMomoPaymentUrl(Order order, String clientIp);

    void handleMomoIpn(java.util.Map<String, Object> params);

    Optional<MomoPayment> findMomoPaymentByOrderId(String orderId);
}
