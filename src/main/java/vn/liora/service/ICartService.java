package vn.liora.service;

import vn.liora.dto.response.CartResponse;

public interface ICartService {
    CartResponse getCart(String guestCartId, Long userId);

}
