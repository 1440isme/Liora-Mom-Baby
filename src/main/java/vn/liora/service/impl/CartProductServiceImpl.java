package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.CartProductCreationRequest;
import vn.liora.dto.request.CartProductUpdateRequest;
import vn.liora.dto.response.CartProductResponse;
import vn.liora.entity.*;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.CartProductMapper;
import vn.liora.repository.CartProductRepository;
import vn.liora.repository.CartRepository;
import vn.liora.repository.ProductRepository;
import vn.liora.service.ICartProductService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CartProductServiceImpl implements ICartProductService {

    CartProductRepository cartProductRepository;
    CartRepository cartRepository;
    ProductRepository productRepository;
    CartProductMapper cartProductMapper;

    @Override
    @Transactional
    public CartProductResponse addProductToCart(Long idCart, CartProductCreationRequest request) {

        Cart cart = cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        Product product = productRepository.findById(request.getIdProduct())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        // Kiểm tra nếu sản phẩm đã tồn tại trong giỏ hàng
        Optional<CartProduct> existing = cartProductRepository.findByCart_IdCartAndProduct_ProductId(idCart, request.getIdProduct());
        CartProduct cartProduct ;

        if (existing.isPresent()) {
            cartProduct = existing.get();
            cartProduct.setQuantity(cartProduct.getQuantity() + request.getQuantity());
            cartProduct.setTotalPrice(product.getPrice()
                    .multiply(BigDecimal.valueOf(cartProduct.getQuantity())));
            // Khi cộng dồn từ reorder, đặt choose = true
            cartProduct.setChoose(true);
        } else {
            // Nếu chưa có thì tạo mới
            cartProduct = cartProductMapper.toCartProduct(request);
            cartProduct.setCart(cart);
            cartProduct.setProduct(product);
            cartProduct.setChoose(false);
            cartProduct.setTotalPrice(product.getPrice()
                    .multiply(BigDecimal.valueOf(cartProduct.getQuantity())));
        }
        cartProduct = cartProductRepository.save(cartProduct);

        return cartProductMapper.toCartProductResponse(cartProduct);


    }

    @Override
    public CartProductResponse updateCartProduct(Long idCart, Long idCartProduct, CartProductUpdateRequest request) {
        // Validate cart exists
        cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        
        CartProduct cartProduct = cartProductRepository.findByIdCartProduct(idCartProduct)
                .orElseThrow(() -> new AppException(ErrorCode.CART_PRODUCT_NOT_FOUND));
        
        cartProductMapper.updateCartProduct(cartProduct, request);
        
        // Set choose field manually nếu có trong request
        if (request.getChoose() != null) {
            cartProduct.setChoose(request.getChoose());
        }
        
        // Chỉ tính lại totalPrice nếu quantity thay đổi
        if (request.getQuantity() != null) {
            Product product = cartProduct.getProduct();
            cartProduct.setTotalPrice(product.getPrice().multiply(BigDecimal.valueOf(cartProduct.getQuantity())));
        }
        
        cartProduct = cartProductRepository.save(cartProduct);
        
        CartProductResponse response = cartProductMapper.toCartProductResponse(cartProduct);
        response.setMainImageUrl(getMainImageUrl(cartProduct.getProduct()));
        return response;
    }


    @Override
    @Transactional
    public void removeProductsInCart(Long idCart, List<Long> idCartProduct) {
        Cart cart = cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        
        List<CartProduct> cartProducts;
        if (idCartProduct == null) {
            // Xóa tất cả sản phẩm đã chọn (choose = true)
            cartProducts = cartProductRepository.findByCartAndChooseTrue(cart);
            log.info("Found {} selected products to remove from cart {}", cartProducts.size(), idCart);
        } else {
            // Xóa các sản phẩm cụ thể theo danh sách ID
            cartProducts = cartProductRepository.findAllById(idCartProduct);
            log.info("Found {} specific products to remove from cart {}", cartProducts.size(), idCart);
        }
        
        if (cartProducts.isEmpty()) {
            log.warn("No products found to remove from cart {}", idCart);
            // Không throw exception nếu không có sản phẩm nào để xóa
            return;
        }
        
        cartProductRepository.deleteAll(cartProducts);
        log.info("Successfully removed {} products from cart {}", cartProducts.size(), idCart);
    }

    @Override
    @Transactional

    public CartProductResponse getCartProductById(Long idCartProduct) {
        CartProduct cartProduct = cartProductRepository.findByIdCartProduct(idCartProduct)
                .orElseThrow(() -> new AppException(ErrorCode.CART_PRODUCT_NOT_FOUND));
        
        CartProductResponse response = cartProductMapper.toCartProductResponse(cartProduct);
        response.setMainImageUrl(getMainImageUrl(cartProduct.getProduct()));
        return response;
    }

    @Override
    public List<CartProductResponse> getSelectedProducts(Long idCart) {
        Cart cart = cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        // Sử dụng query tối ưu để tránh N+1 problem
        List<CartProduct> selectedProducts = cartProductRepository.findByCartAndChooseTrueWithProduct(cart);

        // ✅ Filter chỉ lấy sản phẩm hợp lệ (available=true, isActive=true)
        return selectedProducts.stream()
                .filter(cartProduct -> {
                    Product product = cartProduct.getProduct();
                    return product != null 
                        && Boolean.TRUE.equals(product.getAvailable()) 
                        && Boolean.TRUE.equals(product.getIsActive());
                })
                .map(cartProduct -> {
                    CartProductResponse response = cartProductMapper.toCartProductResponse(cartProduct);
                    response.setMainImageUrl(getMainImageUrl(cartProduct.getProduct()));
                    return response;
                })
                .toList();
    }

    @Override
    public double getCartTotal(Long cartId) {
        // ✅ Sử dụng getSelectedProductsTotal để chỉ tính những sản phẩm hợp lệ
        // (choose=true, available=true, isActive=true)
        BigDecimal total = this.getSelectedProductsTotal(cartId);
        return total != null ? total.doubleValue() : 0.0;
    }

    @Override
    public int getCartItemCount(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        // Sử dụng query tối ưu thay vì load tất cả CartProduct
        Long count = cartProductRepository.getCartItemCount(cart);
        return count != null ? count.intValue() : 0;
    }

    @Override
    public List<CartProductResponse> getAllProductsInCart(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        // Sử dụng query tối ưu để tránh N+1 problem
        List<CartProduct> cartProducts = cartProductRepository.findByCartWithProduct(cart);
        
        // Map sang DTO và set image URL in one pass
        return cartProducts.stream()
                .map(cartProduct -> {
                    CartProductResponse response = cartProductMapper.toCartProductResponse(cartProduct);
                    response.setMainImageUrl(getMainImageUrl(cartProduct.getProduct()));
                    return response;
                })
                .toList();
    }
    
    private String getMainImageUrl(Product product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return "/uploads/products/placeholder.jpg";
        }
        
        // Tìm ảnh chính (isMain = true)
        return product.getImages().stream()
                .filter(image -> Boolean.TRUE.equals(image.getIsMain()))
                .findFirst()
                .map(Image::getImageUrl)
                .orElse(product.getImages().get(0).getImageUrl()); // Fallback to first image
    }

    @Override
    public BigDecimal getSelectedProductsTotal(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        List<CartProduct> cartProducts = cartProductRepository.findByCartAndChooseTrue(cart);
        
        // ✅ Filter chỉ tính tiền cho sản phẩm hợp lệ (available=true, isActive=true)
        return cartProducts.stream()
                .filter(cartProduct -> {
                    Product product = cartProduct.getProduct();
                    return product != null 
                        && Boolean.TRUE.equals(product.getAvailable()) 
                        && Boolean.TRUE.equals(product.getIsActive());
                })
                .map(CartProduct::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
