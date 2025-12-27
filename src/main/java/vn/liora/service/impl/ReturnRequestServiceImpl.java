package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.ReturnRequestCreateRequest;
import vn.liora.dto.request.ReturnRequestProcessRequest;
import vn.liora.dto.response.ReturnRequestResponse;
import vn.liora.entity.Order;
import vn.liora.entity.ReturnRequest;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.OrderRepository;
import vn.liora.repository.ReturnRequestRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.IReturnRequestService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ReturnRequestServiceImpl implements IReturnRequestService {

    ReturnRequestRepository returnRequestRepository;
    OrderRepository orderRepository;
    UserRepository userRepository;

    @Override
    @Transactional
    public ReturnRequestResponse createReturnRequest(ReturnRequestCreateRequest request, Long userId) {
        log.info("Creating return request for order ID: {}, userId: {}", request.getOrderId(), userId);

        // Kiểm tra order tồn tại
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        log.info("Found order: {}, status: {}", order.getIdOrder(), order.getOrderStatus());

        // Validate owner
        if (userId != null) {
            if (order.getUser() == null) {
                log.error("Order {} has no user associated", order.getIdOrder());
                throw new AppException(ErrorCode.ORDER_NOT_FOUND);
            }
            if (!userId.equals(order.getUser().getUserId())) {
                log.warn("User {} tried to create return request for order {} owned by user {}",
                        userId, order.getIdOrder(), order.getUser().getUserId());
                throw new AppException(ErrorCode.ORDER_NOT_FOUND); // Trả về Not Found để bảo mật
            }
        }

        // Kiểm tra order status - chỉ cho phép trả hàng với status DELIVERED
        if (!("DELIVERED".equals(order.getOrderStatus()) || "COMPLETED".equals(order.getOrderStatus()))) {
            log.warn("Cannot create return request for order {} with status {}",
                    order.getIdOrder(), order.getOrderStatus());
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        // Kiểm tra xem đã có return request cho order này chưa
        if (returnRequestRepository.existsByOrder_IdOrder(request.getOrderId())) {
            log.warn("Return request already exists for order {}", request.getOrderId());
            throw new AppException(ErrorCode.RETURN_REQUEST_ALREADY_EXISTS);
        }

        // Tạo return request
        ReturnRequest returnRequest = ReturnRequest.builder()
                .order(order)
                .reason(request.getReason())
                .status("PENDING")
                .createdDate(LocalDateTime.now())
                .build();

        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        log.info("Created return request ID: {} for order ID: {}", saved.getIdReturnRequest(), order.getIdOrder());

        return mapToResponse(saved);
    }

    @Override
    public List<ReturnRequestResponse> getAllReturnRequests() {
        return returnRequestRepository.findAllByOrderByCreatedDateDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReturnRequestResponse> getReturnRequestsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return returnRequestRepository.findByDateRange(startDate, endDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReturnRequestResponse> getReturnRequestsByStatus(String status) {
        return returnRequestRepository.findByStatusOrderByCreatedDateDesc(status)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReturnRequestResponse> getReturnRequestsByStatusAndDateRange(String status, LocalDateTime startDate,
            LocalDateTime endDate) {
        return returnRequestRepository.findByStatusAndDateRange(status, startDate, endDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ReturnRequestResponse getReturnRequestById(Long id) {
        ReturnRequest returnRequest = returnRequestRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RETURN_REQUEST_NOT_FOUND));
        return mapToResponse(returnRequest);
    }

    @Override
    @Transactional
    public ReturnRequestResponse processReturnRequest(Long id, ReturnRequestProcessRequest request, Long adminId) {
        // Tìm return request
        ReturnRequest returnRequest = returnRequestRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RETURN_REQUEST_NOT_FOUND));

        // Kiểm tra status hiện tại - chỉ xử lý PENDING
        if (!"PENDING".equals(returnRequest.getStatus())) {
            throw new AppException(ErrorCode.RETURN_REQUEST_ALREADY_PROCESSED);
        }

        // Lấy admin user
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Cập nhật return request
        returnRequest.setStatus(request.getStatus());
        returnRequest.setProcessedDate(LocalDateTime.now());
        returnRequest.setProcessedBy(admin);
        returnRequest.setAdminNote(request.getAdminNote());

        // Nếu ACCEPTED, cập nhật order status thành RETURNED
        if ("ACCEPTED".equals(request.getStatus())) {
            Order order = returnRequest.getOrder();
            order.setOrderStatus("RETURNED");
            orderRepository.save(order);
            log.info("Order {} status updated to RETURNED", order.getIdOrder());
        }

        ReturnRequest updated = returnRequestRepository.save(returnRequest);
        log.info("Processed return request ID: {} with status: {}", id, request.getStatus());

        return mapToResponse(updated);
    }

    @Override
    public long countByStatus(String status) {
        return returnRequestRepository.countByStatus(status);
    }

    // Helper method to map Entity to Response DTO
    private ReturnRequestResponse mapToResponse(ReturnRequest returnRequest) {
        Order order = returnRequest.getOrder();
        User customer = order.getUser();

        // Tạo full name từ firstname + lastname
        String customerFullName = "Khách";
        if (customer != null && customer.getFirstname() != null && customer.getLastname() != null) {
            customerFullName = customer.getFirstname() + " " + customer.getLastname();
        }

        String processedByName = null;
        if (returnRequest.getProcessedBy() != null) {
            User admin = returnRequest.getProcessedBy();
            if (admin.getFirstname() != null && admin.getLastname() != null) {
                processedByName = admin.getFirstname() + " " + admin.getLastname();
            }
        }

        return ReturnRequestResponse.builder()
                .idReturnRequest(returnRequest.getIdReturnRequest())
                .idOrder(order.getIdOrder())
                .orderNumber("#" + order.getIdOrder())
                .customerName(customerFullName)
                .customerEmail(customer != null ? customer.getEmail() : order.getEmail())
                .reason(returnRequest.getReason())
                .status(returnRequest.getStatus())
                .createdDate(returnRequest.getCreatedDate())
                .processedDate(returnRequest.getProcessedDate())
                .processedBy(returnRequest.getProcessedBy() != null ? returnRequest.getProcessedBy().getUserId() : null)
                .processedByName(processedByName)
                .adminNote(returnRequest.getAdminNote())
                .orderTotal(order.getTotal().doubleValue())
                .orderStatus(order.getOrderStatus())
                .build();
    }
}
