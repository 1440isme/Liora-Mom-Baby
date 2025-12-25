package vn.liora.enums;

public enum FooterLinkType {
    INTERNAL, // Link đến trang nội bộ (static pages)
    EXTERNAL, // Link đến trang bên ngoài
    PARENT_CATEGORY, // Danh mục cha (click xổ ra danh mục con)
    CATEGORY, // Alias cho PARENT_CATEGORY (tương thích với frontend)
    PAGE, // Link đến trang tĩnh (chi tiết)
    PAGE_LIST // Link đến trang tổng hợp danh sách static pages theo sectionSlug
}
