package vn.liora.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.liora.entity.Brand;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {
    List<Brand> findByNameContaining(String name);
    Page<Brand> findByNameContaining(String name, Pageable pageable);
    Optional<Brand> findByName(String name);
    boolean existsByName(String name);
    List<Brand> findByIsActiveTrue();
    Page<Brand> findByIsActiveTrue(Pageable pageable);
    Page<Brand> findByIsActiveFalse(Pageable pageable);
    boolean existsByNameAndIsActiveTrue(String name);
}
