/**
 * Admin Dashboard JavaScript
 * Handles dashboard functionality, charts, and real-time updates
 */

class AdminDashboard {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.initCharts();
        this.initRealTimeUpdates();
        this.initQuickActions();
        this.initThemeToggle();
        this.bindEvents();
    }

    /**
     * Initialize all dashboard charts
     */
    initCharts() {
        this.initSalesChart();
        this.initOrdersChart();
        this.initUsersChart();
        this.initRevenueChart();
    }

    /**
     * Initialize sales chart
     */
    initSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        this.charts.sales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.getLast7Days(),
                datasets: [{
                    label: 'Doanh thu',
                    data: this.generateRandomData(7, 1000, 5000),
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND'
                                }).format(value);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Initialize orders chart
     */
    initOrdersChart() {
        const ctx = document.getElementById('ordersChart');
        if (!ctx) return;

        this.charts.orders = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Đã giao', 'Đang xử lý', 'Chờ xác nhận', 'Đã hủy'],
                datasets: [{
                    data: [45, 25, 20, 10],
                    backgroundColor: [
                        '#28a745',
                        '#007bff',
                        '#ffc107',
                        '#dc3545'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * Initialize users chart
     */
    initUsersChart() {
        const ctx = document.getElementById('usersChart');
        if (!ctx) return;

        this.charts.users = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.getLast12Months(),
                datasets: [{
                    label: 'Người dùng mới',
                    data: this.generateRandomData(12, 50, 200),
                    backgroundColor: '#17a2b8',
                    borderColor: '#17a2b8',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Initialize revenue chart
     */
    initRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        this.charts.revenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.getLast12Months(),
                datasets: [{
                    label: 'Doanh thu',
                    data: this.generateRandomData(12, 10000, 100000),
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: '#28a745',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                    notation: 'compact'
                                }).format(value);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Initialize real-time updates
     */
    initRealTimeUpdates() {
        // Update stats every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.updateStats();
        }, 30000);

        // Initial stats update
        this.updateStats();
    }

    /**
     * Update dashboard statistics
     */
    async updateStats() {
        try {
            const response = await fetch('/admin/api/dashboard/stats');
            const data = await response.json();

            this.updateStatCard('totalSales', data.totalSales);
            this.updateStatCard('totalOrders', data.totalOrders);
            this.updateStatCard('totalUsers', data.totalUsers);
            this.updateStatCard('totalProducts', data.totalProducts);

            this.updateRecentActivity(data.recentActivity);
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    /**
     * Update individual stat card
     */
    updateStatCard(statId, value) {
        const element = document.querySelector(`[data-stat="${statId}"]`);
        if (element) {
            const currentValue = parseInt(element.textContent.replace(/[^\d]/g, ''));
            this.animateNumber(element, currentValue, value);
        }
    }

    /**
     * Animate number change
     */
    animateNumber(element, start, end) {
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const current = Math.floor(start + (end - start) * this.easeOutCubic(progress));
            element.textContent = this.formatNumber(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Easing function
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * Format number with Vietnamese locale
     */
    formatNumber(num) {
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    /**
     * Update recent activity
     */
    updateRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        if (!container || !activities) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${activity.color}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-desc">${activity.description}</div>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');
    }

    /**
     * Initialize quick actions
     */
    initQuickActions() {
        const quickActions = document.querySelectorAll('.quick-action-card');
        quickActions.forEach(action => {
            action.addEventListener('click', (e) => {
                const url = action.dataset.url;
                if (url) {
                    window.location.href = url;
                }
            });
        });
    }

    /**
     * Initialize theme toggle
     */
    initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        // Load saved theme
        const savedTheme = localStorage.getItem('admin-theme') || 'light';
        this.setTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
        });
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        const body = document.body;
        const themeToggle = document.getElementById('themeToggle');

        if (theme === 'dark') {
            body.classList.add('dark-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            body.classList.remove('dark-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }

        localStorage.setItem('admin-theme', theme);
    }

    /**
     * Bind events
     */
    bindEvents() {
        // Chart period buttons
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.updateChartPeriod(btn.dataset.period);
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCharts();
        });
    }

    /**
     * Update chart period
     */
    updateChartPeriod(period) {
        // Update active button
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');

        // Update charts based on period
        this.updateChartsForPeriod(period);
    }

    /**
     * Update charts for specific period
     */
    updateChartsForPeriod(period) {
        // This would typically make an API call to get new data
        // For now, we'll just regenerate random data
        if (this.charts.sales) {
            const data = this.generateRandomData(7, 1000, 5000);
            this.charts.sales.data.datasets[0].data = data;
            this.charts.sales.update();
        }
    }

    /**
     * Toggle sidebar
     */
    toggleSidebar() {
        const sidebar = document.querySelector('.admin-sidebar');
        const main = document.querySelector('.admin-main');

        sidebar.classList.toggle('collapsed');
        main.classList.toggle('sidebar-collapsed');
    }

    /**
     * Resize charts
     */
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    /**
     * Get last 7 days labels
     */
    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('vi-VN', { weekday: 'short' }));
        }
        return days;
    }

    /**
     * Get last 12 months labels
     */
    getLast12Months() {
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            months.push(date.toLocaleDateString('vi-VN', { month: 'short' }));
        }
        return months;
    }

    /**
     * Generate random data
     */
    generateRandomData(count, min, max) {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        return data;
    }

    /**
     * Destroy dashboard
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}
