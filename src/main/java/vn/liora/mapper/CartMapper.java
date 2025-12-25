package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.liora.dto.response.CartResponse;
import vn.liora.entity.Cart;

import java.util.List;

@Mapper(componentModel = "spring", uses = {CartProductMapper.class})
public interface CartMapper {

    @Mapping(target = "userId", source = "user.userId")
    @Mapping(target = "totalItems", ignore = true)
    CartResponse toCartResponse(Cart cart);
}
