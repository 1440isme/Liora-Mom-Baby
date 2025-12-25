package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.AddressCreateRequest;
import vn.liora.dto.request.AddressUpdateRequest;
import vn.liora.dto.response.AddressResponse;
import vn.liora.entity.Address;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.AddressMapper;
import vn.liora.repository.AddressRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.IAddressService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AddressServiceImpl implements IAddressService {

    AddressRepository addressRepository;
    UserRepository userRepository;
    AddressMapper addressMapper;

    @Override
    @Transactional
    public AddressResponse createAddress(Long userId, AddressCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Address address = addressMapper.toAddress(request);

        address.setUser(user);

        List<Address> existingAddresses = addressRepository.findByUser(user);

        if (existingAddresses.isEmpty()) {
            address.setIsDefault(true);
        } else if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.clearDefaultByUser(userId);
            address.setIsDefault(true);
        } else {
            address.setIsDefault(false);
        }

        address = addressRepository.save(address);
        return addressMapper.toAddressResponse(address);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(Long userId, Long idAddress, AddressUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Address address = addressRepository.findById(idAddress)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.clearDefaultByUser(userId);
            address.setIsDefault(true);
        }
        if (Boolean.FALSE.equals(request.getIsDefault()) && Boolean.TRUE.equals(address.getIsDefault())) {
            throw new AppException(ErrorCode.CANNOT_REMOVE_DEFAULT_ADDRESS);
        }

        addressMapper.updateAddress(address, request);
        address = addressRepository.save(address);

        return addressMapper.toAddressResponse(address);
    }

    @Override
    @Transactional
    public void deleteAddress(Long userId, Long idAddress) {

        Address address = addressRepository.findByIdAddress(idAddress)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (Boolean.TRUE.equals(address.getIsDefault())) {
            throw new AppException(ErrorCode.CANNOT_DELETE_DEFAULT_ADDRESS);
        }

        addressRepository.deleteById(idAddress);
    }

    @Override
    public AddressResponse getAddressById(Long userId, Long idAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Address address = addressRepository.findByIdAddress(idAddress)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));
        return addressMapper.toAddressResponse(address);
    }

    @Override
    public List<AddressResponse> getMyAddresses(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<Address> addresses = addressRepository.findByUser(user);
        return addressMapper.toAddressResponseList(addresses);
    }

    @Override
    public AddressResponse getDefaultAddress(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Address defaultAddress = addressRepository.findByUserAndIsDefaultTrue(user)
                .orElseThrow(() -> new AppException(ErrorCode.DEFAULT_ADDRESS_NOT_FOUND));

        return addressMapper.toAddressResponse(defaultAddress);
    }
}
