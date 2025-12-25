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
@Table(name = "Orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdOrder")
    Long idOrder;
    @Column(name = "OrderDate", nullable = false)
    LocalDateTime orderDate;
    @Column(name = "TotalDiscount", nullable = false)
    BigDecimal totalDiscount;
    @Column(name = "Total", nullable = false)
    BigDecimal total;

    @Column(name = "PaymentMethod", nullable = false)
    String paymentMethod;

    @Column(name = "OrderStatus", nullable = false)
    String orderStatus;

    @Column(name = "PaymentStatus", nullable = false)
    String paymentStatus; // PENDING, PAID, FAILED, CANCELLED

    @Column(name = "ShippingFee", nullable = false)
    @Builder.Default
    BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "Name", nullable = false, columnDefinition = "NVARCHAR(255)")
    String name;
    @Column(name = "Phone", nullable = false)
    String phone;
    @Column(name = "AddressDetail", nullable = false, columnDefinition = "NVARCHAR(255)")
    String addressDetail;

    @Column(name = "WardCode", nullable = false, columnDefinition = "NVARCHAR(100)")
    String wardCode;

    @Column(name = "DistrictId", nullable = false)
    Integer districtId;

    @Column(name = "ProvinceId", nullable = false)
    Integer provinceId;

    @Column(name = "Email")
    String email;

    @Column(name = "Note", columnDefinition = "NVARCHAR(255)")
    String note;

    @ManyToOne
    @JoinColumn(name = "IdUser", nullable = true)
    @JsonIgnore
    private User user;

    @ManyToOne
    @JoinColumn(name = "IdDiscount", nullable = true)
    @JsonIgnore
    private Discount discount;

    // Relationships with separate payment and shipping tables
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private VnpayPayment vnpayPayment;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private MomoPayment momoPayment;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private GhnShipping ghnShipping;

    @PrePersist
    @PreUpdate
    private void ensureNonNullMonetaryFields() {
        if (totalDiscount == null) {
            totalDiscount = BigDecimal.ZERO;
        }
        if (shippingFee == null) {
            shippingFee = BigDecimal.ZERO;
        }
        if (total == null) {
            total = BigDecimal.ZERO;
        }
        if (paymentStatus == null) {
            paymentStatus = "PENDING";
        }
        if (orderStatus == null) {
            orderStatus = "PENDING";
        }
    }
}
