package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.liora.entity.VnpayPayment;

import java.util.Optional;

@Repository
public interface VnpayPaymentRepository extends JpaRepository<VnpayPayment, Long> {
    Optional<VnpayPayment> findByVnpTxnRef(String vnpTxnRef);

    Optional<VnpayPayment> findByIdOrder(Long idOrder);
}
