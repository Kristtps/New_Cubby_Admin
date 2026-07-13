// ========================================
// REPORTS PAGE - JAVASCRIPT FUNCTIONALITY
// ========================================

// Chart instances
let revenueChartInstance = null;
let rentalsBySizeInstance = null;

// Auto-refresh interval
let reportsAutoRefreshInterval = null;

// Report data structure
const reportData = {
    totalRevenue: 0.00,
    totalRentals: 0,
    avgRentalValue: 0.00,
    mostUsedLocker: '-',
    mostUsedPayment: '-',
    revenueAndRentals: {
        labels: [],
        revenue: [],
        rentals: []
    },
    rentalsBySize: {
        labels: ['Small', 'Medium', 'Large'],
        data: [0, 0, 0],
        backgroundColor: ['#4DAA63', '#10b981', '#f59e0b']
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    if (typeof isUserAuthenticated !== 'undefined' && !isUserAuthenticated()) {
        console.log('User not authenticated, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    await initializeReports();
    
    // Start auto-refresh (every 60 seconds for reports)
    initializeReportsAutoRefresh();
});

/**
 * Initialize reports page
 */
async function initializeReports() {
    // Default load: last 14 days (matches the active pill)
    await loadReportData();
    initializeCharts();
}

/* ── Filter handlers ───────────────────────── */

/**
 * Main dispatcher — called when the range <select> changes
 */
async function handleRangeSelect(value) {
    const customRange = document.getElementById('customRange');
    customRange.classList.remove('visible');

    if (value === 'month') {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        await loadReportData(from, to);
        updateChartTitle('This Month');
    } else if (value === 'custom') {
        customRange.classList.add('visible');
        return; // wait for the user to pick dates
    } else {
        const days = parseInt(value, 10);
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - (days - 1));
        from.setHours(0, 0, 0, 0);
        await loadReportData(from, to);
        updateChartTitle(`Last ${days} Days`);
    }

    initializeCharts();
}

/**
 * Update the chart card title to reflect selected range
 */
function updateChartTitle(label) {
    const el = document.getElementById('revenueChartTitle');
    if (el) el.textContent = `Revenue & Rentals \u2014 ${label}`;
}

/**
 * Apply whatever dates are set in the custom pickers
 */
async function applyCustomFilter() {
    const fromVal = document.getElementById('dateFrom').value;
    const toVal = document.getElementById('dateTo').value;
    if (!fromVal || !toVal) return;

    const from = new Date(fromVal);
    const to = new Date(toVal);
    to.setHours(23, 59, 59, 999);

    await loadReportData(from, to);
    initializeCharts();
}

/**
 * Load report data from database or localStorage
 * @param {Date} [dateFrom]  - Start of range (default: 14 days ago)
 * @param {Date} [dateTo]    - End of range   (default: now)
 */
async function loadReportData(dateFrom, dateTo) {
    try {
        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() && typeof dbOps !== 'undefined') {
            // Load historical data for charts + derive stat-card totals from it
            if (dbOps.getReportData) {
                const rawData = await dbOps.getReportData(dateFrom, dateTo);
                if (rawData && (rawData.payments || rawData.transactions || rawData.length > 0)) {
                    processHistoricalData(rawData);
                    console.log('✓ Historical report data loaded from database');
                    updateStatCards();
                    return;
                }
            }
        }

        // Fall back to localStorage
        const savedReport = localStorage.getItem('coincubby_report_data');
        if (savedReport) {
            const data = JSON.parse(savedReport);
            Object.assign(reportData, data);
            console.log('✓ Report data loaded from localStorage');
        }
    } catch (error) {
        console.warn('Error loading report data:', error);
    }

    updateStatCards();
}

/**
 * Process raw transaction data into chart formats
 */
