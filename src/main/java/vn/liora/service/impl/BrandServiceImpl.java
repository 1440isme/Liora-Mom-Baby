package vn.liora.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import vn.liora.dto.request.BrandCreationRequest;
import vn.liora.dto.request.BrandUpdateRequest;
import vn.liora.dto.response.BrandResponse;
import vn.liora.entity.Brand;
import vn.liora.entity.Product;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.BrandMapper;
import vn.liora.repository.BrandRepository;

import vn.liora.repository.ProductRepository;
import vn.liora.service.IBrandService;

@Service
public class BrandServiceImpl implements IBrandService {
    @Autowired
    private BrandRepository brandRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private BrandMapper brandMapper;
    @Override
    public void deleteAll() {
        brandRepository.deleteAll();
    }

    @Override
    public void delete(Brand brand) {
        brandRepository.delete(brand);
    }

    @Override
    public void deleteById(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));
        
        // Kiểm tra xem thương hiệu có sản phẩm nào đang sử dụng không
        if (productRepository.countByBrand(id) > 0) {
            throw new AppException(ErrorCode.BRAND_HAS_PRODUCTS);
        }
        
        brandRepository.deleteById(id);
    }

    @Override
    public long count() {
        return brandRepository.count();
    }

    @Override
    public Brand createBrand(BrandCreationRequest request) {
        if (brandRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.BRAND_EXISTED);
        }
        Brand brand = brandMapper.toBrand(request);
        return brandRepository.save(brand);
    }

    @Override
    public BrandResponse findById(Long id) {
        Brand brand = brandRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));
        return brandMapper.toBrandResponse(brand);
    }

    @Override
    public BrandResponse updateBrand(Long id, BrandUpdateRequest request) {
        Brand brand = brandRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));

        if (request.getName() != null && !request.getName().equalsIgnoreCase(brand.getName())
            && brandRepository.existsByName(request.getName())) {
                throw new AppException(ErrorCode.BRAND_EXISTED);
        }

        brandMapper.updateBrand(brand, request);
        brandRepository.save(brand);
        return brandMapper.toBrandResponse(brand);
    }

    @Override
    public Optional<Brand> findByIdOptional(Long id) {
        return brandRepository.findById(id);
    }

    @Override
    public List<Brand> findAllById(Iterable<Long> ids) {
        return brandRepository.findAllById(ids);
    }

    @Override
    public List<Brand> findAll(Sort sort) {
        return brandRepository.findAll(sort);
    }

    @Override
    public Page<Brand> findAll(Pageable pageable) {
        return brandRepository.findAll(pageable);
    }

    @Override
    public List<Brand> findAll() {
        return brandRepository.findAll();
    }

    @Override
    public <S extends Brand> S save(S entity) {
        return brandRepository.save(entity);
    }

    @Override
    public List<Brand> findByNameContaining(String name) {
        return brandRepository.findByNameContaining(name);
    }

    @Override
    public Page<Brand> findByNameContaining(String name, Pageable pageable) {
        return brandRepository.findByNameContaining(name, pageable);
    }

    @Override
    public Optional<Brand> findByName(String name) {
        return brandRepository.findByName(name);
    }

    @Override
    public List<Brand> findActiveBrands() {
        return brandRepository.findByIsActiveTrue();
    }

    @Override
    public Page<Brand> findActiveBrands(Pageable pageable) {
        return brandRepository.findByIsActiveTrue(pageable);
    }

    @Override
    public Page<Brand> findInactiveBrands(Pageable pageable) {
        return brandRepository.findByIsActiveFalse(pageable);
    }

    @Override
    public void deactivateBrand(Long id) {
        Brand brand = brandRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));
        brand.setIsActive(false);
        brandRepository.save(brand);

        List<Product> products = productRepository.findByBrandBrandId(id);
        for (Product product : products) {
            product.setIsActive(false);
            product.setUpdatedDate(LocalDateTime.now());
            productRepository.save(product);
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void activateBrand(Long id) {
        Brand brand = brandRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));
        brand.setIsActive(true);
        brandRepository.save(brand);

        // Chỉ activate products khi cả brand và category đều active
        List<Product> products = productRepository.findByBrandBrandId(id);
        for (Product product : products) {
            // Kiểm tra category có active không
            if (product.getCategory() != null 
                    && product.getCategory().getIsActive() != null 
                    && product.getCategory().getIsActive()) {
                product.setIsActive(true);
                product.setUpdatedDate(LocalDateTime.now());
                productRepository.save(product);
            }
        }
    }
}
