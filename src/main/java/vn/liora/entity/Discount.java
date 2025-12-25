package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "Discounts")
public class Discount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdDiscount")
    private Long discountId;

    @Column(name = "Name", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String name;

    @Column(name = "Description", columnDefinition = "NVARCHAR(500)")
    private String description;

    @Column(name = "DiscountValue", nullable = false, precision = 10, scale = 2)
    @DecimalMin(value = "0.0", message = "Discount value must be positive")
    private BigDecimal discountValue;

    @Column(name = "MinOrderValue", precision = 10, scale = 2)
    private BigDecimal minOrderValue;

    @Column(name = "MaxDiscountAmount", precision = 10, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "StartDate", nullable = false, columnDefinition = "DATETIME2")
    private LocalDateTime startDate;

    @Column(name = "EndDate", nullable = false, columnDefinition = "DATETIME2")
    private LocalDateTime endDate;

    @Column(name = "UsageLimit")
    private Integer usageLimit;

    @Column(name = "UserUsageLimit")
    private Integer userUsageLimit;

    @Column(name = "IsActive", nullable = false)
    private Boolean isActive = true;

    @Column(name = "CreatedAt", nullable = false, columnDefinition = "DATETIME2")
    private LocalDateTime createdAt;

    @Column(name = "UpdatedAt", columnDefinition = "DATETIME2")
    private LocalDateTime updatedAt;

    @Column(name = "UsedCount")
    private Integer usedCount = 0;

    // ========== RELATIONSHIPS ==========
    @OneToMany(mappedBy = "discount", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Order> orders;
}