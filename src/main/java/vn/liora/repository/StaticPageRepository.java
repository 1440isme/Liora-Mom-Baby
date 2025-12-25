package vn.liora.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.StaticPage;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaticPageRepository extends JpaRepository<StaticPage, Long> {

        // Tìm static page theo slug
        Optional<StaticPage> findBySlug(String slug);

        // Tìm static page theo slug và trạng thái active
        Optional<StaticPage> findBySlugAndIsActiveTrue(String slug);

        // Tìm static page đã publish theo slug
        Optional<StaticPage> findBySlugAndIsActiveTrueAndIsPublishedTrue(String slug);

        // Tìm tất cả static page active
        List<StaticPage> findByIsActiveTrueOrderByTitleAsc();

        // Tìm static page đã publish
        List<StaticPage> findByIsActiveTrueAndIsPublishedTrueOrderByTitleAsc();

        // Tìm static page đã publish theo sectionSlug
        List<StaticPage> findByIsActiveTrueAndIsPublishedTrueAndSectionSlugOrderByPublishedAtDesc(String sectionSlug);

        // Tìm static page theo title (tìm kiếm)
        Page<StaticPage> findByTitleContainingIgnoreCase(String title, Pageable pageable);

        // Tìm static page theo trạng thái active với phân trang
        Page<StaticPage> findByIsActive(Boolean isActive, Pageable pageable);

        // Tìm static page theo trạng thái published với phân trang
        Page<StaticPage> findByIsActiveTrueAndIsPublished(Boolean isPublished, Pageable pageable);

        // Bổ sung các truy vấn phục vụ lọc kết hợp
        Page<StaticPage> findByIsPublished(Boolean isPublished, Pageable pageable);

        Page<StaticPage> findByIsActiveAndIsPublished(Boolean isActive, Boolean isPublished, Pageable pageable);

        Page<StaticPage> findByTitleContainingIgnoreCaseAndIsActive(String title, Boolean isActive, Pageable pageable);

        Page<StaticPage> findByTitleContainingIgnoreCaseAndIsPublished(String title, Boolean isPublished,
                        Pageable pageable);

        Page<StaticPage> findByTitleContainingIgnoreCaseAndIsActiveAndIsPublished(String title, Boolean isActive,
                        Boolean isPublished, Pageable pageable);

        // Tìm static page theo slug (tìm kiếm)
        Page<StaticPage> findBySlugContainingIgnoreCase(String slug, Pageable pageable);

        // Kiểm tra slug có tồn tại không (trừ id hiện tại)
        boolean existsBySlugAndIdNot(String slug, Long id);

        // Kiểm tra slug có tồn tại không
        boolean existsBySlug(String slug);

        // Tìm static page theo từ khóa trong content
        @Query("SELECT sp FROM StaticPage sp WHERE sp.isActive = true " +
                        "AND (LOWER(sp.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(sp.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
                        "ORDER BY sp.title ASC")
        List<StaticPage> findByKeywordInTitleOrContent(@Param("keyword") String keyword);

        // Đếm số static page active
        long countByIsActiveTrue();

        // Đếm số static page đã publish
        long countByIsActiveTrueAndIsPublishedTrue();
}
