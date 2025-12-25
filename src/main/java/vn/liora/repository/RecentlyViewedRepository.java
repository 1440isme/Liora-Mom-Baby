package vn.liora.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.RecentlyViewed;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecentlyViewedRepository extends JpaRepository<RecentlyViewed, Long> {
    
    // Lấy danh sách sản phẩm đã xem gần đây của user
    @Query("SELECT rv FROM RecentlyViewed rv JOIN FETCH rv.product p LEFT JOIN FETCH p.brand LEFT JOIN FETCH p.category WHERE rv.user IS NOT NULL AND rv.user.userId = :userId ORDER BY rv.viewedAt DESC")
    List<RecentlyViewed> findByUserIdOrderByViewedAtDesc(@Param("userId") Long userId, Pageable pageable);
    
    // Lấy danh sách sản phẩm đã xem gần đây theo guest ID (cho user chưa đăng nhập)
    @Query("SELECT rv FROM RecentlyViewed rv JOIN FETCH rv.product p LEFT JOIN FETCH p.brand LEFT JOIN FETCH p.category WHERE rv.guestId = :guestId AND rv.user IS NULL ORDER BY rv.viewedAt DESC")
    List<RecentlyViewed> findByGuestIdOrderByViewedAtDesc(@Param("guestId") String guestId, Pageable pageable);
    
    // Kiểm tra xem user đã xem sản phẩm này chưa - Đơn giản hóa query
    Optional<RecentlyViewed> findByUser_UserIdAndProduct_ProductId(Long userId, Long productId);
    
    // Kiểm tra xem guest đã xem sản phẩm này chưa - Đơn giản hóa query
    Optional<RecentlyViewed> findByGuestIdAndProduct_ProductIdAndUserIsNull(String guestId, Long productId);
    
    // Đếm số lượng sản phẩm đã xem của user
    @Query("SELECT COUNT(rv) FROM RecentlyViewed rv WHERE rv.user.userId = :userId")
    Long countByUserId(@Param("userId") Long userId);
    
    // Đếm số lượng sản phẩm đã xem của guest
    @Query("SELECT COUNT(rv) FROM RecentlyViewed rv WHERE rv.guestId = :guestId AND rv.user IS NULL")
    Long countByGuestId(@Param("guestId") String guestId);
    
    // Xóa các bản ghi cũ hơn 30 ngày
    @Modifying
    @Query("DELETE FROM RecentlyViewed rv WHERE rv.viewedAt < :cutoffDate")
    int deleteOldRecords(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Xóa tất cả lịch sử của user
    @Modifying
    @Query("DELETE FROM RecentlyViewed rv WHERE rv.user.userId = :userId")
    int deleteByUserId(@Param("userId") Long userId);
    
    // Xóa tất cả lịch sử của guest
    @Modifying
    @Query("DELETE FROM RecentlyViewed rv WHERE rv.guestId = :guestId AND rv.user IS NULL")
    int deleteByGuestId(@Param("guestId") String guestId);
    
    // Xóa một sản phẩm cụ thể của user
    @Modifying
    @Query("DELETE FROM RecentlyViewed rv WHERE rv.user.userId = :userId AND rv.product.productId = :productId")
    int deleteByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);
    
    // Xóa một sản phẩm cụ thể của guest
    @Modifying
    @Query("DELETE FROM RecentlyViewed rv WHERE rv.guestId = :guestId AND rv.product.productId = :productId AND rv.user IS NULL")
    int deleteByGuestIdAndProductId(@Param("guestId") String guestId, @Param("productId") Long productId);
    
    // Lấy danh sách sản phẩm đã xem gần đây (hỗ trợ cả user và guest)
    @Query("SELECT rv FROM RecentlyViewed rv JOIN FETCH rv.product p WHERE " +
           "(:userId IS NOT NULL AND rv.user IS NOT NULL AND rv.user.userId = :userId) OR " +
           "(:userId IS NULL AND :guestId IS NOT NULL AND rv.guestId = :guestId AND rv.user IS NULL) " +
           "ORDER BY rv.viewedAt DESC")
    List<RecentlyViewed> findRecentlyViewed(@Param("userId") Long userId, @Param("guestId") String guestId, Pageable pageable);
    
    // Query để test - lấy TẤT CẢ records của user (không giới hạn)
    @Query("SELECT rv FROM RecentlyViewed rv JOIN FETCH rv.product WHERE rv.user IS NOT NULL AND rv.user.userId = :userId ORDER BY rv.viewedAt DESC")
    List<RecentlyViewed> findAllByUserId(@Param("userId") Long userId);
}
