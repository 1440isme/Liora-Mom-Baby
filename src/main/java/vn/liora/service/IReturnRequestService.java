package vn.liora.service;

import vn.liora.dto.request.ReturnRequestCreateRequest;
import vn.liora.dto.request.ReturnRequestProcessRequest;
import vn.liora.dto.response.ReturnRequestResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface IReturnRequestService {

    /**
     * Tạo yêu cầu trả hàng mới
     */
    ReturnRequestResponse createReturnRequest(ReturnRequestCreateRequest request, Long userId);

    /**
     * Lấy tất cả return requests
     */
    List<ReturnRequestResponse> getAllReturnRequests();

    /**
     * Lấy return requests theo khoảng thời gian
     */
    List<ReturnRequestResponse> getReturnRequestsByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Lấy return requests theo status
     */
    List<ReturnRequestResponse> getReturnRequestsByStatus(String status);

    /**
     * Lấy return requests theo status và date range
     */
    List<ReturnRequestResponse> getReturnRequestsByStatusAndDateRange(String status, LocalDateTime startDate,
            LocalDateTime endDate);

    /**
     * Lấy return request theo ID
     */
    ReturnRequestResponse getReturnRequestById(Long id);

    /**
     * Xử lý return request (accept/reject)
     */
    ReturnRequestResponse processReturnRequest(Long id, ReturnRequestProcessRequest request, Long adminId);

    /**
     * Đếm số lượng theo status
     */
    long countByStatus(String status);
}
