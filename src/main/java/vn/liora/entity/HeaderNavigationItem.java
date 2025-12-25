package vn.liora.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import vn.liora.enums.FooterLinkType;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "header_navigation_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeaderNavigationItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @Column(name = "is_category_parent", nullable = false)
    private Boolean isCategoryParent = false;

    @Column(name = "parent_item_id")
    private Long parentItemId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Reference to static page if it's an internal link
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "static_page_id")
    @JsonIgnore
    private StaticPage staticPage;

    // Sub-items for this navigation item (transient field, not persisted)
    @Transient
    private List<HeaderNavigationItem> subItems;

    public HeaderNavigationItem(String title, String url, FooterLinkType linkType, Integer itemOrder) {
        this.title = title;
        this.url = url;
        this.linkType = linkType;
        this.itemOrder = itemOrder;
        this.isActive = true;
        this.isCategoryParent = false;
    }

    public HeaderNavigationItem(String title, String url, FooterLinkType linkType, Integer itemOrder,
            Long parentItemId) {
        this.title = title;
        this.url = url;
        this.linkType = linkType;
        this.itemOrder = itemOrder;
        this.isActive = true;
        this.isCategoryParent = false;
        this.parentItemId = parentItemId;
    }

    @Override
    public String toString() {
        return "HeaderNavigationItem{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", url='" + url + '\'' +
                ", linkType=" + linkType +
                ", itemOrder=" + itemOrder +
                ", isActive=" + isActive +
                ", isCategoryParent=" + isCategoryParent +
                ", parentItemId=" + parentItemId +
                '}';
    }
}
