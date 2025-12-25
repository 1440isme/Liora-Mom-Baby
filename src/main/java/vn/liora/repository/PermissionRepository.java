package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Permission;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {
}
