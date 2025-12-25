package vn.liora.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import vn.liora.dto.request.CategoryCreationRequest;
import vn.liora.dto.request.CategoryUpdateRequest;
import vn.liora.dto.response.CategoryResponse;
import vn.liora.entity.Category;

import java.util.List;
import java.util.Optional;

public interface ICategoryService {
    // CRUD
    Category createCategory(CategoryCreationRequest request);

    CategoryResponse findById(Long id);

    CategoryResponse updateCategory(Long id, CategoryUpdateRequest request);

    void deleteById(Long id);

    // Tìm kiếm
    Optional<Category> findByIdOptional(Long id);

    List<Category> findAllById(Iterable<Long> ids);

    List<Category> findAll(Sort sort);

    Page<Category> findAll(Pageable pageable);

    List<Category> findAll();

    <S extends Category> S save(S entity);

    // Search
    List<Category> findByNameContaining(String name);

    Page<Category> findByNameContaining(String name, Pageable pageable);

    Optional<Category> findByName(String name);

    boolean existsByName(String name);

    // Phân tầng
    List<Category> findRootCategories();

    List<Category> findAllRootCategories(); // Lấy tất cả root categories (cả active và inactive)

    List<Category> findChildCategories(Long parentId);

    List<Category> findAllChildCategories();

    boolean hasChildren(Long categoryId);

    long count();

    // xóa mềm
    List<Category> findActiveCategories();

    List<Category> findInactiveCategories();

    List<Category> findActiveRootCategories();

    List<Category> findActiveChildCategories(Long parentId);

    void deactivateCategory(Long id);

    void activateCategory(Long id);

    // Cây danh mục
    List<CategoryResponse> getCategoryTree();
}
