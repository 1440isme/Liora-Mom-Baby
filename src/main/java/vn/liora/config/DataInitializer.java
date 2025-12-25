package vn.liora.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import vn.liora.entity.Permission;
import vn.liora.entity.Role;
import vn.liora.repository.PermissionRepository;
import vn.liora.repository.RoleRepository;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        initializePermissions();
        initializeRoles();
    }

    private void initializePermissions() {
        log.info("Đang khởi tạo permissions...");

        for (vn.liora.enums.Permission permissionEnum : vn.liora.enums.Permission.values()) {
            if (!permissionRepository.existsById(permissionEnum.getName())) {
                Permission permission = Permission.builder()
                        .name(permissionEnum.getName())
                        .description(permissionEnum.getDescription())
                        .build();
                permissionRepository.save(permission);
                log.info("Đã tạo permission: {}", permissionEnum.getName());
            }
        }

        log.info("Hoàn thành khởi tạo permissions");
    }

    private void initializeRoles() {
        log.info("Đang khởi tạo roles...");

        // Tạo hoặc cập nhật role ADMIN với toàn quyền
        Set<Permission> adminPermissions = new HashSet<>();
        for (vn.liora.enums.Permission permissionEnum : vn.liora.enums.Permission.values()) {
            permissionRepository.findById(permissionEnum.getName())
                    .ifPresent(adminPermissions::add);
        }

        Role adminRole = roleRepository.findById("ADMIN").orElse(null);
        if (adminRole == null) {
            // Tạo mới
            adminRole = Role.builder()
                    .name("ADMIN")
                    .description("Quản trị viên - Toàn quyền hệ thống")
                    .permissions(adminPermissions)
                    .build();
            log.info("Đã tạo role ADMIN với {} permissions", adminPermissions.size());
        } else {
            // Cập nhật permissions cho role đã tồn tại
            adminRole.setPermissions(adminPermissions);
            log.info("Đã cập nhật role ADMIN với {} permissions", adminPermissions.size());
        }
        roleRepository.save(adminRole);

        // Tạo role MANAGER với quyền hạn hạn chế
        if (!roleRepository.existsById("MANAGER")) {
            Set<Permission> managerPermissions = new HashSet<>();

            // Quyền sản phẩm
            addPermissionIfExists(managerPermissions, "product.view");
            addPermissionIfExists(managerPermissions, "product.create");
            addPermissionIfExists(managerPermissions, "product.update");
            addPermissionIfExists(managerPermissions, "product.delete");
            addPermissionIfExists(managerPermissions, "product.manage_images");

            // Quyền danh mục
            addPermissionIfExists(managerPermissions, "category.view");
            addPermissionIfExists(managerPermissions, "category.create");
            addPermissionIfExists(managerPermissions, "category.update");
            addPermissionIfExists(managerPermissions, "category.delete");

            // Quyền thương hiệu
            addPermissionIfExists(managerPermissions, "brand.view");
            addPermissionIfExists(managerPermissions, "brand.create");
            addPermissionIfExists(managerPermissions, "brand.update");
            addPermissionIfExists(managerPermissions, "brand.delete");

            // Quyền đơn hàng
            addPermissionIfExists(managerPermissions, "order.view");
            addPermissionIfExists(managerPermissions, "order.update_status");
            addPermissionIfExists(managerPermissions, "order.manage");

            // Quyền đánh giá
            addPermissionIfExists(managerPermissions, "review.view");
            addPermissionIfExists(managerPermissions, "review.manage");

            // Quyền banner (chỉ banner sản phẩm, không phải banner chính)
            addPermissionIfExists(managerPermissions, "banner.view");
            addPermissionIfExists(managerPermissions, "banner.create");
            addPermissionIfExists(managerPermissions, "banner.update");
            addPermissionIfExists(managerPermissions, "banner.delete");

            // Quyền trang tĩnh
            addPermissionIfExists(managerPermissions, "static_page.view");
            addPermissionIfExists(managerPermissions, "static_page.create");
            addPermissionIfExists(managerPermissions, "static_page.update");
            addPermissionIfExists(managerPermissions, "static_page.delete");

            // Quyền mã giảm giá
            addPermissionIfExists(managerPermissions, "discount.view");
            addPermissionIfExists(managerPermissions, "discount.create");
            addPermissionIfExists(managerPermissions, "discount.update");
            addPermissionIfExists(managerPermissions, "discount.delete");

            Role managerRole = Role.builder()
                    .name("MANAGER")
                    .description("Quản lý - Quyền quản lý sản phẩm, đơn hàng, nội dung")
                    .permissions(managerPermissions)
                    .build();
            roleRepository.save(managerRole);
            log.info("Đã tạo role MANAGER với {} permissions", managerPermissions.size());
        }

        // Tạo role USER cho người dùng thông thường
        if (!roleRepository.existsById("USER")) {
            Set<Permission> userPermissions = new HashSet<>();

            // USER role không có admin permissions, chỉ có quyền cơ bản
            // Có thể thêm các quyền user-specific nếu cần
            // Hiện tại để trống vì USER không cần admin permissions

            Role userRole = Role.builder()
                    .name("USER")
                    .description("Người dùng thông thường - Không có quyền admin")
                    .permissions(userPermissions)
                    .build();
            roleRepository.save(userRole);
            log.info("Đã tạo role USER với {} permissions", userPermissions.size());
        }

        log.info("Hoàn thành khởi tạo roles");
    }

    private void addPermissionIfExists(Set<Permission> permissions, String permissionName) {
        permissionRepository.findById(permissionName)
                .ifPresent(permissions::add);
    }
}
