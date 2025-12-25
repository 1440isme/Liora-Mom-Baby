package vn.liora.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Banner;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BannerRepository extends JpaRepository<Banner, Long> {

    // Tìm banner theo trạng thái active
    List<Banner> findByIsActiveTrueOrderBySortOrderAsc();

    // Tìm banner theo trạng thái active và thời gian hiện tại
    @Query("SELECT b FROM Banner b WHERE b.isActive = true " +
            "AND (b.startDate IS NULL OR b.startDate <= :currentTime) " +
            "AND (b.endDate IS NULL OR b.endDate >= :currentTime) " +
            "ORDER BY b.sortOrder ASC")
    List<Banner> findActiveBannersByCurrentTime(@Param("currentTime") LocalDateTime currentTime);

    // Tìm banner theo title (tìm kiếm)
    Page<Banner> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    // Tìm banner theo trạng thái active với phân trang
    Page<Banner> findByIsActive(Boolean isActive, Pageable pageable);

    // Tìm banner theo sort order
    Optional<Banner> findBySortOrder(Integer sortOrder);

    // Tìm banner có sort order lớn hơn hoặc bằng giá trị cho trước
    List<Banner> findBySortOrderGreaterThanEqualOrderBySortOrderAsc(Integer sortOrder);

    // Tìm banner có sort order nhỏ hơn hoặc bằng giá trị cho trước
    List<Banner> findBySortOrderLessThanEqualOrderBySortOrderDesc(Integer sortOrder);

    // Đếm số banner active
    long countByIsActiveTrue();

    // Tìm banner theo khoảng thời gian
    @Query("SELECT b FROM Banner b WHERE b.isActive = true " +
            "AND ((b.startDate IS NULL OR b.startDate <= :endTime) " +
            "AND (b.endDate IS NULL OR b.endDate >= :startTime)) " +
            "ORDER BY b.sortOrder ASC")
    List<Banner> findBannersInTimeRange(@Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
