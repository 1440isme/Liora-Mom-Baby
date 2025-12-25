package vn.liora.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.liora.dto.request.ApplyDiscountRequest;
import vn.liora.dto.request.DiscountCreationRequest;
import vn.liora.dto.request.DiscountUpdateRequest;
import vn.liora.dto.response.DiscountResponse;
import vn.liora.entity.Discount;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IDiscountService {
    
    // ========== BASIC CRUD ==========
    Discount createDiscount(DiscountCreationRequest request);
    DiscountResponse findById(Long id);
    DiscountResponse updateDiscount(Long id, DiscountUpdateRequest request);
    void deleteById(Long id);
    long count();
    
    // ========== FIND ALL ==========
    List<Discount> findAll();
    Page<Discount> findAll(Pageable pageable);
    Optional<Discount> findByIdOptional(Long id);
    
    // ========== BASIC SEARCH ==========
    Optional<Discount> findByName(String name);
    boolean existsByName(String name);
    List<Discount> findByNameContaining(String name);
    Page<Discount> findByNameContaining(String name, Pageable pageable);
    
    
    // ========== BY STATUS ==========
    List<Discount> findActiveDiscounts();
    List<Discount> findInactiveDiscounts();
    Page<Discount> findActiveDiscounts(Pageable pageable);
    Page<Discount> findInactiveDiscounts(Pageable pageable);
    
    // ========== BY DATE RANGE ==========
    List<Discount> findActiveNow();
    Page<Discount> findActiveNow(Pageable pageable);
    List<Discount> findByStartDateBetween(LocalDateTime start, LocalDateTime end);
    List<Discount> findByEndDateBetween(LocalDateTime start, LocalDateTime end);
    List<Discount> findExpiredDiscounts();
    List<Discount> findUpcomingDiscounts();
    
    // ========== COUNT QUERIES ==========
    Long countActiveDiscounts();
    Long countInactiveDiscounts();
    
    // ========== BUSINESS LOGIC ==========
    List<Discount> findAvailableDiscounts();
    List<Discount> findAvailableDiscountsForOrder(BigDecimal orderTotal);
    BigDecimal calculateDiscountAmount(Long discountId, BigDecimal orderTotal);
    boolean canApplyDiscount(Long discountId, Long userId, BigDecimal orderTotal);
    Discount findAvailableDiscountByCode(String discountCode);
    
    // ========== ORDER DISCOUNT MANAGEMENT ==========
    List<Discount> getDiscountsByOrder(Long orderId);
    
    // ========== VALIDATION ==========
    boolean isDiscountActive(Long discountId);
    boolean isDiscountExpired(Long discountId);
    boolean hasReachedUsageLimit(Long discountId);
    boolean hasReachedUserUsageLimit(Long discountId, Long userId);
    
    // ========== STATISTICS ==========
    Long getTotalUsageCount(Long discountId);
    Long getUsageCountByUser(Long discountId, Long userId);
    BigDecimal getTotalDiscountAmount(Long discountId);
    void incrementUsageCount(Long discountId);
}