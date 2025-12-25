package vn.liora.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.RecentlyViewedDTO;
import vn.liora.entity.Image;
import vn.liora.entity.Product;
import vn.liora.entity.RecentlyViewed;
import vn.liora.entity.User;
import vn.liora.repository.ImageRepository;
import vn.liora.repository.ProductRepository;
import vn.liora.repository.RecentlyViewedRepository;
import vn.liora.repository.ReviewRepository;
import vn.liora.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecentlyViewedService {
    
    private final RecentlyViewedRepository recentlyViewedRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ImageRepository imageRepository;
    private final ReviewRepository reviewRepository;
    
    private static final int MAX_RECENTLY_VIEWED = 20;  // Giới hạn số lượng sản phẩm gần đây
    private static final int GUEST_RETENTION_DAYS = 30;  // Guest: giữ 30 ngày
    private static final int USER_RETENTION_DAYS = 90;   // User: giữ 90 ngày (hoặc giới hạn theo số lượng)
    
    @Transactional
    public RecentlyViewedDTO trackProductView(Long productId, Long userId, String guestId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            log.warn("Product not found: {}", productId);
                return null;
            }
            
        // Tìm existing record - giống CartProduct
        Optional<RecentlyViewed> existing;
            if (userId != null) {
            existing = recentlyViewedRepository.findByUser_UserIdAndProduct_ProductId(userId, productId);
            log.debug("Check existing for userId={}, productId={}: {}", userId, productId, existing.isPresent());
            } else {
            existing = recentlyViewedRepository.findByGuestIdAndProduct_ProductIdAndUserIsNull(guestId, productId);
            log.debug("Check existing for guestId={}, productId={}: {}", guestId, productId, existing.isPresent());
            }
            
            RecentlyViewed recentlyViewed;
        if (existing.isPresent()) {
            // Update existing - giống CartProduct
            recentlyViewed = existing.get();
                recentlyViewed.setViewedAt(LocalDateTime.now());
            log.debug("Updating existing record: id={}", recentlyViewed.getIdRecentlyViewed());
            } else {
            // Create new - giống CartProduct
                User user = null;
                if (userId != null) {
                    user = userRepository.findById(userId).orElse(null);
                    if (user == null) {
                    log.warn("User not found: {}", userId);
                        return null;
                }
            }
                recentlyViewed = RecentlyViewed.builder()
                    .user(user)
                    .product(product)
                .guestId(userId == null ? guestId : null)
                    .viewedAt(LocalDateTime.now())
                    .build();
            log.debug("Creating new record: userId={}, guestId={}, productId={}", userId, guestId, productId);
        }
        
        try {
            // Save - giống CartProduct
            recentlyViewed = recentlyViewedRepository.save(recentlyViewed);
            log.debug("Saved successfully: id={}", recentlyViewed.getIdRecentlyViewed());
            
            // Cleanup: Giới hạn số lượng records và xóa records cũ
            cleanupOldRecords(userId, guestId);
        } catch (DataIntegrityViolationException e) {
            // Duplicate key - find và update lại
            log.warn("Duplicate key detected, finding existing record: userId={}, guestId={}, productId={}", userId, guestId, productId);
                if (userId != null) {
                existing = recentlyViewedRepository.findByUser_UserIdAndProduct_ProductId(userId, productId);
                } else {
                existing = recentlyViewedRepository.findByGuestIdAndProduct_ProductIdAndUserIsNull(guestId, productId);
                }
            if (existing.isPresent()) {
                recentlyViewed = existing.get();
                    recentlyViewed.setViewedAt(LocalDateTime.now());
                    recentlyViewed = recentlyViewedRepository.save(recentlyViewed);
                log.debug("Updated existing record after duplicate key: id={}", recentlyViewed.getIdRecentlyViewed());
                } else {
                log.error("Cannot find existing record after duplicate key!");
                    return null;
                }
            }
            
        return convertToDTO(recentlyViewed);
    }
    
    public List<RecentlyViewedDTO> getRecentlyViewed(Long userId, String guestId, int limit) {
        List<RecentlyViewed> list;
            if (userId != null) {
            list = recentlyViewedRepository.findByUserIdOrderByViewedAtDesc(userId, PageRequest.of(0, limit));
        } else {
            list = recentlyViewedRepository.findByGuestIdOrderByViewedAtDesc(guestId, PageRequest.of(0, limit));
        }
        
        return list.stream()
                .map(this::convertToDTO)
            .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public boolean clearRecentlyViewed(Long userId, String guestId) {
            if (userId != null) {
                recentlyViewedRepository.deleteByUserId(userId);
        } else {
                recentlyViewedRepository.deleteByGuestId(guestId);
            }
            return true;
    }
    
    @Transactional
    public boolean removeFromRecentlyViewed(Long productId, Long userId, String guestId) {
        Optional<RecentlyViewed> existing;
            if (userId != null) {
            existing = recentlyViewedRepository.findByUser_UserIdAndProduct_ProductId(userId, productId);
                } else {
            existing = recentlyViewedRepository.findByGuestIdAndProduct_ProductIdAndUserIsNull(guestId, productId);
        }
        
        if (existing.isPresent()) {
            recentlyViewedRepository.delete(existing.get());
            return true;
        }
        return false;
    }
    
    private RecentlyViewedDTO convertToDTO(RecentlyViewed rv) {
        if (rv == null || rv.getProduct() == null) return null;
        
        Product p = rv.getProduct();
        
        // Lấy main image URL
        String mainImageUrl = "/user/img/default-product.jpg";
        Optional<Image> mainImage = imageRepository.findByProductProductIdAndIsMainTrue(p.getProductId());
        if (mainImage.isPresent()) {
            mainImageUrl = mainImage.get().getImageUrl();
            } else {
            // Fallback: lấy ảnh đầu tiên nếu không có ảnh chính
            List<Image> images = imageRepository.findByProductProductId(p.getProductId());
            if (images != null && !images.isEmpty()) {
                mainImageUrl = images.get(0).getImageUrl();
            }
        }
        
        // Lấy tất cả ảnh của sản phẩm
        List<String> productImages = imageRepository.findByProductProductId(p.getProductId())
            .stream()
            .map(Image::getImageUrl)
            .collect(Collectors.toList());
        
        // Lấy rating count từ ReviewRepository
        Long ratingCountLong = reviewRepository.getTotalReviewCountByProductId(p.getProductId());
        Integer ratingCount = ratingCountLong != null ? ratingCountLong.intValue() : 0;
        
        return RecentlyViewedDTO.builder()
            .idRecentlyViewed(rv.getIdRecentlyViewed())
            .productId(p.getProductId())
            .productName(p.getName())
            .productDescription(p.getDescription())
            .price(p.getPrice())
            .mainImageUrl(mainImageUrl)
            .productImages(productImages)
            .brandId(p.getBrand() != null ? p.getBrand().getBrandId() : null)
            .brandName(p.getBrand() != null ? p.getBrand().getName() : null)
            .categoryId(p.getCategory() != null ? p.getCategory().getCategoryId() : null)
            .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
            .stock(p.getStock())
            .soldCount(p.getSoldCount())
            .averageRating(p.getAverageRating())
            .ratingCount(ratingCount)
            .available(p.getAvailable())
            .isActive(p.getIsActive())
            .viewedAt(rv.getViewedAt())
            .build();
    }
    
    /**
     * Cleanup old records để tránh database phình to
     * - Guest: Xóa records cũ hơn 30 ngày
     * - User: Giữ tối đa MAX_RECENTLY_VIEWED records (xóa các records cũ nhất)
     */
    @Transactional
    private void cleanupOldRecords(Long userId, String guestId) {
        try {
            if (userId != null) {
                // USER: Giữ tối đa MAX_RECENTLY_VIEWED records
                List<RecentlyViewed> allUserRecords = recentlyViewedRepository
                    .findByUserIdOrderByViewedAtDesc(userId, PageRequest.of(0, 1000));
                
                if (allUserRecords.size() > MAX_RECENTLY_VIEWED) {
                    // Xóa các records cũ nhất (giữ lại MAX_RECENTLY_VIEWED records mới nhất)
                    List<RecentlyViewed> toDelete = allUserRecords.subList(
                        MAX_RECENTLY_VIEWED, allUserRecords.size());
                    recentlyViewedRepository.deleteAll(toDelete);
                    log.debug("Cleaned up {} old user records for userId={}", 
                        toDelete.size(), userId);
                }
                
                // Xóa records cũ hơn USER_RETENTION_DAYS ngày
                LocalDateTime cutoffDate = LocalDateTime.now().minusDays(USER_RETENTION_DAYS);
                int deletedCount = recentlyViewedRepository.deleteOldRecords(cutoffDate);
                if (deletedCount > 0) {
                    log.debug("Deleted {} user records older than {} days", 
                        deletedCount, USER_RETENTION_DAYS);
                }
            } else {
                // GUEST: Xóa records cũ hơn GUEST_RETENTION_DAYS ngày
                LocalDateTime cutoffDate = LocalDateTime.now().minusDays(GUEST_RETENTION_DAYS);
                int deletedCount = recentlyViewedRepository.deleteOldRecords(cutoffDate);
                if (deletedCount > 0) {
                    log.debug("Deleted {} guest records older than {} days", 
                        deletedCount, GUEST_RETENTION_DAYS);
                }
            }
        } catch (Exception e) {
            log.warn("Error during cleanup old records: {}", e.getMessage());
            // Không throw exception để không ảnh hưởng đến flow chính
        }
    }
}

