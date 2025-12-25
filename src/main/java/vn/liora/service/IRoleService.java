package vn.liora.service;

import vn.liora.dto.request.RoleRequest;
import vn.liora.dto.response.RoleResponse;
import vn.liora.enums.PermissionCategory;

import java.util.List;
import java.util.Map;

public interface IRoleService {
    RoleResponse create(RoleRequest request);

    List<RoleResponse> getAll();

    RoleResponse getById(String name);

    RoleResponse update(String name, RoleRequest request);

    void delete(String role);

    // Mới: Quản lý quyền theo danh mục
    Map<PermissionCategory, List<vn.liora.entity.Permission>> getPermissionsByCategory();

    RoleResponse updateRolePermissions(String roleName, List<String> permissionNames);

    List<vn.liora.entity.Permission> getRolePermissions(String roleName);
}
