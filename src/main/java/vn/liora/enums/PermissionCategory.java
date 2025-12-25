package vn.liora.enums;

import lombok.Getter;

@Getter
public enum PermissionCategory {
    PRODUCTS("Sản phẩm", "product"),
    CATEGORIES("Danh mục", "category"),
    BRANDS("Thương hiệu", "brand"),
    ORDERS("Đơn hàng", "order"),
    REVIEWS("Đánh giá", "review"),
    USERS("Người dùng", "user"),
    ROLES("Vai trò", "role"),
    PERMISSIONS("Quyền hạn", "permission"),
    BANNERS("Banner", "banner"),
    STATIC_PAGES("Trang tĩnh", "static_page"),
    HEADER_FOOTER("Header & Footer", "header_footer"),
    DISCOUNTS("Mã giảm giá", "discount"),
    SYSTEM("Hệ thống", "system");

    private final String displayName;
    private final String prefix;

    PermissionCategory(String displayName, String prefix) {
        this.displayName = displayName;
        this.prefix = prefix;
    }
}
