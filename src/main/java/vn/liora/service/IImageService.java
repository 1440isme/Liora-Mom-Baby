package vn.liora.service;

import vn.liora.entity.Image;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface IImageService {
    
    // ========== BASIC CRUD ==========
    Image createImage(Image image);
    Image findById(Long imageId);
    Image updateImage(Image image);
    void deleteById(Long imageId);
    void deleteByProductId(Long productId);
    
    // ========== FIND BY PRODUCT ==========
    List<Image> findByProductId(Long productId);
    List<Image> findByProductIdOrderByDisplayOrder(Long productId);
    Optional<Image> findMainImageByProductId(Long productId);
    List<Image> findAdditionalImagesByProductId(Long productId);
    
    // ========== UPLOAD METHODS ==========
    Image uploadProductImage(Long productId, MultipartFile file, boolean isMain, Integer displayOrder);
    List<Image> uploadMultipleProductImages(Long productId, MultipartFile[] files);
    
    // ========== IMAGE MANAGEMENT ==========
    void setMainImage(Long productId, Long imageId);
    void updateImageOrder(Long imageId, Integer newOrder);
    void deleteImage(Long imageId);
    
    // ========== VALIDATION ==========
    boolean isValidImageFile(MultipartFile file);
    boolean canUploadMoreImages(Long productId, int currentCount);
    
    // ========== STATISTICS ==========
    Long countByProductId(Long productId);
    Long countMainImagesByProductId(Long productId);
}