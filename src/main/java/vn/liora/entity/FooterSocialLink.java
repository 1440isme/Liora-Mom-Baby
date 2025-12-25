package vn.liora.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "footer_social_links")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FooterSocialLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "footer_id", nullable = false)
    private Footer footer;

    @Column(name = "platform", nullable = false, columnDefinition = "NVARCHAR(50)")
    private String platform; // instagram, facebook, tiktok, youtube, etc.

    @Column(name = "url", nullable = false, columnDefinition = "NVARCHAR(500)")
    private String url;

    @Column(name = "icon_class", columnDefinition = "NVARCHAR(100)")
    private String iconClass; // fab fa-instagram, fab fa-facebook, etc.

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public FooterSocialLink(Footer footer, String platform, String url, String iconClass, Integer displayOrder) {
        this.footer = footer;
        this.platform = platform;
        this.url = url;
        this.iconClass = iconClass;
        this.displayOrder = displayOrder;
        this.isActive = true;
    }
}
