package vn.liora.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.dto.response.TopCustomerResponse;
import vn.liora.entity.Order;
import vn.liora.entity.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);

    List<Order> findByOrderStatus(String orderStatus);

    List<Order> findByUserAndOrderStatus(User user, String orderStatus);

    List<Order> findByOrderDateBetween(LocalDateTime start, LocalDateTime end);
    
    List<Order> findByOrderDateBetweenAndOrderStatus(LocalDateTime start, LocalDateTime end, String orderStatus);

    long countByUser(User user);

    List<Order> findByUserOrderByOrderDateDesc(User user);

    List<Order> findByOrderByOrderDateDesc();

    List<Order> findAllByOrderByIdOrderDesc();

    @Query("SELECT SUM(o.total) FROM Order o")
    BigDecimal getTotalRevenue();

    @Query("SELECT SUM(o.total) FROM Order o WHERE o.user = :user")
    BigDecimal getTotalRevenueByUser(@Param("user") User user);

    @Query("SELECT SUM(o.total) FROM Order o WHERE o.user = :user AND o.orderStatus = 'COMPLETED'")
    BigDecimal getTotalRevenueByUserCompleted(@Param("user") User user);


    // Tổng doanh thu của đơn hàng đã hoàn thành
    @Query("SELECT SUM(o.total) FROM Order o WHERE o.orderStatus = 'COMPLETED'")
    BigDecimal getTotalRevenueCompleted();

    // Tổng doanh thu trong ngày
    @Query("SELECT SUM(o.total) FROM Order o WHERE o.orderDate >= :start AND o.orderStatus = 'COMPLETED' ")
    BigDecimal getRevenueByDate(@Param("start") LocalDateTime start);

    // Doanh thu theo sản phẩm
    @Query("""
    SELECT COALESCE(SUM(op.totalPrice), 0)
    FROM OrderProduct op
    JOIN op.order o
    WHERE op.product.productId = :productId
      AND o.orderStatus = 'COMPLETED'
""")
    BigDecimal getRevenueByProductId(@Param("productId") Long productId);

    // ======================== Doanh thu theo NGÀY ========================
    @Query("""
        SELECT CAST(o.orderDate AS date), SUM(o.total)
        FROM Order o
        WHERE o.orderDate BETWEEN :startDate AND :endDate
          AND o.orderStatus = 'COMPLETED'
        GROUP BY CAST(o.orderDate AS date)
        ORDER BY CAST(o.orderDate AS date)
    """)
    List<Object[]> getRevenueByDay(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // ======================== Doanh thu theo THÁNG ========================
    @Query("""
        SELECT MONTH(o.orderDate), SUM(o.total)
        FROM Order o
        WHERE o.orderDate BETWEEN :startDate AND :endDate
          AND o.orderStatus = 'COMPLETED'
        GROUP BY MONTH(o.orderDate)
        ORDER BY MONTH(o.orderDate)
    """)
    List<Object[]> getRevenueByMonth(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // ========================  Doanh thu theo NĂM ========================
    @Query("""
        SELECT YEAR(o.orderDate), SUM(o.total)
        FROM Order o
        WHERE o.orderDate BETWEEN :startDate AND :endDate
          AND o.orderStatus = 'COMPLETED'
        GROUP BY YEAR(o.orderDate)
        ORDER BY YEAR(o.orderDate)
    """)
    List<Object[]> getRevenueByYear(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
    SELECT COUNT(DISTINCT u)
    FROM User u
    JOIN u.roles r
    WHERE r.name = 'USER'
      AND (SELECT COUNT(o) FROM Order o WHERE o.user = u) > 1
    """)
    long countReturningCustomers();
    
    @Query("""
    SELECT COUNT(DISTINCT o.user)
    FROM Order o
    WHERE o.orderStatus = 'COMPLETED'
      AND o.user IS NOT NULL
    """)
    long countCustomersWithCompletedOrders();


    @Query("""
        SELECT new vn.liora.dto.response.TopCustomerResponse(
            u.userId,
            COALESCE(CONCAT(u.firstname, ' ', u.lastname), u.username, ''),
            COALESCE(u.email, 'N/A'),
            COUNT(o.idOrder),
            SUM(o.total)
        )
        FROM Order o
        JOIN o.user u
        WHERE u.active = true
          AND o.orderStatus = 'COMPLETED'
        GROUP BY u.userId, u.firstname, u.lastname, u.email, u.username
        ORDER BY SUM(o.total) DESC
        """)
    List<TopCustomerResponse> findTopSpenders(Pageable pageable);
    
    // ======================== DISCOUNT USAGE TRACKING ========================
    // Đếm tất cả orders trừ CANCELLED (PENDING được đếm để user không thể đặt 2 đơn PENDING cùng mã)
    @Query("SELECT COUNT(o) FROM Order o WHERE o.user.userId = :userId AND o.discount.discountId = :discountId AND o.orderStatus != 'CANCELLED'")
    Long countOrdersByUserAndDiscount(@Param("userId") Long userId, @Param("discountId") Long discountId);
}
