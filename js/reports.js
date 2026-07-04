// ========================================
// REPORTS PAGE - JAVASCRIPT FUNCTIONALITY
// ========================================

// Chart instances
let revenueChartInstance = null;
let rentalsBySizeInstance = null;

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
        backgroundColor: ['#3B82F6', '#10b981', '#f59e0b']
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

    initializeReports();
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
            const method = p.payment_method || 'Unpaid';
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

    // Find most used locker
    let mostUsedLockerName = '-';
    let maxLockerUses = 0;
    for (const [locker, count] of Object.entries(lockerUsage)) {
        if (count > maxLockerUses) {
            maxLockerUses = count;
            mostUsedLockerName = locker;
        }
    }

    // Find most used payment method
    let mostUsedPaymentMethod = '-';
    let maxPaymentUses = 0;
    for (const [method, count] of Object.entries(paymentMethods)) {
        if (count > maxPaymentUses) {
            maxPaymentUses = count;
            mostUsedPaymentMethod = method;
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
    reportData.mostUsedLocker = mostUsedLockerName;
    reportData.mostUsedPayment = mostUsedPaymentMethod;
}

/**
 * Update stat cards with data
 */
function updateStatCards() {
    // Update visible stat card values
    const statCards = document.querySelectorAll('.reports-stats .stat-card');
    if (statCards.length >= 5) {
        statCards[0].querySelector('.stat-value').textContent = `₱${reportData.totalRevenue.toFixed(2)}`;
        statCards[1].querySelector('.stat-value').textContent = reportData.totalRentals;
        statCards[2].querySelector('.stat-value').textContent = `₱${reportData.avgRentalValue.toFixed(2)}`;
        statCards[3].querySelector('.stat-value').textContent = reportData.mostUsedLocker;
        statCards[4].querySelector('.stat-value').textContent = reportData.mostUsedPayment;
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
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
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
