package vn.liora.service;

import vn.liora.dto.request.CartProductCreationRequest;
import vn.liora.dto.request.CartProductUpdateRequest;
import vn.liora.dto.response.CartProductResponse;

import java.math.BigDecimal;
import java.util.List;

public interface ICartProductService {
    CartProductResponse addProductToCart(Long idCart, CartProductCreationRequest request);
    CartProductResponse updateCartProduct(Long idCart, Long idCartProduct, CartProductUpdateRequest request);
    void removeProductsInCart(Long idCart, List<Long> idCartProduct);
    CartProductResponse getCartProductById(Long idCartProduct);
    List<CartProductResponse> getSelectedProducts(Long idCart);
    BigDecimal getSelectedProductsTotal(Long cartId);
    double getCartTotal(Long cartId);

    int getCartItemCount(Long cartId);

    List<CartProductResponse> getAllProductsInCart(Long cartId);
}
