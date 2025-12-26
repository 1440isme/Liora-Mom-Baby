package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.response.WalletResponse;
import vn.liora.dto.response.WalletTransactionResponse;
import vn.liora.entity.Order;
import vn.liora.entity.User;
import vn.liora.entity.UserWallet;
import vn.liora.entity.WalletTransaction;
import vn.liora.enums.TransactionType;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.WalletMapper;
import vn.liora.mapper.WalletTransactionMapper;
import vn.liora.repository.OrderRepository;
import vn.liora.repository.UserRepository;
import vn.liora.repository.UserWalletRepository;
import vn.liora.repository.WalletTransactionRepository;
import vn.liora.service.IWalletService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class WalletServiceImpl implements IWalletService {

    UserWalletRepository userWalletRepository;
    WalletTransactionRepository walletTransactionRepository;
    UserRepository userRepository;
    OrderRepository orderRepository;
    WalletMapper walletMapper;
    WalletTransactionMapper walletTransactionMapper;

    // Tỉ lệ xu thưởng: 0.1% = 0.001
    private static final BigDecimal REWARD_RATE = new BigDecimal("0.001");

    @Override
    @Transactional
    public WalletResponse getOrCreateWallet(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        UserWallet wallet = userWalletRepository.findByUser(user)
                .orElseGet(() -> {
                    UserWallet newWallet = UserWallet.builder()
                            .user(user)
                            .balance(BigDecimal.ZERO)
                            .build();
                    UserWallet saved = userWalletRepository.save(newWallet);
                    log.info("Created new wallet for user {}", userId);
                    return saved;
                });

        return walletMapper.toWalletResponse(wallet);
    }

    @Override
    public WalletResponse getWalletByUserId(Long userId) {
        UserWallet wallet = userWalletRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        return walletMapper.toWalletResponse(wallet);
    }

    @Override
    @Transactional
    public WalletResponse addRewardPoints(Long userId, Long orderId, BigDecimal orderTotal) {
        // Lấy hoặc tạo ví
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        UserWallet wallet = userWalletRepository.findByUser(user)
                .orElseGet(() -> {
                    UserWallet newWallet = UserWallet.builder()
                            .user(user)
                            .balance(BigDecimal.ZERO)
                            .build();
                    return userWalletRepository.save(newWallet);
                });

        // Tính xu thưởng: 0.1% tổng đơn hàng, làm tròn xuống
        BigDecimal rewardAmount = orderTotal.multiply(REWARD_RATE)
                .setScale(0, RoundingMode.DOWN);

        if (rewardAmount.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("Reward amount is zero or negative for order {}. Skipping.", orderId);
            return walletMapper.toWalletResponse(wallet);
        }

        // Lưu số dư trước khi cộng
        BigDecimal balanceBefore = wallet.getBalance();
        BigDecimal balanceAfter = balanceBefore.add(rewardAmount);

        // Cập nhật số dư ví
        wallet.setBalance(balanceAfter);
        wallet = userWalletRepository.save(wallet);

        // Lưu lịch sử giao dịch
        Order order = orderId != null ? orderRepository.findById(orderId).orElse(null) : null;

        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(wallet)
                .type(TransactionType.REWARD)
                .amount(rewardAmount)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .order(order)
                .description(String.format("Xu thưởng từ đơn hàng #%d (0.1%% giá trị đơn hàng)", orderId))
                .build();
        walletTransactionRepository.save(transaction);

        log.info("Added {} reward points to wallet {} for order {}. Balance: {} -> {}",
                rewardAmount, wallet.getWalletId(), orderId, balanceBefore, balanceAfter);

        return walletMapper.toWalletResponse(wallet);
    }

    @Override
    @Transactional
    public WalletResponse addRefund(Long userId, Long orderId, BigDecimal refundAmount) {
        // Lấy hoặc tạo ví
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        UserWallet wallet = userWalletRepository.findByUser(user)
                .orElseGet(() -> {
                    UserWallet newWallet = UserWallet.builder()
                            .user(user)
                            .balance(BigDecimal.ZERO)
                            .build();
                    return userWalletRepository.save(newWallet);
                });

        if (refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("Refund amount is zero or negative for order {}. Skipping.", orderId);
            return walletMapper.toWalletResponse(wallet);
        }

        // Lưu số dư trước khi hoàn tiền
        BigDecimal balanceBefore = wallet.getBalance();
        BigDecimal balanceAfter = balanceBefore.add(refundAmount);

        // Cập nhật số dư ví
        wallet.setBalance(balanceAfter);
        wallet = userWalletRepository.save(wallet);

        // Lưu lịch sử giao dịch
        Order order = orderId != null ? orderRepository.findById(orderId).orElse(null) : null;

        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(wallet)
                .type(TransactionType.REFUND)
                .amount(refundAmount)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .order(order)
                .description(String.format("Hoàn tiền từ đơn hàng #%d", orderId))
                .build();
        walletTransactionRepository.save(transaction);

        log.info("Added {} refund to wallet {} for order {}. Balance: {} -> {}",
                refundAmount, wallet.getWalletId(), orderId, balanceBefore, balanceAfter);

        return walletMapper.toWalletResponse(wallet);
    }

    @Override
    @Transactional
    public WalletResponse deductPoints(Long userId, Long orderId, BigDecimal amount) {
        UserWallet wallet = userWalletRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("Deduction amount is zero or negative. Skipping.");
            return walletMapper.toWalletResponse(wallet);
        }

        // Lưu số dư trước khi trừ
        BigDecimal balanceBefore = wallet.getBalance();

        // Chỉ trừ tối đa số dư hiện có, không cho phép số dư âm
        BigDecimal actualDeduction = amount.min(balanceBefore);
        BigDecimal balanceAfter = balanceBefore.subtract(actualDeduction);

        // Cập nhật số dư ví
        wallet.setBalance(balanceAfter);
        wallet = userWalletRepository.save(wallet);

        // Lưu lịch sử giao dịch
        Order order = orderId != null ? orderRepository.findById(orderId).orElse(null) : null;

        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(wallet)
                .type(TransactionType.DEDUCTION)
                .amount(actualDeduction.negate()) // Số âm để biểu thị trừ xu
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .order(order)
                .description(String.format("Trừ xu thưởng do đơn hàng #%d bị hủy", orderId))
                .build();
        walletTransactionRepository.save(transaction);

        if (actualDeduction.compareTo(amount) < 0) {
            log.warn(
                    "Deducted {} points (requested {}) from wallet {} for order {}. Insufficient balance. Balance: {} -> {}",
                    actualDeduction, amount, wallet.getWalletId(), orderId, balanceBefore, balanceAfter);
        } else {
            log.info("Deducted {} points from wallet {} for order {}. Balance: {} -> {}",
                    actualDeduction, wallet.getWalletId(), orderId, balanceBefore, balanceAfter);
        }

        return walletMapper.toWalletResponse(wallet);
    }

    @Override
    public List<WalletTransactionResponse> getTransactionHistory(Long userId, int page, int size) {
        UserWallet wallet = userWalletRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size);
        List<WalletTransaction> transactions = walletTransactionRepository
                .findByWalletOrderByCreatedDateDesc(wallet, pageable);

        return walletTransactionMapper.toTransactionResponseList(transactions);
    }

    @Override
    public long countTransactions(Long userId) {
        UserWallet wallet = userWalletRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        return walletTransactionRepository.countByWallet(wallet);
    }
}
