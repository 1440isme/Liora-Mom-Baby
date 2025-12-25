package vn.liora.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.ProductCreationRequest;
import vn.liora.dto.request.ProductUpdateRequest;
import vn.liora.dto.response.ProductResponse;
import vn.liora.dto.response.BrandResponse;
import vn.liora.dto.response.TopProductResponse;
import vn.liora.entity.Brand;
import vn.liora.entity.Category;
import vn.liora.entity.Product;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.ProductMapper;
import vn.liora.repository.BrandRepository;
import vn.liora.repository.CategoryRepository;
import vn.liora.repository.ProductRepository;
import vn.liora.repository.ReviewRepository;
import vn.liora.service.IProductService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
@Service
public class ProductServiceImpl implements IProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductMapper productMapper;
    private final ReviewRepository reviewRepository;

    public ProductServiceImpl(ProductRepository productRepository,
                              CategoryRepository categoryRepository,
                              BrandRepository brandRepository,
                              ProductMapper productMapper,
                              ReviewRepository reviewRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.productMapper = productMapper;
        this.reviewRepository = reviewRepository;
    }

    // ========== BASIC CRUD ==========
    @Transactional
    @Override
    public Product createProduct(ProductCreationRequest request) {
        // Validate brand
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));

        // Validate category
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // Check name uniqueness
        if (productRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.PRODUCT_NAME_ALREADY_EXISTS);
        }

        // Create product
        Product product = productMapper.toProduct(request);

        product.setBrand(brand);
        product.setCategory(category);
        product.setCreatedDate(LocalDateTime.now());
        
        // Tự động set available dựa vào stock
        if (request.getStock() != null) {
            product.setAvailable(request.getStock() > 0);
        }

        Product savedProduct = productRepository.save(product);
        return savedProduct; // ← Trả về Product thay vì ProductResponse
    }

    @Override
    public ProductResponse findById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        return productMapper.toProductResponse(product);
    }

    @Transactional
    @Override
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product =  productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // validate brand
        Brand brand = product.getBrand();
        if (request.getBrandId() != null) {
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));
            product.setBrand(brand);
        }

        // validate category
        Category category = product.getCategory();
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            product.setCategory(category);
        }
        
        // check name uniqueness if name is being updated
        if (request.getName() != null && !request.getName().equalsIgnoreCase(product.getName())
            && productRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.PRODUCT_EXISTED);
        }

        productMapper.updateProduct(product, request);
        
        // Kiểm tra ràng buộc khi activate sản phẩm
        if (request.getIsActive() != null && request.getIsActive()) {
            // Nếu đang cố gắng activate sản phẩm, kiểm tra category và brand
            if (category == null || category.getIsActive() == null || !category.getIsActive()) {
                throw new AppException(ErrorCode.PRODUCT_CATEGORY_INACTIVE);
            }
            if (brand == null || brand.getIsActive() == null || !brand.getIsActive()) {
                throw new AppException(ErrorCode.PRODUCT_BRAND_INACTIVE);
            }
        }
        
        // Tự động set available dựa vào stock
        if (request.getStock() != null) {
            product.setAvailable(request.getStock() > 0);
        }
        
        product.setUpdatedDate(LocalDateTime.now());
        productRepository.save(product);
        return productMapper.toProductResponse(product);

    }

    @Transactional
    @Override
    public void deleteById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        
        // Kiểm tra xem sản phẩm đã được bán chưa
        if (product.getSoldCount() != null && product.getSoldCount() > 0) {
            throw new AppException(ErrorCode.PRODUCT_HAS_ORDERS);
        }
        
        productRepository.deleteById(id);
    }

    @Transactional
    @Override
    public void deleteAll() {
        productRepository.deleteAll();
    }

    @Override
    public long count() {
        return productRepository.count();
    }
    // ========== FIND ALL ==========
    @Override
    public List<Product> findAll() {
        return productRepository.findAll();
    }

    @Override
    public Page<Product> findAll(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    @Override
    public List<Product> findAllById(Iterable<Long> ids) {
        return productRepository.findAllById(ids);
    }

    @Override
    public Optional<Product> findByIdOptional(Long id) {
        return productRepository.findById(id);
    }

    // ========== SEARCH ==========
    @Override
    public List<Product> findByNameContaining(String name) {
        return productRepository.findByNameContaining(name);
    }

    @Override
    public Page<Product> findByNameContaining(String name, Pageable pageable) {
        return productRepository.findByNameContaining(name, pageable);
    }

    @Override
    public Optional<Product> findByName(String name) {
        return productRepository.findByName(name);
    }

    @Override
    public boolean existsByName(String name) {
        return productRepository.existsByName(name);
    }
    // ========== STATUS FILTERS ==========
    @Override
    public List<Product> findActiveProducts() {
        return productRepository.findByIsActiveTrue();
    }

    @Override
    public List<Product> findInactiveProducts() {
        return productRepository.findByIsActiveFalse();
    }

    @Override
    public List<Product> findAvailableProducts() {
        return productRepository.findByAvailableTrue();
    }

    @Override
    public List<Product> findUnavailableProducts() {
        return productRepository.findByAvailableFalse();
    }

    @Override
    public List<Product> findActiveAvailableProducts() {
        return productRepository.findByIsActiveTrueAndAvailableTrue();
    }
    // ========== BRAND & CATEGORY FILTERS ==========
    @Override
    public List<Product> findByBrand(Long brandId) {
        return productRepository.findByBrandBrandId(brandId);
    }

    @Override
    public List<Product> findByCategory(Long categoryId) {
        return productRepository.findByCategoryCategoryId(categoryId);
    }

    @Override
    public List<Product> findActiveByBrand(Long brandId) {
        return productRepository.findByBrandBrandIdAndIsActiveTrue(brandId);
    }

    @Override
    public List<Product> findActiveByCategory(Long categoryId) {
        return productRepository.findByCategoryCategoryIdAndIsActiveTrue(categoryId);
    }
    // ========== PRICE FILTERS ==========
    @Override
    public List<Product> findByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        return productRepository.findByPriceBetween(minPrice, maxPrice);
    }

    @Override
    public List<Product> findByPriceLessThanEqual(BigDecimal maxPrice) {
        return productRepository.findByPriceLessThanEqual(maxPrice);
    }

    @Override
    public List<Product> findByPriceGreaterThanEqual(BigDecimal minPrice) {
        return productRepository.findByPriceGreaterThanEqual(minPrice);
    }

    @Override
    public List<Product> findActiveAvailableByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        return productRepository.findActiveAvailableByPriceRange(minPrice, maxPrice);
    }
    // ========== STOCK FILTERS ==========
    @Override
    public List<Product> findByStockGreaterThan(Integer minStock) {
        return productRepository.findByStockGreaterThan(minStock);
    }

    @Override
    public List<Product> findByStockLessThanEqual(Integer maxStock) {
        return productRepository.findByStockLessThanEqual(maxStock);
    }

    @Override
    public List<Product> findByStockRange(Integer minStock, Integer maxStock) {
        return productRepository.findByStockBetween(minStock, maxStock);
    }

    @Override
    public List<Product> findInStockProducts() {
        return productRepository.findByStockGreaterThan(0);
    }

    @Override
    public List<Product> findOutOfStockProducts() {
        return productRepository.findByStockLessThanEqual(0);
    }
    // ========== RATING FILTERS ==========
    @Override
    public List<Product> findByRatingGreaterThanEqual(BigDecimal minRating) {
        return productRepository.findByAverageRatingGreaterThanEqual(minRating);
    }

    @Override
    public List<Product> findByRatingRange(BigDecimal minRating, BigDecimal maxRating) {
        return productRepository.findByAverageRatingBetween(minRating, maxRating);
    }

    @Override
    public List<Product> findProductsByMinRating(BigDecimal minRating) {
        return productRepository.findByAverageRatingGreaterThanEqual(minRating);
    }
    // ========== COMBINED FILTERS ==========
    @Override
    public List<Product> findActiveAvailableByBrandAndCategory(Long brandId, Long categoryId) {
        return productRepository.findActiveAvailableByBrandAndCategory(brandId, categoryId);
    }

    @Override
    public Page<Product> searchActiveAvailableProducts(String keyword, Pageable pageable) {
        return productRepository.searchActiveAvailableProducts(keyword, pageable);
    }
    // ========== SORTING ==========
    @Override
    public List<Product> findActiveAvailableOrderByPriceAsc() {
        return productRepository.findActiveAvailableOrderByPriceAsc();
    }

    @Override
    public List<Product> findActiveAvailableOrderByPriceDesc() {
        return productRepository.findActiveAvailableOrderByPriceDesc();
    }

    @Override
    public List<Product> findActiveAvailableOrderByRatingDesc() {
        return productRepository.findActiveAvailableOrderByRatingDesc();
    }

    @Override
    public List<Product> findActiveAvailableOrderBySoldCountDesc() {
        return productRepository.findActiveAvailableOrderBySoldCountDesc();
    }
    // ========== BUSINESS QUERIES ==========
    @Override
    public List<Product> findTopSellingInStockProducts(Pageable pageable) {
        return productRepository.findTopSellingInStockProducts(pageable);
    }

    @Override
    public List<Product> findHighRatedProductsWithPagination(BigDecimal minRating, Pageable pageable) {
        return productRepository.findHighRatedProducts(minRating, pageable);
    }

    @Override
    public List<TopProductResponse> getTopSellingProducts(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Product> topProducts = productRepository.findTopSellingInStockProducts(pageable);

        return topProducts.stream()
                .map(p -> TopProductResponse.builder()
                        .id(p.getProductId())
                        .name(p.getName())
                        .categoryName(
                                p.getCategory() != null
                                        ? p.getCategory().getName()
                                        : "Không xác định"
                        )
                        .soldQuantity(
                                p.getSoldCount() != null
                                        ? p.getSoldCount()
                                        : 0L
                        )
                        .revenue(
                                p.getPrice() != null && p.getSoldCount() != null
                                        ? p.getPrice().multiply(BigDecimal.valueOf(p.getSoldCount()))
                                        : BigDecimal.ZERO
                        )
                        .rating(
                                p.getAverageRating() != null
                                        ? p.getAverageRating()
                                        : BigDecimal.ZERO
                        )
                        .build())
                .toList();
    }



    // ========== ADMIN QUERIES ==========
    @Override
    public Page<Product> findActiveProductsWithPagination(Pageable pageable) {
        return productRepository.findByIsActiveWithPagination(true, pageable);
    }

    @Override
    public Page<Product> findAvailableProductsWithPagination(Pageable pageable) {
        return productRepository.findByAvailableWithPagination(true, pageable);
    }

    @Override
    public Page<Product> findInactiveProductsWithPagination(Pageable pageable) {
        return productRepository.findByIsActiveWithPagination(false, pageable);
    }
    // ========== STATUS MANAGEMENT (SOFT DELETE) ==========
    @Transactional
    @Override
    public void activateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        
        // Kiểm tra ràng buộc: Category và Brand phải cùng hoạt động
        Category category = product.getCategory();
        if (category == null || category.getIsActive() == null || !category.getIsActive()) {
            throw new AppException(ErrorCode.PRODUCT_CATEGORY_INACTIVE);
        }
        
        Brand brand = product.getBrand();
        if (brand == null || brand.getIsActive() == null || !brand.getIsActive()) {
            throw new AppException(ErrorCode.PRODUCT_BRAND_INACTIVE);
        }
        
        product.setIsActive(true);
        product.setUpdatedDate(LocalDateTime.now());
        productRepository.save(product);
    }

    @Transactional
    @Override
    public void deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setIsActive(false);
        product.setUpdatedDate(LocalDateTime.now());
        productRepository.save(product);
    }

    @Transactional
    @Override
    public void setAvailable(Long id, Boolean available) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        
        // Không cho phép set available = true nếu stock = 0
        if (available && product.getStock() != null && product.getStock() == 0) {
            throw new AppException(ErrorCode.PRODUCT_OUT_OF_STOCK);
        }
        
        product.setAvailable(available);
        product.setUpdatedDate(LocalDateTime.now());
        productRepository.save(product);
    }

    @Transactional
    @Override
    public void updateStock(Long id, Integer stock) {
        if (stock < 0) {
            throw new AppException(ErrorCode.PRODUCT_STOCK_INVALID);
        }
        if (stock > 999999) {
            throw new AppException(ErrorCode.PRODUCT_STOCK_TOO_HIGH);
        }
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setStock(stock);
        // Tự động set available dựa vào stock
        if (stock == 0) {
            product.setAvailable(false);
        } else {
            product.setAvailable(true);
        }
        product.setUpdatedDate(LocalDateTime.now());
        productRepository.save(product);
    }

    @Transactional
    @Override
    public void updateSoldCount(Long id, Integer soldCount) {
        if (soldCount < 0) {
            throw new AppException(ErrorCode.PRODUCT_SOLD_COUNT_INVALID);
        }
        if (soldCount > 999999) {
            throw new AppException(ErrorCode.PRODUCT_SOLD_COUNT_TOO_HIGH);
        }
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setSoldCount(soldCount);
        product.setUpdatedDate(LocalDateTime.now());
        productRepository.save(product);
    }
    // ========== STATISTICS ==========
    @Override
    public Long countActiveProducts() {
        return productRepository.countActiveProducts();
    }

    @Override
    public Long countActiveAvailableProducts() {
        return productRepository.countActiveAvailableProducts();
    }

    @Override
    public Long countOutOfStockProducts() {
        return productRepository.countOutOfStockProducts();
    }

    @Override
    public Long countByBrand(Long brandId) {
        return productRepository.countByBrand(brandId);
    }


    @Override
    public Product save(Product product) {
        return productRepository.save(product);
    }

    @Override
    public Long countByCategory(Long categoryId) {
        return productRepository.countByCategory(categoryId);
    }
    
    // ========== RELATED PRODUCTS ==========
    @Override
    public List<Product> findByCategoryAndIdNot(Long categoryId, Long productId) {
        return productRepository.findByCategoryCategoryIdAndProductIdNotAndIsActiveTrue(categoryId, productId);
    }
    
    // ========== OPTIMIZED FRONTEND QUERIES ==========
    @Override
    public List<Product> findBestSellingProducts(Pageable pageable) {
        return productRepository.findBestSellingProducts(pageable);
    }
    
    @Override
    public List<Product> findNewestProducts(Pageable pageable) {
        System.out.println("=== findNewestProducts called ===");
        System.out.println("Page: " + pageable.getPageNumber() + ", Size: " + pageable.getPageSize());
        
        List<Product> products = productRepository.findNewestProducts(pageable);
        System.out.println("Found " + products.size() + " newest products");
        
        if (products.isEmpty()) {
            System.out.println("No newest products found - checking if any products exist...");
            // Check if there are any products at all
            List<Product> allProducts = productRepository.findAll();
            System.out.println("Total products in database: " + allProducts.size());
            
            if (!allProducts.isEmpty()) {
                System.out.println("Sample product: " + allProducts.get(0).getName() + 
                    " - isActive: " + allProducts.get(0).getIsActive() + 
                    " - available: " + allProducts.get(0).getAvailable());
            }
        }
        
        return products;
    }
    
    @Override
    public List<Product> findBestSellingByCategory(Long categoryId, Pageable pageable) {
        return productRepository.findBestSellingByCategory(categoryId, pageable);
    }
    
    @Override
    public List<Product> findBestSellingByBrand(Long brandId, Pageable pageable) {
        return productRepository.findBestSellingByBrand(brandId, pageable);
    }
    
    @Override
    public List<BrandResponse> getBestSellingBrands() {
        System.out.println("=== getBestSellingBrands called ===");
        
        // Get all best selling products
        List<Product> bestSellingProducts = productRepository.findBestSellingProducts(PageRequest.of(0, 1000));
        System.out.println("Found " + bestSellingProducts.size() + " best selling products");
        
        if (bestSellingProducts.isEmpty()) {
            System.out.println("No best selling products found, returning empty list");
            return List.of();
        }
        
        // Group by brand and count
        Map<Brand, Long> brandCounts = bestSellingProducts.stream()
            .collect(Collectors.groupingBy(Product::getBrand, Collectors.counting()));
        
        System.out.println("Brand counts: " + brandCounts.size() + " brands");
        
        // Convert to BrandResponse and sort by count
        List<BrandResponse> result = brandCounts.entrySet().stream()
            .sorted(Map.Entry.<Brand, Long>comparingByValue().reversed())
            .map(entry -> {
                Brand brand = entry.getKey();
                BrandResponse brandResponse = new BrandResponse();
                brandResponse.setBrandId(brand.getBrandId());
                brandResponse.setName(brand.getName());
                // BrandResponse doesn't have description field
                brandResponse.setLogoUrl(brand.getLogoUrl());
                System.out.println("Brand: " + brand.getName() + " (ID: " + brand.getBrandId() + ")");
                return brandResponse;
            })
            .toList();
            
        System.out.println("Returning " + result.size() + " brands");
        return result;
    }

    @Override
    public List<BrandResponse> getNewestBrands() {
        System.out.println("=== getNewestBrands called ===");
        
        // Get all newest products
        List<Product> newestProducts = productRepository.findNewestProducts(PageRequest.of(0, 1000));
        System.out.println("Found " + newestProducts.size() + " newest products");
        
        if (newestProducts.isEmpty()) {
            System.out.println("No newest products found, returning empty list");
            return List.of();
        }
        
        // Group by brand and count
        Map<Brand, Long> brandCounts = newestProducts.stream()
            .collect(Collectors.groupingBy(Product::getBrand, Collectors.counting()));
        
        System.out.println("Brand counts: " + brandCounts.size() + " brands");
        
        // Convert to BrandResponse and sort by count
        List<BrandResponse> result = brandCounts.entrySet().stream()
            .sorted(Map.Entry.<Brand, Long>comparingByValue().reversed())
            .map(entry -> {
                Brand brand = entry.getKey();
                BrandResponse brandResponse = new BrandResponse();
                brandResponse.setBrandId(brand.getBrandId());
                brandResponse.setName(brand.getName());
                brandResponse.setLogoUrl(brand.getLogoUrl());
                brandResponse.setIsActive(brand.getIsActive());
                System.out.println("Newest Brand: " + brand.getName() + " (ID: " + brand.getBrandId() + ")");
                return brandResponse;
            })
            .toList();
            
        System.out.println("Returning " + result.size() + " newest brands");
        return result;
    }

    // ========== RATING MANAGEMENT ==========
    
    @Override
    @Transactional
    public void updateProductAverageRating(Long productId) {
        try {
            // Lấy product
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
            
            // Tính average rating từ reviews
            Double averageRating = reviewRepository.getAverageRatingByProductId(productId);
            
            // Cập nhật average rating
            if (averageRating != null) {
                product.setAverageRating(BigDecimal.valueOf(averageRating));
            } else {
                product.setAverageRating(BigDecimal.ZERO);
            }
            
            // Cập nhật updated date
            product.setUpdatedDate(LocalDateTime.now());
            
            // Lưu product
            productRepository.save(product);
            
            System.out.println("Updated average rating for product " + productId + ": " + product.getAverageRating());
            
        } catch (Exception e) {
            System.err.println("Error updating average rating for product " + productId + ": " + e.getMessage());
            throw e;
        }
    }
    
    @Override
    @Transactional
    public void updateAllProductsAverageRating() {
        try {
            // Lấy tất cả products
            List<Product> products = productRepository.findAll();
            
            System.out.println("Updating average rating for " + products.size() + " products...");
            
            for (Product product : products) {
                // Tính average rating từ reviews
                Double averageRating = reviewRepository.getAverageRatingByProductId(product.getProductId());
                
                // Cập nhật average rating
                if (averageRating != null) {
                    product.setAverageRating(BigDecimal.valueOf(averageRating));
                } else {
                    product.setAverageRating(BigDecimal.ZERO);
                }
                
                // Cập nhật updated date
                product.setUpdatedDate(LocalDateTime.now());
            }
            
            // Lưu tất cả products
            productRepository.saveAll(products);
            
            System.out.println("Successfully updated average rating for all products");
            
        } catch (Exception e) {
            System.err.println("Error updating average rating for all products: " + e.getMessage());
            throw e;
        }
    }


}
