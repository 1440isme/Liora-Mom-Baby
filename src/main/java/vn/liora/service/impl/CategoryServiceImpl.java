package vn.liora.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import vn.liora.dto.request.CategoryCreationRequest;
import vn.liora.dto.request.CategoryUpdateRequest;
import vn.liora.dto.response.CategoryResponse;
import vn.liora.entity.Category;
import vn.liora.entity.Product;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.CategoryMapper;
import vn.liora.repository.CategoryRepository;
import vn.liora.repository.ProductRepository;
import vn.liora.service.ICategoryService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryServiceImpl implements ICategoryService {
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CategoryMapper categoryMapper;

    @Override
    public Category createCategory(CategoryCreationRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.CATEGORY_EXISTED);
        }
        Category category = categoryMapper.toCategory(request);

        // Xử lý parentCategoryId
        if (request.getParentCategoryId() != null) {
            Category parentCategory = categoryRepository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            category.setParentCategory(parentCategory);
        }

        return categoryRepository.save(category);
    }

    @Override
    public CategoryResponse findById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        return categoryMapper.toCategoryResponse(category);
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryUpdateRequest request) {
        // 1. Tìm danh mục cần cập nhật
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // 2. Kiểm tra tên trùng lặp
        if (request.getName() != null && !request.getName().equalsIgnoreCase(category.getName())) {
            Optional<Category> existingCategory = categoryRepository.findByName(request.getName());
            if (existingCategory.isPresent() && !existingCategory.get().getCategoryId().equals(id)) {
                throw new AppException(ErrorCode.CATEGORY_EXISTED);
            }
        }

        // 3. Kiểm tra circular reference - danh mục không thể là cha của chính nó
        if (request.getParentCategoryId() != null && request.getParentCategoryId().equals(id)) {
            throw new AppException(ErrorCode.CATEGORY_CIRCULAR_REFERENCE);
        }

        // 4. Kiểm tra circular reference - danh mục không thể là cha của danh mục cha
        // của nó
        if (request.getParentCategoryId() != null) {
            Category parentCategory = categoryRepository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

            // Kiểm tra nếu danh mục cha có parent là danh mục hiện tại (tạo vòng lặp)
            if (isCircularReference(category, parentCategory)) {
                throw new AppException(ErrorCode.CATEGORY_CIRCULAR_REFERENCE);
            }
        }

        // 5. Cập nhật thông tin từ mapper
        categoryMapper.updateCategory(category, request);

        // 6. Xử lý parentCategoryId - LOGIC ĐÃ SỬA
        if (request.getParentCategoryId() != null) {
            // Có parentCategoryId → gán parent
            Category parentCategory = categoryRepository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            category.setParentCategory(parentCategory);
        } else {
            // parentCategoryId = null → xóa parent (bất kể có name hay không)
            category.setParentCategory(null);
        }

        // 7. Lưu vào database
        categoryRepository.save(category);

        return categoryMapper.toCategoryResponse(category);
    }

    // Helper method để kiểm tra circular reference
    private boolean isCircularReference(Category category, Category potentialParent) {
        Category current = potentialParent;
        while (current != null) {
            if (current.getCategoryId().equals(category.getCategoryId())) {
                return true;
            }
            current = current.getParentCategory();
        }
        return false;
    }

    @Override
    public void deleteById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        
        // Kiểm tra xem danh mục có sản phẩm nào đang sử dụng không
        if (productRepository.countByCategory(id) > 0) {
            throw new AppException(ErrorCode.CATEGORY_HAS_PRODUCTS);
        }
        
        categoryRepository.deleteById(id);
    }

    @Override
    public Optional<Category> findByIdOptional(Long id) {
        return categoryRepository.findById(id);
    }

    @Override
    public List<Category> findAllById(Iterable<Long> ids) {
        return categoryRepository.findAllById(ids);
    }

    @Override
    public List<Category> findAll(Sort sort) {
        return categoryRepository.findAll(sort);
    }

    @Override
    public Page<Category> findAll(Pageable pageable) {
        return categoryRepository.findAll(pageable);
    }

    @Override
    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    @Override
    public <S extends Category> S save(S entity) {
        return categoryRepository.save(entity);
    }

    @Override
    public List<Category> findByNameContaining(String name) {
        return categoryRepository.findByNameContaining(name);
    }

    @Override
    public Page<Category> findByNameContaining(String name, Pageable pageable) {
        return categoryRepository.findByNameContaining(name, pageable);
    }

    @Override
    public Optional<Category> findByName(String name) {
        return categoryRepository.findByName(name);
    }

    @Override
    public boolean existsByName(String name) {
        return categoryRepository.existsByName(name);
    }

    @Override
    public List<Category> findRootCategories() {
        return categoryRepository.findRootCategories();
    }

    @Override
    public List<Category> findAllRootCategories() {
        return categoryRepository.findRootCategories(); // Lấy tất cả root categories (cả active và inactive)
    }

    @Override
    public List<Category> findChildCategories(Long parentId) {
        return categoryRepository.findChildCategories(parentId);
    }

    @Override
    public List<Category> findAllChildCategories() {
        return categoryRepository.findByParentCategoryNotNull();
    }

    @Override
    public boolean hasChildren(Long categoryId) {
        return categoryRepository.hasChildren(categoryId);
    }

    @Override
    public long count() {
        return categoryRepository.count();
    }

    @Override
    public List<Category> findActiveCategories() {
        System.out.println("=== DEBUG: findActiveCategories called ===");
        List<Category> allCategories = categoryRepository.findAll();
        System.out.println("Total categories: " + allCategories.size());
        allCategories
                .forEach(cat -> System.out.println("Category: " + cat.getName() + " - isActive: " + cat.getIsActive()));

        List<Category> activeCategories = categoryRepository.findByIsActiveTrue();
        System.out.println("Active categories: " + activeCategories.size());
        activeCategories.forEach(cat -> System.out.println("Active Category: " + cat.getName()));

        return activeCategories;
    }

    @Override
    public List<Category> findInactiveCategories() {
        return categoryRepository.findByIsActiveFalse();
    }

    @Override
    public List<Category> findActiveRootCategories() {
        return categoryRepository.findActiveRootCategories();
    }

    @Override
    public List<Category> findActiveChildCategories(Long parentId) {
        return categoryRepository.findActiveChildCategoriesByParentId(parentId);
    }

    @Override
    public void deactivateCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // Lưu thông tin parent trước khi deactivate (có thể sử dụng sau này)
        // Category parentCategory = category.getParentCategory();

        category.setIsActive(false);
        categoryRepository.save(category);

        // Cascade deactivate all children
        List<Category> children = categoryRepository.findChildCategories(id);
        for (Category child : children) {
            deactivateCategory(child.getCategoryId()); // Recursive deactivate
        }

        List<Product> products = productRepository.findByCategoryCategoryId(id);
        for (Product product : products) {
            product.setIsActive(false);
            product.setUpdatedDate(LocalDateTime.now());
            productRepository.save(product);
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void activateCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // Kiểm tra nếu có parent và parent bị deactivate thì không thể activate
        if (category.getParentCategory() != null && !category.getParentCategory().getIsActive()) {
            throw new AppException(ErrorCode.CATEGORY_PARENT_INACTIVE);
        }

        // Chỉ activate nếu parent category còn tồn tại và active
        if (category.getParentCategory() != null) {
            Category parentCategory = categoryRepository.findById(category.getParentCategory().getCategoryId())
                    .orElse(null);
            if (parentCategory == null || !parentCategory.getIsActive()) {
                throw new AppException(ErrorCode.CATEGORY_PARENT_INACTIVE);
            }
        }

        category.setIsActive(true);
        categoryRepository.save(category);

        // Cascade activate all children
        List<Category> children = categoryRepository.findChildCategories(id);
        for (Category child : children) {
            activateCategory(child.getCategoryId()); // Recursive activate
        }

        // Chỉ activate products khi cả brand và category đều active
        List<Product> products = productRepository.findByCategoryCategoryId(id);
        for (Product product : products) {
            // Kiểm tra brand có active không
            if (product.getBrand() != null 
                    && product.getBrand().getIsActive() != null 
                    && product.getBrand().getIsActive()) {
                product.setIsActive(true);
                product.setUpdatedDate(LocalDateTime.now());
                productRepository.save(product);
            }
        }
    }

    @Override
    public List<CategoryResponse> getCategoryTree() {
        List<Category> rootCategories = categoryRepository.findActiveRootCategories();
        return rootCategories.stream()
                .map(this::buildCategoryTree)
                .toList();
    }

    private CategoryResponse buildCategoryTree(Category category) {
        CategoryResponse response = categoryMapper.toCategoryResponse(category);

        // Lấy danh mục con active
        List<Category> children = categoryRepository.findActiveChildCategoriesByParentId(category.getCategoryId());
        if (!children.isEmpty()) {
            List<CategoryResponse> childResponses = children.stream()
                    .map(this::buildCategoryTree)
                    .toList();
            response.setChildren(childResponses);
        }

        return response;
    }

    // Thêm method mới để khôi phục parent category (có thể sử dụng sau này)
    // private void restoreParentCategory(Category category) {
    // if (category.getParentCategory() != null) {
    // // Kiểm tra parent category còn tồn tại không
    // Category parentCategory =
    // categoryRepository.findById(category.getParentCategory().getCategoryId())
    // .orElse(null);
    // if (parentCategory == null || !parentCategory.getIsActive()) {
    // // Nếu parent không tồn tại hoặc inactive, xóa parent
    // category.setParentCategory(null);
    // categoryRepository.save(category);
    // }
    // }
    // }
}
