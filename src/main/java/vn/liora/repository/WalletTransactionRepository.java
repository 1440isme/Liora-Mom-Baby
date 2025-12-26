package vn.liora.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.liora.entity.UserWallet;
import vn.liora.entity.WalletTransaction;
import vn.liora.enums.TransactionType;

import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByWalletOrderByCreatedDateDesc(UserWallet wallet, Pageable pageable);

    List<WalletTransaction> findByWalletAndTypeOrderByCreatedDateDesc(UserWallet wallet, TransactionType type,
            Pageable pageable);

    long countByWallet(UserWallet wallet);
}
