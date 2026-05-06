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
document.addEventListener('DOMContentLoaded', async function() {
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
    await loadReportData();
    initializeCharts();
}

/**
 * Load report data from database or localStorage
 */
async function loadReportData() {
    try {
        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() && typeof dbOps !== 'undefined') {
            // Load dashboard stats
            const stats = await dbOps.getDashboardStats();
            if (stats) {
                reportData.totalRevenue = stats.todayRevenue || 0;
                reportData.totalRentals = stats.activeRentals || 0;
                reportData.avgRentalValue = reportData.totalRentals > 0 ? reportData.totalRevenue / reportData.totalRentals : 0;
            }

            // Load historical data for charts
            if (dbOps.getReportData) {
                const rawData = await dbOps.getReportData();
                if (rawData && rawData.length > 0) {
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

    data.forEach(tx => {
        // Daily revenue aggregation
        const date = new Date(tx.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyData[date]) dailyData[date] = { revenue: 0, rentals: 0 };
        dailyData[date].revenue += (tx.amount || 0);
        dailyData[date].rentals += 1;

        // Size distribution
        // size_type_id mapping: 1=Small, 2=Medium, 3=Large
        if (tx.lockers) {
            const sizeIdx = (tx.lockers.size_type_id || 1) - 1;
            if (sizeIdx >= 0 && sizeIdx < 3) sizeData[sizeIdx]++;
        }
    });

    // Update reportData object
    reportData.revenueAndRentals.labels = Object.keys(dailyData);
    reportData.revenueAndRentals.revenue = Object.values(dailyData).map(d => d.revenue);
    reportData.revenueAndRentals.rentals = Object.values(dailyData).map(d => d.rentals);
    reportData.rentalsBySize.data = sizeData;
}

/**
 * Update stat cards with data
 */
function updateStatCards() {
    // Update visible stat card values
    const statCards = document.querySelectorAll('.reports-stats .stat-card');
    if (statCards.length >= 3) {
        statCards[0].querySelector('.stat-value').textContent = `₱${reportData.totalRevenue.toFixed(2)}`;
        statCards[1].querySelector('.stat-value').textContent = reportData.totalRentals;
        statCards[2].querySelector('.stat-value').textContent = `₱${reportData.avgRentalValue.toFixed(2)}`;
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
