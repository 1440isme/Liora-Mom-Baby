package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.liora.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "WalletTransaction")
public class WalletTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdTransaction")
    Long transactionId;

    @ManyToOne
    @JoinColumn(name = "IdWallet", nullable = false)
    @JsonIgnore
    UserWallet wallet;

    @Enumerated(EnumType.STRING)
    @Column(name = "Type", nullable = false, length = 20)
    TransactionType type;

    @Column(name = "Amount", nullable = false, precision = 19, scale = 2)
    BigDecimal amount;

    @Column(name = "BalanceBefore", nullable = false, precision = 19, scale = 2)
    BigDecimal balanceBefore;

    @Column(name = "BalanceAfter", nullable = false, precision = 19, scale = 2)
    BigDecimal balanceAfter;

    @ManyToOne
    @JoinColumn(name = "IdOrder", nullable = true)
    @JsonIgnore
    Order order;

    @Column(name = "Description", columnDefinition = "NVARCHAR(500)")
    String description;

    @Column(name = "CreatedDate", nullable = false)
    LocalDateTime createdDate;

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
    }
}
