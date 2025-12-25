package vn.liora.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "static_pages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaticPage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String title;

    @Column(name = "slug", nullable = false, unique = true, columnDefinition = "NVARCHAR(255)")
    private String slug;

    @Column(name = "content", columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "section_slug", columnDefinition = "NVARCHAR(255)")
    private String sectionSlug;

    @Column(name = "seo_title", length = 255, columnDefinition = "NVARCHAR(255)")
    private String seoTitle;

    @Column(name = "seo_description", length = 500, columnDefinition = "NVARCHAR(500)")
    private String seoDescription;

    @Column(name = "seo_keywords", length = 500, columnDefinition = "NVARCHAR(500)")
    private String seoKeywords;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_published", nullable = false)
    private Boolean isPublished = false;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructor for easy creation
    public StaticPage(String title, String slug, String content) {
        this.title = title;
        this.slug = slug;
        this.content = content;
        this.isActive = true;
        this.isPublished = false;
    }

    // Method to generate slug from title
    public void generateSlugFromTitle() {
        if (this.title != null) {
            this.slug = this.title.toLowerCase()
                    .replaceAll("[^a-z0-9\\s]", "")
                    .replaceAll("\\s+", "-")
                    .trim();
        }
    }
}
