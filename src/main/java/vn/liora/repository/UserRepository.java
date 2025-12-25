package vn.liora.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.liora.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    List<User> findByUsernameContaining(String username);

    Page<User> findByUsernameContaining(String username, Pageable pageable);

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findAllByEmail(String email);

    @Query("""
    SELECT COUNT(DISTINCT u.userId)
    FROM User u
    JOIN u.roles r
    WHERE r.name = 'USER'
      AND MONTH(u.createdDate) = MONTH(CURRENT_DATE)
      AND YEAR(u.createdDate) = YEAR(CURRENT_DATE)
    """)
    long countNewCustomersThisMonth();
    
    @Query("""
    SELECT COUNT(DISTINCT u.userId)
    FROM User u
    JOIN u.roles r
    WHERE r.name = 'USER'
      AND CAST(u.createdDate AS timestamp) >= :startDate
      AND CAST(u.createdDate AS timestamp) <= :endDate
    """)
    long countByRegistrationDateBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
    
    // Đếm khách hàng mới theo tháng (trả về year-month và count)
    @Query("""
    SELECT YEAR(u.createdDate), MONTH(u.createdDate), COUNT(DISTINCT u.userId)
    FROM User u
    JOIN u.roles r
    WHERE r.name = 'USER'
      AND CAST(u.createdDate AS timestamp) >= :startDate
    GROUP BY YEAR(u.createdDate), MONTH(u.createdDate)
    ORDER BY YEAR(u.createdDate), MONTH(u.createdDate)
    """)
    List<Object[]> countNewCustomersByMonth(java.time.LocalDateTime startDate);
}
