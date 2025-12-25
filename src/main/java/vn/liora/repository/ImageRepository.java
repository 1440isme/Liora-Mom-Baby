package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.liora.entity.Image;

import java.util.List;
import java.util.Optional;

public interface ImageRepository extends JpaRepository<Image, Long> {
    
    // Basic queries
    List<Image> findByProductProductId(Long productId);
    List<Image> findByProductProductIdOrderByDisplayOrder(Long productId);
    Optional<Image> findByProductProductIdAndIsMainTrue(Long productId);
    List<Image> findByProductProductIdAndIsMainFalse(Long productId);
    
    // Count queries
    Long countByProductProductId(Long productId);
    Long countByProductProductIdAndIsMainTrue(Long productId);
    
    // Delete queries
    @Query("DELETE FROM Image i WHERE i.product.productId = :productId")
    void deleteByProductId(@Param("productId") Long productId);
}