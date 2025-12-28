package vn.liora.controller.admin;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ReturnRequestProcessRequest;
import vn.liora.dto.response.ReturnRequestResponse;
import vn.liora.repository.UserRepository;
import vn.liora.service.IReturnRequestService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/return-requests")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasAuthority('order.view')")
public class AdminReturnRequestController {

    IReturnRequestService returnRequestService;
    UserRepository userRepository;

    /**
     * Lấy tất cả return requests hoặc theo date range
     */
    @GetMapping
    public ResponseEntity<List<ReturnRequestResponse>> getAllReturnRequests(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") String dateFrom,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") String dateTo,
            @RequestParam(required = false) String status) {

        // Nếu có filter by date range
        if (dateFrom != null || dateTo != null) {
            LocalDateTime startDate = dateFrom != null
                    ? LocalDateTime.parse(dateFrom + "T00:00:00")
                    : LocalDateTime.now().minusDays(2);

            LocalDateTime endDate = dateTo != null
                    ? LocalDateTime.parse(dateTo + "T23:59:59")
                    : LocalDateTime.now();

            if (status != null && !status.isEmpty()) {
                return ResponseEntity
                        .ok(returnRequestService.getReturnRequestsByStatusAndDateRange(status, startDate, endDate));
            } else {
                return ResponseEntity.ok(returnRequestService.getReturnRequestsByDateRange(startDate, endDate));
            }
        }

        // Nếu chỉ filter by status
        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(returnRequestService.getReturnRequestsByStatus(status));
        }

        // Lấy tất cả
        return ResponseEntity.ok(returnRequestService.getAllReturnRequests());
    }

    /**
     * Lấy return request theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReturnRequestResponse> getReturnRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(returnRequestService.getReturnRequestById(id));
    }

    /**
     * Xử lý return request (accept/reject)
     */
    @PutMapping("/{id}/process")
    @PreAuthorize("hasAuthority('order.update_status')")
    public ResponseEntity<ReturnRequestResponse> processReturnRequest(
            @PathVariable Long id,
            @Valid @RequestBody ReturnRequestProcessRequest request) {

        // Lấy admin user ID từ authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        // Tìm admin user
        Long adminId = userRepository.findByUsername(username)
                .map(user -> user.getUserId())
                .orElse(null);

        ReturnRequestResponse response = returnRequestService.processReturnRequest(id, request, adminId);

        log.info("Admin {} processed return request {}: {}", username, id, request.getStatus());
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thống kê return requests
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("pending", returnRequestService.countByStatus("PENDING"));
        stats.put("accepted", returnRequestService.countByStatus("ACCEPTED"));
        stats.put("rejected", returnRequestService.countByStatus("REJECTED"));

        return ResponseEntity.ok(stats);
    }
}
