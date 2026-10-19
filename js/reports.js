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
 * Get chart colors based on current theme
 */
function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        borderColor: isDark ? '#2d3f55' : '#ffffff',
        gridColor: isDark ? '#2d3f55' : '#e5e7eb',
        textColor: isDark ? '#94a3b8' : '#6b7280',
    };
}

/**
 * Initialize Revenue & Rentals Line Chart
 */
function initializeRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    const chartData = reportData.revenueAndRentals;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

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
                    backgroundColor: isDark ? 'rgba(77, 170, 99, 0.15)' : 'rgba(77, 170, 99, 0.05)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Rentals',
                    data: chartData.rentals,
                    borderColor: '#f59e0b',
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.05)',
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

    const chartColors = getChartColors();

    rentalsBySizeInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    data: chartData.data,
                    backgroundColor: chartData.backgroundColor,
                    borderColor: chartColors.borderColor,
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
 * Get the currently selected range label for document headers
 */
function getSelectedRangeLabel() {
    const sel = document.getElementById('rangeSelect');
    if (!sel) return 'Selected Period';
    const val = sel.value;
    if (val === 'month') return 'This Month';
    if (val === 'custom') {
        const from = document.getElementById('dateFrom')?.value || '';
        const to   = document.getElementById('dateTo')?.value   || '';
        if (from && to) return `${from} — ${to}`;
        return 'Custom Range';
    }
    return `Last ${val} Days`;
}

/**
 * Print report — opens a professional document in a new window
 */
