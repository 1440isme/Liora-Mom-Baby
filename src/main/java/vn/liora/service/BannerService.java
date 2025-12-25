package vn.liora.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.BannerRequest;
import vn.liora.dto.request.BannerSortRequest;
import vn.liora.dto.response.BannerResponse;
import vn.liora.entity.Banner;
import vn.liora.repository.BannerRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class BannerService {

    @Autowired
    private BannerRepository bannerRepository;

    // Tạo banner mới
    public BannerResponse createBanner(BannerRequest request) {
        Banner banner = new Banner();
        banner.setTitle(request.getTitle());
        banner.setImageUrl(request.getImageUrl());
        banner.setTargetLink(request.getTargetLink());
        banner.setSortOrder(request.getSortOrder());
        banner.setIsActive(request.getIsActive());
        banner.setStartDate(request.getStartDate());
        banner.setEndDate(request.getEndDate());

        Banner savedBanner = bannerRepository.save(banner);
        return new BannerResponse(savedBanner);
    }

    // Cập nhật banner
    public BannerResponse updateBanner(Long id, BannerRequest request) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy banner với ID: " + id));

        banner.setTitle(request.getTitle());
        banner.setImageUrl(request.getImageUrl());
        banner.setTargetLink(request.getTargetLink());
        banner.setSortOrder(request.getSortOrder());
        banner.setIsActive(request.getIsActive());
        banner.setStartDate(request.getStartDate());
        banner.setEndDate(request.getEndDate());

        Banner savedBanner = bannerRepository.save(banner);
        return new BannerResponse(savedBanner);
    }

    // Lấy banner theo ID
    public BannerResponse getBannerById(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy banner với ID: " + id));
        return new BannerResponse(banner);
    }

    // Lấy tất cả banner active (cho frontend)
    public List<BannerResponse> getActiveBanners() {
        try {
            // Lấy tất cả banner active (bỏ qua thời gian hiển thị để test)
            List<Banner> activeBanners = bannerRepository.findByIsActiveTrueOrderBySortOrderAsc();
            System.out.println("=== DEBUG: Active banners found: " + activeBanners.size() + " ===");

            // Bỏ qua thời gian hiển thị để test
            List<BannerResponse> result = activeBanners.stream()
                    .map(BannerResponse::new)
                    .collect(Collectors.toList());

            System.out.println("=== DEBUG: BannerResponse created: " + result.size() + " ===");
            return result;
        } catch (Exception e) {
            System.err.println("=== ERROR in getActiveBanners: " + e.getMessage() + " ===");
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // Lấy tất cả banner với phân trang
    public Page<BannerResponse> getAllBanners(Pageable pageable) {
        Page<Banner> banners = bannerRepository.findAll(pageable);
        return banners.map(BannerResponse::new);
    }

    // Tìm kiếm banner theo title
    public Page<BannerResponse> searchBannersByTitle(String title, Pageable pageable) {
        Page<Banner> banners = bannerRepository.findByTitleContainingIgnoreCase(title, pageable);
        return banners.map(BannerResponse::new);
    }

    // Lấy banner theo trạng thái active
    public Page<BannerResponse> getBannersByActiveStatus(Boolean isActive, Pageable pageable) {
        Page<Banner> banners = bannerRepository.findByIsActive(isActive, pageable);
        return banners.map(BannerResponse::new);
    }

    // Xóa banner
    public void deleteBanner(Long id) {
        if (!bannerRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy banner với ID: " + id);
        }
        bannerRepository.deleteById(id);
    }

    // Sắp xếp lại thứ tự banner
    public void reorderBanners(BannerSortRequest request) {
        List<Long> bannerIds = request.getBannerIds();

        for (int i = 0; i < bannerIds.size(); i++) {
            Long bannerId = bannerIds.get(i);
            Optional<Banner> bannerOpt = bannerRepository.findById(bannerId);

            if (bannerOpt.isPresent()) {
                Banner banner = bannerOpt.get();
                banner.setSortOrder(i);
                bannerRepository.save(banner);
            }
        }
    }

    // Chuyển đổi trạng thái active
    public BannerResponse toggleActiveStatus(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy banner với ID: " + id));

        banner.setIsActive(!banner.getIsActive());
        Banner savedBanner = bannerRepository.save(banner);
        return new BannerResponse(savedBanner);
    }

    // Lấy banner theo khoảng thời gian
    public List<BannerResponse> getBannersInTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        List<Banner> banners = bannerRepository.findBannersInTimeRange(startTime, endTime);
        return banners.stream()
                .map(BannerResponse::new)
                .collect(Collectors.toList());
    }

    // Đếm số banner active
    public long countActiveBanners() {
        return bannerRepository.countByIsActiveTrue();
    }

}
