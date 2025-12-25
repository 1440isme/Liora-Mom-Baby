package vn.liora.service;

import vn.liora.dto.request.PermissionRequest;
import vn.liora.dto.response.PermissionResponse;
import vn.liora.enums.PermissionCategory;

import java.util.List;
import java.util.Map;

public interface IPermissionService {
    PermissionResponse create(PermissionRequest request);

    List<PermissionResponse> getAll();

    PermissionResponse getById(String name);

    PermissionResponse update(String name, PermissionRequest request);

    void delete(String permission);

    // Mới: Quản lý quyền theo danh mục
    Map<PermissionCategory, List<vn.liora.entity.Permission>> getPermissionsByCategory();

    List<vn.liora.entity.Permission> getPermissionsByCategory(PermissionCategory category);
}
