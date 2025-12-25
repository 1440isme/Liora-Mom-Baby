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
@Table(name = "CartProduct")
public class CartProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdCartProduct")
    Long idCartProduct;
    @Column(name = "Quantity", nullable = false)
    Integer quantity;
    @Column(name = "TotalPrice", nullable = false)
    BigDecimal totalPrice;
    @Column(name = "Choose")
    Boolean choose = false;

    @ManyToOne
    @JoinColumn(name = "IdCart")
    @JsonIgnore
    private Cart cart;

    @ManyToOne
    @JoinColumn(name = "IdProduct")
    @JsonIgnore
    private Product product;



}
