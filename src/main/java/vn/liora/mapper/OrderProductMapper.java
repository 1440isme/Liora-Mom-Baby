package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.entity.CartProduct;
import vn.liora.entity.OrderProduct;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderProductMapper {
    @Mapping(target = "idOrderProduct", ignore = true)
    @Mapping(target = "order", ignore = true)                  // set thủ công
    @Mapping(target = "product", source = "product")          // map từ CartProduct
    @Mapping(target = "totalPrice", source = "totalPrice")      // đảm bảo map
    OrderProduct toOrderProduct(CartProduct cartProduct);


    // Chuyển OrderProduct → Response với thông tin chi tiết sản phẩm
    @Mapping(target = "idOrder", source = "order.idOrder")
    @Mapping(target = "idProduct", source = "product.productId")
    @Mapping(target = "quantity", source = "quantity") // Map rõ ràng trường quantity
    @Mapping(target = "totalPrice", source = "totalPrice") // Map rõ ràng trường totalPrice
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "productDescription", source = "product.description")
    @Mapping(target = "productPrice", source = "product.price")
    @Mapping(target = "categoryName", source = "product.category.name")
    @Mapping(target = "brandName", source = "product.brand.name")
    @Mapping(target = "brandId", source = "product.brand.brandId")
    @Mapping(target = "mainImageUrl", ignore = true) // Sẽ set thủ công trong service
    OrderProductResponse toOrderProductResponse(OrderProduct orderProduct);
    List<OrderProductResponse> toOrderProductResponseList(List<OrderProduct> orderProducts);


}
