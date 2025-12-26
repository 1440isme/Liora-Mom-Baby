package vn.liora.controller;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.response.WalletResponse;
import vn.liora.dto.response.WalletTransactionResponse;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.UserRepository;
import vn.liora.service.IWalletService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class WalletController {

    IWalletService walletService;
    UserRepository userRepository;

    /**
     * Lấy thông tin ví của user đang đăng nhập
     */
    @GetMapping("/my-wallet")
    public ResponseEntity<WalletResponse> getMyWallet() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        WalletResponse wallet = walletService.getOrCreateWallet(user.getUserId());
        return ResponseEntity.ok(wallet);
    }

    /**
     * Lấy lịch sử giao dịch của ví (phân trang)
     */
    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransactionResponse>> getTransactionHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<WalletTransactionResponse> transactions = walletService.getTransactionHistory(user.getUserId(), page,
                size);
        return ResponseEntity.ok(transactions);
    }

    /**
     * Đếm tổng số giao dịch
     */
    @GetMapping("/transactions/count")
    public ResponseEntity<Map<String, Object>> countTransactions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        long count = walletService.countTransactions(user.getUserId());

        Map<String, Object> response = new HashMap<>();
        response.put("totalTransactions", count);

        return ResponseEntity.ok(response);
    }
}
