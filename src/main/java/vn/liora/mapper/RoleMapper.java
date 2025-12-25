package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.liora.dto.request.PermissionRequest;
import vn.liora.dto.request.RoleRequest;
import vn.liora.dto.response.PermissionResponse;
import vn.liora.dto.response.RoleResponse;
import vn.liora.entity.Permission;
import vn.liora.entity.Role;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    @Mapping(target = "permissions", ignore = true)
    Role toRole(RoleRequest request);
    RoleResponse toRoleResponse(Role role);
}
