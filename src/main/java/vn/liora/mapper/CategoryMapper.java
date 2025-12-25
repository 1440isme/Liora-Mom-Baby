package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import vn.liora.dto.request.CategoryCreationRequest;
import vn.liora.dto.request.CategoryUpdateRequest;
import vn.liora.dto.response.CategoryResponse;
import vn.liora.entity.Category;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    @Mapping(target = "parentCategory", ignore = true)
    Category toCategory(CategoryCreationRequest request);
    
    @Mapping(target = "parentCategoryId", source = "parentCategory.categoryId", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "children", ignore = true)
    CategoryResponse toCategoryResponse(Category category);
    
    @Mapping(target = "name", source = "name", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "isParent", source = "isParent", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "isActive", source = "isActive", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "parentCategory", ignore = true)
    void updateCategory(@MappingTarget Category category, CategoryUpdateRequest request);
}
