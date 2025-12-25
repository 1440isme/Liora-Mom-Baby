package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.liora.dto.request.CartProductCreationRequest;
import vn.liora.dto.request.CartProductUpdateRequest;
import vn.liora.dto.response.CartProductResponse;
import vn.liora.entity.CartProduct;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CartProductMapper {

    @Mapping(target = "idCartProduct", ignore = true)
    @Mapping(target = "cart", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "totalPrice", ignore = true)
    @Mapping(target = "choose", ignore = true)
    CartProduct toCartProduct(CartProductCreationRequest request);

    @Mapping(target = "idCart", source = "cart.idCart")
    @Mapping(target = "idProduct", source = "product.productId")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "productPrice", source = "product.price")
    @Mapping(target = "brandName", source = "product.brand.name")
    @Mapping(target = "brandId", source = "product.brand.brandId")
    @Mapping(target = "available", source = "product.available")
    @Mapping(target = "isActive", source = "product.isActive")
    @Mapping(target = "stock", source = "product.stock")
    @Mapping(target = "mainImageUrl", ignore = true) // Sẽ set thủ công trong service
    CartProductResponse toCartProductResponse(CartProduct cartProduct);
    List<CartProductResponse> toCartProductResponseList(List<CartProduct> cartProducts);

    @Mapping(target = "idCartProduct", ignore = true)
    @Mapping(target = "cart", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "totalPrice", ignore = true)
    @Mapping(target = "choose", ignore = true)
    void updateCartProduct(@MappingTarget CartProduct cartProduct, CartProductUpdateRequest request);
}