function printReport() {
    // Capture chart images from canvases
    const revenueCanvas = document.getElementById('revenueChart');
    const sizeCanvas    = document.getElementById('rentalsBySize');
    const revenueImg    = revenueCanvas ? revenueCanvas.toDataURL('image/png') : '';
    const sizeImg       = sizeCanvas    ? sizeCanvas.toDataURL('image/png')    : '';

    const rangeLabel   = getSelectedRangeLabel();
    const generatedAt  = new Date().toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    // Stat values from the DOM (already formatted)
    const statCards = document.querySelectorAll('.reports-stats .stat-card');
    const totalRevenue  = statCards[0]?.querySelector('.stat-value')?.textContent?.trim() || '₱0.00';
    const totalRentals  = statCards[1]?.querySelector('.stat-value')?.textContent?.trim() || '0';
    const mostLocker    = statCards[2]?.querySelector('.stat-value')?.textContent?.trim() || '—';
    const mostPayment   = statCards[3]?.querySelector('.stat-value')?.textContent?.trim() || '—';

    // Build daily breakdown rows
    const labels  = reportData.revenueAndRentals.labels  || [];
    const revenue = reportData.revenueAndRentals.revenue || [];
    const rentals = reportData.revenueAndRentals.rentals || [];
    let dailyRows = '';
    labels.forEach((label, i) => {
        const rev  = (revenue[i] || 0).toFixed(2);
        const rent = rentals[i] || 0;
        dailyRows += `
            <tr>
                <td>${label}</td>
                <td>₱${rev}</td>
                <td>${rent}</td>
            </tr>`;
    });

    // Size breakdown rows
    const sizeLabels = reportData.rentalsBySize.labels || ['Small', 'Medium', 'Large'];
    const sizeData   = reportData.rentalsBySize.data   || [0, 0, 0];
    const totalSize  = sizeData.reduce((a, b) => a + b, 0) || 1;
    let sizeRows = '';
    sizeLabels.forEach((label, i) => {
        const count = sizeData[i] || 0;
        const pct   = ((count / totalSize) * 100).toFixed(1);
        sizeRows += `<tr><td>${label}</td><td>${count}</td><td>${pct}%</td></tr>`;
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CoinCubby Report — ${rangeLabel}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    color: #1f2937;
    background: #fff;
    padding: 0;
  }
  .page {
    width: 794px;
    margin: 0 auto;
    padding: 48px 52px;
  }

  /* ── Letterhead ── */
  .letterhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid #4DAA63;
    padding-bottom: 20px;
    margin-bottom: 28px;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-name { font-size: 22px; font-weight: 800; color: #1f2937; letter-spacing: -0.5px; }
  .brand-tag  { font-size: 11px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
  .brand-dot  { display: inline-block; width: 10px; height: 10px; background: #4DAA63; border-radius: 50%; margin-right: 4px; }
  .doc-meta   { text-align: right; font-size: 12px; color: #6b7280; line-height: 1.6; }
  .doc-meta strong { color: #1f2937; }

  /* ── Report Title Block ── */
  .report-title-block { margin-bottom: 28px; }
  .report-title-block h1 { font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 4px; }
  .report-title-block .period-tag {
    display: inline-block;
    background: #ecfdf5;
    color: #4DAA63;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid #bbf7d0;
  }

  /* ── Section Headings ── */
  .section-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #6b7280;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e5e7eb;
  }

  /* ── Summary KPI Grid ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 32px;
  }
  .kpi-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 16px;
  }
  .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 6px; }
  .kpi-value { font-size: 20px; font-weight: 800; color: #1f2937; line-height: 1.2; }
  .kpi-card.accent { border-left: 3px solid #4DAA63; }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 12px; }
  thead tr { background: #1f2937; color: #fff; }
  thead th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody tr:nth-child(odd)  { background: #fff; }
  tbody td { padding: 9px 14px; border-bottom: 1px solid #f3f4f6; color: #374151; }
  tbody tr:last-child td { border-bottom: none; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }

  /* ── Charts ── */
  .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 32px; }
  .chart-box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; background: #fff; }
  .chart-box h4 { font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
  .chart-box img { width: 100%; height: auto; display: block; }

  /* ── Footer ── */
  .doc-footer {
    margin-top: 32px;
    padding-top: 14px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #9ca3af;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 32px 40px; }
    thead tr { background: #1f2937 !important; -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Letterhead -->
  <div class="letterhead">
    <div class="brand">
      <div>
        <div class="brand-name"><span class="brand-dot"></span>CoinCubby</div>
        <div class="brand-tag">Admin Operations Report</div>
      </div>
    </div>
    <div class="doc-meta">
      <div><strong>Generated:</strong> ${generatedAt}</div>
      <div><strong>Period:</strong> ${rangeLabel}</div>
      <div><strong>Document:</strong> Confidential</div>
    </div>
  </div>

  <!-- Title -->
  <div class="report-title-block">
    <h1>Operations Summary Report</h1>
    <span class="period-tag">${rangeLabel}</span>
  </div>

  <!-- KPI Cards -->
  <div class="section-title">Key Performance Indicators</div>
  <div class="kpi-grid">
    <div class="kpi-card accent">
      <div class="kpi-label">Total Revenue</div>
      <div class="kpi-value">${totalRevenue}</div>
    </div>
    <div class="kpi-card accent">
      <div class="kpi-label">Total Rentals</div>
      <div class="kpi-value">${totalRentals}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Most Used Locker</div>
      <div class="kpi-value" style="font-size:14px;">${mostLocker || '—'}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Top Payment Method</div>
      <div class="kpi-value" style="font-size:14px;">${mostPayment || '—'}</div>
    </div>
  </div>

  <!-- Charts -->
  ${(revenueImg || sizeImg) ? `
  <div class="section-title">Visual Analytics</div>
  <div class="charts-row">
    ${revenueImg ? `<div class="chart-box"><h4>Revenue &amp; Rentals Trend</h4><img src="${revenueImg}" alt="Revenue Chart"></div>` : ''}
    ${sizeImg    ? `<div class="chart-box"><h4>Rentals by Size</h4><img src="${sizeImg}" alt="Size Chart"></div>` : ''}
  </div>` : ''}

  <!-- Daily Breakdown Table -->
  <div class="section-title">Daily Revenue &amp; Rentals Breakdown</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Revenue (₱)</th>
        <th>Rentals</th>
      </tr>
    </thead>
    <tbody>
      ${dailyRows || '<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:20px;">No data available</td></tr>'}
    </tbody>
  </table>

  <!-- Size Breakdown Table -->
  <div class="section-title">Rentals by Locker Size</div>
  <table>
    <thead>
      <tr>
        <th>Locker Size</th>
        <th>Count</th>
        <th>Share (%)</th>
      </tr>
    </thead>
    <tbody>
      ${sizeRows || '<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:20px;">No data available</td></tr>'}
    </tbody>
  </table>

  <!-- Footer -->
  <div class="doc-footer">
    <span>CoinCubby Admin Panel &mdash; Confidential</span>
    <span>Generated: ${generatedAt}</span>
  </div>

</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) {
        alert('Please allow popups for this site to use the Print feature.');
        return;
    }
    printWin.document.write(html);
    printWin.document.close();
}

/**
 * Export report as a formatted CSV document
 */
function exportReport() {
    const rangeLabel  = getSelectedRangeLabel();
    const generatedAt = new Date().toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const statCards   = document.querySelectorAll('.reports-stats .stat-card');
    const totalRevenue = statCards[0]?.querySelector('.stat-value')?.textContent?.trim() || '0.00';
    const totalRentals = statCards[1]?.querySelector('.stat-value')?.textContent?.trim() || '0';
    const mostLocker   = statCards[2]?.querySelector('.stat-value')?.textContent?.trim() || '—';
    const mostPayment  = statCards[3]?.querySelector('.stat-value')?.textContent?.trim() || '—';

    const labels  = reportData.revenueAndRentals.labels  || [];
    const revenue = reportData.revenueAndRentals.revenue || [];
    const rentals = reportData.revenueAndRentals.rentals || [];

    const sizeLabels = reportData.rentalsBySize.labels || ['Small', 'Medium', 'Large'];
    const sizeData   = reportData.rentalsBySize.data   || [0, 0, 0];
    const totalSize  = sizeData.reduce((a, b) => a + b, 0) || 1;

    const rows = [];

    // ── Document Header ──
    rows.push(['COINCUBBY OPERATIONS REPORT']);
    rows.push(['Period', rangeLabel]);
    rows.push(['Generated', generatedAt]);
    rows.push(['Document', 'Confidential']);
    rows.push([]);

    // ── KPI Summary ──
    rows.push(['--- KEY PERFORMANCE INDICATORS ---']);
    rows.push(['Metric', 'Value']);
    rows.push(['Total Revenue', totalRevenue]);
    rows.push(['Total Rentals', totalRentals]);
    rows.push(['Most Used Locker', mostLocker]);
    rows.push(['Top Payment Method', mostPayment]);
    rows.push([]);

    // ── Daily Breakdown ──
    rows.push(['--- DAILY REVENUE & RENTALS BREAKDOWN ---']);
    rows.push(['Date', 'Revenue (PHP)', 'Rentals']);
    labels.forEach((label, i) => {
        rows.push([label, (revenue[i] || 0).toFixed(2), rentals[i] || 0]);
    });
    if (labels.length === 0) rows.push(['No data available', '', '']);
    rows.push([]);

    // ── Size Breakdown ──
    rows.push(['--- RENTALS BY LOCKER SIZE ---']);
    rows.push(['Locker Size', 'Count', 'Share (%)']);
    sizeLabels.forEach((label, i) => {
        const count = sizeData[i] || 0;
        const pct   = ((count / totalSize) * 100).toFixed(1);
        rows.push([label, count, pct + '%']);
    });
    rows.push([]);
    rows.push(['--- END OF REPORT ---']);

    // Convert to CSV string
    const csv = rows.map(row =>
        row.map(cell => {
            const str = String(cell ?? '');
            return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        }).join(',')
    ).join('\r\n');

    const bom  = '\uFEFF'; // UTF-8 BOM so Excel opens it correctly
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href     = url;
    link.download = `CoinCubby_Report_${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

// Re-render charts on theme change
window.addEventListener('themechange', function() {
    initializeRevenueChart();
    initializeRentalsBySizeChart();
});
