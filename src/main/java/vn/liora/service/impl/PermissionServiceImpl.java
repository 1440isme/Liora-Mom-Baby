package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import vn.liora.dto.request.PermissionRequest;
import vn.liora.dto.response.PermissionResponse;
import vn.liora.entity.Permission;
import vn.liora.enums.PermissionCategory;
import vn.liora.mapper.PermissionMapper;
import vn.liora.repository.PermissionRepository;
import vn.liora.service.IPermissionService;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionServiceImpl implements IPermissionService {
    PermissionRepository permissionRepository;
    PermissionMapper permissionMapper;

    @Override
    public PermissionResponse create(PermissionRequest request) {
        Permission permission = permissionMapper.toPermission(request);
        permission = permissionRepository.save(permission);
        return permissionMapper.toPermissionResponse(permission);
    }

    @Override
    public List<PermissionResponse> getAll() {
        var permission = permissionRepository.findAll();
        return permission.stream().map(permissionMapper::toPermissionResponse).toList();
    }

    @Override
    public PermissionResponse getById(String name) {
        var permission = permissionRepository.findById(name)
                .orElseThrow(() -> new RuntimeException("Permission not found: " + name));
        return permissionMapper.toPermissionResponse(permission);
    }

    @Override
    public PermissionResponse update(String name, PermissionRequest request) {
        var permission = permissionRepository.findById(name)
                .orElseThrow(() -> new RuntimeException("Permission not found: " + name));

        // Update description
        if (request.getDescription() != null) {
            permission.setDescription(request.getDescription());
        }

        permissionRepository.save(permission);
        return permissionMapper.toPermissionResponse(permission);
    }

    @Override
    public void delete(String permission) {
        permissionRepository.deleteById(permission);
    }

    @Override
    public Map<PermissionCategory, List<Permission>> getPermissionsByCategory() {
        List<Permission> allPermissions = permissionRepository.findAll();
        return allPermissions.stream()
                .collect(Collectors.groupingBy(permission -> {
                    // Tìm category dựa trên permission name
                    for (vn.liora.enums.Permission permissionEnum : vn.liora.enums.Permission.values()) {
                        if (permissionEnum.getName().equals(permission.getName())) {
                            return permissionEnum.getCategory();
                        }
                    }
                    return PermissionCategory.SYSTEM; // Default category
                }));
    }

    @Override
    public List<Permission> getPermissionsByCategory(PermissionCategory category) {
        return permissionRepository.findAll().stream()
                .filter(permission -> {
                    for (vn.liora.enums.Permission permissionEnum : vn.liora.enums.Permission.values()) {
                        if (permissionEnum.getName().equals(permission.getName())) {
                            return permissionEnum.getCategory() == category;
                        }
                    }
                    return false;
                })
                .collect(Collectors.toList());
    }
}
