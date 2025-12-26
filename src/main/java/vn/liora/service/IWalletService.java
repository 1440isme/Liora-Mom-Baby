package vn.liora.service;

import vn.liora.dto.response.WalletResponse;
import vn.liora.dto.response.WalletTransactionResponse;

import java.math.BigDecimal;
import java.util.List;

public interface IWalletService {

    /**
     * Lấy hoặc tạo ví cho user
     * 
     * @param userId ID của user
     * @return WalletResponse
     */
    WalletResponse getOrCreateWallet(Long userId);

    /**
     * Lấy thông tin ví theo userId
     * 
     * @param userId ID của user
     * @return WalletResponse
     */
    WalletResponse getWalletByUserId(Long userId);

    /**
     * Cộng xu thưởng khi đơn hàng hoàn thành (0.1% tổng đơn hàng)
     * 
     * @param userId     ID của user
     * @param orderId    ID của đơn hàng
     * @param orderTotal Tổng giá trị đơn hàng
     * @return WalletResponse sau khi cộng xu
     */
    WalletResponse addRewardPoints(Long userId, Long orderId, BigDecimal orderTotal);

    /**
     * Hoàn tiền vào ví khi đơn hàng bị hủy (100% giá trị đơn hàng)
     * 
     * @param userId       ID của user
     * @param orderId      ID của đơn hàng
     * @param refundAmount Số tiền hoàn
     * @return WalletResponse sau khi hoàn tiền
     */
    WalletResponse addRefund(Long userId, Long orderId, BigDecimal refundAmount);

    /**
     * Trừ xu khi đơn hàng hoàn thành bị hủy
     * Chỉ trừ tối đa số dư hiện có, không cho phép số dư âm
     * 
     * @param userId  ID của user
     * @param orderId ID của đơn hàng
     * @param amount  Số xu cần trừ
     * @return WalletResponse sau khi trừ xu
     */
    WalletResponse deductPoints(Long userId, Long orderId, BigDecimal amount);

    /**
     * Lấy lịch sử giao dịch của ví (phân trang)
     * 
     * @param userId ID của user
     * @param page   Trang hiện tại (bắt đầu từ 0)
     * @param size   Số lượng item mỗi trang
     * @return Danh sách giao dịch
     */
    List<WalletTransactionResponse> getTransactionHistory(Long userId, int page, int size);

    /**
     * Đếm tổng số giao dịch của ví
     * 
     * @param userId ID của user
     * @return Số lượng giao dịch
     */
    long countTransactions(Long userId);
}
