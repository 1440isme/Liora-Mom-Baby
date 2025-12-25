package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Order;
import vn.liora.entity.OrderProduct;
import vn.liora.entity.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
@Repository
public interface OrderProductRepository extends JpaRepository<OrderProduct,Long> {
    List<OrderProduct> findByOrder(Order order);

    @Query("SELECT COUNT(op) FROM OrderProduct op WHERE op.order = :order")
    long countProductsByOrder(@Param("order") Order order);

    @Query("SELECT SUM(op.totalPrice) FROM OrderProduct op WHERE op.order = :order")
    BigDecimal getTotalPriceByOrder(@Param("order") Order order);

    // ======================== Doanh thu theo DANH MỤC ========================
    @Query("""
        SELECT c.name, SUM(op.totalPrice)
        FROM OrderProduct op
        JOIN op.order o
        JOIN op.product p
        JOIN p.category c
        WHERE o.orderDate BETWEEN :startDate AND :endDate
        GROUP BY c.name
        ORDER BY SUM(op.totalPrice) DESC
    """)
    List<Object[]> getRevenueByCategory(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // ========================  Doanh thu theo THƯƠNG HIỆU ========================
    @Query("""
        SELECT b.name, SUM(op.totalPrice)
        FROM OrderProduct op
        JOIN op.order o
        JOIN op.product p
        JOIN p.brand b
        WHERE o.orderDate BETWEEN :startDate AND :endDate
        GROUP BY b.name
        ORDER BY SUM(op.totalPrice) DESC
    """)
    List<Object[]> getRevenueByBrand(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // ======================== TOP SẢN PHẨM BÁN CHẠY THEO THỜI GIAN ========================
    @Query("""
        SELECT p.productId, p.name, c.name, SUM(op.quantity), SUM(op.totalPrice),
               COALESCE((SELECT AVG(CAST(r.rating AS DOUBLE))
                         FROM Review r
                         WHERE r.productId = p.productId
                           AND r.createdAt BETWEEN :startDate AND :endDate), 0.0)
        FROM OrderProduct op
        JOIN op.order o
        JOIN op.product p
        JOIN p.category c
        WHERE o.orderDate BETWEEN :startDate AND :endDate
          AND o.orderStatus = 'COMPLETED'
        GROUP BY p.productId, p.name, c.name
        ORDER BY SUM(op.quantity) DESC
    """)
    List<Object[]> getTopSellingProductsByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
    
    // ======================== ĐẾM SỐ SẢN PHẨM/BThương hiệu được BÁN ========================
    @Query("""
        SELECT COUNT(DISTINCT p.productId)
        FROM OrderProduct op
        JOIN op.order o
        JOIN op.product p
        WHERE o.orderDate BETWEEN :startDate AND :endDate
          AND o.orderStatus = 'COMPLETED'
    """)
    long countSoldProductsByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
    
    @Query("""
        SELECT COUNT(DISTINCT b.brandId)
        FROM OrderProduct op
        JOIN op.order o
        JOIN op.product p
        JOIN p.brand b
        WHERE o.orderDate BETWEEN :startDate AND :endDate
          AND o.orderStatus = 'COMPLETED'
    """)
    long countSoldBrandsByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
