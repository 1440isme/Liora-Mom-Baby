package vn.liora.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReturnRequestResponse {

    Long idReturnRequest;
    Long idOrder;
    String orderNumber; // Mã đơn hàng để hiển thị
    String customerName;
    String customerEmail;
    String reason;
    String status; // PENDING, ACCEPTED, REJECTED
    LocalDateTime createdDate;
    LocalDateTime processedDate;
    Long processedBy;
    String processedByName;
    String adminNote;

    // Thông tin bổ sung từ order
    Double orderTotal;
    String orderStatus;
}
