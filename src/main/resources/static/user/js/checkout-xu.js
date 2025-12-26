// ===== CHECKOUT LIORA XU FUNCTIONS =====

let userWalletBalance = 0;
let xuDiscount = 0;
let orderTotalBeforeXu = 0; // Tổng thanh toán TRƯỚC khi áp dụng xu
let isUpdatingTotal = false; // Flag để ngăn vòng lặp vô hạn khi cập nhật total

// Load wallet balance when page loads
document.addEventListener('DOMContentLoaded', function () {
    loadUserWalletBalance();

    // Listen to toggle change
    const useXuToggle = document.getElementById('useXuToggle');
    if (useXuToggle) {
        useXuToggle.addEventListener('change', handleXuToggleChange);
    }

    // Observe order total changes to update reward preview
    observeOrderTotalChanges();
});

// Load user wallet balance
async function loadUserWalletBalance() {
    try {
        const response = await fetch('/api/wallet/my-wallet');

        if (response.ok) {
            const wallet = await response.json();
            userWalletBalance = wallet.balance || 0;

            // Update UI
            document.getElementById('currentXuBalance').textContent = formatCurrency(userWalletBalance) + ' Xu';

            // Show toggle only if user has xu
            if (userWalletBalance > 0) {
                document.querySelector('.use-xu-section').style.display = 'block';
            }
        } else {
            // User not logged in or no wallet - hide xu section
            const xuSection = document.querySelector('.use-xu-section');
            if (xuSection) xuSection.style.display = 'none';
        }
    } catch (error) {
        console.log('[CHECKOUT-XU] Could not load wallet:', error.message);
        // Hide xu section if error
        const xuSection = document.querySelector('.use-xu-section');
        if (xuSection) xuSection.style.display = 'none';
    }
}

// Handle xu toggle change
function handleXuToggleChange(event) {
    const isChecked = event.target.checked;
    const xuBalanceInfo = document.getElementById('xuBalanceInfo');
    const xuDiscountRow = document.getElementById('xuDiscountRow');
    const summaryTotal = document.getElementById('summary-total');

    if (isChecked) {
        // Lưu tổng ban đầu TRƯỚC khi áp dụng xu
        if (orderTotalBeforeXu === 0) {
            orderTotalBeforeXu = parseFloat(summaryTotal.textContent.replace(/[^\d]/g, '')) || 0;
        }

        // Show xu balance info
        xuBalanceInfo.style.display = 'block';
        xuDiscountRow.style.display = 'flex';

        // Calculate xu discount và cập nhật tổng
        calculateXuDiscount();
    } else {
        // Hide xu balance info
        xuBalanceInfo.style.display = 'none';
        xuDiscountRow.style.display = 'none';

        // Reset discount
        xuDiscount = 0;
        document.getElementById('summary-xu-discount').textContent = '-0đ';

        // Khôi phục tổng ban đầu - set flag để ngăn observer trigger lại
        if (orderTotalBeforeXu > 0) {
            isUpdatingTotal = true;
            summaryTotal.textContent = formatCurrency(orderTotalBeforeXu) + 'đ';
            setTimeout(() => { isUpdatingTotal = false; }, 50);
        }
    }
}

// Calculate xu discount based on order total
function calculateXuDiscount() {
    if (isUpdatingTotal) return; // Ngăn vòng lặp vô hạn

    const totalElement = document.getElementById('summary-total');
    if (!totalElement) return;

    // Sử dụng tổng ban đầu (trước khi áp dụng xu) để tính
    let baseTotal = orderTotalBeforeXu;
    if (baseTotal === 0) {
        baseTotal = parseFloat(totalElement.textContent.replace(/[^\d]/g, '')) || 0;
        orderTotalBeforeXu = baseTotal;
    }

    // Calculate how much xu to use
    // Use minimum of: user balance OR order total (1 Xu = 1 VND)
    const xuToUse = Math.min(userWalletBalance, baseTotal);
    xuDiscount = xuToUse;

    // Tính tổng thanh toán mới = tổng ban đầu - xu sử dụng
    const newTotal = baseTotal - xuDiscount;

    // Update UI
    document.getElementById('xuToUse').textContent = formatCurrency(xuToUse) + ' Xu';
    document.getElementById('xuAfterPayment').textContent = formatCurrency(userWalletBalance - xuToUse) + ' Xu';
    document.getElementById('summary-xu-discount').textContent = '-' + formatCurrency(xuDiscount) + 'đ';

    // ✅ Cập nhật tổng thanh toán (đã trừ xu) - set flag để ngăn vòng lặp
    isUpdatingTotal = true;
    totalElement.textContent = formatCurrency(newTotal) + 'đ';
    setTimeout(() => { isUpdatingTotal = false; }, 50);
}

