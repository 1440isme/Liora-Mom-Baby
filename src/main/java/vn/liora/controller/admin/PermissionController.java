package vn.liora.controller.admin;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.PermissionRequest;
import vn.liora.dto.response.PermissionResponse;
import vn.liora.entity.Permission;
import vn.liora.enums.PermissionCategory;
import vn.liora.service.IPermissionService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/permissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@PreAuthorize("hasAuthority('permission.view')")
public class PermissionController {
    IPermissionService permissionService;

    @PostMapping
    @PreAuthorize("hasAuthority('permission.create')")
    ApiResponse<PermissionResponse> create(@RequestBody PermissionRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .result(permissionService.create(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<PermissionResponse>> getAll() {
        return ApiResponse.<List<PermissionResponse>>builder()
                .result(permissionService.getAll())
                .build();
    }

    @GetMapping("/{name}")
    ApiResponse<PermissionResponse> getById(@PathVariable String name) {
        return ApiResponse.<PermissionResponse>builder()
                .result(permissionService.getById(name))
                .build();
    }

    @PutMapping("/{name}")
    @PreAuthorize("hasAuthority('permission.update')")
    ApiResponse<PermissionResponse> update(@PathVariable String name, @RequestBody PermissionRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .result(permissionService.update(name, request))
                .build();
    }

    @DeleteMapping("/{permission}")
    @PreAuthorize("hasAuthority('permission.delete')")
    ApiResponse<Void> delete(@PathVariable String permission) {
        permissionService.delete(permission);
        return ApiResponse.<Void>builder().build();
    }

    // Mới: APIs quản lý quyền theo danh mục
    @GetMapping("/by-category")
    ApiResponse<Map<PermissionCategory, List<Permission>>> getPermissionsByCategory() {
        return ApiResponse.<Map<PermissionCategory, List<Permission>>>builder()
                .result(permissionService.getPermissionsByCategory())
                .build();
    }

    @GetMapping("/by-category/{category}")
    ApiResponse<List<Permission>> getPermissionsByCategory(@PathVariable PermissionCategory category) {
        return ApiResponse.<List<Permission>>builder()
                .result(permissionService.getPermissionsByCategory(category))
                .build();
    }
}
