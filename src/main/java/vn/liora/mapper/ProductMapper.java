package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import vn.liora.dto.request.ProductCreationRequest;
import vn.liora.dto.request.ProductUpdateRequest;
import vn.liora.dto.response.ProductResponse;
import vn.liora.entity.Product;
import vn.liora.entity.Image;

@Mapper(componentModel = "spring")
public interface ProductMapper {
    // ========== CREATION MAPPING ==========
    @Mapping(target = "productId", ignore = true)
    @Mapping(target = "brand", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "soldCount", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    @Mapping(target = "averageRating", ignore = true)
    @Mapping(target = "ratingCount", ignore = true)
    Product toProduct(ProductCreationRequest request);

    // ========== RESPONSE MAPPING ==========
    @Mapping(target = "brandId", source = "brand.brandId")
    @Mapping(target = "brandName", source = "brand.name")
    @Mapping(target = "categoryId", source = "category.categoryId")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "mainImageUrl", source = "images", qualifiedByName = "getMainImageUrl")
    @Mapping(target = "imageUrls", source = "images", qualifiedByName = "getAllImageUrls")
    ProductResponse toProductResponse(Product product);
    
    @org.mapstruct.Named("getMainImageUrl")
    default String getMainImageUrl(java.util.List<Image> images) {
        if (images == null || images.isEmpty()) {
            return null;
        }
        return images.stream()
                .filter(image -> image.getIsMain() != null && image.getIsMain())
                .findFirst()
                .map(Image::getImageUrl)
                .orElse(images.get(0).getImageUrl());
    }
    
    @org.mapstruct.Named("getAllImageUrls")
    default java.util.List<String> getAllImageUrls(java.util.List<Image> images) {
        if (images == null || images.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return images.stream()
                .map(Image::getImageUrl)
                .collect(java.util.stream.Collectors.toList());
    }

    // ========== UPDATE MAPPING ==========
    @Mapping(target = "name", source = "name", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "description", source = "description", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "price", source = "price", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "stock", source = "stock", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "available", source = "available", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "isActive", source = "isActive", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "brand", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "soldCount", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    @Mapping(target = "averageRating", ignore = true)
    @Mapping(target = "ratingCount", ignore = true)
    void updateProduct(@MappingTarget Product product, ProductUpdateRequest request);

}
