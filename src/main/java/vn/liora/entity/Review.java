package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "Reviews")
@Builder
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdReview")
    private Long reviewId;

    @Column(name = "Content", columnDefinition = "NVARCHAR(MAX)", nullable = true)
    private String content;

    @Column(name = "Rating", nullable = false)
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    @Column(name = "Anonymous", nullable = false)
    private Boolean anonymous = false;

    // Thêm field để admin ẩn/hiện review
    @Column(name = "IsVisible", nullable = false)
    @Builder.Default
    private Boolean isVisible = true; // Mặc định hiển thị

    @Column(name = "CreatedAt", nullable = false, columnDefinition = "DATETIME")
    private LocalDateTime createdAt;

    @Column(name = "LastUpdate", nullable = false, columnDefinition = "DATETIME")
    private LocalDateTime lastUpdate;

    @Column(name = "IdUser", nullable = false)
    private Long userId;

    @Column(name = "IdProduct", nullable = false)
    private Long productId;

    // ========== RELATIONSHIPS ==========
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "IdOrderProduct", nullable = false)
    @JsonIgnore
    private OrderProduct orderProduct;
}