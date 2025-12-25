package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.liora.entity.Permission;
import vn.liora.entity.Role;
import vn.liora.entity.User;
import vn.liora.enums.PermissionCategory;
import vn.liora.service.IAuthorizationService;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthorizationServiceImpl implements IAuthorizationService {

    @Override
    public boolean hasPermission(User user, String permission) {
        if (user == null || permission == null) {
            return false;
        }

        Set<String> userPermissions = getUserPermissions(user);
        return userPermissions.contains(permission);
    }

    @Override
    public boolean hasAnyPermission(User user, String... permissions) {
        if (user == null || permissions == null || permissions.length == 0) {
            return false;
        }

        Set<String> userPermissions = getUserPermissions(user);
        return Arrays.stream(permissions).anyMatch(userPermissions::contains);
    }

    @Override
    public boolean hasAllPermissions(User user, String... permissions) {
        if (user == null || permissions == null || permissions.length == 0) {
            return false;
        }

        Set<String> userPermissions = getUserPermissions(user);
        return Arrays.stream(permissions).allMatch(userPermissions::contains);
    }

    @Override
    public Set<String> getUserPermissions(User user) {
        Set<String> permissions = new HashSet<>();

        if (user == null || user.getRoles() == null) {
            return permissions;
        }

        // Lấy quyền từ roles của user
        for (Role role : user.getRoles()) {
            if (role.getPermissions() != null) {
                for (Permission permission : role.getPermissions()) {
                    permissions.add(permission.getName());
                }
            }
        }

        // TODO: Thêm logic lấy quyền trực tiếp của user (nếu có UserPermission entity)
        // Hiện tại chỉ lấy quyền từ role, sau này có thể mở rộng để lấy quyền trực tiếp

        log.debug("User {} has permissions: {}", user.getUsername(), permissions);
        return permissions;
    }

    @Override
    public Map<PermissionCategory, List<String>> getUserPermissionsByCategory(User user) {
        Set<String> userPermissions = getUserPermissions(user);
        Map<PermissionCategory, List<String>> permissionsByCategory = new HashMap<>();

        // Group permissions by category
        for (String permissionName : userPermissions) {
            PermissionCategory category = getPermissionCategory(permissionName);
            permissionsByCategory.computeIfAbsent(category, k -> new ArrayList<>()).add(permissionName);
        }

        return permissionsByCategory;
    }

    /**
     * Lấy category của permission dựa trên tên permission
     */
    private PermissionCategory getPermissionCategory(String permissionName) {
        for (vn.liora.enums.Permission permissionEnum : vn.liora.enums.Permission.values()) {
            if (permissionEnum.getName().equals(permissionName)) {
                return permissionEnum.getCategory();
            }
        }
        return PermissionCategory.SYSTEM; // Default category
    }
}
