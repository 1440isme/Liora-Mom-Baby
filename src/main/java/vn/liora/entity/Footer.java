package vn.liora.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "footers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Footer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "brand_name", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String brandName;

    @Column(name = "brand_description", columnDefinition = "NVARCHAR(255)")
    private String brandDescription;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Social links
    @OneToMany(mappedBy = "footer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FooterSocialLink> socialLinks;

    // Footer columns
    @OneToMany(mappedBy = "footer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FooterColumn> columns;

    public Footer(String brandName, String brandDescription) {
        this.brandName = brandName;
        this.brandDescription = brandDescription;
        this.isActive = true;
    }
}
