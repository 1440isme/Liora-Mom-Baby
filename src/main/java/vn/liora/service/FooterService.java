package vn.liora.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.FooterRequest;
import vn.liora.dto.request.FooterColumnRequest;
import vn.liora.dto.request.FooterItemRequest;
import vn.liora.dto.request.FooterSocialLinkRequest;
import vn.liora.entity.*;
import vn.liora.repository.*;
import vn.liora.enums.FooterLinkType;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class FooterService {

    @Autowired
    private FooterRepository footerRepository;

    @Autowired
    private FooterColumnRepository footerColumnRepository;

    @Autowired
    private FooterItemRepository footerItemRepository;

    @Autowired
    private FooterSocialLinkRepository footerSocialLinkRepository;

    @Autowired
    private StaticPageRepository staticPageRepository;

    public Footer getActiveFooter() {
        return footerRepository.getActiveFooter().orElse(null);
    }

    public Optional<Footer> findActiveFooter() {
        return footerRepository.findActiveFooter();
    }

    public Footer saveOrUpdateFooter(FooterRequest request) {
        // Deactivate current footer
        Optional<Footer> currentFooter = footerRepository.findActiveFooter();
        if (currentFooter.isPresent()) {
            currentFooter.get().setIsActive(false);
            footerRepository.save(currentFooter.get());
        }

        // Create new footer
        Footer footer = new Footer();
        footer.setBrandName(request.getBrandName());
        footer.setBrandDescription(request.getBrandDescription());
        footer.setIsActive(true);

        footer = footerRepository.save(footer);

        // Save columns (only non-empty ones)
        if (request.getColumns() != null) {
            int columnIndex = 0;
            for (int i = 0; i < request.getColumns().size(); i++) {
                FooterColumnRequest columnRequest = request.getColumns().get(i);

                // Skip empty columns (no title or empty title)
                if (columnRequest.getTitle() == null || columnRequest.getTitle().trim().isEmpty()) {
                    continue;
                }

                FooterColumn column = new FooterColumn();
                column.setFooter(footer);
                column.setTitle(columnRequest.getTitle());
                column.setColumnOrder(
                        columnRequest.getColumnOrder() != null ? columnRequest.getColumnOrder() : columnIndex + 1);
                column = footerColumnRepository.save(column);

                // Save items for this column
                if (columnRequest.getItems() != null) {
                    for (int j = 0; j < columnRequest.getItems().size(); j++) {
                        FooterItemRequest itemRequest = columnRequest.getItems().get(j);

                        // Skip empty items
                        if (itemRequest.getTitle() == null || itemRequest.getTitle().trim().isEmpty()) {
                            continue;
                        }

                        FooterItem item = new FooterItem();
                        item.setColumn(column);
                        item.setTitle(itemRequest.getTitle());
                        item.setUrl(itemRequest.getUrl() != null ? itemRequest.getUrl() : "#");
                        item.setLinkType(itemRequest.getLinkType() != null ? itemRequest.getLinkType()
                                : FooterLinkType.INTERNAL);
                        item.setItemOrder(itemRequest.getItemOrder() != null ? itemRequest.getItemOrder() : j + 1);

                        // Set static page reference if it's an internal link
                        if (itemRequest.getStaticPageId() != null) {
                            Optional<StaticPage> staticPage = staticPageRepository
                                    .findById(itemRequest.getStaticPageId());
                            staticPage.ifPresent(item::setStaticPage);
                        }

                        footerItemRepository.save(item);
                    }
                }

                columnIndex++; // Increment only for saved columns
            }
        }

        // Save social links (only non-empty ones)
        if (request.getSocialLinks() != null) {
            int socialIndex = 0;
            for (int i = 0; i < request.getSocialLinks().size(); i++) {
                FooterSocialLinkRequest socialLinkRequest = request.getSocialLinks().get(i);

                // Skip empty social links (no platform or empty platform)
                if (socialLinkRequest.getPlatform() == null || socialLinkRequest.getPlatform().trim().isEmpty()) {
                    continue;
                }

                FooterSocialLink socialLink = new FooterSocialLink();
                socialLink.setFooter(footer);
                socialLink.setPlatform(socialLinkRequest.getPlatform());
                socialLink.setUrl(socialLinkRequest.getUrl() != null ? socialLinkRequest.getUrl() : "");
                socialLink.setIconClass(socialLinkRequest.getIconClass() != null ? socialLinkRequest.getIconClass()
                        : "fab fa-facebook");
                socialLink.setDisplayOrder(
                        socialLinkRequest.getDisplayOrder() != null ? socialLinkRequest.getDisplayOrder()
                                : socialIndex + 1);
                footerSocialLinkRepository.save(socialLink);

                socialIndex++;
            }
        }

        return footer;
    }

    public List<FooterColumn> getActiveColumns(Long footerId) {
        return footerColumnRepository.findActiveColumnsByFooterId(footerId);
    }

    public List<FooterItem> getActiveItems(Long columnId) {
        return footerItemRepository.findActiveItemsByColumnId(columnId);
    }

    public List<FooterSocialLink> getActiveSocialLinks(Long footerId) {
        return footerSocialLinkRepository.findActiveSocialLinksByFooterId(footerId);
    }

    // Method để khởi tạo dữ liệu mẫu
    public void initializeDefaultFooter() {
        try {
            // Kiểm tra xem đã có footer chưa
            if (footerRepository.findActiveFooter().isPresent()) {
                return; // Đã có footer rồi
            }

            // Tạo footer mặc định
            Footer footer = new Footer();
            footer.setBrandName("Liora ✨");
            footer.setBrandDescription(
                    "Your trusted destination for authentic Korean beauty products. Discover the secret to radiant, healthy skin with our curated K-beauty collection.");
            footer.setIsActive(true);
            footer = footerRepository.save(footer);

            // Tạo social links mặc định
            FooterSocialLink instagram = new FooterSocialLink(footer, "instagram", "https://instagram.com/liora",
                    "fab fa-instagram", 1);
            FooterSocialLink facebook = new FooterSocialLink(footer, "facebook", "https://facebook.com/liora",
                    "fab fa-facebook", 2);
            FooterSocialLink tiktok = new FooterSocialLink(footer, "tiktok", "https://tiktok.com/@liora",
                    "fab fa-tiktok", 3);
            FooterSocialLink youtube = new FooterSocialLink(footer, "youtube", "https://youtube.com/liora",
                    "fab fa-youtube", 4);

            footerSocialLinkRepository.save(instagram);
            footerSocialLinkRepository.save(facebook);
            footerSocialLinkRepository.save(tiktok);
            footerSocialLinkRepository.save(youtube);

            // Tạo columns mặc định
            FooterColumn shopColumn = new FooterColumn(footer, "Shop", 1);
            shopColumn = footerColumnRepository.save(shopColumn);

            FooterItem skincare = new FooterItem(shopColumn, "Skincare", "/products?category=skincare",
                    FooterLinkType.PAGE, 1);
            FooterItem makeup = new FooterItem(shopColumn, "Makeup", "/products?category=makeup",
                    FooterLinkType.PAGE, 2);
            FooterItem bestsellers = new FooterItem(shopColumn, "Bestsellers", "/products?sort=bestsellers",
                    FooterLinkType.PAGE, 3);
            FooterItem newArrivals = new FooterItem(shopColumn, "New Arrivals", "/products?sort=newest",
                    FooterLinkType.PAGE,
                    4);

            footerItemRepository.save(skincare);
            footerItemRepository.save(makeup);
            footerItemRepository.save(bestsellers);
            footerItemRepository.save(newArrivals);

            FooterColumn supportColumn = new FooterColumn(footer, "Support", 2);
            supportColumn = footerColumnRepository.save(supportColumn);

            FooterItem contact = new FooterItem(supportColumn, "Contact Us", "/about", FooterLinkType.INTERNAL, 1);
            FooterItem shipping = new FooterItem(supportColumn, "Shipping Info", "/about", FooterLinkType.INTERNAL,
                    2);
            FooterItem returns = new FooterItem(supportColumn, "Returns", "/about", FooterLinkType.INTERNAL, 3);
            FooterItem sizeGuide = new FooterItem(supportColumn, "Size Guide", "/about", FooterLinkType.INTERNAL,
                    4);

            footerItemRepository.save(contact);
            footerItemRepository.save(shipping);
            footerItemRepository.save(returns);
            footerItemRepository.save(sizeGuide);

            FooterColumn aboutColumn = new FooterColumn(footer, "About", 3);
            aboutColumn = footerColumnRepository.save(aboutColumn);

            FooterItem ourStory = new FooterItem(aboutColumn, "Our Story", "/about", FooterLinkType.INTERNAL, 1);
            FooterItem kBeautyGuide = new FooterItem(aboutColumn, "K-Beauty Guide", "/about",
                    FooterLinkType.INTERNAL, 2);
            FooterItem ingredients = new FooterItem(aboutColumn, "Ingredients", "/about", FooterLinkType.INTERNAL,
                    3);
            FooterItem blog = new FooterItem(aboutColumn, "Blog", "/about", FooterLinkType.INTERNAL, 4);

            footerItemRepository.save(ourStory);
            footerItemRepository.save(kBeautyGuide);
            footerItemRepository.save(ingredients);
            footerItemRepository.save(blog);

            FooterColumn legalColumn = new FooterColumn(footer, "Legal", 4);
            legalColumn = footerColumnRepository.save(legalColumn);

            FooterItem privacy = new FooterItem(legalColumn, "Privacy Policy", "/about", FooterLinkType.INTERNAL, 1);
            FooterItem terms = new FooterItem(legalColumn, "Terms of Service", "/about", FooterLinkType.INTERNAL, 2);
            FooterItem cookies = new FooterItem(legalColumn, "Cookie Policy", "/about", FooterLinkType.INTERNAL, 3);

            footerItemRepository.save(privacy);
            footerItemRepository.save(terms);
            footerItemRepository.save(cookies);

        } catch (Exception e) {
            System.err.println("Error initializing default footer: " + e.getMessage());
        }
    }
}
