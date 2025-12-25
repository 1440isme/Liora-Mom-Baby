package vn.liora.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import vn.liora.dto.request.BrandCreationRequest;
import vn.liora.dto.request.BrandUpdateRequest;
import vn.liora.dto.response.BrandResponse;
import vn.liora.entity.Brand;

public interface IBrandService {
    void deleteAll();
    void delete(Brand brand);
    void deleteById(Long id);
    long count();

    public Brand createBrand(BrandCreationRequest request);
    BrandResponse findById(Long id);
    BrandResponse updateBrand(Long id, BrandUpdateRequest request);
    Optional<Brand> findByIdOptional(Long id);
    List<Brand> findAllById(Iterable<Long> ids);
    List<Brand> findAll(Sort sort);
    Page<Brand> findAll(Pageable pageable);
    List<Brand> findAll();
    <S extends Brand> S save(S entity);

    List<Brand> findByNameContaining(String name);
    Page<Brand> findByNameContaining(String name, Pageable pageable);
    Optional<Brand> findByName(String name);
    // Thực hiện các chức năng xóa mềm
    List<Brand> findActiveBrands();
    Page<Brand> findActiveBrands(Pageable pageable);
    Page<Brand> findInactiveBrands(Pageable pageable);
    void deactivateBrand(Long id);
    void activateBrand(Long id);
}
