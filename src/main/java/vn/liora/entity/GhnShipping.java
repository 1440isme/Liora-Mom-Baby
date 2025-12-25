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
@Table(name = "GhnShippings")
public class GhnShipping {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdGhnShipping")
    Long idGhnShipping;

    @Column(name = "IdOrder", nullable = false)
    Long idOrder;

    // GHN essential fields only (for test environment)
    @Column(name = "GhnOrderCode", nullable = false, unique = true)
    String ghnOrderCode;

    @Column(name = "GhnServiceId", nullable = false)
    Integer ghnServiceId;

    // Customer address (simplified)
    @Column(name = "ToName", nullable = false, columnDefinition = "NVARCHAR(255)")
    String toName;

    @Column(name = "ToPhone", nullable = false)
    String toPhone;

    @Column(name = "ToAddress", nullable = false, columnDefinition = "NVARCHAR(500)")
    String toAddress;

    @Column(name = "ToWardCode", nullable = false)
    String toWardCode;

    @Column(name = "ToDistrictId", nullable = false)
    Integer toDistrictId;

    // Shipping fee
    @Column(name = "ShippingFee", nullable = false)
    BigDecimal shippingFee;

    // GHN Status (simplified)
    @Column(name = "GhnStatus", nullable = false)
    String ghnStatus; // PENDING, PICKING, DELIVERING, DELIVERED, RETURNED

    // Timestamps
    @Column(name = "CreatedAt", nullable = false)
    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();

    // Relationships
    @OneToOne
    @JoinColumn(name = "IdOrder", insertable = false, updatable = false)
    @JsonIgnore
    Order order;
}
