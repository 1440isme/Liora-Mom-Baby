package vn.liora.service;

import vn.liora.dto.request.AddressCreateRequest;
import vn.liora.dto.request.AddressUpdateRequest;
import vn.liora.dto.response.AddressResponse;
import vn.liora.entity.Address;
import vn.liora.entity.User;

import java.util.List;

public interface IAddressService {
    AddressResponse createAddress(Long userId,AddressCreateRequest request);
    AddressResponse updateAddress(Long userId,Long idAddress, AddressUpdateRequest request);
    void deleteAddress(Long userId,Long idAddress);
    AddressResponse getAddressById(Long userId,Long idAddress);
    List<AddressResponse> getMyAddresses(Long userId);
    AddressResponse getDefaultAddress(Long userId);
}
