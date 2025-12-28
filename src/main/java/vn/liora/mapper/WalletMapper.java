package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.liora.dto.response.WalletResponse;
import vn.liora.entity.UserWallet;

import java.util.List;

@Mapper(componentModel = "spring")
public interface WalletMapper {

    @Mapping(source = "user.userId", target = "userId")
    @Mapping(source = "user.username", target = "username")
    @Mapping(source = "user.firstname", target = "firstname")
    @Mapping(source = "user.lastname", target = "lastname")
    WalletResponse toWalletResponse(UserWallet wallet);

    List<WalletResponse> toWalletResponseList(List<UserWallet> wallets);
}
