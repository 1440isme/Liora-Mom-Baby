package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.liora.dto.request.AddressCreateRequest;
import vn.liora.dto.request.AddressUpdateRequest;
import vn.liora.dto.response.AddressResponse;
import vn.liora.entity.Address;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    @Mapping(target = "user", ignore = true)
    Address toAddress(AddressCreateRequest request);

    @Mapping(target = "userId", source = "user.userId")
    AddressResponse toAddressResponse(Address address);

    @Mapping(target = "idAddress", ignore = true)
    @Mapping(target = "user", ignore = true)
    void updateAddress(@MappingTarget Address address, AddressUpdateRequest request);

    List<AddressResponse> toAddressResponseList(List<Address> addresses);
}
