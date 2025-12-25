package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import vn.liora.dto.request.OrderCreationRequest;
import vn.liora.dto.request.OrderUpdateRequest;
import vn.liora.dto.response.OrderResponse;
import vn.liora.entity.Order;
import vn.liora.entity.User;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    // Map từ request khi tạo đơn hàng → entity Order
    @Mapping(target = "idOrder", ignore = true)
    @Mapping(target = "orderDate", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "orderStatus", ignore = true)
    @Mapping(target = "discount", ignore = true)
    Order toOrder(OrderCreationRequest request);

    @Mapping(target = "userId", source = "user.userId")
    @Mapping(target = "customerName", source = "user", qualifiedByName = "mapCustomerName")
    @Mapping(target = "discountId", source = "discount.discountId")
    @Mapping(target = "discountName", source = "discount.name")
    @Mapping(target = "discountValue", source = "discount.discountValue")
    OrderResponse toOrderResponse(Order order);

    List<OrderResponse> toOrderResponseList(List<Order> orders);

    @Mapping(target = "orderStatus", source = "orderStatus")
    @Mapping(target = "paymentStatus", source = "paymentStatus")
    @Mapping(target = "discount", ignore = true)
    void updateOrder(@MappingTarget Order order, OrderUpdateRequest request);

    @Named("mapCustomerName")
    default String mapCustomerName(User user) {
        if (user != null && user.getUserId() != null) {
            // Nếu có User (đăng nhập), lấy lastname + firstname
            String lastName = user.getLastname() != null ? user.getLastname() : "";
            String firstName = user.getFirstname() != null ? user.getFirstname() : "";
            return (lastName + " " + firstName).trim();
        } else {
            // Nếu là khách vãng lai (không có User), hiển thị "Khách"
            return "Khách";
        }
    }
}
