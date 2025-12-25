package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
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
@Table(name = "Products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdProduct")
    private Long productId;

    @Column(name = "Name", nullable = false, columnDefinition = "NVARCHAR(255)")
    @NotBlank(message = "PRODUCT_NAME_REQUIRED")
    private String name;

    @Column(name = "Description", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    @NotBlank(message = "PRODUCT_DESCRIPTION_REQUIRED")
    private String description;

    @Column(name = "Price", precision = 10, scale = 2, nullable = false)
    @DecimalMin(value = "0.01", message = "PRODUCT_PRICE_INVALID")
    @DecimalMax(value = "99999999.99", message = "PRODUCT_PRICE_TOO_HIGH")
    private BigDecimal price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "IdBrand")
    @NotNull(message = "PRODUCT_BRAND_REQUIRED")
    @JsonIgnore
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "IdCategory")
    @NotNull(message = "PRODUCT_CATEGORY_REQUIRED")
    @JsonIgnore
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Image> images;

    @Column(name = "Stock")
    @NotNull(message = "PRODUCT_STOCK_INVALID")
    @Min(value = 0, message = "PRODUCT_STOCK_INVALID")
    private Integer stock = 0;

    @Column(name = "SoldCount")
    private Integer soldCount = 0;

    @Column(name = "CreatedDate", columnDefinition = "DATETIME")
    private LocalDateTime createdDate;

    @Column(name = "UpdatedDate", columnDefinition = "DATETIME")
    private LocalDateTime updatedDate;

    @Column(name = "Available")
    private Boolean available = true;

    @Column(name = "AverageRating", precision = 2, scale = 1)
    @DecimalMin(value = "0.0", message = "PRODUCT_RATING_INVALID")
    @DecimalMax(value = "5.0", message = "PRODUCT_RATING_INVALID")
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Transient
    private Integer ratingCount;

    @Column(name = "IsActive")
    private Boolean isActive = true;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<CartProduct> cartProducts;
}
