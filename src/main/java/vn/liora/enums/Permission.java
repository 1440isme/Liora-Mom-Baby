package vn.liora.enums;

import lombok.Getter;

@Getter
public enum Permission {
    // SẢN PHẨM
    PRODUCT_VIEW("product.view", "Xem sản phẩm", PermissionCategory.PRODUCTS),
    PRODUCT_CREATE("product.create", "Tạo sản phẩm", PermissionCategory.PRODUCTS),
    PRODUCT_UPDATE("product.update", "Sửa sản phẩm", PermissionCategory.PRODUCTS),
    PRODUCT_DELETE("product.delete", "Xóa sản phẩm", PermissionCategory.PRODUCTS),
    PRODUCT_MANAGE_IMAGES("product.manage_images", "Quản lý hình ảnh sản phẩm", PermissionCategory.PRODUCTS),

    // DANH MỤC
    CATEGORY_VIEW("category.view", "Xem danh mục", PermissionCategory.CATEGORIES),
    CATEGORY_CREATE("category.create", "Tạo danh mục", PermissionCategory.CATEGORIES),
    CATEGORY_UPDATE("category.update", "Sửa danh mục", PermissionCategory.CATEGORIES),
    CATEGORY_DELETE("category.delete", "Xóa danh mục", PermissionCategory.CATEGORIES),

    // THƯƠNG HIỆU
    BRAND_VIEW("brand.view", "Xem thương hiệu", PermissionCategory.BRANDS),
    BRAND_CREATE("brand.create", "Tạo thương hiệu", PermissionCategory.BRANDS),
    BRAND_UPDATE("brand.update", "Sửa thương hiệu", PermissionCategory.BRANDS),
    BRAND_DELETE("brand.delete", "Xóa thương hiệu", PermissionCategory.BRANDS),

    // ĐƠN HÀNG
    ORDER_VIEW("order.view", "Xem đơn hàng", PermissionCategory.ORDERS),
    ORDER_UPDATE_STATUS("order.update_status", "Cập nhật trạng thái đơn hàng", PermissionCategory.ORDERS),
    ORDER_MANAGE("order.manage", "Quản lý đơn hàng", PermissionCategory.ORDERS),

    // ĐÁNH GIÁ
    REVIEW_VIEW("review.view", "Xem đánh giá", PermissionCategory.REVIEWS),
    REVIEW_MANAGE("review.manage", "Quản lý đánh giá", PermissionCategory.REVIEWS),

    // NGƯỜI DÙNG
    USER_VIEW("user.view", "Xem người dùng", PermissionCategory.USERS),
    USER_CREATE("user.create", "Tạo người dùng", PermissionCategory.USERS),
    USER_UPDATE("user.update", "Sửa người dùng", PermissionCategory.USERS),
    USER_DELETE("user.delete", "Xóa người dùng", PermissionCategory.USERS),
    USER_MANAGE_ROLES("user.manage_roles", "Quản lý vai trò người dùng", PermissionCategory.USERS),

    // VAI TRÒ
    ROLE_VIEW("role.view", "Xem vai trò", PermissionCategory.ROLES),
    ROLE_CREATE("role.create", "Tạo vai trò", PermissionCategory.ROLES),
    ROLE_UPDATE("role.update", "Sửa vai trò", PermissionCategory.ROLES),
    ROLE_DELETE("role.delete", "Xóa vai trò", PermissionCategory.ROLES),
    ROLE_MANAGE_PERMISSIONS("role.manage_permissions", "Quản lý quyền hạn vai trò", PermissionCategory.ROLES),

    // QUYỀN HẠN
    PERMISSION_VIEW("permission.view", "Xem quyền hạn", PermissionCategory.PERMISSIONS),
    PERMISSION_MANAGE("permission.manage", "Quản lý quyền hạn", PermissionCategory.PERMISSIONS),

    // BANNER
    BANNER_VIEW("banner.view", "Xem banner", PermissionCategory.BANNERS),
    BANNER_CREATE("banner.create", "Tạo banner", PermissionCategory.BANNERS),
    BANNER_UPDATE("banner.update", "Sửa banner", PermissionCategory.BANNERS),
    BANNER_DELETE("banner.delete", "Xóa banner", PermissionCategory.BANNERS),

    // TRANG TĨNH
    STATIC_PAGE_VIEW("static_page.view", "Xem trang tĩnh", PermissionCategory.STATIC_PAGES),
    STATIC_PAGE_CREATE("static_page.create", "Tạo trang tĩnh", PermissionCategory.STATIC_PAGES),
    STATIC_PAGE_UPDATE("static_page.update", "Sửa trang tĩnh", PermissionCategory.STATIC_PAGES),
    STATIC_PAGE_DELETE("static_page.delete", "Xóa trang tĩnh", PermissionCategory.STATIC_PAGES),

    // HEADER & FOOTER (chỉ ADMIN)
    HEADER_MANAGE("header.manage", "Quản lý header", PermissionCategory.HEADER_FOOTER),
    FOOTER_MANAGE("footer.manage", "Quản lý footer", PermissionCategory.HEADER_FOOTER),

    // MÃ GIẢM GIÁ
    DISCOUNT_VIEW("discount.view", "Xem mã giảm giá", PermissionCategory.DISCOUNTS),
    DISCOUNT_CREATE("discount.create", "Tạo mã giảm giá", PermissionCategory.DISCOUNTS),
    DISCOUNT_UPDATE("discount.update", "Sửa mã giảm giá", PermissionCategory.DISCOUNTS),
    DISCOUNT_DELETE("discount.delete", "Xóa mã giảm giá", PermissionCategory.DISCOUNTS),

    // HỆ THỐNG
    SYSTEM_SETTINGS("system.settings", "Cài đặt hệ thống", PermissionCategory.SYSTEM),
    SYSTEM_LOGS("system.logs", "Xem logs hệ thống", PermissionCategory.SYSTEM);

    private final String name;
    private final String description;
    private final PermissionCategory category;

    Permission(String name, String description, PermissionCategory category) {
        this.name = name;
        this.description = description;
        this.category = category;
    }
}
