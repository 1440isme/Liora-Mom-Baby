package vn.liora.entity;

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
@Table(name = "UserWallet")
public class UserWallet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdWallet")
    Long walletId;

    @OneToOne
    @JoinColumn(name = "IdUser", nullable = false, unique = true)
    User user;

    @Column(name = "Balance", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "CreatedDate", nullable = false)
    LocalDateTime createdDate;

    @Column(name = "UpdatedDate")
    LocalDateTime updatedDate;

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
        updatedDate = LocalDateTime.now();
        if (balance == null) {
            balance = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedDate = LocalDateTime.now();
    }
}
