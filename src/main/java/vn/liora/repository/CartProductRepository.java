package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Cart;
import vn.liora.entity.CartProduct;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartProductRepository extends JpaRepository<CartProduct,Long> {
    Optional<CartProduct> findByIdCartProduct(Long idCartProduct);
    Optional<CartProduct> findByCart_IdCartAndProduct_ProductId(Long idCart, Long productId);
    
    @Query("SELECT cp FROM CartProduct cp JOIN FETCH cp.product p JOIN FETCH p.images WHERE cp.cart = :cart AND cp.choose = true")
    List<CartProduct> findByCartAndChooseTrueWithProduct(@Param("cart") Cart cart);
    
    @Query("SELECT cp FROM CartProduct cp JOIN FETCH cp.product p JOIN FETCH p.images WHERE cp.cart = :cart")
    List<CartProduct> findByCartWithProduct(@Param("cart") Cart cart);
    
    @Query("SELECT SUM(cp.totalPrice) FROM CartProduct cp WHERE cp.cart = :cart")
    java.math.BigDecimal getCartTotalAmount(@Param("cart") Cart cart);
    
    @Query("SELECT COUNT(cp) FROM CartProduct cp WHERE cp.cart = :cart")
    Long getCartItemCount(@Param("cart") Cart cart);
    
    // Fallback methods for backward compatibility
    List<CartProduct> findByCartAndChooseTrue(Cart cart);
    List<CartProduct> findByCart(Cart cart);
}
