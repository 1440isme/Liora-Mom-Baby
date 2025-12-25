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
@Table(name = "VnpayPayments")
public class VnpayPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdVnpayPayment")
    Long idVnpayPayment;

    @Column(name = "IdOrder", nullable = false)
    Long idOrder;

    // VNPAY essential fields only
    @Column(name = "VnpTxnRef", nullable = false, unique = true)
    String vnpTxnRef;

    @Column(name = "VnpTransactionNo")
    String vnpTransactionNo;

    @Column(name = "VnpBankCode")
    String vnpBankCode;

    @Column(name = "VnpAmount", nullable = false)
    BigDecimal vnpAmount;

    @Column(name = "VnpResponseCode")
    String vnpResponseCode;

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
