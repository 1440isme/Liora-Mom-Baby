package vn.liora.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import vn.liora.dto.response.OrderResponse;
import vn.liora.dto.response.OrderProductResponse;

import java.util.List;
import java.util.Random;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${APP_URL:http://localhost:8080}")
    private String appUrl;

    /**
     * Gửi email xác nhận đơn hàng cho user đã đăng nhập
     */
    public void sendOrderConfirmationEmail(String userEmail, String userName, OrderResponse order,
            List<OrderProductResponse> orderProducts) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(userEmail);
            message.setSubject("Xác nhận đơn hàng #" + order.getIdOrder() + " - Liora");

            String content = buildOrderConfirmationContent(userName, order, orderProducts, true);
            message.setText(content);

            mailSender.send(message);
            System.out.println("Order confirmation email sent to: " + userEmail);
        } catch (Exception e) {
            System.err.println("Error sending order confirmation email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Gửi email xác nhận đơn hàng cho guest
     */
    public void sendGuestOrderConfirmationEmail(String guestEmail, OrderResponse order,
            List<OrderProductResponse> orderProducts) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(guestEmail);
            message.setSubject("Xác nhận đơn hàng #" + order.getIdOrder() + " - Liora");

            String content = buildOrderConfirmationContent("Khách hàng", order, orderProducts, false);
            message.setText(content);

            mailSender.send(message);
            System.out.println("Guest order confirmation email sent to: " + guestEmail);
        } catch (Exception e) {
            System.err.println("Error sending guest order confirmation email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Xây dựng nội dung email
     */
    private String buildOrderConfirmationContent(String customerName, OrderResponse order,
            List<OrderProductResponse> orderProducts, boolean isRegisteredUser) {
        StringBuilder content = new StringBuilder();

        content.append("Xin chào ").append(customerName).append(",\n\n");
        content.append("Cảm ơn bạn đã đặt hàng tại Liora! Đơn hàng của bạn đang được xử lý.\n\n");

        content.append("THÔNG TIN ĐƠN HÀNG:\n");
        content.append("Mã đơn hàng: #").append(order.getIdOrder()).append("\n");
        content.append("Ngày đặt: ").append(order.getOrderDate()).append("\n");
        content.append("Trạng thái: ").append(getOrderStatusText(order.getOrderStatus())).append("\n");
        content.append("Tổng tiền: ").append(String.format("%,.0f VNĐ", order.getTotal())).append("\n\n");

        content.append("SẢN PHẨM ĐÃ ĐẶT:\n");
        for (OrderProductResponse product : orderProducts) {
            content.append("- ").append(product.getProductName())
                    .append(" x").append(product.getQuantity())
                    .append(" = ").append(String.format("%,.0f VNĐ", product.getTotalPrice())).append("\n");
        }

        content.append("\nTHÔNG TIN GIAO HÀNG:\n");
        content.append("Họ tên: ").append(order.getName()).append("\n");
        content.append("Số điện thoại: ").append(order.getPhone()).append("\n");
        content.append("Email: ").append(order.getEmail()).append("\n");
        content.append("Địa chỉ: ").append(order.getAddressDetail()).append("\n");
        content.append("Phương thức thanh toán: ").append(getPaymentMethodText(order.getPaymentMethod()))
                .append("\n\n");

        if (isRegisteredUser) {
            content.append("XEM CHI TIẾT ĐƠN HÀNG:\n");
            content.append("Bạn có thể xem chi tiết đơn hàng tại: ");
            content.append(appUrl).append("/user/order-detail/").append(order.getIdOrder()).append("\n\n");
        } else {
            content.append("XEM CHI TIẾT ĐƠN HÀNG:\n");
            content.append("Bạn có thể xem chi tiết đơn hàng tại: ");
            content.append(appUrl).append("/user/order-detail/access\n\n");
            content.append("Thông tin cần thiết:\n");
            content.append("- Mã đơn hàng: ").append(order.getIdOrder()).append("\n");
            content.append("- Email đặt hàng: ").append(order.getEmail()).append("\n\n");
        }

        content.append("Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.\n\n");
        content.append("Trân trọng,\n");
        content.append("Đội ngũ Liora");

        return content.toString();
    }

    private String getOrderStatusText(String status) {
        switch (status) {
            case "PENDING":
                return "Chờ xử lý";
            case "CONFIRMED":
                return "Đã xác nhận";
            case "SHIPPING":
                return "Đang giao hàng";
            case "DELIVERED":
                return "Đã giao hàng";
            case "CANCELLED":
                return "Đã hủy";
            default:
                return status;
        }
    }

    private String getPaymentMethodText(String paymentMethod) {
        switch (paymentMethod) {
            case "CASH":
                return "Thanh toán khi nhận hàng";
            case "BANK_TRANSFER":
                return "Chuyển khoản ngân hàng";
            case "CREDIT_CARD":
                return "Thẻ tín dụng";
            default:
                return paymentMethod;
        }
    }

    /**
     * Gửi email OTP đăng ký
     */
    public void sendRegistrationOtpEmail(String userEmail, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(userEmail);
            message.setSubject("Xác thực email đăng ký - Liora");

            String content = buildRegistrationOtpContent(otpCode);
            message.setText(content);

            mailSender.send(message);
            System.out.println("Registration OTP email sent to: " + userEmail);
        } catch (Exception e) {
            System.err.println("Error sending registration OTP email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Gửi email OTP reset password
     */
    public void sendPasswordResetOtpEmail(String userEmail, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(userEmail);
            message.setSubject("Mã xác thực đặt lại mật khẩu - Liora");

            String content = buildPasswordResetOtpContent(otpCode);
            message.setText(content);

            mailSender.send(message);
            System.out.println("Password reset OTP email sent to: " + userEmail);
        } catch (Exception e) {
            System.err.println("Error sending password reset OTP email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Tạo mã OTP ngẫu nhiên 6 chữ số
     */
    public String generateOtpCode() {
        Random random = new Random();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }

    /**
     * Xây dựng nội dung email OTP đăng ký
     */
    private String buildRegistrationOtpContent(String otpCode) {
        StringBuilder content = new StringBuilder();

        content.append("Xin chào,\n\n");
        content.append("Cảm ơn bạn đã đăng ký tài khoản tại Liora!\n\n");

        content.append("ĐỂ HOÀN TẤT ĐĂNG KÝ:\n");
        content.append("Vui lòng nhập mã xác thực sau để xác nhận email của bạn:\n\n");

        content.append("MÃ XÁC THỰC:\n");
        content.append(otpCode).append("\n\n");

        content.append("LƯU Ý QUAN TRỌNG:\n");
        content.append("- Mã xác thực có hiệu lực trong 10 phút\n");
        content.append("- Mã chỉ sử dụng được 1 lần\n");
        content.append("- Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này\n");
        content.append("- Để bảo mật, không chia sẻ mã này với ai khác\n\n");

        content.append("Nếu bạn gặp vấn đề, hãy liên hệ với chúng tôi.\n\n");
        content.append("Trân trọng,\nĐội ngũ Liora");

        return content.toString();
    }

    /**
     * Xây dựng nội dung email OTP reset password
     */
    private String buildPasswordResetOtpContent(String otpCode) {
        StringBuilder content = new StringBuilder();

        content.append("Xin chào,\n\n");
        content.append("Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Liora của mình.\n\n");

        content.append("ĐỂ ĐẶT LẠI MẬT KHẨU:\n");
        content.append("Vui lòng nhập mã xác thực sau:\n\n");

        content.append("MÃ XÁC THỰC:\n");
        content.append(otpCode).append("\n\n");

        content.append("LƯU Ý QUAN TRỌNG:\n");
        content.append("- Mã xác thực có hiệu lực trong 10 phút\n");
        content.append("- Mã chỉ sử dụng được 1 lần\n");
        content.append("- Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này\n");
        content.append("- Để bảo mật, không chia sẻ mã này với ai khác\n\n");

        content.append("Nếu bạn gặp vấn đề, hãy liên hệ với chúng tôi.\n\n");
        content.append("Trân trọng,\nĐội ngũ Liora");

        return content.toString();
    }

    /**
     * Gửi email thông báo hủy đơn hàng cho user đã đăng nhập
     */
    public void sendOrderCancellationEmail(String userEmail, String userName, OrderResponse order,
            List<OrderProductResponse> orderProducts) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(userEmail);
            message.setSubject("Thông báo hủy đơn hàng #" + order.getIdOrder() + " - Liora");

            String content = buildOrderCancellationContent(userName, order, orderProducts, true);
            message.setText(content);

            mailSender.send(message);
            System.out.println("Order cancellation email sent to: " + userEmail);
        } catch (Exception e) {
            System.err.println("Error sending order cancellation email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Gửi email thông báo hủy đơn hàng cho guest
     */
    public void sendGuestOrderCancellationEmail(String guestEmail, OrderResponse order,
            List<OrderProductResponse> orderProducts) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(guestEmail);
            message.setSubject("Thông báo hủy đơn hàng #" + order.getIdOrder() + " - Liora");

            String content = buildOrderCancellationContent("Khách hàng", order, orderProducts, false);
            message.setText(content);

            mailSender.send(message);
            System.out.println("Guest order cancellation email sent to: " + guestEmail);
        } catch (Exception e) {
            System.err.println("Error sending guest order cancellation email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Xây dựng nội dung email thông báo hủy đơn hàng
     */
    private String buildOrderCancellationContent(String customerName, OrderResponse order,
            List<OrderProductResponse> orderProducts, boolean isRegisteredUser) {
        StringBuilder content = new StringBuilder();

        content.append("Xin chào ").append(customerName).append(",\n\n");
        content.append("Chúng tôi xin thông báo đơn hàng của bạn đã bị hủy.\n\n");

        content.append("THÔNG TIN ĐƠN HÀNG:\n");
        content.append("Mã đơn hàng: #").append(order.getIdOrder()).append("\n");
        content.append("Ngày đặt: ").append(order.getOrderDate()).append("\n");
        content.append("Trạng thái: ").append("Đã hủy").append("\n");
        content.append("Tổng tiền: ").append(String.format("%,.0f VNĐ", order.getTotal())).append("\n\n");

        content.append("SẢN PHẨM ĐÃ HỦY:\n");
        for (OrderProductResponse product : orderProducts) {
            content.append("- ").append(product.getProductName())
                    .append(" x").append(product.getQuantity())
                    .append(" = ").append(String.format("%,.0f VNĐ", product.getTotalPrice())).append("\n");
        }

        if (isRegisteredUser) {
            content.append("XEM CHI TIẾT ĐƠN HÀNG:\n");
            content.append("Bạn có thể xem chi tiết đơn hàng tại: ");
            content.append(appUrl).append("/user/order-detail/").append(order.getIdOrder()).append("\n\n");
        } else {
            content.append("XEM CHI TIẾT ĐƠN HÀNG:\n");
            content.append("Bạn có thể xem chi tiết đơn hàng tại: ");
            content.append(appUrl).append("/user/order-detail/access\n\n");
            content.append("Thông tin cần thiết:\n");
            content.append("- Mã đơn hàng: ").append(order.getIdOrder()).append("\n");
            content.append("- Email đặt hàng: ").append(order.getEmail()).append("\n\n");
        }

        content.append("Nếu bạn cần hỗ trợ hoặc có câu hỏi về việc hủy đơn hàng, vui lòng liên hệ với chúng tôi.\n\n");
        content.append("Trân trọng,\n");
        content.append("Đội ngũ Liora");

        return content.toString();
    }
}
