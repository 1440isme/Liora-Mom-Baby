package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Permission;
import vn.liora.entity.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {
}
