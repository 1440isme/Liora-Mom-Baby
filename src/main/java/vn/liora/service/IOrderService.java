package vn.liora.service;

import vn.liora.dto.request.OrderCreationRequest;
import vn.liora.dto.request.OrderUpdateRequest;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.dto.response.OrderResponse;
import vn.liora.dto.response.TopCustomerResponse;
import vn.liora.entity.Order;
import vn.liora.entity.User;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface IOrderService {
    OrderResponse createOrder(Long idCart, OrderCreationRequest request);
    OrderResponse updateOrderStatus(Long idOrder, OrderUpdateRequest request);
    OrderResponse getOrderById(Long idOrder);
    List<OrderResponse> getMyOrders(Long userId);
    List<OrderResponse> getMyOrdersPaginated(Long userId, int page, int size);
    Long countMyOrders(Long userId);
    List<OrderResponse> getAllOrders();
    List<OrderResponse> getOrdersByOrderStatus(String orderStatus);
    List<OrderResponse> getOrdersByDateRange(LocalDateTime start, LocalDateTime end);
    List<OrderProductResponse> getProductsByOrderId(Long idOrder);
    Long countByUser(User user);
    Long count();
    BigDecimal getTotalRevenue();
    BigDecimal getTotalRevenueByUser(User user);
    BigDecimal getTotalRevenueByUserCompleted(User user);
    void applyDiscountToOrder(Long orderId, Long discountId);
    void removeDiscountFromOrder(Long orderId, Long discountId);
    void cancelOrderByUser(Long orderId, Long userId);

    BigDecimal getRevenueByDate(LocalDate now);
    BigDecimal getTotalRevenueCompleted();

    List<Order> getRecentOrders(int limit);

    // doanh thu theo sản phẩm
    BigDecimal getRevenueByProductId(Long productId);

    List<Object[]> getRevenueByDay(LocalDateTime startDate, LocalDateTime endDate);
    List<Object[]> getRevenueByMonth(LocalDateTime startDate, LocalDateTime endDate);
    List<Object[]> getRevenueByYear(LocalDateTime startDate, LocalDateTime endDate);

    long countReturningCustomers();
    long countCustomersWithCompletedOrders();
    List<TopCustomerResponse> getTopSpenders(int limit);
}