// Observe order total changes
function observeOrderTotalChanges() {
    const totalElement = document.getElementById('summary-total');
    const shippingElement = document.getElementById('summary-shipping');
    if (!totalElement) return;

    // Use MutationObserver to watch for text changes
    const observer = new MutationObserver(function (mutations) {
        // Bỏ qua nếu đang trong quá trình cập nhật từ calculateXuDiscount
        if (isUpdatingTotal) return;

        mutations.forEach(function (mutation) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const useXuToggle = document.getElementById('useXuToggle');
                const isXuEnabled = useXuToggle && useXuToggle.checked;

                // Lấy tổng mới từ phần tử
                const totalText = totalElement.textContent;
                const newTotal = parseFloat(totalText.replace(/[^\d]/g, '')) || 0;

                // Nếu xu KHÔNG được bật, cập nhật orderTotalBeforeXu
                if (!isXuEnabled) {
                    orderTotalBeforeXu = newTotal;
                }

                // Tính xu thưởng dựa trên (tổng - phí ship)
                const shippingText = shippingElement ? shippingElement.textContent : '0';
                const shippingFee = parseFloat(shippingText.replace(/[^\d]/g, '')) || 0;
                const totalForReward = (isXuEnabled ? orderTotalBeforeXu : newTotal) - shippingFee;
                updateRewardPreview(totalForReward);

                // Recalculate xu if toggle is on
                if (isXuEnabled) {
                    // Cập nhật orderTotalBeforeXu nếu tổng base thay đổi (không phải do xu)
                    // Kiểm tra xem có phải thay đổi do xu không bằng cách so sánh
                    const expectedTotalWithXu = orderTotalBeforeXu - xuDiscount;
                    if (Math.abs(newTotal - expectedTotalWithXu) > 1) {
                        // Tổng thay đổi không phải do xu -> cập nhật base và tính lại
                        orderTotalBeforeXu = newTotal + xuDiscount;
                    }
                    calculateXuDiscount();
                }
            }
        });
    });

    observer.observe(totalElement, {
        childList: true,
        characterData: true,
        subtree: true
    });
}

// Calculate and display reward preview (xu thưởng tính trên giá trị sản phẩm, không bao gồm phí ship)
function updateRewardPreview(orderValueWithoutShipping) {
    // Đảm bảo không tính xu thưởng trên giá trị âm
    const baseValue = Math.max(0, orderValueWithoutShipping);
    // Calculate 0.1% reward
    const rewardAmount = Math.floor(baseValue * 0.001);
    const rewardElement = document.getElementById('rewardPreview');
    if (rewardElement) {
        rewardElement.textContent = formatCurrency(rewardAmount) + ' Xu';
    }
}

// Reset orderTotalBeforeXu khi cần tính lại từ đầu
function resetOrderTotalBeforeXu() {
    orderTotalBeforeXu = 0;
}

// Format currency
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0';
    return new Intl.NumberFormat('vi-VN').format(amount);
}

// Get xu discount amount (to be used when submitting order)
function getXuDiscount() {
    const useXuToggle = document.getElementById('useXuToggle');
    return useXuToggle && useXuToggle.checked ? xuDiscount : 0;
}

// Export functions for use in checkout.js
window.checkoutXu = {
    loadUserWalletBalance,
    calculateXuDiscount,
    updateRewardPreview,
    getXuDiscount,
    resetOrderTotalBeforeXu,
    getOrderTotalBeforeXu: () => orderTotalBeforeXu
};
