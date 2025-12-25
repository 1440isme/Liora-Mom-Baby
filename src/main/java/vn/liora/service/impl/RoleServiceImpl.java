package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import vn.liora.dto.request.RoleRequest;
import vn.liora.dto.response.RoleResponse;
import vn.liora.entity.Permission;
import vn.liora.enums.PermissionCategory;
import vn.liora.mapper.RoleMapper;
import vn.liora.repository.PermissionRepository;
import vn.liora.repository.RoleRepository;
import vn.liora.service.IRoleService;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleServiceImpl implements IRoleService {
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RoleMapper roleMapper;

    @Override
    public RoleResponse create(RoleRequest request) {
        var role = roleMapper.toRole(request);
        var permission = permissionRepository.findAllById(request.getPermissions());
        role.setPermissions(new HashSet<>(permission));
        roleRepository.save(role);
        return roleMapper.toRoleResponse(role);
    }

    @Override
    public List<RoleResponse> getAll() {
        return roleRepository.findAll()
                .stream().map(roleMapper::toRoleResponse).toList();
    }

    @Override
    public RoleResponse getById(String name) {
        var role = roleRepository.findById(name)
                .orElseThrow(() -> new RuntimeException("Role not found: " + name));
        return roleMapper.toRoleResponse(role);
    }

    @Override
    public RoleResponse update(String name, RoleRequest request) {
        var role = roleRepository.findById(name)
                .orElseThrow(() -> new RuntimeException("Role not found: " + name));

        // Update description
        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }

        // Update permissions
        if (request.getPermissions() != null) {
            var permissions = permissionRepository.findAllById(request.getPermissions());
            role.setPermissions(new HashSet<>(permissions));
        }

        roleRepository.save(role);
        return roleMapper.toRoleResponse(role);
    }

    @Override
    public void delete(String role) {
        roleRepository.deleteById(role);
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
    public RoleResponse updateRolePermissions(String roleName, List<String> permissionNames) {
        var role = roleRepository.findById(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        // Lấy permissions từ database
        var permissions = permissionRepository.findAllById(permissionNames);
        role.setPermissions(new HashSet<>(permissions));

        roleRepository.save(role);
        return roleMapper.toRoleResponse(role);
    }

    @Override
    public List<Permission> getRolePermissions(String roleName) {
        var role = roleRepository.findById(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        return new ArrayList<>(role.getPermissions());
    }
}
