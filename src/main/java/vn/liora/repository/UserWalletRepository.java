package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.liora.entity.User;
import vn.liora.entity.UserWallet;

import java.util.Optional;

@Repository
public interface UserWalletRepository extends JpaRepository<UserWallet, Long> {
    Optional<UserWallet> findByUser(User user);

    Optional<UserWallet> findByUser_UserId(Long userId);

    boolean existsByUser(User user);
}
