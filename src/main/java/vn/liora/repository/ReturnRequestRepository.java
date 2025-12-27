package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.ReturnRequest;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    // Tìm tất cả return requests
    List<ReturnRequest> findAllByOrderByCreatedDateDesc();

    // Tìm theo status
    List<ReturnRequest> findByStatusOrderByCreatedDateDesc(String status);

    // Tìm theo order ID
    List<ReturnRequest> findByOrder_IdOrderOrderByCreatedDateDesc(Long orderId);

    // Tìm trong khoảng thời gian
    @Query("SELECT r FROM ReturnRequest r WHERE r.createdDate BETWEEN :startDate AND :endDate ORDER BY r.createdDate DESC")
    List<ReturnRequest> findByDateRange(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Tìm theo status và khoảng thời gian
    @Query("SELECT r FROM ReturnRequest r WHERE r.status = :status AND r.createdDate BETWEEN :startDate AND :endDate ORDER BY r.createdDate DESC")
    List<ReturnRequest> findByStatusAndDateRange(@Param("status") String status,
            @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Đếm số lượng theo status
    long countByStatus(String status);

    // Kiểm tra xem order đã có return request chưa
    boolean existsByOrder_IdOrder(Long orderId);

    // Lấy return request mới nhất của một order
    ReturnRequest findFirstByOrder_IdOrderOrderByCreatedDateDesc(Long orderId);
}
