package vn.liora.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.StaticPageRequest;
import vn.liora.dto.response.StaticPageResponse;
import vn.liora.entity.StaticPage;
import vn.liora.repository.StaticPageRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StaticPageService {

    @Autowired
    private StaticPageRepository staticPageRepository;

    // Tạo static page mới
    public StaticPageResponse createStaticPage(StaticPageRequest request) {
        // Kiểm tra slug đã tồn tại chưa
        if (staticPageRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Slug đã tồn tại: " + request.getSlug());
        }

        StaticPage staticPage = new StaticPage();
        staticPage.setTitle(request.getTitle());
        staticPage.setSlug(request.getSlug());
        staticPage.setContent(request.getContent());
        staticPage.setSeoTitle(request.getSeoTitle());
        staticPage.setSeoDescription(request.getSeoDescription());
        staticPage.setSeoKeywords(request.getSeoKeywords());
        staticPage.setSectionSlug(request.getSectionSlug());
        staticPage.setIsActive(request.getIsActive());
        staticPage.setIsPublished(request.getIsPublished());

        // Nếu publish thì set thời gian publish
        if (Boolean.TRUE.equals(request.getIsPublished())) {
            staticPage.setPublishedAt(LocalDateTime.now());
        }

        StaticPage savedStaticPage = staticPageRepository.save(staticPage);
        return new StaticPageResponse(savedStaticPage);
    }

    // Cập nhật static page
    public StaticPageResponse updateStaticPage(Long id, StaticPageRequest request) {
        StaticPage staticPage = staticPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trang với ID: " + id));

        // Kiểm tra slug đã tồn tại chưa (trừ trang hiện tại)
        if (staticPageRepository.existsBySlugAndIdNot(request.getSlug(), id)) {
            throw new RuntimeException("Slug đã tồn tại: " + request.getSlug());
        }

        staticPage.setTitle(request.getTitle());
        staticPage.setSlug(request.getSlug());
        staticPage.setContent(request.getContent());
        staticPage.setSeoTitle(request.getSeoTitle());
        staticPage.setSeoDescription(request.getSeoDescription());
        staticPage.setSeoKeywords(request.getSeoKeywords());
        staticPage.setSectionSlug(request.getSectionSlug());
        staticPage.setIsActive(request.getIsActive());

        // Nếu chuyển từ chưa publish sang publish
        if (request.getIsPublished() && !staticPage.getIsPublished()) {
            staticPage.setPublishedAt(LocalDateTime.now());
        }
        staticPage.setIsPublished(request.getIsPublished());

        StaticPage savedStaticPage = staticPageRepository.save(staticPage);
        return new StaticPageResponse(savedStaticPage);
    }

    // Lấy static page theo ID
    public StaticPageResponse getStaticPageById(Long id) {
        StaticPage staticPage = staticPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trang với ID: " + id));
        return new StaticPageResponse(staticPage);
    }

    // Lấy static page theo slug (cho frontend)
    public StaticPageResponse getStaticPageBySlug(String slug) {
        StaticPage staticPage = staticPageRepository.findBySlugAndIsActiveTrueAndIsPublishedTrue(slug)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trang với slug: " + slug));
        return new StaticPageResponse(staticPage);
    }

    // Lấy tất cả static page active (cho frontend)
    public List<StaticPageResponse> getActiveStaticPages() {
        List<StaticPage> staticPages = staticPageRepository.findByIsActiveTrueAndIsPublishedTrueOrderByTitleAsc();
        return staticPages.stream()
                .map(StaticPageResponse::new)
                .collect(Collectors.toList());
    }

    // Lấy các trang đã publish theo sectionSlug (cho listing)
    public List<StaticPageResponse> getPublishedPagesBySection(String sectionSlug) {
        if (sectionSlug == null || sectionSlug.trim().isEmpty())
            return List.of();
        List<StaticPage> staticPages = staticPageRepository
                .findByIsActiveTrueAndIsPublishedTrueAndSectionSlugOrderByPublishedAtDesc(sectionSlug.trim());
        return staticPages.stream().map(StaticPageResponse::new).collect(Collectors.toList());
    }

    // Lấy tất cả static page với phân trang
    public Page<StaticPageResponse> getAllStaticPages(Pageable pageable) {
        Page<StaticPage> staticPages = staticPageRepository.findAll(pageable);
        return staticPages.map(StaticPageResponse::new);
    }

    // Tìm kiếm static page theo title
    public Page<StaticPageResponse> searchStaticPagesByTitle(String title, Pageable pageable) {
        Page<StaticPage> staticPages = staticPageRepository.findByTitleContainingIgnoreCase(title, pageable);
        return staticPages.map(StaticPageResponse::new);
    }

    // Lấy danh sách theo bộ lọc tổng hợp (search theo title, isActive, isPublished)
    public Page<StaticPageResponse> getStaticPages(String search, Boolean isActive, Boolean isPublished,
            Pageable pageable) {
        Page<StaticPage> staticPages;

        String safeSearch = (search == null) ? "" : search;
        boolean hasSearch = !safeSearch.trim().isEmpty();
        if (hasSearch) {
            String keyword = safeSearch.trim();
            if (isActive != null && isPublished != null) {
                staticPages = staticPageRepository.findByTitleContainingIgnoreCaseAndIsActiveAndIsPublished(keyword,
                        isActive, isPublished, pageable);
            } else if (isActive != null) {
                staticPages = staticPageRepository.findByTitleContainingIgnoreCaseAndIsActive(keyword, isActive,
                        pageable);
            } else if (isPublished != null) {
                staticPages = staticPageRepository.findByTitleContainingIgnoreCaseAndIsPublished(keyword, isPublished,
                        pageable);
            } else {
                staticPages = staticPageRepository.findByTitleContainingIgnoreCase(keyword, pageable);
            }
        } else {
            if (isActive != null && isPublished != null) {
                staticPages = staticPageRepository.findByIsActiveAndIsPublished(isActive, isPublished, pageable);
            } else if (isActive != null) {
                staticPages = staticPageRepository.findByIsActive(isActive, pageable);
            } else if (isPublished != null) {
                staticPages = staticPageRepository.findByIsPublished(isPublished, pageable);
            } else {
                staticPages = staticPageRepository.findAll(pageable);
            }
        }

        return staticPages.map(StaticPageResponse::new);
    }

    // Tìm kiếm static page theo slug
    public Page<StaticPageResponse> searchStaticPagesBySlug(String slug, Pageable pageable) {
        Page<StaticPage> staticPages = staticPageRepository.findBySlugContainingIgnoreCase(slug, pageable);
        return staticPages.map(StaticPageResponse::new);
    }

    // Lấy static page theo trạng thái active
    public Page<StaticPageResponse> getStaticPagesByActiveStatus(Boolean isActive, Pageable pageable) {
        Page<StaticPage> staticPages = staticPageRepository.findByIsActive(isActive, pageable);
        return staticPages.map(StaticPageResponse::new);
    }

    // Lấy static page theo trạng thái published
    public Page<StaticPageResponse> getStaticPagesByPublishedStatus(Boolean isPublished, Pageable pageable) {
        Page<StaticPage> staticPages = staticPageRepository.findByIsActiveTrueAndIsPublished(isPublished, pageable);
        return staticPages.map(StaticPageResponse::new);
    }

    // Tìm kiếm static page theo từ khóa
    public List<StaticPageResponse> searchStaticPagesByKeyword(String keyword) {
        List<StaticPage> staticPages = staticPageRepository.findByKeywordInTitleOrContent(keyword);
        return staticPages.stream()
                .map(StaticPageResponse::new)
                .collect(Collectors.toList());
    }

    // Xóa static page
    public void deleteStaticPage(Long id) {
        if (!staticPageRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy trang với ID: " + id);
        }
        staticPageRepository.deleteById(id);
    }

    // Chuyển đổi trạng thái active
    public StaticPageResponse toggleActiveStatus(Long id) {
        StaticPage staticPage = staticPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trang với ID: " + id));

        staticPage.setIsActive(!staticPage.getIsActive());
        StaticPage savedStaticPage = staticPageRepository.save(staticPage);
        return new StaticPageResponse(savedStaticPage);
    }

    // Chuyển đổi trạng thái published
    public StaticPageResponse togglePublishedStatus(Long id) {
        StaticPage staticPage = staticPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trang với ID: " + id));

        boolean newPublishedStatus = !staticPage.getIsPublished();
        staticPage.setIsPublished(newPublishedStatus);

        // Nếu chuyển sang published thì set thời gian publish
        if (newPublishedStatus) {
            staticPage.setPublishedAt(LocalDateTime.now());
        }

        StaticPage savedStaticPage = staticPageRepository.save(staticPage);
        return new StaticPageResponse(savedStaticPage);
    }

    // Tạo slug từ title
    public String generateSlugFromTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            return "";
        }

        String slug = title.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", "-")
                .trim();

        // Kiểm tra slug có tồn tại không, nếu có thì thêm số
        String originalSlug = slug;
        int counter = 1;
        while (staticPageRepository.existsBySlug(slug)) {
            slug = originalSlug + "-" + counter;
            counter++;
        }

        return slug;
    }

    // Đếm số static page active
    public long countActiveStaticPages() {
        return staticPageRepository.countByIsActiveTrue();
    }

    // Đếm số static page đã publish
    public long countPublishedStaticPages() {
        return staticPageRepository.countByIsActiveTrueAndIsPublishedTrue();
    }
}
