package vn.liora.controller.admin;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.response.WalletResponse;
import vn.liora.dto.response.WalletTransactionResponse;
import vn.liora.service.IWalletService;

import java.util.List;

@RestController
@RequestMapping("/admin/api/wallet")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasAuthority('wallet.view')")
public class AdminWalletController {

    IWalletService walletService;

    /**
     * Admin xem ví của user bất kỳ
     */
    @GetMapping("/{userId}")
    public ResponseEntity<WalletResponse> getUserWallet(@PathVariable Long userId) {
        WalletResponse wallet = walletService.getOrCreateWallet(userId);
        return ResponseEntity.ok(wallet);
    }

    /**
     * Admin xem lịch sử giao dịch của user
     */
    @GetMapping("/{userId}/transactions")
    public ResponseEntity<List<WalletTransactionResponse>> getUserTransactionHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        List<WalletTransactionResponse> transactions = walletService.getTransactionHistory(userId, page, size);
        return ResponseEntity.ok(transactions);
    }
}
