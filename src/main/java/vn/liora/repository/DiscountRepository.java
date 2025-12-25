package vn.liora.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Discount;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiscountRepository extends JpaRepository<Discount, Long> {
    
    // ====== BASIC SEARCH (tìm tên) ======
    Optional<Discount> findByName(String name);
    boolean existsByName(String name);
    List<Discount> findByNameContaining(String name);
    Page<Discount> findByNameContaining(String name, Pageable pageable);
    
    
    // ====== BY STATUS (tìm mã theo trạng thái)======
    List<Discount> findByIsActiveTrue();
    List<Discount> findByIsActiveFalse();
    Page<Discount> findByIsActiveTrue(Pageable pageable);
    Page<Discount> findByIsActiveFalse(Pageable pageable);
    
    // ====== BY DATE RANGE (theo ngày)======
    List<Discount> findByStartDateBetween(LocalDateTime start, LocalDateTime end);
    List<Discount> findByEndDateBetween(LocalDateTime start, LocalDateTime end);
    List<Discount> findByStartDateBefore(LocalDateTime time);
    List<Discount> findByEndDateBefore(LocalDateTime time);
    List<Discount> findByStartDateAfter(LocalDateTime time);
    List<Discount> findByEndDateAfter(LocalDateTime time);
    
    // ====== COUNT QUERIES ======
    Long countByIsActiveTrue();
    Long countByIsActiveFalse();
    
    // ====== CUSTOM QUERIES ======
    @Query("SELECT d FROM Discount d WHERE d.isActive = true AND d.startDate <= :now AND d.endDate >= :now")
    List<Discount> findActiveNow(@Param("now") LocalDateTime now);
    
    @Query("SELECT d FROM Discount d WHERE d.isActive = true AND d.startDate <= :now AND d.endDate >= :now")
    Page<Discount> findActiveNow(@Param("now") LocalDateTime now, Pageable pageable);
    
    @Query("SELECT d FROM Discount d WHERE d.isActive = true AND d.startDate <= :now AND d.endDate >= :now " +
           "AND (d.usageLimit IS NULL OR d.usedCount < d.usageLimit)")
    List<Discount> findAvailableDiscounts(@Param("now") LocalDateTime now);
    
    @Query("SELECT d FROM Discount d WHERE d.name LIKE %:keyword% OR d.description LIKE %:keyword%")
    Page<Discount> searchDiscounts(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT d FROM Discount d WHERE d.name = :name AND d.isActive = true " +
       "AND d.startDate <= :now AND d.endDate >= :now " +
       "AND (d.usageLimit IS NULL OR d.usedCount < d.usageLimit)")
    Optional<Discount> findAvailableDiscountByName(@Param("name") String name, @Param("now") LocalDateTime now);
}