function processHistoricalData(data) {
    const dailyData = {};
    const sizeData = [0, 0, 0]; // Small, Medium, Large
    const lockerUsage = {}; // Track locker usage count
    const paymentMethods = {}; // Track payment method usage

    let totalRev = 0;
    let totalRent = 0;

    // Pre-fill the last 14 days so the chart always looks continuous
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = new Intl.DateTimeFormat('en-US', { 
            timeZone: 'Asia/Manila',
            month: 'short', 
            day: 'numeric' 
        }).format(d);
        dailyData[dateStr] = { revenue: 0, rentals: 0 };
    }

    // Process Payments for Revenue and Payment Methods
    if (data.payments && Array.isArray(data.payments)) {
        data.payments.forEach(p => {
            const date = new Intl.DateTimeFormat('en-US', { 
                timeZone: 'Asia/Manila',
                month: 'short', 
                day: 'numeric' 
            }).format(new Date(p.payment_date));
            const amount = parseFloat(p.amount || 0);
            if (dailyData[date]) {
                dailyData[date].revenue += amount;
            }
            totalRev += amount;

            // Track payment methods
            const method = p.payment_method || '-';
            paymentMethods[method] = (paymentMethods[method] || 0) + 1;
        });
    }

    // Process Transactions for Rentals and Sizes
    if (data.transactions && Array.isArray(data.transactions)) {
        data.transactions.forEach(tx => {
            const date = new Intl.DateTimeFormat('en-US', { 
                timeZone: 'Asia/Manila',
                month: 'short', 
                day: 'numeric' 
            }).format(new Date(tx.start_time));
            if (dailyData[date]) {
                dailyData[date].rentals += 1;
            }
            totalRent += 1;

            // Track locker usage
            if (tx.lockers) {
                const lockerNum = tx.lockers.locker_number || 'Unknown';
                lockerUsage[lockerNum] = (lockerUsage[lockerNum] || 0) + 1;

                // Size distribution
                // size_type_id mapping: 1=Small, 2=Medium, 3=Large
                const sizeIdx = (tx.lockers.size_type_id || 1) - 1;
                if (sizeIdx >= 0 && sizeIdx < 3) sizeData[sizeIdx]++;
            }
        });
    }

    // Fallback for old single-array data just in case
    if (Array.isArray(data)) {
        data.forEach(tx => {
            const date = new Intl.DateTimeFormat('en-US', { 
                timeZone: 'Asia/Manila',
                month: 'short', 
                day: 'numeric' 
            }).format(new Date(tx.start_time || tx.created_at));
            const amount = parseFloat(tx.amount || 0);
            if (!dailyData[date]) dailyData[date] = { revenue: 0, rentals: 0 };
            dailyData[date].revenue += amount;
            dailyData[date].rentals += 1;

            totalRev += amount;
            totalRent += 1;

            if (tx.lockers) {
                const lockerNum = tx.lockers.locker_number || 'Unknown';
                lockerUsage[lockerNum] = (lockerUsage[lockerNum] || 0) + 1;

                const sizeIdx = (tx.lockers.size_type_id || 1) - 1;
                if (sizeIdx >= 0 && sizeIdx < 3) sizeData[sizeIdx]++;
            }
        });
    }

    // Find most used lockers sorted by usage
    const sortedLockers = Object.entries(lockerUsage)
        .filter(([locker]) => locker !== 'Unknown' && locker !== '-')
        .sort((a, b) => b[1] - a[1]);
    
    let mostUsedLockerStr = '-';
    if (sortedLockers.length > 0) {
        const topLocker = sortedLockers[0];
        mostUsedLockerStr = `
            <div class="top-locker-val" style="font-size: 24px; font-weight: 700; color: var(--color-dark); line-height: 1.2;">Locker ${topLocker[0]}</div>
            <div style="font-size: 13px; font-weight: 500; color: var(--color-text-muted); margin-top: 4px;">${topLocker[1]} rented</div>
        `;
    }

    // Find most used payment method
    let mostUsedPaymentMethodStr = '-';
    let maxPaymentUses = 0;
    for (const [method, count] of Object.entries(paymentMethods)) {
        if (count > maxPaymentUses) {
            maxPaymentUses = count;
            mostUsedPaymentMethodStr = `
                <div class="top-payment-val" style="font-size: 24px; font-weight: 700; color: var(--color-dark); line-height: 1.2;">${method}</div>
                <div style="font-size: 13px; font-weight: 500; color: var(--color-text-muted); margin-top: 4px;">${count} used</div>
            `;
        }
    }

    // Update reportData object
    reportData.revenueAndRentals.labels = Object.keys(dailyData);
    reportData.revenueAndRentals.revenue = Object.values(dailyData).map(d => d.revenue);
    reportData.revenueAndRentals.rentals = Object.values(dailyData).map(d => d.rentals);
    reportData.rentalsBySize.data = sizeData;

    // Update the stat cards to show the 14-day totals instead of just today
    reportData.totalRevenue = totalRev;
    reportData.totalRentals = totalRent;
    reportData.avgRentalValue = totalRent > 0 ? totalRev / totalRent : 0;
    reportData.mostUsedLocker = mostUsedLockerStr;
    reportData.mostUsedPayment = mostUsedPaymentMethodStr;
}

