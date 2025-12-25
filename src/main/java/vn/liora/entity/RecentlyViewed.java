package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "RecentlyViewed", 
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_user_product", columnNames = {"IdUser", "IdProduct"}),
           @UniqueConstraint(name = "uk_guest_product", columnNames = {"IdGuest", "IdProduct"})
       })
public class RecentlyViewed {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdRecentlyViewed")
    Long idRecentlyViewed;

    @Column(name = "IdGuest", nullable = true)
    String guestId;

    @ManyToOne
    @JoinColumn(name = "IdUser", nullable = true)
    @JsonIgnore
    private User user;

    @ManyToOne
    @JoinColumn(name = "IdProduct")
    @JsonIgnore
    private Product product;

    @Column(name = "ViewedAt", nullable = false, columnDefinition = "DATETIME")
    LocalDateTime viewedAt;

    @PrePersist
    protected void onCreate() {
        if (viewedAt == null) {
            viewedAt = LocalDateTime.now();
        }
    }
}
