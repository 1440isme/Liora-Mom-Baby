package vn.liora.controller.user;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.AddressCreateRequest;
import vn.liora.dto.request.AddressUpdateRequest;
import vn.liora.service.IAddressService;
import vn.liora.dto.response.AddressResponse;

import java.util.List;

@RestController
@RequestMapping("/addresses/{userId}")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j

public class AddressController {
    @Autowired
    IAddressService addressService;

    /**
     * Tạo địa chỉ mới cho user
     */
    @PostMapping
    public ResponseEntity<AddressResponse> createAddress(
            @PathVariable Long userId,
            @Valid @RequestBody AddressCreateRequest request) {

        AddressResponse response = addressService.createAddress(userId, request);
        return ResponseEntity.ok(response);

    }

    /**
     * Cập nhật địa chỉ
     */
    @PutMapping("/{id}")
    public ResponseEntity<AddressResponse> updateAddress(
            @PathVariable("id") Long id,
            @PathVariable("userId") Long idUser,
            @Valid @RequestBody AddressUpdateRequest request) {
        AddressResponse response = addressService.updateAddress(idUser, id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Xoá (ẩn) địa chỉ
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(@PathVariable("userId") Long userId, @PathVariable("id") Long id) {
        try {
            log.info("Attempting to delete address: userId={}, addressId={}", userId, id);
            addressService.deleteAddress(userId, id);
            log.info("Successfully deleted address: userId={}, addressId={}", userId, id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting address: userId={}, addressId={}, error={}", userId, id, e.getMessage());
            throw e;
        }
    }

    /**
     * Lấy thông tin 1 địa chỉ theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<AddressResponse> getAddressById(@PathVariable("userId") Long userId,
            @PathVariable("id") Long id) {
        AddressResponse response = addressService.getAddressById(userId, id);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy địa chỉ mặc định của user
     */
    @GetMapping("/default")
    public ResponseEntity<AddressResponse> getDefaultAddress(@PathVariable Long userId) {
        AddressResponse response = addressService.getDefaultAddress(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy tất cả địa chỉ của user
     */
    @GetMapping
    public ResponseEntity<List<AddressResponse>> getMyAddresses(@PathVariable Long userId) {
        List<AddressResponse> responses = addressService.getMyAddresses(userId);
        return ResponseEntity.ok(responses);
    }
}