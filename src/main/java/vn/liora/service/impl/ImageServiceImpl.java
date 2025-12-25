package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.liora.entity.Image;
import vn.liora.entity.Product;
import vn.liora.repository.ImageRepository;
import vn.liora.repository.ProductRepository;
import vn.liora.service.IImageService;
import vn.liora.service.IStorageService;
import vn.liora.service.IDirectoryStructureService;
import vn.liora.service.IImageOptimizationService;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ImageServiceImpl implements IImageService {

    private final ImageRepository imageRepository;
    private final ProductRepository productRepository;
    private final IStorageService storageService;
    private final IDirectoryStructureService directoryStructureService;
    private final IImageOptimizationService imageOptimizationService;

    // Constants
    private static final int MAX_WIDTH = 1200;
    private static final int MAX_HEIGHT = 1200;
    private static final float QUALITY = 0.8f;
    private static final int THUMBNAIL_SIZE = 300;
    private static final int MAX_IMAGES_PER_PRODUCT = 10;

    @Override
    public Image createImage(Image image) {
        return imageRepository.save(image);
    }

    @Override
    public Image findById(Long imageId) {
        return imageRepository.findById(imageId)
                .orElseThrow(() -> new AppException(ErrorCode.IMAGE_NOT_FOUND));
    }

    @Override
    public Image updateImage(Image image) {
        return imageRepository.save(image);
    }

    @Override
    public void deleteById(Long imageId) {
        Image image = findById(imageId);
        imageRepository.delete(image);
    }

    @Override
    @Transactional
    public void deleteByProductId(Long productId) {
        imageRepository.deleteByProductId(productId);
    }

    @Override
    public List<Image> findByProductId(Long productId) {
        return imageRepository.findByProductProductId(productId);
    }

    @Override
    public List<Image> findByProductIdOrderByDisplayOrder(Long productId) {
        return imageRepository.findByProductProductIdOrderByDisplayOrder(productId);
    }

    @Override
    public Optional<Image> findMainImageByProductId(Long productId) {
        return imageRepository.findByProductProductIdAndIsMainTrue(productId);
    }

    @Override
    public List<Image> findAdditionalImagesByProductId(Long productId) {
        return imageRepository.findByProductProductIdAndIsMainFalse(productId);
    }

    @Override
    @Transactional
    public Image uploadProductImage(Long productId, MultipartFile file, boolean isMain, Integer displayOrder) {
        // Validate
        if (!isValidImageFile(file)) {
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // Check if can upload more images
        if (!canUploadMoreImages(productId, 1)) {
            throw new AppException(ErrorCode.TOO_MANY_IMAGES);
        }

        try {
            // Generate unique filename
            String filename = generateUniqueFilename(file.getOriginalFilename());
            String relativePath = directoryStructureService.createFullPath("products", filename, false);
            String thumbnailPath = directoryStructureService.createFullPath("products", filename, true);

            // Optimize main image
            Path mainImagePath = Paths.get(storageService.getStorageLocation(), relativePath);
            imageOptimizationService.optimizeImage(file, mainImagePath, MAX_WIDTH, MAX_HEIGHT, QUALITY);

            // Create thumbnail
            Path thumbnailImagePath = Paths.get(storageService.getStorageLocation(), thumbnailPath);
            Files.createDirectories(thumbnailImagePath.getParent());
            imageOptimizationService.createThumbnail(file, thumbnailImagePath, THUMBNAIL_SIZE);

            // Create Image entity
            Image image = new Image();
            image.setImageUrl("/uploads/" + relativePath);
            image.setProduct(product);
            image.setIsMain(isMain);
            image.setDisplayOrder(displayOrder != null ? displayOrder : 0);

            return imageRepository.save(image);

        } catch (IOException e) {
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }

    @Override
    @Transactional
    public List<Image> uploadMultipleProductImages(Long productId, MultipartFile[] files) {
        List<Image> uploadedImages = new ArrayList<>();
        
        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            if (!file.isEmpty() && isValidImageFile(file)) {
                boolean isMain = (i == 0); // First image is main
                Image image = uploadProductImage(productId, file, isMain, i);
                uploadedImages.add(image);
            }
        }
        
        return uploadedImages;
    }

    @Override
    @Transactional
    public void setMainImage(Long productId, Long imageId) {
        // Set all images of this product to not main
        List<Image> productImages = findByProductId(productId);
        for (Image img : productImages) {
            img.setIsMain(false);
            imageRepository.save(img);
        }

        // Set the selected image as main
        Image image = findById(imageId);
        if (!image.getProduct().getProductId().equals(productId)) {
            throw new AppException(ErrorCode.IMAGE_NOT_BELONG_TO_PRODUCT);
        }
        image.setIsMain(true);
        imageRepository.save(image);
    }

    @Override
    public void updateImageOrder(Long imageId, Integer newOrder) {
        Image image = findById(imageId);
        image.setDisplayOrder(newOrder);
        imageRepository.save(image);
    }

    @Override
    public void deleteImage(Long imageId) {
        Image image = findById(imageId);
        imageRepository.delete(image);
    }

    @Override
    public boolean isValidImageFile(MultipartFile file) {
        return imageOptimizationService.isValidImageFile(file);
    }

    @Override
    public boolean canUploadMoreImages(Long productId, int currentCount) {
        Long existingCount = countByProductId(productId);
        return (existingCount + currentCount) <= MAX_IMAGES_PER_PRODUCT;
    }

    @Override
    public Long countByProductId(Long productId) {
        return imageRepository.countByProductProductId(productId);
    }

    @Override
    public Long countMainImagesByProductId(Long productId) {
        return imageRepository.countByProductProductIdAndIsMainTrue(productId);
    }

    private String generateUniqueFilename(String originalFilename) {
        return System.currentTimeMillis() + "_" + originalFilename;
    }
}