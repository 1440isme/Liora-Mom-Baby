package vn.liora.dto.response;


import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.liora.entity.Permission;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)

public class RoleResponse {
     String name;
     String description;
     Set<PermissionResponse> permissions;
}
