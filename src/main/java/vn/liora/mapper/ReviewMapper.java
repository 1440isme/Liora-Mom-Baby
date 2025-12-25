package vn.liora.mapper;

import org.mapstruct.*;
import vn.liora.dto.request.ReviewCreationRequest;
import vn.liora.dto.request.ReviewUpdateRequest;
import vn.liora.dto.response.ReviewResponse;
import vn.liora.entity.Image;
import vn.liora.entity.Review;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    // ========== CREATION MAPPING ==========
    @Mapping(target = "reviewId", ignore = true)
    @Mapping(target = "isVisible", ignore = true) // Mặc định true
    @Mapping(target = "createdAt", ignore = true) // Sẽ set trong service
    @Mapping(target = "lastUpdate", ignore = true) // Sẽ set trong service
    @Mapping(target = "userId", ignore = true) // Sẽ set trong service
    @Mapping(target = "productId", ignore = true) // Sẽ set trong service
    @Mapping(target = "orderProduct", ignore = true) // Sẽ set trong service
    Review toReview(ReviewCreationRequest request);

    // ========== RESPONSE MAPPING ==========
    @Mapping(target = "content", source = "content") // Không áp dụng mask cho content
    @Mapping(target = "username", source = "orderProduct.order.user.username")
    @Mapping(target = "userFirstname", source = "orderProduct.order.user.firstname")
    @Mapping(target = "userLastname", source = "orderProduct.order.user.lastname")
    @Mapping(target = "userAvatar", source = "orderProduct.order.user.avatar")
    @Mapping(target = "userEmail", source = "orderProduct.order.user.email")
    @Mapping(target = "userPhone", source = "orderProduct.order.user.phone")
    @Mapping(target = "orderCustomerName", source = "orderProduct.order.name")
    @Mapping(target = "orderCustomerPhone", source = "orderProduct.order.phone")
    @Mapping(target = "orderCustomerEmail", source = "orderProduct.order.email")
    @Mapping(target = "orderCustomerAddress", source = "orderProduct.order.addressDetail")
    @Mapping(target = "productName", source = "orderProduct.product.name")
    @Mapping(target = "productImage", ignore = true)
    @Mapping(target = "productThumbnail", source = "orderProduct.product.images", qualifiedByName = "getFirstImage")
    @Mapping(target = "productPrice", source = "orderProduct.product.price")
    @Mapping(target = "productBrandName", source = "orderProduct.product.brand.name")
    @Mapping(target = "productCategoryName", source = "orderProduct.product.category.name")
    @Mapping(target = "orderProductId", source = "orderProduct.idOrderProduct")
    @Mapping(target = "orderId", source = "orderProduct.order.idOrder")
    @Mapping(target = "orderCode", source = "orderProduct.order.idOrder", qualifiedByName = "mapOrderCode")
    @Mapping(target = "orderDate", source = "orderProduct.order.orderDate")
    @Mapping(target = "userDisplayName", expression = "java(calculateUserDisplayName(review))")
    ReviewResponse toReviewResponse(Review review);

    // ========== BATCH RESPONSE MAPPING ==========
    List<ReviewResponse> toReviewResponseList(List<Review> reviews);

    // ========== UPDATE MAPPING ==========
    @Mapping(target = "content", source = "content", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "rating", source = "rating", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "anonymous", source = "anonymous", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "reviewId", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "productId", ignore = true)
    @Mapping(target = "isVisible", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "lastUpdate", ignore = true)
    @Mapping(target = "orderProduct", ignore = true)
    void updateReview(@MappingTarget Review review, ReviewUpdateRequest request);

    @Named("mapOrderCode")
    default String mapOrderCode(Long orderId) {
        return orderId != null ? "#" + orderId : null;
    }

    @Named("getFirstImage")
    default String getFirstImage(List<Image> images) {
        return images != null && !images.isEmpty() ? images.get(0).getImageUrl() : null;
    }

    default String calculateUserDisplayName(Review review) {
        if (Boolean.TRUE.equals(review.getAnonymous())) {
            // User chọn ẩn danh - áp dụng mask cho username
            String username = review.getOrderProduct().getOrder().getUser().getUsername();
            if (username != null && !username.trim().isEmpty()) {
                return maskUsername(username);
            }
            return "Anonymous User";
        }

        // User không chọn ẩn danh - hiển thị full username
        String username = review.getOrderProduct().getOrder().getUser().getUsername();
        if (username != null && !username.trim().isEmpty()) {
            return username;
        }

        // Fallback to firstname + lastname
        String firstname = review.getOrderProduct().getOrder().getUser().getFirstname();
        String lastname = review.getOrderProduct().getOrder().getUser().getLastname();
        if (firstname != null && lastname != null) {
            return firstname + " " + lastname;
        }

        return "User";
    }

    // Helper method để mask username (chỉ dùng trong calculateUserDisplayName)
    @Named("maskUsername")
    default String maskUsername(String username) {
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