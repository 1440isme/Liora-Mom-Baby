package vn.liora.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.liora.entity.StaticPage;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaticPageResponse {

    private Long id;
    private String title;
    private String slug;
    private String content;
    private String seoTitle;
    private String seoDescription;
    private String seoKeywords;
    private String sectionSlug;
    private Boolean isActive;
    private Boolean isPublished;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Ảnh thumbnail rút ra từ content (ảnh đầu tiên), có thể null
    private String thumbnailUrl;

    // Constructor từ entity
    public StaticPageResponse(StaticPage staticPage) {
        this.id = staticPage.getId();
        this.title = staticPage.getTitle();
        this.slug = staticPage.getSlug();
        this.content = staticPage.getContent();
        this.seoTitle = staticPage.getSeoTitle();
        this.seoDescription = staticPage.getSeoDescription();
        this.seoKeywords = staticPage.getSeoKeywords();
        this.sectionSlug = staticPage.getSectionSlug();
        this.isActive = staticPage.getIsActive();
        this.isPublished = staticPage.getIsPublished();
        this.publishedAt = staticPage.getPublishedAt();
        this.createdAt = staticPage.getCreatedAt();
        this.updatedAt = staticPage.getUpdatedAt();

        // Trích ảnh đầu tiên từ nội dung HTML làm thumbnail
        this.thumbnailUrl = extractFirstImageSrc(this.content);
    }

    private String extractFirstImageSrc(String html) {
        if (html == null || html.isEmpty())
            return null;
        // Regex đơn giản để tìm <img ... src="...">
        try {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile("<img[^>]+src=\\\"([^\\\"]+)\\\"",
                    java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher m = p.matcher(html);
            if (m.find()) {
                return m.group(1);
            }
            // Thử với nháy đơn
            p = java.util.regex.Pattern.compile("<img[^>]+src=\\'([^\\']+)\\'",
                    java.util.regex.Pattern.CASE_INSENSITIVE);
            m = p.matcher(html);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
