package vn.liora.controller.admin;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.RoleRequest;
import vn.liora.dto.response.RoleResponse;
import vn.liora.entity.Permission;
import vn.liora.enums.PermissionCategory;
import vn.liora.service.IRoleService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/roles")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@PreAuthorize("hasAuthority('role.view')")
public class RoleController {
    IRoleService roleService;

    @PostMapping
    @PreAuthorize("hasAuthority('role.create')")
    ApiResponse<RoleResponse> create(@RequestBody RoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.create(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<RoleResponse>> getAll() {
        return ApiResponse.<List<RoleResponse>>builder()
                .result(roleService.getAll())
                .build();
    }

    @GetMapping("/{name}")
    ApiResponse<RoleResponse> getById(@PathVariable String name) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.getById(name))
                .build();
    }

    @PutMapping("/{name}")
    @PreAuthorize("hasAuthority('role.update')")
    ApiResponse<RoleResponse> update(@PathVariable String name, @RequestBody RoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.update(name, request))
                .build();
    }

    @DeleteMapping("/{role}")
    @PreAuthorize("hasAuthority('role.delete')")
    ApiResponse<Void> delete(@PathVariable String role) {
        roleService.delete(role);
        return ApiResponse.<Void>builder().build();
    }

    // Mới: APIs quản lý quyền theo danh mục
    @GetMapping("/permissions/by-category")
    ApiResponse<Map<PermissionCategory, List<Permission>>> getPermissionsByCategory() {
        return ApiResponse.<Map<PermissionCategory, List<Permission>>>builder()
                .result(roleService.getPermissionsByCategory())
                .build();
    }

    @PutMapping("/{roleName}/permissions")
    @PreAuthorize("hasAuthority('role.manage_permissions')")
    ApiResponse<RoleResponse> updateRolePermissions(
            @PathVariable String roleName,
            @RequestBody List<String> permissionNames) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.updateRolePermissions(roleName, permissionNames))
                .message("Cập nhật quyền hạn cho vai trò thành công")
                .build();
    }

    @GetMapping("/{roleName}/permissions")
    ApiResponse<List<Permission>> getRolePermissions(@PathVariable String roleName) {
        return ApiResponse.<List<Permission>>builder()
                .result(roleService.getRolePermissions(roleName))
                .build();
    }
}
