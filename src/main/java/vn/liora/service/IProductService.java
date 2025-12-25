package vn.liora.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.liora.dto.request.ProductCreationRequest;
import vn.liora.dto.request.ProductUpdateRequest;
import vn.liora.dto.response.ProductResponse;
import vn.liora.dto.response.BrandResponse;
import vn.liora.dto.response.TopProductResponse;
import vn.liora.entity.Product;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface IProductService {
    // ========== BASIC CRUD ==========
    Product createProduct(ProductCreationRequest request);
    ProductResponse findById(Long id);
    ProductResponse updateProduct(Long id, ProductUpdateRequest request);
    void deleteById(Long id);
    void deleteAll();
    long count();

    // ========== FIND ALL ==========
    List<Product> findAll();
    Page<Product> findAll(Pageable pageable);
    List<Product> findAllById(Iterable<Long> ids);
    Optional<Product> findByIdOptional(Long id);
    Product save(Product product);

    // ========== SEARCH ==========
    List<Product> findByNameContaining(String name);
    Page<Product> findByNameContaining(String name, Pageable pageable);
    Optional<Product> findByName(String name);
    boolean existsByName(String name);

    // ========== STATUS FILTERS ==========
    List<Product> findActiveProducts();
    List<Product> findInactiveProducts();
    List<Product> findAvailableProducts();
    List<Product> findUnavailableProducts();
    List<Product> findActiveAvailableProducts();

    // ========== BRAND & CATEGORY FILTERS ==========
    List<Product> findByBrand(Long brandId);
    List<Product> findByCategory(Long categoryId);
    List<Product> findActiveByBrand(Long brandId);
    List<Product> findActiveByCategory(Long categoryId);

    // ========== PRICE FILTERS ==========
    List<Product> findByPriceRange(BigDecimal minPrice, BigDecimal maxPrice);
    List<Product> findByPriceLessThanEqual(BigDecimal maxPrice);
    List<Product> findByPriceGreaterThanEqual(BigDecimal minPrice);
    List<Product> findActiveAvailableByPriceRange(BigDecimal minPrice, BigDecimal maxPrice);

    // ========== STOCK FILTERS ==========
    List<Product> findByStockGreaterThan(Integer minStock);
    List<Product> findByStockLessThanEqual(Integer maxStock);
    List<Product> findByStockRange(Integer minStock, Integer maxStock);
    List<Product> findInStockProducts();
    List<Product> findOutOfStockProducts();

    // ========== RATING FILTERS ==========
    List<Product> findByRatingGreaterThanEqual(BigDecimal minRating);
    List<Product> findByRatingRange(BigDecimal minRating, BigDecimal maxRating);
    List<Product> findProductsByMinRating(BigDecimal minRating);

    // ========== COMBINED FILTERS ==========
    List<Product> findActiveAvailableByBrandAndCategory(Long brandId, Long categoryId);
    Page<Product> searchActiveAvailableProducts(String keyword, Pageable pageable);

    // ========== SORTING ==========
    List<Product> findActiveAvailableOrderByPriceAsc();
    List<Product> findActiveAvailableOrderByPriceDesc();
    List<Product> findActiveAvailableOrderByRatingDesc();
    List<Product> findActiveAvailableOrderBySoldCountDesc();

    // ========== BUSINESS QUERIES ==========
    List<Product> findTopSellingInStockProducts(Pageable pageable);
    List<Product> findHighRatedProductsWithPagination(BigDecimal minRating, Pageable pageable);
    List<TopProductResponse> getTopSellingProducts(int limit);

    // ========== ADMIN QUERIES ==========
    Page<Product> findActiveProductsWithPagination(Pageable pageable);
    Page<Product> findAvailableProductsWithPagination(Pageable pageable);
    Page<Product> findInactiveProductsWithPagination(Pageable pageable);

    // ========== STATUS MANAGEMENT (SOFT DELETE) ==========
    void activateProduct(Long id);
    void deactivateProduct(Long id);
    void setAvailable(Long id, Boolean available);
    void updateStock(Long id, Integer stock);
    void updateSoldCount(Long id, Integer soldCount);

    // ========== STATISTICS ==========
    Long countActiveProducts();
    Long countActiveAvailableProducts();
    Long countOutOfStockProducts();
    Long countByBrand(Long brandId);
    Long countByCategory(Long categoryId);
    
    // ========== RELATED PRODUCTS ==========
    List<Product> findByCategoryAndIdNot(Long categoryId, Long productId);
    
    // ========== OPTIMIZED FRONTEND QUERIES ==========
    // Simple APIs for frontend - fast and efficient
    List<Product> findBestSellingProducts(Pageable pageable);
    List<Product> findNewestProducts(Pageable pageable);
    List<Product> findBestSellingByCategory(Long categoryId, Pageable pageable);
    List<Product> findBestSellingByBrand(Long brandId, Pageable pageable);
    List<BrandResponse> getBestSellingBrands();
    List<BrandResponse> getNewestBrands();
    
    // Advanced APIs for dedicated pages with filtering
    // Note: newest-advanced now uses direct controller logic like best-selling-advanced
    
    // ========== RATING MANAGEMENT ==========
    void updateProductAverageRating(Long productId);
    void updateAllProductsAverageRating();

}
