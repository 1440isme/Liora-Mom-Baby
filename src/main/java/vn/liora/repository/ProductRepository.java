package vn.liora.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Product;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product,Long> {
    // ====== BASIC SEARCH ======
    List<Product> findByNameContaining(String name);
    Page<Product> findByNameContaining(String name, Pageable pageable);
    Optional<Product> findByName(String name);
    boolean existsByName(String name);

    // ====== Lọc theo trạng thái ======
    List<Product> findByIsActiveTrue();
    List<Product> findByIsActiveFalse();
    List<Product> findByAvailableTrue();
    List<Product> findByAvailableFalse();
    List<Product> findByIsActiveTrueAndAvailableTrue();

    // ====== Lọc theo brand và category ======
    List<Product> findByBrandBrandId(Long brandId);
    List<Product> findByCategoryCategoryId(Long categoryId);
    List<Product> findByBrandBrandIdAndIsActiveTrue(Long brandId);
    List<Product> findByCategoryCategoryIdAndIsActiveTrue(Long categoryId);

    // ====== Lọc theo giá ======
    List<Product> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);
    List<Product> findByPriceLessThanEqual(BigDecimal maxPrice);
    List<Product> findByPriceGreaterThanEqual(BigDecimal minPrice);

    // ====== Lọc theo số lượng tồn ======
    List<Product> findByStockGreaterThan(Integer minStock);
    List<Product> findByStockLessThanEqual(Integer maxStock);
    List<Product> findByStockBetween(Integer minStock, Integer maxStock);
    List<Product> findByStockGreaterThanAndAvailableTrue(Integer minStock);

    // ====== Lọc theo đánh giá ======
    List<Product> findByAverageRatingGreaterThanEqual(BigDecimal minRating);
    List<Product> findByAverageRatingBetween(BigDecimal minRating, BigDecimal maxRating);

    // ====== Lọc kết hợp ======
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.available = true " +
            "AND p.brand.brandId = :brandId AND p.category.categoryId = :categoryId")
    List<Product> findActiveAvailableByBrandAndCategory(@Param("brandId") Long brandId,
                                                        @Param("categoryId") Long categoryId);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.available = true " +
            "AND p.price BETWEEN :minPrice AND :maxPrice")
    List<Product> findActiveAvailableByPriceRange(@Param("minPrice") BigDecimal minPrice,
                                                  @Param("maxPrice") BigDecimal maxPrice);

    // ====== Tìm kiếm phân trang ======
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.available = true " +
            "AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchActiveAvailableProducts(@Param("keyword") String keyword, Pageable pageable);

    // ====== Các query sort ======
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.available = true " +
            "ORDER BY p.price ASC")
    List<Product> findActiveAvailableOrderByPriceAsc();

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.available = true " +
            "ORDER BY p.price DESC")
    List<Product> findActiveAvailableOrderByPriceDesc();

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.available = true " +
            "ORDER BY p.averageRating DESC")
    List<Product> findActiveAvailableOrderByRatingDesc();

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.available = true " +
            "ORDER BY p.soldCount DESC")
    List<Product> findActiveAvailableOrderBySoldCountDesc();

    // ====== Các query hỗ trợ business ======
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.available = true " +
            "AND p.stock > 0 ORDER BY p.soldCount DESC")
    List<Product> findTopSellingInStockProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.available = true " +
            "AND p.averageRating >= :minRating ORDER BY p.averageRating DESC")
    List<Product> findHighRatedProducts(@Param("minRating") BigDecimal minRating, Pageable pageable);

    // ====== Các query hỗ trợ admin ======
    @Query("SELECT p FROM Product p WHERE p.isActive = :isActive")
    Page<Product> findByIsActiveWithPagination(@Param("isActive") Boolean isActive, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.available = :available")
    Page<Product> findByAvailableWithPagination(@Param("available") Boolean available, Pageable pageable);

    // ====== Các query thống kê ======
    @Query("SELECT COUNT(p) FROM Product p WHERE p.isActive = true")
    Long countActiveProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.isActive = true AND p.available = true")
    Long countActiveAvailableProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.isActive = true AND p.stock = 0")
    Long countOutOfStockProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.brand.brandId = :brandId")
    Long countByBrand(@Param("brandId") Long brandId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.categoryId = :categoryId")
    Long countByCategory(@Param("categoryId") Long categoryId);

    List<Product> findByBrandBrandIdAndCategoryCategoryIdAndIsActiveTrue(Long brandId, Long categoryId);
    
    // ====== RELATED PRODUCTS ======
    List<Product> findByCategoryCategoryIdAndProductIdNotAndIsActiveTrue(Long categoryId, Long productId);
    
    // ====== OPTIMIZED QUERIES FOR FRONTEND ======
    // Best selling products - optimized for frontend
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.available = true " +
           "AND p.soldCount > 0 ORDER BY p.soldCount DESC")
    List<Product> findBestSellingProducts(Pageable pageable);
    
    // Newest products - optimized for frontend  
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.available = true " +
           "ORDER BY p.createdDate DESC")
    List<Product> findNewestProducts(Pageable pageable);
    
    // Best selling by category
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.available = true " +
           "AND p.soldCount > 0 AND p.category.categoryId = :categoryId " +
           "ORDER BY p.soldCount DESC")
    List<Product> findBestSellingByCategory(@Param("categoryId") Long categoryId, Pageable pageable);
    
    // Best selling by brand
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.available = true " +
           "AND p.soldCount > 0 AND p.brand.brandId = :brandId " +
           "ORDER BY p.soldCount DESC")
    List<Product> findBestSellingByBrand(@Param("brandId") Long brandId, Pageable pageable);
}
