package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "OrderProduct")
public class OrderProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdOrderProduct")
    Long idOrderProduct;
    @Column(name = "Quantity", nullable = false)
    Integer quantity;
    @Column(name = "TotalPrice", nullable = false)
    BigDecimal totalPrice;

    @ManyToOne
    @JoinColumn(name = "IdOrder")
    @JsonIgnore
    private Order order;

    @ManyToOne
    @JoinColumn(name = "IdProduct")
    @JsonIgnore
    private Product product;

    @OneToOne(mappedBy = "orderProduct", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    Review review;
}
