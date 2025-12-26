// ===== WALLET FUNCTIONS =====

let currentTransactionPage = 0;
const transactionsPerPage = 10;
let currentFilter = 'ALL';
let allTransactions = [];

// Load wallet data when wallet tab is shown
document.getElementById('wallet-tab')?.addEventListener('shown.bs.tab', function () {
    loadWalletData();
    loadTransactions();
});

// Load wallet balance and stats
async function loadWalletData() {
    try {
        const response = await fetch('/api/wallet/my-wallet');

        if (!response.ok) {
            throw new Error('Failed to load wallet data');
        }

        const wallet = await response.json();

        // Update balance in wallet tab
        const walletBalanceEl = document.getElementById('walletBalance');
        if (walletBalanceEl) {
            walletBalanceEl.textContent = formatCurrency(wallet.balance) + ' Xu';
        }

        // Update balance in profile header
        const headerBalance = document.getElementById('walletBalanceHeader');
        if (headerBalance) {
            headerBalance.textContent = formatCurrency(wallet.balance);
        }

        // Load transaction count
        loadTransactionCount();

    } catch (error) {
        console.error('Error loading wallet:', error);
        const walletBalanceEl = document.getElementById('walletBalance');
        if (walletBalanceEl) {
            walletBalanceEl.textContent = '0 Xu';
        }
        const headerBalance = document.getElementById('walletBalanceHeader');
        if (headerBalance) {
            headerBalance.textContent = '0';
        }
        console.log('[WALLET] Không thể tải thông tin ví:', error.message);
    }
}

// Load transaction count
async function loadTransactionCount() {
    try {
        const response = await fetch('/api/wallet/transactions/count');

        if (!response.ok) {
            throw new Error('Failed to load transaction count');
        }

        const data = await response.json();
        document.getElementById('totalTransactions').textContent = data.totalTransactions || 0;

    } catch (error) {
        console.error('Error loading transaction count:', error);
        document.getElementById('totalTransactions').textContent = '0';
    }
}

// Load transactions
async function loadTransactions(page = 0) {
    try {
        const response = await fetch(`/api/wallet/transactions?page=${page}&size=${transactionsPerPage}`);

        if (!response.ok) {
            throw new Error('Failed to load transactions');
        }

        allTransactions = await response.json();
        currentTransactionPage = page;

        // Calculate stats from transactions
        calculateWalletStats(allTransactions);

        // Display transactions
        displayTransactions(allTransactions);

    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionList').innerHTML = `
            <div class="empty-state">
                <i class="mdi mdi-alert-circle"></i>
                <h5>Không thể tải giao dịch</h5>
                <p>Vui lòng thử lại sau</p>
            </div>
        `;
    }
}

// Calculate wallet stats from transactions
function calculateWalletStats(transactions) {
    let totalRewards = 0;
    let totalRefunds = 0;
    let totalDeductions = 0;

    transactions.forEach(tx => {
        if (tx.type === 'REWARD') {
            totalRewards += tx.amount;
        } else if (tx.type === 'REFUND') {
            totalRefunds += tx.amount;
        } else if (tx.type === 'DEDUCTION') {
            totalDeductions += Math.abs(tx.amount); // Deduction is negative, so take absolute
        }
    });

    // Show net rewards (rewards earned minus deductions)
    const netRewards = totalRewards - totalDeductions;
    document.getElementById('totalRewards').textContent = formatCurrency(netRewards) + ' Xu';
    document.getElementById('totalRefunds').textContent = formatCurrency(totalRefunds) + ' Xu';
}

// Display transactions
function displayTransactions(transactions) {
    const transactionList = document.getElementById('transactionList');

    if (!transactions || transactions.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <i class="mdi mdi-wallet-outline"></i>
                <h5>Chưa có giao dịch</h5>
                <p>Lịch sử giao dịch của bạn sẽ hiển thị ở đây</p>
            </div>
        `;
        return;
    }

    let html = '<div class="transaction-items">';

    transactions.forEach(tx => {
        const typeInfo = getTransactionTypeInfo(tx.type);
        const isPositive = tx.amount >= 0;
        const amountClass = isPositive ? 'text-success' : 'text-danger';
        const amountPrefix = isPositive ? '+' : '';

        html += `
            <div class="transaction-item">
                <div class="transaction-icon ${typeInfo.colorClass}">
                    <i class="mdi ${typeInfo.icon}"></i>
                </div>
                <div class="transaction-details">
                    <h6 class="transaction-title">${typeInfo.label}</h6>
                    <p class="transaction-desc">${tx.description || 'Không có mô tả'}</p>
                    <p class="transaction-date">
                        <i class="mdi mdi-clock-outline"></i>
                        ${formatDateTime(tx.createdDate)}
                    </p>
                </div>
                <div class="transaction-amount">
                    <p class="amount ${amountClass}">${amountPrefix}${formatCurrency(Math.abs(tx.amount))} Xu</p>
                    <p class="balance-after">Số dư: ${formatCurrency(tx.balanceAfter)} Xu</p>
                </div>
            </div>
        `;
    });

    html += '</div>';
    transactionList.innerHTML = html;
}

// Get transaction type info
function getTransactionTypeInfo(type) {
    const types = {
        'REWARD': {
            label: 'Xu thưởng',
            icon: 'mdi-gift',
            colorClass: 'bg-success'
        },
        'REFUND': {
            label: 'Hoàn tiền',
            icon: 'mdi-cash-refund',
            colorClass: 'bg-info'
        },
        'DEDUCTION': {
            label: 'Trừ xu',
            icon: 'mdi-minus-circle',
            colorClass: 'bg-warning'
        }
    };

    return types[type] || {
        label: 'Giao dịch',
        icon: 'mdi-swap-horizontal',
        colorClass: 'bg-secondary'
    };
}

// Filter transactions
function filterTransactions(type) {
    currentFilter = type;

    // Update active button
    document.querySelectorAll('.btn-group button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filter and display
    if (type === 'ALL') {
        displayTransactions(allTransactions);
    } else {
        const filtered = allTransactions.filter(tx => tx.type === type);
        displayTransactions(filtered);
    }
}

// Format currency
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0';
    return new Intl.NumberFormat('vi-VN').format(amount);
}

// Format date time
function formatDateTime(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            if (minutes === 0) {
                return 'Vừa xong';
            }
            return `${minutes} phút trước`;
        }
        return `${hours} giờ trước`;
    } else if (days === 1) {
        return 'Hôm qua';
    } else if (days < 7) {
        return `${days} ngày trước`;
    }

    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token') || '';
}

// Show toast notification
function showToast(message, type = 'info') {
    // Try to use global toast function if available
    if (typeof AdminUtils !== 'undefined' && typeof AdminUtils.showToast === 'function') {
        AdminUtils.showToast(message, type);
    } else if (typeof toast !== 'undefined') {
        toast(message);
    } else {
        // Fallback to console
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}
