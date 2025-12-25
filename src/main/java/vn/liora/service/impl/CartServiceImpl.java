package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.liora.dto.response.CartResponse;
import vn.liora.entity.*;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.CartMapper;
import vn.liora.repository.CartRepository;
import vn.liora.repository.CartProductRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.ICartService;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CartServiceImpl implements ICartService {

    CartRepository cartRepository;
    UserRepository userRepository;
    CartProductRepository cartProductRepository;
    CartMapper cartMapper;

    @Override
    public CartResponse getCart(String guestCartId, Long userId) {
        Cart cart;

        if (userId != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

            // Nếu có guestCartId thì merge cart guest vào cart user
            if (guestCartId != null) {
                mergeGuestCartIntoUserCart(user, guestCartId);
            }

            cart = cartRepository.findByUser_UserId(userId)
                    .orElseGet(() -> cartRepository.save(
                            Cart.builder().user(user).build()));
        } else if (guestCartId != null) {
            cart = cartRepository.findByGuestId(guestCartId)
                    .orElseGet(() -> cartRepository.save(
                            Cart.builder().guestId(guestCartId).build()));
        } else {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        return cartMapper.toCartResponse(cart);
    }

    @Transactional
    protected void mergeGuestCartIntoUserCart(User user, String guestCartId) {
        // Lấy cart user (tạo nếu chưa có)
        Cart userCart = cartRepository.findByUser_UserId(user.getUserId())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));

        // Lấy cart guest; nếu không có thì thoát
        java.util.Optional<Cart> guestCartOpt = cartRepository.findByGuestId(guestCartId);
        if (guestCartOpt.isEmpty())
            return;

        Cart guestCart = guestCartOpt.get();
        if (guestCart.getIdCart().equals(userCart.getIdCart())) {
            return; // tránh merge cùng một cart
        }

        // Lấy danh sách item của guest kèm product
        List<CartProduct> guestItems = cartProductRepository.findByCartWithProduct(guestCart);

        for (CartProduct guestItem : guestItems) {
            Long productId = guestItem.getProduct().getProductId();
            Optional<CartProduct> existingOpt = cartProductRepository
                    .findByCart_IdCartAndProduct_ProductId(userCart.getIdCart(), productId);

            if (existingOpt.isPresent()) {
                CartProduct existing = existingOpt.get();
                int newQty = existing.getQuantity() + guestItem.getQuantity();
                existing.setQuantity(newQty);
                existing.setTotalPrice(guestItem.getProduct().getPrice()
                        .multiply(BigDecimal.valueOf(newQty)));
                cartProductRepository.save(existing);
                // Xóa item guest sau khi đã cộng dồn
                cartProductRepository.delete(guestItem);
            } else {
                // Chuyển item sang cart user
                guestItem.setCart(userCart);
                guestItem.setTotalPrice(guestItem.getProduct().getPrice()
                        .multiply(BigDecimal.valueOf(guestItem.getQuantity())));
                cartProductRepository.save(guestItem);
            }
        }

        // Xóa cart guest sau khi merge
        cartRepository.delete(guestCart);
    }
}
