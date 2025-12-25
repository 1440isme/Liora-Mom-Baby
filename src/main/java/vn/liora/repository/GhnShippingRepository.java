package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.liora.entity.GhnShipping;

import java.util.Optional;

@Repository
public interface GhnShippingRepository extends JpaRepository<GhnShipping, Long> {
    Optional<GhnShipping> findByGhnOrderCode(String ghnOrderCode);

    Optional<GhnShipping> findByIdOrder(Long idOrder);
}
