package vn.liora.controller.user;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.CartProductCreationRequest;
import vn.liora.dto.request.CartProductUpdateRequest;
import vn.liora.dto.response.CartProductResponse;
import vn.liora.service.ICartProductService;

import java.util.List;

@RestController
@RequestMapping("/CartProduct/{idCart}")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CartProductController {
    ICartProductService cartProductService;
    @PostMapping
    public ResponseEntity<CartProductResponse> addProductToCart(
            @PathVariable Long idCart,
            @Valid @RequestBody CartProductCreationRequest request)     {
        CartProductResponse response = cartProductService.addProductToCart(idCart, request);
        return ResponseEntity.ok(response);
    }

    // Cập nhật sản phẩm trong giỏ
    @PutMapping("/{cartProductId}")
    public ResponseEntity<CartProductResponse> updateCartProduct(
            @PathVariable Long idCart,
            @PathVariable Long cartProductId,
            @Valid @RequestBody CartProductUpdateRequest request
    ) {
        CartProductResponse response = cartProductService.updateCartProduct(idCart, cartProductId, request);
        return ResponseEntity.ok(response);
    }

    // Lấy thông tin sản phẩm trong giỏ
    @GetMapping("/{cartProductId}")
    public ResponseEntity<CartProductResponse> getCartProductById(
            @PathVariable Long cartProductId
    ) {
        CartProductResponse response = cartProductService.getCartProductById(cartProductId);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/selected-products")
    public ResponseEntity<List<CartProductResponse>> getSelectedProducts(
            @PathVariable Long idCart) {
        List<CartProductResponse> responses = cartProductService.getSelectedProducts(idCart);
        return ResponseEntity.ok(responses);
    }

    // Xóa tất cả sản phẩm đã chọn khỏi giỏ hàng
    @DeleteMapping("/selected")
    public ResponseEntity<Void> removeSelectedProducts(
            @PathVariable Long idCart
    ) {
        cartProductService.removeProductsInCart(idCart, null);
        return ResponseEntity.ok().build();
    }

//    // Xóa một sản phẩm cụ thể khỏi giỏ hàng
//    @DeleteMapping("/{cartProductId}")
//    public ResponseEntity<Void> removeCartProduct(
//            @PathVariable Long idCart,
//            @PathVariable Long cartProductId
//    ) {
//        cartProductService.removeProductsInCart(idCart, List.of(cartProductId));
//        return ResponseEntity.ok().build();
//    }

    // Xóa một sản phẩm không tồn tại khỏi giỏ hàng
    @DeleteMapping("/unavailable/{cartProductId}")
    public ResponseEntity<Void> removeUnavailableCartProduct(
            @PathVariable Long idCart,
            @PathVariable Long cartProductId
    ) {
        cartProductService.removeProductsInCart(idCart, List.of(cartProductId));
        return ResponseEntity.ok().build();
    }
}