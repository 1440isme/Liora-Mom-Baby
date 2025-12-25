package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "MomoPayments")
public class MomoPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdMomoPayment")
    Long idMomoPayment;

    @Column(name = "IdOrder", nullable = false)
    Long idOrder;

    // MOMO essential fields
    @Column(name = "PartnerCode", nullable = false)
    String partnerCode;

    @Column(name = "OrderId", nullable = false, unique = true)
    String orderId;

    @Column(name = "RequestId", nullable = false, unique = true)
    String requestId;

    @Column(name = "Amount", nullable = false)
    BigDecimal amount;

    @Column(name = "OrderInfo", columnDefinition = "NVARCHAR(500)")
    String orderInfo;

    @Column(name = "RedirectUrl", columnDefinition = "NVARCHAR(500)")
    String redirectUrl;

    @Column(name = "IpnUrl", columnDefinition = "NVARCHAR(500)")
    String ipnUrl;

    @Column(name = "ExtraData", columnDefinition = "NVARCHAR(500)")
    String extraData;

    @Column(name = "RequestType", nullable = false)
    String requestType;

    @Column(name = "Signature", columnDefinition = "NVARCHAR(500)")
    String signature;

    // Response fields
    @Column(name = "ResultCode")
    Integer resultCode;

    @Column(name = "Message", columnDefinition = "NVARCHAR(500)")
    String message;

    @Column(name = "PayUrl", columnDefinition = "NVARCHAR(1000)")
    String payUrl;

    @Column(name = "TransId")
    String transId;

    @Column(name = "OrderType")
    String orderType;

    @Column(name = "ResponseTime")
    Long responseTime;

    // Payment details
    @Column(name = "PaidAmount")
    BigDecimal paidAmount;

    @Column(name = "PaidAt")
    LocalDateTime paidAt;

    @Column(name = "FailureReason", columnDefinition = "NVARCHAR(500)")
    String failureReason;

    // Timestamps
    @Column(name = "CreatedAt", nullable = false)
    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "UpdatedAt", nullable = false)
    @Builder.Default
    LocalDateTime updatedAt = LocalDateTime.now();

    // Relationship
    @OneToOne
    @JoinColumn(name = "IdOrder", insertable = false, updatable = false)
    @JsonIgnore
    Order order;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
