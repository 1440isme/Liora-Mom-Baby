package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import org.mapstruct.NullValuePropertyMappingStrategy;
import vn.liora.dto.request.BrandCreationRequest;
import vn.liora.dto.request.BrandUpdateRequest;
import vn.liora.dto.response.BrandResponse;
import vn.liora.entity.Brand;

@Mapper(componentModel = "spring")
public interface BrandMapper {
    @Mapping(target = "brandId", ignore = true)
    @Mapping(target = "products", ignore = true)
    Brand toBrand(BrandCreationRequest request); // chuyển dữ liệu client -> entity lưu vào db
    
    BrandResponse toBrandResponse(Brand brand); // chuyển entity -> response trả client
    @Mapping(target = "brandId", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "name", source = "name", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "logoUrl", source = "logoUrl", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "isActive", source = "isActive", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateBrand(@MappingTarget Brand brand, BrandUpdateRequest request); // update trực tiếp vào entity
}
