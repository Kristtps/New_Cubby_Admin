// ========================================
// REPORTS PAGE - JAVASCRIPT FUNCTIONALITY
// ========================================

// Chart instances
let revenueChartInstance = null;
let rentalsBySizeInstance = null;

// Sample report data
const reportData = {
    totalRevenue: 10.00,
    totalRentals: 1,
    avgRentalValue: 10.00,
    revenueAndRentals: {
        labels: ['Apr 4', 'Apr 5', 'Apr 6', 'Apr 7', 'Apr 8', 'Apr 9', 'Apr 10', 'Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17'],
        revenue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10],
        rentals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
    },
    rentalsBySize: {
        labels: ['Small', 'Medium', 'Large'],
        data: [1, 0, 0],
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
        // Try to load from Supabase first
        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected()) {
            if (typeof dbOps !== 'undefined' && dbOps.getDashboardStats) {
                try {
                    const stats = await dbOps.getDashboardStats();
                    if (stats) {
                        // Transform database stats to report format
                        reportData.totalRevenue = stats.todayRevenue || 0;
                        reportData.totalRentals = stats.totalRentals || 0;
                        reportData.avgRentalValue = stats.totalRentals > 0 ? stats.todayRevenue / stats.totalRentals : 0;
                        console.log('✓ Report data loaded from database', stats);
                        return;
                    }
                } catch (error) {
                    console.warn('Error loading from database:', error);
                }
            }
        }
        
        // Fall back to localStorage
        const savedReport = localStorage.getItem('coincubby_report_data');
        if (savedReport) {
            const data = JSON.parse(savedReport);
            Object.assign(reportData, data);
            console.log('✓ Report data loaded from localStorage', data);
        }
    } catch (error) {
        console.warn('Using default report data:', error);
    }

    updateStatCards();
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
    
    if (!ctx) {
        console.error('Chart canvas not found');
        return;
    }

    const chartData = reportData.revenueAndRentals;

    if (revenueChartInstance) {
        revenueChartInstance.destroy();
    }

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
                    pointRadius: 5,
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                    tension: 0.4,
                    pointStyle: 'circle'
                },
                {
                    label: 'Rentals',
                    data: chartData.rentals,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    borderWidth: 3,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: '#f59e0b',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                    tension: 0.4,
                    pointStyle: 'circle'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 13,
                            weight: '600'
                        },
                        color: '#6b7280'
                    }
                },
                filler: {
                    propagate: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize Rentals by Size Donut Chart
 */
function initializeRentalsBySizeChart() {
    const ctx = document.getElementById('rentalsBySize');
    
    if (!ctx) {
        console.error('Chart canvas not found');
        return;
    }

    const chartData = reportData.rentalsBySize;

    if (rentalsBySizeInstance) {
        rentalsBySizeInstance.destroy();
    }

    rentalsBySizeInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    data: chartData.data,
                    backgroundColor: chartData.backgroundColor,
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    hoverOffset: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 13,
                            weight: '600'
                        },
                        color: '#6b7280'
                    }
                }
            }
        }
    });
}

/**
 * Update chart data dynamically
 */
function updateChartData(newData) {
    try {
        Object.assign(reportData, newData);
        localStorage.setItem('coincubby_report_data', JSON.stringify(reportData));
        
        // Reinitialize charts with new data
        initializeCharts();
        updateStatCards();
        
        console.log('✓ Chart data updated:', newData);
    } catch (error) {
        console.error('Error updating chart data:', error);
    }
}

/**
 * Print report
 */
function printReport() {
    try {
        // Ensure charts are rendered before printing
        setTimeout(() => {
            window.print();
            console.log('✓ Report printing initiated');
        }, 100);
    } catch (error) {
        console.error('Error printing report:', error);
    }
}

/**
 * Export report as PDF or image
 */
function exportReport() {
    try {
        const reportContent = {
            title: 'CoinCubby Report',
            date: new Date().toISOString(),
            stats: {
                totalRevenue: reportData.totalRevenue,
                totalRentals: reportData.totalRentals,
                avgRentalValue: reportData.avgRentalValue
            },
            charts: {
                revenueAndRentals: reportData.revenueAndRentals,
                rentalsBySize: reportData.rentalsBySize
            }
        };

        // Export as JSON
        exportAsJSON(reportContent);
    } catch (error) {
        console.error('Error exporting report:', error);
    }
}

/**
 * Export data as JSON file
 */
function exportAsJSON(data) {
    try {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        console.log('✓ Report exported as JSON');
    } catch (error) {
        console.error('Error exporting as JSON:', error);
    }
}

/**
 * Export chart as image
 */
function exportChartAsImage(chartInstance, filename) {
    try {
        if (!chartInstance) {
            console.error('Chart instance not found');
            return;
        }

        const image = chartInstance.toBase64Image();
        const link = document.createElement('a');
        link.href = image;
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
        
        console.log(`✓ Chart exported as image: ${filename}`);
    } catch (error) {
        console.error('Error exporting chart as image:', error);
    }
}

/**
 * Get summary statistics
 */
function getSummaryStats() {
    return {
        totalRevenue: reportData.totalRevenue,
        totalRentals: reportData.totalRentals,
        avgRentalValue: reportData.avgRentalValue,
        lastUpdated: new Date().toISOString()
    };
}

/**
 * Generate mock data for testing
 */
function generateMockData() {
    const mockData = {
        totalRevenue: Math.random() * 1000,
        totalRentals: Math.floor(Math.random() * 50),
        avgRentalValue: Math.random() * 100,
        revenueAndRentals: {
            labels: reportData.revenueAndRentals.labels,
            revenue: reportData.revenueAndRentals.labels.map(() => Math.random() * 500),
            rentals: reportData.revenueAndRentals.labels.map(() => Math.floor(Math.random() * 20))
        },
        rentalsBySize: {
            ...reportData.rentalsBySize,
            data: [
                Math.floor(Math.random() * 30),
                Math.floor(Math.random() * 30),
                Math.floor(Math.random() * 30)
            ]
        }
    };

    updateChartData(mockData);
    console.log('✓ Mock data generated');
}

/**
 * Refresh report data
 */
function refreshReport() {
    try {
        // Reload from localStorage or API
        loadReportData();
        initializeCharts();
        console.log('✓ Report refreshed');
    } catch (error) {
        console.error('Error refreshing report:', error);
    }
}

// Expose functions globally for use in HTML
window.printReport = printReport;
window.exportReport = exportReport;
window.generateMockData = generateMockData;
window.refreshReport = refreshReport;
