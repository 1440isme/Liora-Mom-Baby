package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.liora.entity.MomoPayment;

import java.util.Optional;

@Repository
public interface MomoPaymentRepository extends JpaRepository<MomoPayment, Long> {

    /**
     * Tìm payment theo orderId (MOMO orderId)
     */
    Optional<MomoPayment> findByOrderId(String orderId);

    /**
     * Tìm payment theo requestId
     */
    Optional<MomoPayment> findByRequestId(String requestId);

    /**
     * Tìm payment theo IdOrder (foreign key)
     */
    Optional<MomoPayment> findByIdOrder(Long idOrder);

    /**
     * Kiểm tra xem orderId đã tồn tại chưa
     */
    boolean existsByOrderId(String orderId);

    /**
     * Kiểm tra xem requestId đã tồn tại chưa
     */
    boolean existsByRequestId(String requestId);
}
