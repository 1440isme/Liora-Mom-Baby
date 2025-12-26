package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.liora.dto.response.WalletTransactionResponse;
import vn.liora.entity.WalletTransaction;

import java.util.List;

@Mapper(componentModel = "spring")
public interface WalletTransactionMapper {

    @Mapping(source = "order.idOrder", target = "orderId")
    @Mapping(expression = "java(transaction.getType() != null ? transaction.getType().name() : null)", target = "type")
    WalletTransactionResponse toTransactionResponse(WalletTransaction transaction);

    List<WalletTransactionResponse> toTransactionResponseList(List<WalletTransaction> transactions);
}
