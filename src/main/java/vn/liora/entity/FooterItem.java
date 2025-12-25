package vn.liora.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import vn.liora.enums.FooterLinkType;

import java.time.LocalDateTime;

@Entity
@Table(name = "footer_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FooterItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", nullable = false)
    private FooterColumn column;

    @Column(name = "title", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String title;

    @Column(name = "url", columnDefinition = "NVARCHAR(500)")
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(name = "link_type", nullable = false)
    private FooterLinkType linkType = FooterLinkType.INTERNAL;

    @Column(name = "item_order", nullable = false)
    private Integer itemOrder;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Reference to static page if it's an internal link
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "static_page_id")
    private StaticPage staticPage;

    public FooterItem(FooterColumn column, String title, String url, FooterLinkType linkType, Integer itemOrder) {
        this.column = column;
        this.title = title;
        this.url = url;
        this.linkType = linkType;
        this.itemOrder = itemOrder;
        this.isActive = true;
    }
}