/**
 * Update stat cards with data
 */
function updateStatCards() {
    // Update visible stat card values
    const statCards = document.querySelectorAll('.reports-stats .stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('.stat-value').textContent = `₱${reportData.totalRevenue.toFixed(2)}`;
        statCards[1].querySelector('.stat-value').textContent = reportData.totalRentals;
        statCards[2].querySelector('.stat-value').innerHTML = reportData.mostUsedLocker;
        statCards[3].querySelector('.stat-value').innerHTML = reportData.mostUsedPayment;
    }
}

/**
 * Initialize all charts
 */
function initializeCharts() {
    initializeRevenueChart();
    initializeRentalsBySizeChart();
}

/**
 * Initialize Revenue & Rentals Line Chart
 */
function initializeRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    const chartData = reportData.revenueAndRentals;

    if (revenueChartInstance) revenueChartInstance.destroy();

    revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: chartData.revenue,
                    borderColor: '#4DAA63',
                    backgroundColor: 'rgba(77, 170, 99, 0.05)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Rentals',
                    data: chartData.rentals,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

/**
 * Initialize Rentals by Size Donut Chart
 */
function initializeRentalsBySizeChart() {
    const ctx = document.getElementById('rentalsBySize');
    if (!ctx) return;

    const chartData = reportData.rentalsBySize;

    if (rentalsBySizeInstance) rentalsBySizeInstance.destroy();

    rentalsBySizeInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    data: chartData.data,
                    backgroundColor: chartData.backgroundColor,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

/**
 * Print report
 */
function printReport() {
    window.print();
}

/**
 * Export report as JSON
 */
function exportReport() {
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Refresh report data
 */
function refreshReport() {
    loadReportData().then(() => initializeCharts());
}

// Expose functions globally
window.printReport = printReport;
window.exportReport = exportReport;
window.refreshReport = refreshReport;

/**
 * Initialize auto-refresh for reports page (every 60 seconds)
 */
function initializeReportsAutoRefresh() {
    reportsAutoRefreshInterval = setInterval(async function() {
        try {
            // Refresh data without resetting filters
            await loadReportData();
            
            // Update charts with new data
            if (revenueChartInstance) {
                revenueChartInstance.data.labels = reportData.revenueAndRentals.labels;
                revenueChartInstance.data.datasets[0].data = reportData.revenueAndRentals.revenue;
                revenueChartInstance.data.datasets[1].data = reportData.revenueAndRentals.rentals;
                revenueChartInstance.update('none'); // Update without animation for smooth refresh
            }
            
            if (rentalsBySizeInstance) {
                rentalsBySizeInstance.data.datasets[0].data = reportData.rentalsBySize.data;
                rentalsBySizeInstance.update('none');
            }
            
            console.log('✓ Reports data auto-refreshed via AJAX');
        } catch (error) {
            console.error('Reports auto-refresh error:', error);
        }
    }, 60000); // 60 seconds
}

/**
 * Stop auto-refresh
 */
function stopReportsAutoRefresh() {
    if (reportsAutoRefreshInterval) {
        clearInterval(reportsAutoRefreshInterval);
        reportsAutoRefreshInterval = null;
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    stopReportsAutoRefresh();
});
