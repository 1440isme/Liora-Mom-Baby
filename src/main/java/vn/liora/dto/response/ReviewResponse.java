package vn.liora.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReviewResponse {
    private Long reviewId;
    private String content;
    private Integer rating;
    private Boolean anonymous;
    private Boolean isVisible;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdate;

    // User info
    private Long userId;
    private String username;
    private String userFirstname;
    private String userLastname;
    private String userAvatar;
    private String userDisplayName; // Computed field for display
    private String userEmail; // Thêm email
    private String userPhone; // Thêm số điện thoại
    private String productImage;
    private String productThumbnail;

    // Product info
    private Long productId;
    private String productName;
    private BigDecimal productPrice; // Thêm giá sản phẩm
    private String productBrandName; // Thêm tên thương hiệu
    private String productCategoryName; // Thêm tên danh mục

    // Order info
    private Long orderProductId;
    private Long orderId; // Thêm ID đơn hàng
    private String orderCode; // Thêm mã đơn hàng
    private LocalDateTime orderDate; // Thêm ngày đặt hàng

    private String orderCustomerName;    // Tên khách hàng từ đơn hàng
    private String orderCustomerPhone;   // SĐT khách hàng từ đơn hàng  
    private String orderCustomerEmail;   // Email khách hàng từ đơn hàng
    private String orderCustomerAddress; // Địa chỉ khách hàng từ đơn hàng

    // Helper method to get display name
    public String getUserDisplayName() {
        if (Boolean.TRUE.equals(anonymous)) {
            // User chọn ẩn danh - áp dụng mask cho username
            if (username != null && !username.trim().isEmpty()) {
                return maskUsername(username);
            }
            return "Anonymous User";
        }
        
        // User không chọn ẩn danh - hiển thị full username
        if (username != null && !username.trim().isEmpty()) {
            return username;
        }
        
        // Fallback to firstname + lastname
        if (userFirstname != null && userLastname != null) {
            return userFirstname + " " + userLastname;
        }
        
        return "User";
    }
    
    // Helper method to mask username (chỉ hiển thị chữ đầu và cuối)
    private String maskUsername(String username) {
        if (username == null || username.length() <= 2) {
            return username;
        }
        
        if (username.length() == 3) {
            return username.charAt(0) + "*" + username.charAt(2);
        }
        
        // Tạo chuỗi với chữ đầu, các dấu *, và chữ cuối
        StringBuilder masked = new StringBuilder();
        masked.append(username.charAt(0));
        
        for (int i = 1; i < username.length() - 1; i++) {
            masked.append("*");
        }
        
        masked.append(username.charAt(username.length() - 1));
        
        return masked.toString();
    }
}