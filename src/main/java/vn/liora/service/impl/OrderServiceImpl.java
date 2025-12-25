package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
// removed unused imports

import java.time.LocalDate;
import java.util.ArrayList;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.OrderCreationRequest;
import vn.liora.dto.request.OrderUpdateRequest;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.dto.response.OrderResponse;
import vn.liora.dto.response.TopCustomerResponse;
import vn.liora.entity.*;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.OrderMapper;
import vn.liora.mapper.OrderProductMapper;
import vn.liora.repository.*;
import vn.liora.service.IImageService;
import vn.liora.service.IOrderService;
import vn.liora.service.IProductService;
import vn.liora.service.IGhnShippingService;
import vn.liora.service.EmailService;
import vn.liora.entity.Discount;
import vn.liora.repository.DiscountRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderServiceImpl implements IOrderService {

    OrderRepository orderRepository;
    UserRepository userRepository;
    CartRepository cartRepository;
    @SuppressWarnings("unused")
    AddressRepository addressRepository;
    OrderProductRepository orderProductRepository;
    OrderProductMapper orderProductMapper;
    CartProductRepository cartProductRepository;
    OrderMapper orderMapper;
    IImageService imageService;
    IProductService productService;
    IGhnShippingService ghnShippingService;
    EmailService emailService;
    GhnShippingRepository ghnShippingRepository;

    @Override
    @Transactional
    public OrderResponse createOrder(Long idCart, OrderCreationRequest request) {
        try {
            Cart cart = cartRepository.findById(idCart)
                    .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
            User user = cart.getUser();
            List<CartProduct> selected = cartProductRepository.findByCartAndChooseTrue(cart);
            if (selected.isEmpty()) {
                throw new AppException(ErrorCode.NO_SELECTED_PRODUCT);
            }

            // ✅ Lọc chỉ lấy sản phẩm hợp lệ (available=true, isActive=true, stock đủ)
            List<CartProduct> validProducts = selected.stream()
                    .filter(cp -> {
                        Product product = cp.getProduct();
                        return product != null
                                && Boolean.TRUE.equals(product.getAvailable())
                                && Boolean.TRUE.equals(product.getIsActive())
                                && product.getStock() != null && cp.getQuantity() <= product.getStock();
                    })
                    .collect(Collectors.toList());

            if (validProducts.isEmpty()) {
                throw new AppException(ErrorCode.NO_VALID_PRODUCT);
            }

            Order order = orderMapper.toOrder(request);
            order.setUser(user); // user có thể null khi guest; các thao tác phía dưới phải null-safe
            order.setOrderDate(LocalDateTime.now());
            order.setOrderStatus("PENDING");
            order.setPaymentStatus("PENDING");

            // Map địa chỉ GHN từ request (nếu FE gửi) để tính phí chuẩn
            if (request.getDistrictId() != null) {
                order.setDistrictId(request.getDistrictId());
            }
            if (request.getWardCode() != null) {
                order.setWardCode(request.getWardCode());
            }
            if (request.getProvinceId() != null) {
                order.setProvinceId(request.getProvinceId());
            }

            // ✅ Sử dụng validProducts thay vì selected
            List<OrderProduct> orderProducts = validProducts.stream()
                    .map(cp -> {
                        OrderProduct op = orderProductMapper.toOrderProduct(cp);
                        op.setOrder(order);
                        return op;
                    })
                    .collect(Collectors.toList());

            BigDecimal subtotal = orderProducts.stream()
                    .map(OrderProduct::getTotalPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalDiscount = BigDecimal.ZERO;
            BigDecimal total = subtotal;

            if ((request.getDiscountId() != null || request.getDiscountCode() != null) && user != null) {
                try {
                    Discount discount = null;

                    // ✅ Xử lý discount theo discountCode (ưu tiên)
                    if (request.getDiscountCode() != null && !request.getDiscountCode().trim().isEmpty()) {
                        discount = discountService.findAvailableDiscountByCode(request.getDiscountCode());
                        if (discount == null) {
                            log.warn("Discount code {} not found or not available", request.getDiscountCode());
                        }
                    }
                    // ✅ Fallback: xử lý theo discountId
                    else if (request.getDiscountId() != null) {
                        discount = discountRepository.findById(request.getDiscountId())
                                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
                    }

                    // ✅ Áp dụng discount nếu tìm thấy
                    if (discount != null
                            && discountService.canApplyDiscount(discount.getDiscountId(), user.getUserId(), subtotal)) {
                        // Tính discount amount
                        totalDiscount = discountService.calculateDiscountAmount(discount.getDiscountId(), subtotal);
                        total = subtotal.subtract(totalDiscount);

                        // Set discount cho order (do not increment global usedCount yet — do it after
                        // order persisted)
                        order.setDiscount(discount);

                        log.info("Applied discount {} (code: {}) to order. Discount amount: {}",
                                discount.getDiscountId(), discount.getName(), totalDiscount);
                    } else {
                        log.warn("Cannot apply discount to order. User: {}, Subtotal: {}, Discount: {}",
                                user != null ? user.getUserId() : "Guest", subtotal,
                                discount != null ? discount.getDiscountId() : "null");
                    }
                } catch (Exception e) {
                    log.warn("Error applying discount: {}. Order will be created without discount.", e.getMessage());
                    // Nếu không áp dụng được discount, vẫn tạo đơn hàng bình thường
                }
            }

            // 9. Tính phí ship từ GHN theo combobox FE (chỉ dựa vào khoảng cách) - dùng 1
            // nơi duy nhất
            BigDecimal shippingFee = BigDecimal.ZERO;
            try {
                Integer toDistrictId = request.getDistrictId();
                String toWardCode = request.getWardCode();
                if (toDistrictId != null && toWardCode != null) {
                    shippingFee = ghnShippingService.calculateFeeByLocation(toDistrictId, toWardCode);
                }
            } catch (Exception ex) {
                log.warn("Calculate GHN fee by location failed, fallback 0: {}", ex.getMessage());
                shippingFee = BigDecimal.ZERO;
            }
            order.setShippingFee(shippingFee);

            // 10. Set tổng tiền cho order (bao gồm phí ship)
            order.setTotalDiscount(totalDiscount);
            BigDecimal computedTotal = total.add(shippingFee);
            order.setTotal(computedTotal);

            final Order savedOrder = orderRepository.save(order);
            // After order persisted, increment discount usage (if a discount was applied)
            try {
                if (savedOrder.getDiscount() != null) {
                    discountService.incrementUsageCount(savedOrder.getDiscount().getDiscountId());
                }
            } catch (Exception e) {
                log.warn("Failed to increment discount usage after saving order {}: {}", savedOrder.getIdOrder(),
                        e.getMessage());
            }
            orderProducts.forEach(op -> op.setOrder(savedOrder));
            orderProductRepository.saveAll(orderProducts);

            // Cập nhật stock cho từng sản phẩm trong đơn hàng (chỉ giảm stock, không tăng
            // sold count)
            for (OrderProduct orderProduct : orderProducts) {
                try {
                    Product product = orderProduct.getProduct();
                    Integer currentStock = product.getStock();
                    Integer orderedQuantity = orderProduct.getQuantity();
                    Integer newStock = currentStock - orderedQuantity;
                    // Chỉ cập nhật stock, sold count sẽ tăng khi đơn hàng hoàn tất
                    productService.updateStock(product.getProductId(), newStock);

                    log.info("Updated stock for product {}: {} -> {} (ordered: {})",
                            product.getProductId(), currentStock, newStock, orderedQuantity);

                } catch (Exception e) {
                    log.error("Error updating stock for product {}: {}",
                            orderProduct.getProduct().getProductId(), e.getMessage());
                    // Không throw exception để không rollback toàn bộ đơn hàng
                }
            }

            // ✅ Chỉ xóa các sản phẩm hợp lệ đã tạo order
            cartProductRepository.deleteAll(validProducts);

            // GHN shipping order sẽ chỉ được tạo khi order status = CONFIRMED
            // để đồng bộ cho tất cả hình thức thanh toán (COD, VNPAY, MOMO)

            Long userIdLog = (user != null ? user.getUserId() : null);
            log.info("Order created successfully. Order ID: {}, User: {}, Total: {}, Discount: {}",
                    savedOrder.getIdOrder(), userIdLog, total, totalDiscount);

            // Gửi email xác nhận đơn hàng
            try {
                OrderResponse orderResponse = orderMapper.toOrderResponse(savedOrder);
                List<OrderProductResponse> orderProductResponses = orderProducts.stream()
                        .map(orderProductMapper::toOrderProductResponse)
                        .collect(Collectors.toList());

                if (user != null) {
                    // User đã đăng nhập
                    emailService.sendOrderConfirmationEmail(
                            user.getEmail(),
                            user.getFirstname() + " " + user.getLastname(),
                            orderResponse,
                            orderProductResponses);
                } else {
                    // Guest user
                    emailService.sendGuestOrderConfirmationEmail(
                            request.getEmail(),
                            orderResponse,
                            orderProductResponses);
                }
            } catch (Exception e) {
                log.error("Failed to send order confirmation email: {}", e.getMessage());
                // Không throw exception để không rollback đơn hàng
            }

            return orderMapper.toOrderResponse(savedOrder);

        } catch (AppException e) {
            log.error("AppException in createOrder: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in createOrder: ", e);
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Autowired
    private DiscountRepository discountRepository;

    @Autowired
    private DiscountServiceImpl discountService;

    public void applyDiscountToOrder(Long orderId, Long discountId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));

        // Tính subtotal từ OrderProducts
        BigDecimal subTotal = calculateOrderSubTotal(order);

        // Kiểm tra có thể áp dụng discount không
        if (!discountService.canApplyDiscount(discountId, order.getUser().getUserId(), subTotal)) {
            throw new AppException(ErrorCode.DISCOUNT_CANNOT_BE_APPLIED);
        }

        // Tính discount amount
        BigDecimal discountAmount = discountService.calculateDiscountAmount(discountId, subTotal);

        // Cập nhật order
        order.setDiscount(discount);
        order.setTotalDiscount(discountAmount);
        order.setTotal(subTotal.subtract(discountAmount));

        orderRepository.save(order);

        // Tăng usage count
        discountService.incrementUsageCount(discountId);
    }

    private BigDecimal calculateOrderSubTotal(Order order) {
        List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
        return orderProducts.stream()
                .map(OrderProduct::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public void removeDiscountFromOrder(Long orderId, Long discountId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));

        // Kiểm tra order có discount này không
        if (order.getDiscount() == null || !order.getDiscount().getDiscountId().equals(discountId)) {
            throw new AppException(ErrorCode.DISCOUNT_NOT_APPLIED_TO_ORDER);
        }

        // Tính subtotal từ OrderProducts (nhất quán với applyDiscountToOrder)
        BigDecimal subTotal = calculateOrderSubTotal(order);

        // Remove discount from order
        order.setDiscount(null);
        order.setTotalDiscount(BigDecimal.ZERO);
        order.setTotal(subTotal); // total = subtotal (không có discount)

        orderRepository.save(order);

        // Decrement usage count
        if (discount.getUsedCount() > 0) {
            discount.setUsedCount(discount.getUsedCount() - 1);
            discountRepository.save(discount);
        }
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long idOrder, OrderUpdateRequest request) {
        Order order = orderRepository.findById(idOrder)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // ✅ HOÀN LẠI DISCOUNT VÀ STOCK NẾU CHUYỂN THÀNH CANCELLED
        if ("CANCELLED".equals(request.getOrderStatus())) {
            // Hoàn lại discount nếu có
            if (order.getDiscount() != null) {
                try {
                    Discount discount = order.getDiscount();
                    // Giảm usage count của discount
                    if (discount.getUsedCount() > 0) {
                        discount.setUsedCount(discount.getUsedCount() - 1);
                        discountRepository.save(discount);
                        log.info("Rolled back discount usage for discount {} (order {} cancelled by admin)",
                                discount.getDiscountId(), idOrder);
                    }
                } catch (Exception e) {
                    log.warn("Failed to rollback discount usage for order {}: {}", idOrder, e.getMessage());
                    // Không throw exception để không ảnh hưởng đến việc cập nhật trạng thái đơn
                    // hàng
                }
            }

            // Hoàn lại stock cho các sản phẩm trong đơn hàng bị hủy
            restoreStockForOrder(order);
        }

        // Lưu trạng thái hiện tại
        String currentPaymentStatus = order.getPaymentStatus();
        String currentOrderStatus = order.getOrderStatus();

        // Cập nhật trạng thái đơn hàng
        orderMapper.updateOrder(order, request);

        // ✅ TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG KHI THANH TOÁN BỊ HỦY
        if (request.getPaymentStatus() != null && "CANCELLED".equals(request.getPaymentStatus())) {
            order.setOrderStatus("CANCELLED");
            log.info("Auto-updated order {} status to CANCELLED due to payment cancellation", idOrder);

            // Hoàn lại stock cho các sản phẩm trong đơn hàng bị hủy
            restoreStockForOrder(order);
        }

        // Tự động cập nhật trạng thái thanh toán và sold count dựa trên trạng thái đơn
        // hàng
        String newOrderStatus = request.getOrderStatus();
        if ("COMPLETED".equals(newOrderStatus)) {
            // Nếu đơn hàng hoàn tất và đã thanh toán, giữ nguyên trạng thái thanh toán
            // Nếu chưa thanh toán, tự động đặt thành "Đã thanh toán"
            if ("PENDING".equals(currentPaymentStatus)) {
                order.setPaymentStatus("PAID");
            }

            // Cập nhật sold count = số lượng sản phẩm trong đơn hàng khi hoàn tất
            updateSoldCountForOrder(order, true);
        } else {
            // Cập nhật trạng thái thanh toán cho các trường hợp khác
            if ("CANCELLED".equals(newOrderStatus)) {
                // Nếu đơn hàng bị hủy và đã thanh toán, chuyển thành "Đã hoàn tiền"
                if ("PAID".equals(currentPaymentStatus)) {
                    order.setPaymentStatus("REFUNDED");
                }

                // Nếu chuyển từ COMPLETED về CANCELLED, cần giảm sold count
                if ("COMPLETED".equals(currentOrderStatus)) {
                    updateSoldCountForOrder(order, false);
                }
            } else if ("PENDING".equals(newOrderStatus) || "CONFIRMED".equals(newOrderStatus)) {
                // Nếu đơn hàng từ COMPLETED chuyển về PENDING/CONFIRMED và đã hoàn tiền, chuyển
                // về "Đã thanh toán"
                if ("REFUNDED".equals(currentPaymentStatus) && "COMPLETED".equals(currentOrderStatus)) {
                    order.setPaymentStatus("PAID");
                }

                // Nếu chuyển từ COMPLETED về PENDING/CONFIRMED, cần giảm sold count
                if ("COMPLETED".equals(currentOrderStatus)) {
                    updateSoldCountForOrder(order, false);
                }
            }
        }

        order = orderRepository.save(order);

        // ✅ TỰ ĐỘNG TẠO GHN SHIPPING ORDER KHI TRẠNG THÁI = CONFIRMED
        // Chỉ tạo khi chuyển sang CONFIRMED để đồng bộ tất cả hình thức thanh toán
        if ("CONFIRMED".equals(newOrderStatus) && !"CONFIRMED".equals(currentOrderStatus)) {
            try {
                // Kiểm tra xem đã có GHN shipping order chưa để tránh tạo trùng
                if (ghnShippingRepository.findByIdOrder(order.getIdOrder()).isEmpty()) {
                    // Đảm bảo Order đã có đủ thông tin địa chỉ (district/ward)
                    if (order.getDistrictId() != null && order.getWardCode() != null) {
                        ghnShippingService.createShippingOrder(order);
                        log.info("Created GHN shipping order for Order {} when status changed to CONFIRMED",
                                order.getIdOrder());
                    } else {
                        log.warn("Skip GHN create for Order {}: missing district/ward.", order.getIdOrder());
                    }
                } else {
                    log.info("GHN shipping order already exists for Order {}", order.getIdOrder());
                }
            } catch (Exception ex) {
                log.error("Failed to auto create GHN order for Order {}: {}",
                        order.getIdOrder(), ex.getMessage());
                // Không throw exception để không rollback việc cập nhật trạng thái đơn hàng
            }
        }

        // ✅ GỬI EMAIL THÔNG BÁO HỦY ĐƠN HÀNG KHI ADMIN HỦY
        // Chỉ gửi khi chuyển từ trạng thái khác sang CANCELLED
        if ("CANCELLED".equals(newOrderStatus) && !"CANCELLED".equals(currentOrderStatus)) {
            try {
                OrderResponse orderResponse = orderMapper.toOrderResponse(order);
                List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
                List<OrderProductResponse> orderProductResponses = orderProducts.stream()
                        .map(orderProductMapper::toOrderProductResponse)
                        .collect(Collectors.toList());

                if (order.getUser() != null) {
                    emailService.sendOrderCancellationEmail(
                            order.getUser().getEmail(),
                            order.getUser().getFirstname() + " " + order.getUser().getLastname(),
                            orderResponse,
                            orderProductResponses);
                } else {
                    emailService.sendGuestOrderCancellationEmail(
                            order.getEmail(),
                            orderResponse,
                            orderProductResponses);
                }
            } catch (Exception e) {
                log.error("Failed to send cancellation email: {}", e.getMessage());
            }
        }

        return orderMapper.toOrderResponse(order);
    }

    /**
     * Cập nhật sold count cho các sản phẩm trong đơn hàng
     * 
     * @param order       đơn hàng
     * @param isCompleted true nếu đơn hàng hoàn tất (+ số lượng), false nếu không
     *                    hoàn tất (- số lượng)
     */
    private void updateSoldCountForOrder(Order order, boolean isCompleted) {
        try {
            List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
            for (OrderProduct orderProduct : orderProducts) {
                try {
                    Product product = orderProduct.getProduct();
                    Integer currentSoldCount = product.getSoldCount();
                    Integer quantity = orderProduct.getQuantity();
                    Integer newSoldCount = isCompleted ? currentSoldCount + quantity
                            : Math.max(0, currentSoldCount - quantity); // Đảm bảo không âm

                    productService.updateSoldCount(product.getProductId(), newSoldCount);

                    log.info("Updated sold count for product {}: {} -> {} (quantity: {}, isCompleted: {})",
                            product.getProductId(), currentSoldCount, newSoldCount, quantity, isCompleted);

                } catch (Exception e) {
                    log.error("Error updating sold count for product {}: {}",
                            orderProduct.getProduct().getProductId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error updating sold count for order {}: {}", order.getIdOrder(), e.getMessage());
        }
    }

    /**
     * Hoàn lại stock cho các sản phẩm trong đơn hàng bị hủy
     * 
     * @param order đơn hàng bị hủy
     */
    private void restoreStockForOrder(Order order) {
        try {
            List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
            for (OrderProduct orderProduct : orderProducts) {
                try {
                    Product product = orderProduct.getProduct();
                    Integer currentStock = product.getStock();
                    Integer quantity = orderProduct.getQuantity();
                    Integer newStock = currentStock + quantity;

                    productService.updateStock(product.getProductId(), newStock);

                    log.info("Restored stock for product {}: {} -> {} (quantity: {})",
                            product.getProductId(), currentStock, newStock, quantity);

                } catch (Exception e) {
                    log.error("Error restoring stock for product {}: {}",
                            orderProduct.getProduct().getProductId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error restoring stock for order {}: {}", order.getIdOrder(), e.getMessage());
        }
    }

    @Override
    public OrderResponse getOrderById(Long idOrder) {
        Order order = orderRepository.findById(idOrder)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        return orderMapper.toOrderResponse(order);
    }

    @Override
    public List<OrderResponse> getMyOrders(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<Order> orders = orderRepository.findByUserOrderByOrderDateDesc(user);
        return orderMapper.toOrderResponseList(orders);
    }

    @Autowired
    private ReviewRepository reviewRepository;

    @Override
    public List<OrderResponse> getMyOrdersPaginated(Long userId, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<Order> orders = orderRepository.findByUserOrderByOrderDateDesc(user);

        // Manual pagination
        int start = page * size;
        int end = Math.min(start + size, orders.size());

        if (start >= orders.size()) {
            return new ArrayList<>();
        }

        List<Order> paginatedOrders = orders.subList(start, end);
        return orderMapper.toOrderResponseList(paginatedOrders);
    }

    @Override
    public Long countMyOrders(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return orderRepository.countByUser(user);
    }

    @Override
    public List<OrderResponse> getAllOrders() {
        List<Order> orders = orderRepository.findAllByOrderByIdOrderDesc();
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    public List<OrderResponse> getOrdersByOrderStatus(String orderStatus) {
        List<Order> orders = orderRepository.findByOrderStatus(orderStatus);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    public List<OrderResponse> getOrdersByDateRange(LocalDateTime start, LocalDateTime end) {
        // Lấy danh sách đơn hàng theo khoảng thời gian
        List<Order> orders = orderRepository.findByOrderDateBetween(start, end);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    public List<OrderProductResponse> getProductsByOrderId(Long idOrder) {
        Order order = orderRepository.findById(idOrder)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
        List<OrderProductResponse> responses = orderProducts.stream().map(op -> {
            OrderProductResponse resp = orderProductMapper.toOrderProductResponse(op);
            String mainImageUrl = imageService.findMainImageByProductId(op.getProduct().getProductId())
                    .map(Image::getImageUrl)
                    .orElse(null);
            resp.setMainImageUrl(mainImageUrl);
            return resp;
        }).collect(Collectors.toList());
        return responses;
    }

    @Override
    public Long countByUser(User user) {
        // Đếm tổng số đơn hàng của một người dùng
        return orderRepository.countByUser(user);
    }

    @Override
    public BigDecimal getTotalRevenue() {
        // Tính tổng doanh thu từ tất cả các đơn hàng
        BigDecimal total = orderRepository.getTotalRevenue();
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public BigDecimal getTotalRevenueByUser(User user) {
        // Tính tổng doanh thu từ các đơn hàng của một người dùng
        BigDecimal total = orderRepository.getTotalRevenueByUser(user);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public BigDecimal getTotalRevenueByUserCompleted(User user) {
        // Tính tổng doanh thu từ các đơn hàng đã hoàn tất của một người dùng
        BigDecimal total = orderRepository.getTotalRevenueByUserCompleted(user);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    @Transactional
    public void cancelOrderByUser(Long orderId, Long userId) {
        // Tìm đơn hàng
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Kiểm tra xem đơn hàng có thuộc về user này không
        if (!order.getUser().getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Kiểm tra xem đơn hàng có thể hủy không (chỉ hủy được khi đang PENDING)
        if (!"PENDING".equals(order.getOrderStatus())) {
            throw new AppException(ErrorCode.ORDER_CANNOT_BE_CANCELLED);
        }

        // ✅ HOÀN LẠI DISCOUNT NẾU CÓ
        if (order.getDiscount() != null) {
            try {
                Discount discount = order.getDiscount();
                // Giảm usage count của discount
                if (discount.getUsedCount() > 0) {
                    discount.setUsedCount(discount.getUsedCount() - 1);
                    discountRepository.save(discount);
                    log.info("Rolled back discount usage for discount {} (order {})",
                            discount.getDiscountId(), orderId);
                }
            } catch (Exception e) {
                log.warn("Failed to rollback discount usage for order {}: {}", orderId, e.getMessage());
                // Không throw exception để không ảnh hưởng đến việc hủy đơn hàng
            }
        }

        // ✅ CẬP NHẬT TRẠNG THÁI THANH TOÁN NẾU ĐÃ THANH TOÁN
        String currentPaymentStatus = order.getPaymentStatus();
        if ("PAID".equals(currentPaymentStatus)) {
            order.setPaymentStatus("REFUNDED");
            log.info("Updated payment status to REFUNDED for cancelled order {}", orderId);
        }

        // Cập nhật trạng thái đơn hàng thành CANCELLED
        order.setOrderStatus("CANCELLED");

        orderRepository.save(order);

        // ✅ HOÀN LẠI STOCK CHO CÁC SẢN PHẨM TRONG ĐƠN HÀNG BỊ HỦY
        restoreStockForOrder(order);

        // ✅ GỬI EMAIL THÔNG BÁO HỦY ĐƠN HÀNG
        try {
            OrderResponse orderResponse = orderMapper.toOrderResponse(order);
            List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
            List<OrderProductResponse> orderProductResponses = orderProducts.stream()
                    .map(orderProductMapper::toOrderProductResponse)
                    .collect(Collectors.toList());

            if (order.getUser() != null) {
                emailService.sendOrderCancellationEmail(
                        order.getUser().getEmail(),
                        order.getUser().getFirstname() + " " + order.getUser().getLastname(),
                        orderResponse,
                        orderProductResponses);
            } else {
                emailService.sendGuestOrderCancellationEmail(
                        order.getEmail(),
                        orderResponse,
                        orderProductResponses);
            }
        } catch (Exception e) {
            log.error("Failed to send cancellation email: {}", e.getMessage());
        }

        log.info("Order {} cancelled by user {}", orderId, userId);
    }

    @Override
    public BigDecimal getRevenueByDate(LocalDate date) {
        // Tính tổng doanh thu trong ngày
        LocalDateTime startOfDay = date.atStartOfDay();
        BigDecimal total = orderRepository.getRevenueByDate(startOfDay);
        return total != null ? total : BigDecimal.ZERO;
    }

    // tổng doanh thu của đơn hàng đã hoàn thành
    @Override
    public BigDecimal getTotalRevenueCompleted() {
        BigDecimal total = orderRepository.getTotalRevenueCompleted();
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public List<Order> getRecentOrders(int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "orderDate"));
        return orderRepository.findAll(pageable).getContent();
    }

    // ======================== DOANH THU THEO SẢN PHẨM ========================
    @Override
    public BigDecimal getRevenueByProductId(Long productId) {
        return orderRepository.getRevenueByProductId(productId);
    }

    @Override
    public List<Object[]> getRevenueByDay(LocalDateTime startDate, LocalDateTime endDate) {
        return orderRepository.getRevenueByDay(startDate, endDate);
    }

    @Override
    public List<Object[]> getRevenueByMonth(LocalDateTime startDate, LocalDateTime endDate) {
        return orderRepository.getRevenueByMonth(startDate, endDate);
    }

    @Override
    public List<Object[]> getRevenueByYear(LocalDateTime startDate, LocalDateTime endDate) {
        return orderRepository.getRevenueByYear(startDate, endDate);
    }

    @Override
    public long countReturningCustomers() {
        return orderRepository.countReturningCustomers();
    }

    @Override
    public long countCustomersWithCompletedOrders() {
        return orderRepository.countCustomersWithCompletedOrders();
    }

    @Override
    public List<TopCustomerResponse> getTopSpenders(int limit) {
        return orderRepository.findTopSpenders(PageRequest.of(0, limit));
    }

    public Long count() {
        return orderRepository.count();
    }

}
