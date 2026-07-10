/**
 * FORMAT TIMESTAMPS FOR DISPLAY
 * 
 * TIMEZONE EXPLANATION:
 * - Supabase Server: Singapore (ap-southeast-1) = UTC+8
 * - Admin Display: Manila (PHT) = UTC+8
 * - Database: Stores timestamps WITHOUT timezone info (assumes UTC+8 from server)
 * 
 * CONVERSION STRATEGY:
 * 1. When READING from database: Timestamps come without timezone marker
 *    → Treat them as if they're already in UTC+8 (Singapore/Manila time)
 *    → Just format for display
 * 
 * 2. When WRITING to database: Convert client time to UTC+8 before storing
 *    → Calculate offset difference: clientOffset - SGT_offset (-480)
 *    → Adjust timestamp to UTC+8
 *    → Store in database
 * 
 * 3. When DISPLAYING: Format for Manila timezone
 */

/**
 * Convert a timestamp FROM client timezone TO Singapore/Manila timezone (UTC+8)
 * Use this when WRITING data to Supabase
 * 
 * @param {Date|string|number} date - Date to convert
 * @returns {Date} Date adjusted to UTC+8 (Singapore/Manila time)
 */
function convertToSGT(date) {
    let dateObj;

    if (typeof date === 'string') {
        dateObj = new Date(date);
    } else if (typeof date === 'number') {
        dateObj = new Date(date);
    } else if (date instanceof Date) {
        dateObj = date;
    } else {
        dateObj = new Date();
    }

    if (isNaN(dateObj.getTime())) {
        return new Date(); // Return current time if invalid
    }

    // Singapore/Manila is UTC+8 = -480 minutes offset
    const sgtOffsetMinutes = -480;

    // Get client's timezone offset
    const clientOffsetMinutes = new Date().getTimezoneOffset();

    // Calculate difference: how many minutes to adjust
    const totalOffsetMinutes = clientOffsetMinutes - sgtOffsetMinutes;

    // Create new date adjusted to SGT
    const adjustedTime = new Date(dateObj.getTime() + (totalOffsetMinutes * 60 * 1000));

    return adjustedTime;
}

/**
 * Format a timestamp for display in Manila/Singapore timezone
 * Use this when READING/DISPLAYING data from Supabase
 * 
 * @param {Date|string|number} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options (optional)
 * @returns {string} Formatted date in Manila timezone
 */
function formatForDisplay(date, options = {}) {
    let dateObj;

    if (typeof date === 'string') {
        dateObj = new Date(date);
    } else if (typeof date === 'number') {
        dateObj = new Date(date);
    } else if (date instanceof Date) {
        dateObj = date;
    } else {
        dateObj = new Date();
    }

    if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
    }

    // Since database stores times without timezone info and assumes UTC+8,
    // we just need to format directly without adjustment
    const defaultOptions = {
        timeZone: 'Asia/Manila', // or 'Asia/Singapore' - both are UTC+8
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        ...options
    };

    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
}

/**
 * LEGACY: formatPHTime is now an alias to formatForDisplay
 * Kept for backward compatibility
 */
function formatPHTime(date, options = {}) {
    return formatForDisplay(date, options);
}

/**
 * Generate a random alphanumeric ID of specified length
 * @param {number} length - Length of the ID to generate (default: 16)
 * @returns {string} Random alphanumeric string
 */
function generateRandomId(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Diagnostic function to check timezone conversion
 * Supabase ap-southeast-1 region (Singapore) = UTC+8 same as Manila
 */
function checkTimezoneIssue() {
    const now = new Date();
    const isoString = now.toISOString();

    // Calculate offset adjustment for Manila
    const clientOffsetMinutes = now.getTimezoneOffset();
    const manilaOffsetMinutes = -480; // UTC+8
    const totalOffsetMinutes = clientOffsetMinutes - manilaOffsetMinutes;
    const adjustedTime = new Date(now.getTime() + (totalOffsetMinutes * 60 * 1000));

    // Current time in different formats
    const diagnostics = {
        'Client Local Time': now.toString(),
        'ISO String (UTC)': isoString,
        'Client Timezone Offset (minutes)': clientOffsetMinutes,
        'Client Timezone Offset (hours)': (clientOffsetMinutes / 60).toFixed(1),
        'Manila Offset (UTC+8) in minutes': manilaOffsetMinutes,
        'Total Offset Adjustment (minutes)': totalOffsetMinutes,
        'Formatted for Manila (PH Time)': new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }).format(adjustedTime),
        'formatPHTime() Output': formatPHTime(now),
        'Note': 'Supabase ap-southeast-1 = Singapore (UTC+8). Manila is also UTC+8. Times should match if conversion is correct.'
    };

    console.table(diagnostics);
    return diagnostics;
}

// Run diagnostic on page load
window.addEventListener('load', function () {
    console.log('🔍 Timezone Diagnostic:');
    checkTimezoneIssue();
});

// Add interactive features and database integration support
// Sign Out Button Handler - Makes all .sign-out links functional

document.addEventListener('click', function (e) {
    const logoutLink = e.target.closest('.sign-out');
    if (logoutLink) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            if (typeof logoutUser !== 'undefined') {
                logoutUser();
            } else {
                localStorage.removeItem('coincubby_auth');
                window.location.href = 'login.html';
            }
        }
    }
});

// Protect this page from unauthorized access (only if not authenticated)
document.addEventListener('DOMContentLoaded', async function () {
    // Wait for Supabase to initialize if needed
    if (window.supabasePromise) {
        await window.supabasePromise;
    }

    if (typeof protectPage !== 'undefined') {
        protectPage();
    } else if (typeof isUserAuthenticated !== 'undefined') {
        if (!isUserAuthenticated()) {
            console.log('User not authenticated, redirecting to login...');
            window.location.href = 'login.html';
            return;
        }
    }

    initializeSidebar();
    updateUserProfile();

    // Check which page we're on
    if (document.getElementById('lockers-table')) {
        await initializeLockerManagement();
        // Start AJAX Auto-Refresh for Lockers (every 30 seconds)
        setInterval(async function() {
            try {
                lockerRecords = await loadLockerRecords();
                renderLockersTable();
                console.log('✓ Locker data auto-refreshed via AJAX');
            } catch (err) {
                console.error('Locker auto-refresh error:', err);
            }
        }, 30000);
    } else if (document.getElementById('modules-container')) {
        await loadDashboardData();
        // Start AJAX Auto-Refresh for Dashboard (every 30 seconds)
        setInterval(async function() {
            try {
                await loadDashboardData();
                console.log('✓ Dashboard data auto-refreshed via AJAX');
            } catch (err) {
                console.error('Dashboard auto-refresh error:', err);
            }
        }, 30000);

        animateStats();
    }
});

/**
 * Load dashboard data from Supabase or fallback
 */
async function loadDashboardData(dateFrom, dateTo) {
    if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected()) {
        try {
            console.log('Loading dashboard data from Supabase...');
            const stats = await getDashboardStats(dateFrom, dateTo);
            const lockers = await fetchAllLockers();

            const dashboardData = {
                stats: {
                    'total-lockers': (lockers && lockers.length) || 0,
                    'active-rentals': (stats && stats.activeRentals) || 0,
                    'total-customers': (stats && stats.totalCustomers) || 0,
                    'today-revenue': ((stats && stats.todayRevenue) || 0).toFixed(2)
                },
                recentRentals: (stats && stats.recentRentals) || [],
                last7DaysSales: (stats && stats.last7DaysSales) || [],
                lockers: lockers
            };

            refreshDashboardFromDatabase(dashboardData);
        } catch (error) {
            console.error('Error loading dashboard data from database:', error);
            console.log('Falling back to sample data...');
            initializeLockers();
        }
    } else {
        console.log('Supabase not connected, using sample data');
        initializeLockers();
    }
}


// ==================== DATABASE HELPER FUNCTIONS ====================

/**
 * Get dashboard statistics from database
 * This will be called by db-operations.js and exposed globally
 */
async function getDashboardStats(dateFrom, dateTo) {
    if (typeof dbOps !== 'undefined' && dbOps.getDashboardStats) {
        return await dbOps.getDashboardStats(dateFrom, dateTo);
    }
    return null;
}

/**
 * Fetch all lockers from database
 */
async function fetchAllLockers() {
    if (typeof dbOps !== 'undefined' && dbOps.fetchAllLockers) {
        return await dbOps.fetchAllLockers();
    }
    return [];
}

/* ── Filter handlers for Overview page ───────────────────────── */

/**
 * Main dispatcher — called when the range <select> changes on Overview
 */
async function handleRangeSelect(value) {
    const customRange = document.getElementById('customRange');
    if (customRange) customRange.classList.remove('visible');

    if (value === 'month') {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        await loadDashboardData(from, to);
    } else if (value === 'custom') {
        if (customRange) customRange.classList.add('visible');
        return; // wait for the user to pick dates
    } else {
        const days = parseInt(value, 10);
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - (days - 1));
        from.setHours(0, 0, 0, 0);
        await loadDashboardData(from, to);
    }
}

/**
 * Apply whatever dates are set in the custom pickers on Overview
 */
async function applyCustomFilter() {
    const fromVal = document.getElementById('dateFrom').value;
    const toVal = document.getElementById('dateTo').value;
    if (!fromVal || !toVal) return;

    const from = new Date(fromVal);
    const to = new Date(toVal);
    to.setHours(23, 59, 59, 999);

    await loadDashboardData(from, to);
}

// ==================== DATABASE INTEGRATION FUNCTIONS ====================
// Use these functions to update UI with database data without changing the design

/**
 * Update a stat value from database
 * @param {string} statKey - 'total-lockers', 'active-rentals', 'total-customers', 'today-revenue'
 * @param {string|number} value - New value from database
 */
function updateStat(statKey, value) {
    const statCard = document.querySelector(`[data-stat="${statKey}"] .stat-value`);
    if (statCard) {
        const currency = statCard.getAttribute('data-currency');
        if (currency) {
            statCard.textContent = currency + value;
        } else {
            statCard.textContent = value;
        }
    }
}

/**
 * Update all stats at once
 * @param {object} statsData - Object with stat keys and values
 * Example: { 'total-lockers': 20, 'active-rentals': 3, 'total-customers': 5, 'today-revenue': '150.00' }
 */
function updateAllStats(statsData) {
    Object.keys(statsData).forEach(key => {
        updateStat(key, statsData[key]);
    });
}

/**
 * Update locker status and styling
 * @param {string} lockerId - Locker ID (e.g., 'L1', 'M2', 'S3')
 * @param {string} newStatus - Status: 'available', 'occupied', 'payment', 'maintenance'
 */
function updateLockerStatus(lockerId, newStatus) {
    const locker = document.querySelector(`[data-locker-id="${lockerId}"]`);
    if (locker) {
        locker.classList.remove('available', 'occupied', 'payment', 'maintenance');
        locker.classList.add(newStatus);
        locker.setAttribute('data-status', newStatus);

        const iconContainer = locker.querySelector('svg');
        if (iconContainer) {
            if (newStatus === 'available') {
                // Unlock icon for available
                iconContainer.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>';
            } else if (newStatus === 'maintenance') {
                // Tool/Wrench icon for maintenance
                iconContainer.innerHTML = '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>';
            } else {
                // Package icon for Occupied (In Use)
                iconContainer.innerHTML = '<path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 7v10"></path><path d="M12 12v10"></path><path d="M22 7v10"></path>';
            }
        }
    }
}

/**
 * Update multiple locker statuses
 * @param {object} lockerUpdates - Object with lockerId: status pairs
 * Example: { 'L1': 'occupied', 'M2': 'available', 'S3': 'payment' }
 */
function updateLockerStatuses(lockerUpdates) {
    Object.keys(lockerUpdates).forEach(lockerId => {
        updateLockerStatus(lockerId, lockerUpdates[lockerId]);
    });
}

/**
 * Update a module's available count
 * @param {number} moduleId - Module ID (1 or 2)
 * @param {number} count - Number of available lockers
 */
function updateModuleAvailableCount(moduleId, count) {
    const module = document.querySelector(`[data-module-id="${moduleId}"]`);
    if (module) {
        const countElement = module.querySelector('[data-available-count]');
        if (countElement) {
            countElement.textContent = count + ' available';
            countElement.setAttribute('data-available-count', count);
        }
    }
}

/**
 * Add or update a rental in the recent rentals list
 * @param {object} rentalData - { id, customerName, lockerInfo, amount }
 * Example: { id: 1, customerName: 'John Doe', lockerInfo: 'Locker M1 • Apr 17, 10:30', amount: '₱25' }
 */
function updateRental(rentalData) {
    const rentalsList = document.getElementById('rentals-list');

    // Check if rental already exists
    let rentalItem = document.querySelector(`[data-rental-id="${rentalData.id}"]`);

    if (!rentalItem) {
        // Create new rental element
        rentalItem = document.createElement('div');
        rentalItem.className = 'rental-item';
        rentalItem.setAttribute('data-rental-id', rentalData.id);
        rentalsList.appendChild(rentalItem);
    }

    // Update rental content
    rentalItem.innerHTML = `
        <p class="rental-customer" data-field="customer-name">${rentalData.customerName}</p>
        <p class="rental-details" data-field="locker-info">${rentalData.lockerInfo}</p>
        <p class="rental-price" data-field="rental-amount">${rentalData.amount}</p>
    `;
}

/**
 * Update recent rentals list with multiple items
 * @param {array} rentalsData - Array of rental objects
 */
function updateRentalsList(rentalsData) {
    const rentalsList = document.getElementById('rentals-list');
    rentalsList.innerHTML = '';

    rentalsData.forEach(rental => {
        updateRental(rental);
    });
}

/**
 * Refresh UI with complete dashboard data from database
 * @param {object} dashboardData - Complete dashboard data object
 */
function refreshDashboardFromDatabase(dashboardData) {
    // Update stats
    if (dashboardData.stats) {
        updateAllStats(dashboardData.stats);
    }

    // Update lockers and modules dynamically
    const modulesContainer = document.getElementById('modules-container');
    if (modulesContainer && dashboardData.lockers) {
        modulesContainer.innerHTML = ''; // Clear loading state

        // Group lockers by module
        const grouped = dashboardData.lockers.reduce((acc, locker) => {
            const modId = locker.module_id || (locker.modules ? locker.modules.module_id : 'unknown');
            const modName = (() => {
                const raw = locker.modules && locker.modules.name != null ? locker.modules.name : null;
                if (raw != null) return String(raw).startsWith('M') ? String(raw) : `M${raw}`;
                return `M${modId}`;
            })();

            if (!acc[modId]) {
                acc[modId] = {
                    id: modId,
                    name: modName,
                    lockers: [],
                    availableCount: 0
                };
            }
            acc[modId].lockers.push(locker);
            if (locker.status.toLowerCase() === 'available') {
                acc[modId].availableCount++;
            }
            return acc;
        }, {});

        // Render each module
        Object.values(grouped).forEach(mod => {
            const moduleEl = document.createElement('div');
            moduleEl.className = 'module';
            moduleEl.setAttribute('data-module-id', mod.id);

            moduleEl.innerHTML = `
                <div class="module-header">
                    <div class="module-badge">${mod.name.substring(0, 2).toUpperCase()}</div>
                    <h3>${mod.name}</h3>
                    <span class="available-count" data-available-count="${mod.availableCount}">${mod.availableCount} available</span>
                </div>
                <div class="lockers-grid" data-module="${mod.id}">
                    ${mod.lockers.map(locker => {
                const status = locker.status.toLowerCase();
                const lockerId = locker.locker_number || locker.code;
                const size = locker.size || (locker.size_type_id === 1 ? 'S' : locker.size_type_id === 2 ? 'M' : 'L');
                const sizeLabel = locker.size || (locker.size_type_id === 1 ? 'Small' : locker.size_type_id === 2 ? 'Medium' : 'Large');

                let icon = '<path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 7v10"></path><path d="M12 12v10"></path><path d="M22 7v10"></path>';
                if (status === 'available') {
                    icon = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>';
                } else if (status === 'maintenance') {
                    icon = '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>';
                }

                return `
                            <div class="locker ${status}" data-locker-id="${lockerId}" data-status="${status}" data-size="${size[0]}">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    ${icon}
                                </svg>
                                <p class="size">${size[0]}</p>
                                <p class="label">${sizeLabel}</p>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
            modulesContainer.appendChild(moduleEl);
        });

        // Re-initialize click handlers for the new locker elements
        initializeLockers();
    }

    // Update recent rentals
    if (dashboardData.recentRentals) {
        updateRentalsList(dashboardData.recentRentals);
    }

    // Update sales chart
    if (dashboardData.last7DaysSales) {
        updateSalesChart(dashboardData.last7DaysSales);
    }
}

/**
 * Update the sales chart SVG with dynamic database values
 * @param {array} salesData - Array of sales items { dateString, dayName, amount }
 */
function updateSalesChart(salesData) {
    const svg = document.getElementById('sales-chart-svg');
    if (!svg) return;

    // Find max value and calculate scale
    let maxAmt = Math.max(...salesData.map(d => d.amount), 0);
    if (maxAmt === 0) maxAmt = 100;

    // Choose a nice clean multiple for scale
    const roundFactor = maxAmt > 500 ? 100 : (maxAmt > 100 ? 50 : 20);
    const maxScale = Math.ceil(maxAmt / roundFactor) * roundFactor;

    // Calculate Y-axis tick values
    const yTicks = [
        0,
        Math.round(maxScale * 0.25),
        Math.round(maxScale * 0.5),
        Math.round(maxScale * 0.75),
        maxScale
    ];

    // Build the grid lines
    let svgContent = `
        <!-- Grid lines -->
        <line x1="50" y1="250" x2="850" y2="250" stroke="#f3f4f6" stroke-width="1" />
        <line x1="50" y1="200" x2="850" y2="200" stroke="#f3f4f6" stroke-width="1" />
        <line x1="50" y1="150" x2="850" y2="150" stroke="#f3f4f6" stroke-width="1" />
        <line x1="50" y1="100" x2="850" y2="100" stroke="#f3f4f6" stroke-width="1" />
        <line x1="50" y1="50" x2="850" y2="50" stroke="#f3f4f6" stroke-width="1" />

        <!-- Axes -->
        <line x1="50" y1="250" x2="850" y2="250" stroke="#e5e7eb" stroke-width="2" />
        <line x1="50" y1="50" x2="50" y2="250" stroke="#e5e7eb" stroke-width="2" />
    `;

    // Add Y-axis labels
    yTicks.forEach((val, idx) => {
        const yPos = 250 - (idx * 50);
        svgContent += `
            <text x="40" y="${yPos + 4}" text-anchor="end" font-size="12" font-family="Inter, system-ui, sans-serif" font-weight="500" fill="#9ca3af">${val}</text>
        `;
    });

    // Add Bars & X-axis labels
    const barWidth = 46;
    const spacing = 110;
    const startX = 100;

    salesData.forEach((day, idx) => {
        const center = startX + (idx * spacing);
        const rectX = center - (barWidth / 2);

        // Calculate height
        const pct = day.amount / maxScale;
        const height = pct * 200; // max Y height is 200px
        const rectY = 250 - height;

        // Use a nice premium gradient feel or pure primary color
        const hasSales = day.amount > 0;
        const barFill = hasSales ? '#4DAA63' : '#e5e7eb';

        svgContent += `
            <!-- Bar -->
            <rect x="${rectX}" y="${rectY}" width="${barWidth}" height="${height}" rx="6" ry="6" fill="${barFill}" style="transition: all 0.3s ease;">
                <title>${day.dayName}: ₱${day.amount.toFixed(2)}</title>
            </rect>
        `;

        // If sales exist, show value text above bar
        if (hasSales) {
            svgContent += `
                <text x="${center}" y="${rectY - 8}" text-anchor="middle" font-size="11" font-family="Inter, system-ui, sans-serif" font-weight="600" fill="#4DAA63">₱${Math.round(day.amount)}</text>
            `;
        }

        // X-axis day name
        svgContent += `
            <text x="${center}" y="275" text-anchor="middle" font-size="12" font-family="Inter, system-ui, sans-serif" font-weight="600" fill="#6b7280">${day.dayName}</text>
        `;
    });

    svg.innerHTML = svgContent;
}

/**
 * Update user profile in sidebar from localStorage
 */
function updateUserProfile() {
    try {
        const authData = JSON.parse(localStorage.getItem('coincubby_auth') || '{}');
        const email = authData.email || 'Admin';

        // Update user name (now email)
        const userNameElem = document.querySelector('.user-name');
        if (userNameElem) {
            userNameElem.textContent = email;
            userNameElem.title = email; // Show full email on hover
        }

        // Update avatar initial
        const avatarElem = document.querySelector('.avatar');
        if (avatarElem) {
            avatarElem.textContent = email.charAt(0).toUpperCase();
        }
    } catch (e) {
        console.error('Error updating user profile:', e);
    }
}

// ==================== ORIGINAL FEATURES ====================

// Sidebar navigation
function initializeSidebar() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            // Only prevent default if it's an anchor link
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }

            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));

            // Add active class to clicked item
            this.classList.add('active');
        });
    });
}

// ==================== LOCKER MANAGEMENT PAGE FUNCTIONS ====================

let lockerRecords = [];
let moduleRecords = [];
let currentModuleFilter = 'All';

/**
 * Initialize locker management page functionality
 */
async function initializeLockerManagement() {
    // Load modules from database for the tabs
    if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
        typeof dbOps !== 'undefined' && dbOps.fetchAllModules) {
        try {
            const mods = await dbOps.fetchAllModules();
            if (mods && Array.isArray(mods)) {
                moduleRecords = mods;
            }
        } catch (err) {
            console.error('Error loading modules:', err);
        }
    }

    lockerRecords = await loadLockerRecords();
    renderLockersTable();
    initializeActionButtons(); // Only attaches listener once
    initializeAddLockerButton();
    initializeModal();
}

async function loadLockerRecords() {
    try {
        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
            typeof dbOps !== 'undefined' && dbOps.fetchAllLockers) {
            const dbRows = await dbOps.fetchAllLockers();
            if (!dbRows) {
                console.warn('Supabase lockers connection failed.');
                return getDefaultLockerData();
            }
            if (!Array.isArray(dbRows)) {
                console.warn('Unexpected lockers response from Supabase.');
                return getDefaultLockerData();
            }
            if (dbRows.length === 0) {
                // No lockers yet — that's fine, table will show empty
                return [];
            }
            const mapped = mapDbRowsToLockerRecords(dbRows);
            return mapped;
        }
    } catch (error) {
        console.error('Error loading lockers from database:', error);
    }
    return getDefaultLockerData();
}

/**
 * Initialize action button handlers - attach to each button individually
 */
let globalActionListenerAttached = false;

function initializeActionButtons() {
    const tbody = document.getElementById('lockers-tbody');
    if (!tbody) return;

    // If already attached, just return
    if (globalActionListenerAttached) {
        console.log('Global action listener already attached');
        return;
    }

    globalActionListenerAttached = true;

    // Single delegated listener for ALL buttons in ALL modules and new lockers
    tbody.addEventListener('click', function (e) {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        const action = btn.getAttribute('data-action');
        const row = btn.closest('tr');
        const lockerIdentifier = row.getAttribute('data-locker-row');
        // Resolve locker by database ID if present, otherwise by composite key (module-id + code)
        let locker = lockerRecords.find(item => {
            if (item.dbLockerId && String(item.dbLockerId) === lockerIdentifier) return true;
            const composite = `${item.moduleId || item.module}-${item.code}`;
            return composite === lockerIdentifier;
        });

        console.log('Action button clicked:', { lockerIdentifier, action });

        // Find the locker in ALL lockerRecords (works for all modules)
        if (!locker) {
            console.error('Locker not found:', lockerIdentifier, 'Available:', lockerRecords.map(l => l.code));
            return;
        }

        console.log('Locker found:', { code: locker.code, status: locker.status, module: locker.module });

        if (action === 'maintenance') {
            handleMaintenanceToggle(locker);
        } else if (action === 'emergency-unlock') {
            handleEmergencyUnlock(locker);
        } else if (action === 'delete') {
            handleDeleteAction(locker);
        }
    });
}

/**
 * Handle maintenance toggle button click - cycles between available and maintenance
 */
async function handleMaintenanceToggle(locker) {
    const lockerId = locker.code;
    const oldStatus = locker.status;
    const newStatus = oldStatus === 'maintenance' ? 'available' : 'maintenance';

    console.log('Toggling maintenance:', { code: lockerId, oldStatus, newStatus, dbId: locker.dbLockerId });

    // Immediately update the UI for instant feedback
    // Use the same identifier used in the row's data-locker-row attribute
    const lockerIdentifier = locker.dbLockerId ? locker.dbLockerId : `${locker.moduleId || locker.module}-${locker.code}`;
    const statusCell = document.querySelector(`tr[data-locker-row="${lockerIdentifier}"] .status-badge`);
    if (statusCell) {
        statusCell.classList.remove(oldStatus);
        statusCell.classList.add(newStatus);
        statusCell.textContent = newStatus;
        console.log('Updated UI immediately:', { code: lockerId, newStatus });
    }

    // Optimistically update status in memory
    locker.status = newStatus;

    // Persist to backend (ignore result to avoid UI flicker)
    persistLockerStatus(locker).catch(err => {
        console.error('Failed to persist locker status:', err);
    });

    console.log('Maintenance toggled successfully:', { code: lockerId, newStatus });

    if (typeof dbOps !== 'undefined' && dbOps.logConfigChangeEvent) {
        await dbOps.logConfigChangeEvent('Maintenance Toggle', `Locker ${lockerId} toggled maintenance mode (from ${oldStatus} to ${newStatus}).`, { lockerId, oldStatus, newStatus });
    }
}

/**
 * Emergency unlock always returns the locker to available.
 */
async function handleEmergencyUnlock(locker) {
    if (!confirm(`Emergency unlock ${locker.code}?`)) return;

    const lockerId = locker.code;
    const oldStatus = locker.status;
    const newStatus = 'available';

    console.log('Emergency unlocking:', { code: lockerId, oldStatus, newStatus });

    // Immediately update the UI for instant feedback
    const lockerIdentifier = locker.dbLockerId ? locker.dbLockerId : `${locker.moduleId || locker.module}-${locker.code}`;
    const statusCell = document.querySelector(`tr[data-locker-row="${lockerIdentifier}"] .status-badge`);
    if (statusCell) {
        statusCell.classList.remove(oldStatus);
        statusCell.classList.add(newStatus);
        statusCell.textContent = newStatus;
        console.log('Updated UI immediately:', { code: lockerId, newStatus });
    }

    locker.status = newStatus;

    // Wait for database update
    const success = await persistLockerStatus(locker);

    if (!success) {
        console.error('Failed to persist locker status');
        locker.status = oldStatus;
        if (statusCell) {
            statusCell.classList.remove(newStatus);
            statusCell.classList.add(oldStatus);
            statusCell.textContent = oldStatus;
        }
        return;
    }

    // Complete any active transactions for this locker
    if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
        typeof dbOps !== 'undefined' && dbOps.completeActiveTransactionForLocker && locker.dbLockerId) {
        try {
            await dbOps.completeActiveTransactionForLocker(locker.dbLockerId);
            console.log('✓ Completed active transaction in database for locker:', locker.code);
        } catch (error) {
            console.error('Error completing active transaction:', error);
        }
    }

    console.log('Emergency unlock completed:', { code: lockerId, newStatus });

    if (typeof dbOps !== 'undefined' && dbOps.logConfigChangeEvent) {
        await dbOps.logConfigChangeEvent('Emergency Unlock', `Locker ${lockerId} was emergency unlocked (Status: ${oldStatus} -> ${newStatus}).`, { lockerId, oldStatus, newStatus });
    }
}

/**
 * Handle delete button click
 */
async function handleDeleteAction(locker) {
    if (!confirm(`Are you sure you want to delete locker ${locker.code}?`)) return;

    if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
        typeof dbOps !== 'undefined' && dbOps.deleteLocker && locker.dbLockerId) {
        try {
            const success = await dbOps.deleteLocker(locker.dbLockerId);
            if (!success) {
                alert(`Failed to delete locker ${locker.code} from database.`);
                return;
            }
        } catch (error) {
            console.error('Error deleting locker:', error);
            alert(`Error deleting locker ${locker.code}.`);
            return;
        }
    }

    if (typeof dbOps !== 'undefined' && dbOps.logConfigChangeEvent) {
        await dbOps.logConfigChangeEvent('Locker Deleted', `Locker ${locker.code} was removed from the system.`, { lockerId: locker.code, lastStatus: locker.status });
    }

    lockerRecords = lockerRecords.filter(item => item.code !== locker.code);
    renderLockersTable();
}

/**
 * Initialize add locker button
 */
function initializeAddLockerButton() {
    const addLockerBtn = document.getElementById('add-locker-btn');
    if (addLockerBtn) {
        addLockerBtn.addEventListener('click', function () {
            openAddLockerModal();
        });
    }

    const addModuleBtn = document.getElementById('add-module-btn');
    if (addModuleBtn) {
        addModuleBtn.addEventListener('click', function () {
            openAddModuleModal();
        });
    }
}

/**
 * Initialize modal open/close functionality
 */
function initializeModal() {
    // ===== Add Locker Modal =====
    const modal = document.getElementById('add-locker-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const form = document.getElementById('add-locker-form');

    if (modal) {
        // Close button click
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                closeAddLockerModal();
            });
        }

        // Close modal when clicking outside
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeAddLockerModal();
            }
        });

        // Form submission
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                handleAddLockerSubmit();
            });
        }
    }

    // ===== Add Module Modal =====
    const moduleModal = document.getElementById('add-module-modal');
    const moduleCloseBtn = document.getElementById('module-modal-close-btn');
    const moduleForm = document.getElementById('add-module-form');

    if (moduleModal) {
        // Close button click
        if (moduleCloseBtn) {
            moduleCloseBtn.addEventListener('click', function () {
                closeAddModuleModal();
            });
        }

        // Close modal when clicking outside
        moduleModal.addEventListener('click', function (e) {
            if (e.target === moduleModal) {
                closeAddModuleModal();
            }
        });

        // Form submission
        if (moduleForm) {
            moduleForm.addEventListener('submit', function (e) {
                e.preventDefault();
                handleAddModuleSubmit();
            });
        }
    }

    // Close modals with Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeAddLockerModal();
            closeAddModuleModal();
        }
    });
}

/**
 * Open add locker modal
 */
async function openAddLockerModal() {
    const modal = document.getElementById('add-locker-modal');
    if (modal) {
        modal.classList.add('active');

        // Reset form first, before setting any custom values
        const form = document.getElementById('add-locker-form');
        if (form) form.reset();

        // Populate modules dropdown
        const moduleSelect = document.getElementById('locker-module');
        if (moduleSelect) {
            moduleSelect.innerHTML = '<option value="">Loading modules...</option>';
            try {
                if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
                    typeof dbOps !== 'undefined' && dbOps.fetchAllModules) {
                    const modules = await dbOps.fetchAllModules();
                    moduleSelect.innerHTML = '<option value="">Select Module</option>';
                    modules.forEach(mod => {
                        const option = document.createElement('option');
                        option.value = mod.module_id;
                        option.textContent = mod.name;
                        moduleSelect.appendChild(option);
                    });

                    if (currentModuleFilter !== 'All') {
                        moduleSelect.value = currentModuleFilter;
                    }
                } else {
                    moduleSelect.innerHTML = '<option value="1">M1 (Offline)</option>';
                }
            } catch (error) {
                console.error('Error loading modules for dropdown:', error);
                moduleSelect.innerHTML = '<option value="">Error loading modules</option>';
            }
        }

        // Focus on first input
        const firstInput = document.getElementById('locker-code');
        if (firstInput) firstInput.focus();
    }
}

/**
 * Close add locker modal
 */
function closeAddLockerModal() {
    const modal = document.getElementById('add-locker-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Handle add locker form submission
 */
async function handleAddLockerSubmit() {
    const form = document.getElementById('add-locker-form');
    if (!form) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';
    }

    try {
        const formData = new FormData(form);
        const moduleId = formData.get('module_id');
        const moduleSelect = document.getElementById('locker-module');
        const moduleName = moduleSelect.options[moduleSelect.selectedIndex].text;

        const lockerData = {
            code: formData.get('code'),
            size: formData.get('size'),
            module: moduleName,
            moduleId: moduleId,
            device: formData.get('device'),
            status: 'available'
        };

        console.log('Adding new locker:', lockerData);

        // Persist to database if connected
        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
            typeof dbOps !== 'undefined' && dbOps.createLocker) {
            const dbPayload = {
                locker_number: lockerData.code,
                size_type_id: getSizeTypeIdFromSize(lockerData.size),
                status: formatStatusForDb(lockerData.status),
                module_id: moduleId
            };
            const result = await dbOps.createLocker(dbPayload);
            if (result && result[0]) {
                lockerData.dbLockerId = result[0].locker_id || result[0].id;
            } else {
                alert('Failed to save locker to database.');
                return;
            }
        }

        lockerRecords.push(lockerData);
        renderLockersTable();

        // Close modal
        closeAddLockerModal();

        // Optional: Show success message
        alert(`Locker ${lockerData.code} added successfully!`);
    } catch (error) {
        console.error('Error saving locker:', error);
        alert('Error saving locker to database.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Locker';
        }
    }
}

function addLockerRow(lockerData) {
    const tbody = document.getElementById('lockers-tbody');
    if (!tbody) return;

    const newRow = document.createElement('tr');
    newRow.setAttribute('data-locker-row', lockerData.dbLockerId ? lockerData.dbLockerId : `${lockerData.moduleId || lockerData.module}-${lockerData.code}`);

    newRow.innerHTML = `
        <td class="code-cell"><span class="locker-code" data-field="code">${lockerData.code}</span></td>
        <td class="size-cell"><span data-field="size">${lockerData.size}</span></td>
        <td class="module-cell"><span data-field="module">${lockerData.module}</span></td>
        <td class="device-cell"><span data-field="device">${lockerData.device}</span></td>
        <td class="status-cell"><span class="status-badge ${lockerData.status}" data-field="status">${lockerData.status}</span></td>
        <td class="actions-cell">
            <button class="action-btn maintenance-btn" title="Toggle Maintenance" data-action="maintenance">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v20m0-20L7 7m10 0L17 7M5 12h14m-14 5h14"></path>
                </svg>
            </button>
            <button class="action-btn emergency-btn" title="Emergency Unlock" data-action="emergency-unlock">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1v6"></path>
                    <path d="M5 8v5a7 7 0 0 0 14 0V8"></path>
                    <rect x="9" y="11" width="6" height="4" rx="1"></rect>
                </svg>
            </button>
            <button class="action-btn delete-btn" title="Delete" data-action="delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        </td>
    `;

    tbody.appendChild(newRow);
}

function renderLockersTable() {
    const tbody = document.getElementById('lockers-tbody');
    if (!tbody) return;

    // Build the definitive list of modules
    let modulesList = [];
    if (typeof moduleRecords !== 'undefined' && Array.isArray(moduleRecords) && moduleRecords.length > 0) {
        modulesList = moduleRecords.map(m => {
            // modules.name is a smallint in the DB — format as "M1", "M2" etc.
            const raw = m.name != null ? m.name : (m.module_id || m.id);
            const label = String(raw).startsWith('M') ? String(raw) : `M${raw}`;
            return { id: String(m.module_id || m.id), name: label };
        });
    } else {
        // Fallback: extract unique modules from lockerRecords
        const fallbackModules = {};
        (lockerRecords || []).forEach(locker => {
            const key = locker.moduleId ? String(locker.moduleId) : locker.module;
            if (!fallbackModules[key]) {
                fallbackModules[key] = { id: key, name: locker.module };
            }
        });
        modulesList = Object.values(fallbackModules);
    }

    // Sort modulesList
    modulesList.sort((a, b) => {
        const numA = parseInt(a.name.replace('M', ''), 10);
        const numB = parseInt(b.name.replace('M', ''), 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.name.localeCompare(b.name);
    });

    // Render the filter tabs
    renderModuleTabs(modulesList);

    tbody.innerHTML = '';

    // Filter modules to render based on current filter
    const modulesToRender = modulesList.filter(mod => currentModuleFilter === 'All' || mod.id === currentModuleFilter);

    if (modulesToRender.length === 0) {
        const filterName = modulesList.find(m => m.id === currentModuleFilter)?.name || currentModuleFilter;
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#6b7280;">No lockers to display in ${currentModuleFilter === 'All' ? 'any module' : filterName}.</td></tr>`;
        return;
    }

    let displayedAnyLockers = false;

    modulesToRender.forEach(mod => {
        // Find lockers belonging to this module
        const moduleLockers = (lockerRecords || []).filter(locker => {
            if (locker.moduleId) return String(locker.moduleId) === mod.id;
            return locker.module === mod.id || locker.module === mod.name;
        });

        // If "All Modules" is selected and this module is empty, skip rendering its group row
        if (currentModuleFilter === 'All' && moduleLockers.length === 0) return;

        displayedAnyLockers = true;

        const groupRow = document.createElement('tr');
        groupRow.className = 'module-group-row';
        groupRow.innerHTML = `<td colspan="6">${mod.name} • ${moduleLockers.length} lockers</td>`;
        tbody.appendChild(groupRow);

        if (moduleLockers.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="6" style="text-align:center; color:#6b7280;">No lockers in this module.</td>`;
            tbody.appendChild(emptyRow);
        } else {
            moduleLockers.forEach(locker => addLockerRow(locker));
        }
    });

    if (!displayedAnyLockers && currentModuleFilter === 'All') {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#6b7280;">No lockers currently in the system.</td></tr>`;
    }
}

function renderModuleTabs(modulesList) {
    const filtersContainer = document.getElementById('module-filters');
    if (!filtersContainer) return;

    filtersContainer.innerHTML = '';

    // Add "All" button
    const allBtn = document.createElement('button');
    allBtn.className = `module-filter-btn ${currentModuleFilter === 'All' ? 'active' : ''}`;
    allBtn.textContent = 'All Modules';
    allBtn.onclick = () => {
        currentModuleFilter = 'All';
        renderLockersTable();
    };
    filtersContainer.appendChild(allBtn);

    // Add module buttons
    modulesList.forEach(mod => {
        const btn = document.createElement('button');
        btn.className = `module-filter-btn ${currentModuleFilter === mod.id ? 'active' : ''}`;
        btn.textContent = mod.name;
        btn.onclick = () => {
            currentModuleFilter = mod.id;
            renderLockersTable();
        };
        filtersContainer.appendChild(btn);
    });
}

/**
 * Update multiple lockers from database
 * @param {array} lockersData - Array of locker objects
 */
function updateAllLockers(lockersData) {
    lockerRecords = lockersData.slice();
    renderLockersTable();
}

/**
 * Open add module modal
 */
function openAddModuleModal() {
    const modal = document.getElementById('add-module-modal');
    if (!modal) return;

    modal.classList.add('active');

    // Reset form
    const form = document.getElementById('add-module-form');
    if (form) form.reset();

    // Set default module name
    const nextModuleNumber = getNextModuleNumber();
    const moduleNameInput = document.getElementById('module-name');
    if (moduleNameInput) {
        moduleNameInput.value = `M${nextModuleNumber}`;
    }

    // Generate and display module ID in the input field
    const generatedModuleId = generateRandomId(16);
    const moduleIdInput = document.getElementById('generated-module-id');
    if (moduleIdInput) {
        moduleIdInput.value = generatedModuleId;
    }

    // Set up regenerate button
    const regenerateBtn = document.getElementById('regenerate-id-btn');
    if (regenerateBtn) {
        // Remove old event listeners
        const newBtn = regenerateBtn.cloneNode(true);
        regenerateBtn.parentNode.replaceChild(newBtn, regenerateBtn);
        
        // Add new event listener
        newBtn.addEventListener('click', function() {
            const newId = generateRandomId(16);
            const moduleIdInput = document.getElementById('generated-module-id');
            if (moduleIdInput) {
                moduleIdInput.value = newId;
                // Add a subtle animation
                moduleIdInput.style.background = 'var(--color-mint-100)';
                setTimeout(() => {
                    moduleIdInput.style.background = '';
                }, 300);
            }
        });
    }

    // Initialize summary update listeners
    initializeModuleSummaryUpdates();

    // Focus on module name
    if (moduleNameInput) moduleNameInput.focus();
}

/**
 * Close add module modal
 */
function closeAddModuleModal() {
    const modal = document.getElementById('add-module-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Initialize module summary real-time updates
 */
function initializeModuleSummaryUpdates() {
    const smallInput = document.getElementById('small-count');
    const mediumInput = document.getElementById('medium-count');
    const largeInput = document.getElementById('large-count');
    const totalSpan = document.getElementById('total-compartments');

    function updateSummary() {
        const small = parseInt(smallInput?.value || 0);
        const medium = parseInt(mediumInput?.value || 0);
        const large = parseInt(largeInput?.value || 0);
        const total = small + medium + large;
        if (totalSpan) {
            totalSpan.textContent = total;
        }
    }

    if (smallInput) smallInput.addEventListener('input', updateSummary);
    if (mediumInput) mediumInput.addEventListener('input', updateSummary);
    if (largeInput) largeInput.addEventListener('input', updateSummary);

    updateSummary();
}

/**
 * Handle add module form submission
 */
async function handleAddModuleSubmit() {
    const form = document.getElementById('add-module-form');
    if (!form) return;

    const submitBtn = document.getElementById('module-submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Module...';
    }

    try {
        const formData = new FormData(form);
        const moduleName = formData.get('module_name');
        const moduleIdInput = document.getElementById('generated-module-id');
        const moduleId = moduleIdInput?.value?.trim() || generateRandomId(16);
        const smallCount = parseInt(formData.get('small_count') || 0);
        const mediumCount = parseInt(formData.get('medium_count') || 0);
        const largeCount = parseInt(formData.get('large_count') || 0);

        const totalCompartments = smallCount + mediumCount + largeCount;

        // Validate module ID
        if (!moduleId || moduleId.length === 0) {
            alert('Module ID cannot be empty.');
            return;
        }

        if (moduleId.length > 16) {
            alert('Module ID must be 16 characters or less.');
            return;
        }

        // Check for valid characters (alphanumeric only)
        if (!/^[a-zA-Z0-9]+$/.test(moduleId)) {
            alert('Module ID can only contain letters and numbers (no spaces or special characters).');
            return;
        }

        if (totalCompartments === 0) {
            alert('Please add at least one compartment to the module.');
            return;
        }

        // Generate default device ID
        const nextModuleNumber = getNextModuleNumber();
        const deviceId = `DEV-${String(nextModuleNumber).padStart(2, '0')}`;

        if (!confirm(`Create module "${moduleName}" with ${totalCompartments} compartments?\n\nModule ID: ${moduleId}`)) {
            return;
        }

        let createdModuleId = null;

        // Create module record in database
        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
            typeof dbOps !== 'undefined' && dbOps.createModule) {
            try {
                // Extract numeric part from module name for DB storage
                const moduleNumber = parseInt(moduleName.replace(/\D/g, '')) || getNextModuleNumber();
                
                const moduleResult = await dbOps.createModule({
                    module_id: moduleId,
                    name: moduleNumber,
                    status: 'Active'
                });

                if (moduleResult && moduleResult[0]) {
                    createdModuleId = moduleResult[0].module_id;
                    console.log('✓ Module created in database:', createdModuleId);

                    // Add to moduleRecords for future reference
                    if (Array.isArray(moduleRecords)) {
                        moduleRecords.push(moduleResult[0]);
                    }
                } else {
                    throw new Error('No module ID returned from database');
                }
            } catch (error) {
                console.error('Error creating module in DB:', error);
                alert('Failed to create module record in database: ' + error.message);
                return;
            }
        } else {
            alert('Supabase connection not available. Cannot add module.');
            return;
        }

        // Create locker records
        const moduleLockers = [];
        
        // Add small lockers
        for (let i = 1; i <= smallCount; i++) {
            const code = `S${i}`;
            moduleLockers.push({
                code: code,
                size: 'Small',
                module: moduleName,
                moduleId: createdModuleId,
                device: deviceId,
                status: 'available'
            });
        }

        // Add medium lockers
        for (let i = 1; i <= mediumCount; i++) {
            const code = `M${i}`;
            moduleLockers.push({
                code: code,
                size: 'Medium',
                module: moduleName,
                moduleId: createdModuleId,
                device: deviceId,
                status: 'available'
            });
        }

        // Add large lockers
        for (let i = 1; i <= largeCount; i++) {
            const code = `L${i}`;
            moduleLockers.push({
                code: code,
                size: 'Large',
                module: moduleName,
                moduleId: createdModuleId,
                device: deviceId,
                status: 'available'
            });
        }

        // Add to local records
        lockerRecords.push(...moduleLockers);

        // Persist lockers to database
        try {
            await persistNewModuleLockers(moduleLockers, createdModuleId);
            console.log('✓ Module lockers persisted to database');
        } catch (error) {
            console.error('Error persisting module lockers:', error);
            alert('Failed to save module lockers to database.');
            return;
        }

        // Close modal and refresh table
        closeAddModuleModal();
        renderLockersTable();
        alert(`✓ Module "${moduleName}" created successfully with ${totalCompartments} compartments!\n\nModule ID: ${createdModuleId}`);

    } catch (error) {
        console.error('Error creating module:', error);
        alert('Error creating module: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Module';
        }
    }
}

async function addDefaultModule() {
    const nextModuleNumber = getNextModuleNumber();
    const moduleName = `M${nextModuleNumber}`;
    const deviceId = `DEV-${String(nextModuleNumber).padStart(2, '0')}`;
    const template = getModuleTemplate();

    if (!confirm(`Add ${moduleName} with ${template.length} lockers (same setup as existing modules)?`)) return;

    let moduleId = null;

    // If connected to Supabase, create the module record first
    if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
        typeof dbOps !== 'undefined' && dbOps.createModule) {
        try {
            // Generate random 16-character module_id
            const generatedModuleId = generateRandomId(16);
            
            const moduleResult = await dbOps.createModule({
                module_id: generatedModuleId,
                // modules.name is a smallint column — send the integer, not a string
                name: nextModuleNumber,
                status: 'Active'
            });
            if (moduleResult && moduleResult[0]) {
                moduleId = moduleResult[0].module_id;
                console.log('✓ Module created in database:', moduleId);

                // Add to moduleRecords for future reference
                if (Array.isArray(moduleRecords)) {
                    moduleRecords.push(moduleResult[0]);
                }
            } else {
                throw new Error('No module ID returned from database');
            }
        } catch (error) {
            console.error('Error creating module in DB:', error);
            alert('Failed to create module record in database: ' + error.message);
            return;
        }
    } else {
        alert('Supabase connection not available. Cannot add module.');
        return;
    }

    // Create locker records for this module
    const moduleLockers = template.map(locker => {
        const code = getNextLockerCode(locker.prefix);
        return {
            code: code,
            size: locker.size,
            module: moduleName,
            moduleId: moduleId,
            device: deviceId,
            status: 'available'
        };
    });

    lockerRecords.push(...moduleLockers);

    // Persist lockers to database
    try {
        await persistNewModuleLockers(moduleLockers, moduleId);
        console.log('✓ Module lockers persisted to database');
    } catch (error) {
        console.error('Error persisting module lockers:', error);
        alert('Failed to save module lockers to database.');
        return;
    }

    renderLockersTable();
    alert(`✓ ${moduleName} added successfully with ${template.length} lockers!`);
}

function getNextModuleNumber() {
    // Prefer the moduleRecords loaded from the DB (most accurate)
    if (Array.isArray(moduleRecords) && moduleRecords.length > 0) {
        const nums = moduleRecords.map(m => {
            const raw = m.name != null ? m.name : (m.module_id || m.id);
            return parseInt(String(raw).replace('M', ''), 10);
        }).filter(n => !isNaN(n));
        return nums.length ? Math.max(...nums) + 1 : 1;
    }
    // Fallback: infer from loaded lockerRecords
    const modules = (lockerRecords || []).map(l => parseInt((l.module || '').replace('M', ''), 10)).filter(n => !isNaN(n));
    return modules.length ? Math.max(...modules) + 1 : 1;
}

function getModuleTemplate() {
    return [
        { prefix: 'L', size: 'Large' },
        { prefix: 'M', size: 'Medium' },
        { prefix: 'S', size: 'Small' },
        { prefix: 'S', size: 'Small' }
    ];
}

function getDefaultLockerData() {
    return [];
}

function normalizeStatus(status) {
    const value = String(status || 'available').toLowerCase();
    if (value === 'available' || value === 'occupied' || value === 'maintenance' || value === 'payment') {
        return value;
    }
    return 'available';
}

function formatStatusForDb(status) {
    const normalized = normalizeStatus(status);
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getSizeTypeIdFromSize(size) {
    const map = { Small: 1, Medium: 2, Large: 3 };
    return map[size] || 1;
}

function mapDbRowsToLockerRecords(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    const sortedRows = rows.slice().sort((a, b) => {
        const aId = a.locker_id || a.id || 0;
        const bId = b.locker_id || b.id || 0;
        return aId - bId;
    });

    return sortedRows.map((row, index) => {
        const number = row.locker_number || row.code || `L${index + 1}`;

        // Use joined module name. modules.name is a smallint in the DB (e.g. 1, 2)
        // so format it as "M1", "M2" etc.
        let moduleName = 'M1';
        if (row.modules && row.modules.name != null) {
            const n = row.modules.name;
            moduleName = String(n).startsWith('M') ? String(n) : `M${n}`;
        } else {
            const moduleVal = row.module_number || row.module || row.module_id;
            if (moduleVal) {
                moduleName = String(moduleVal).startsWith('M') ? String(moduleVal) : `M${moduleVal}`;
            } else {
                moduleName = inferModuleFromLockerNumber(number);
            }
        }

        const size = row.size ||
            (row.size_type_id === 1 ? 'Small' : row.size_type_id === 2 ? 'Medium' : 'Large');

        return {
            code: number,
            size: size,
            module: moduleName,
            device: row.device || row.device_id || `DEV-${String(Math.floor(index / 4) + 1).padStart(2, '0')}`,
            status: normalizeStatus(row.status),
            dbLockerId: row.locker_id || row.id || null,
            moduleId: row.module_id || (row.modules ? row.modules.module_id : null)
        };
    });
}

function inferModuleFromLockerNumber(lockerNumber) {
    const code = String(lockerNumber || '').toUpperCase();
    const numericPart = parseInt(code.replace(/^[A-Z]+/, ''), 10);
    if (code.startsWith('L') || code.startsWith('M')) {
        if (!isNaN(numericPart)) return `M${numericPart}`;
    }
    if (code.startsWith('S')) {
        if (!isNaN(numericPart)) return numericPart <= 2 ? 'M1' : 'M2';
    }
    return 'M1';
}

function getNextLockerCode(prefix) {
    const samePrefix = lockerRecords
        .map(locker => locker.code || '')
        .filter(code => code.startsWith(prefix))
        .map(code => parseInt(code.replace(prefix, ''), 10))
        .filter(value => !isNaN(value));
    const next = samePrefix.length ? Math.max(...samePrefix) + 1 : 1;
    return `${prefix}${next}`;
}

async function persistLockerStatus(locker) {
    if (!(typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
        typeof dbOps !== 'undefined' && dbOps.updateLockerStatus && locker.dbLockerId)) {
        return;
    }
    try {
        const result = await dbOps.updateLockerStatus(locker.dbLockerId, formatStatusForDb(locker.status));
        if (!result) {
            alert(`Failed to update locker ${locker.code} in Supabase.`);
        }
    } catch (error) {
        console.error('Error saving locker status:', error);
        alert(`Failed to update locker ${locker.code} in Supabase.`);
    }
}

async function persistNewModuleLockers(newLockers, moduleId) {
    if (!(typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
        typeof dbOps !== 'undefined' && dbOps.createLockersBatch)) {
        console.warn('Supabase not connected or createLockersBatch not available');
        return;
    }

    if (!moduleId) {
        throw new Error('Module ID is required to persist lockers');
    }

    const dbPayload = newLockers.map(locker => ({
        locker_number: locker.code,
        size_type_id: getSizeTypeIdFromSize(locker.size),
        status: formatStatusForDb(locker.status),
        module_id: moduleId,
        device_id: 1
    }));

    try {
        const inserted = await dbOps.createLockersBatch(dbPayload);
        if (!inserted) {
            throw new Error('Failed to insert lockers - no data returned');
        }
        if (Array.isArray(inserted)) {
            inserted.forEach((row, index) => {
                if (newLockers[index]) {
                    newLockers[index].dbLockerId = row.locker_id || row.id || null;
                }
            });
            console.log(`✓ ${inserted.length} lockers created in database`);
        }
    } catch (error) {
        console.error('Error saving new module lockers:', error);
        throw error;
    }
}

// Locker interaction
function initializeLockers() {
    const lockers = document.querySelectorAll('.locker');

    lockers.forEach(locker => {
        locker.addEventListener('click', function () {
            const lockerId = this.getAttribute('data-locker-id');
            const status = this.getAttribute('data-status');
            const size = this.getAttribute('data-size');

            console.log(`Locker clicked: ID: ${lockerId}, Size: ${size}, Status: ${status}`);
            // You can add modal or detailed view here
        });

        locker.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-4px)';
        });

        locker.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Animate stats on page load
function animateStats() {
    const stats = document.querySelectorAll('.stat-value');

    stats.forEach(stat => {
        const finalValue = stat.textContent;
        let startValue = 0;

        // Extract numeric value from final value
        const numericValue = parseFloat(finalValue.replace(/[^\d.]/g, ''));

        if (isNaN(numericValue)) return;

        const duration = 1000;
        const startTime = performance.now();

        function updateValue(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentValue = Math.floor(numericValue * progress);

            if (finalValue.includes('₱')) {
                stat.textContent = '₱' + (numericValue * progress).toFixed(2);
            } else {
                stat.textContent = currentValue;
            }

            if (progress < 1) {
                requestAnimationFrame(updateValue);
            } else {
                stat.textContent = finalValue;
            }
        }

        requestAnimationFrame(updateValue);
    });
}

// Responsive sidebar toggle (for mobile)
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.transform = sidebar.style.transform === 'translateX(-100%)'
        ? 'translateX(0)'
        : 'translateX(-100%)';
}

// Add keyboard shortcuts
document.addEventListener('keydown', function (event) {
    // Press 'L' to see locker details
    if (event.key === 'l' || event.key === 'L') {
        console.log('Show locker details view');
    }

    // Press 'C' to see customer details
    if (event.key === 'c' || event.key === 'C') {
        console.log('Show customer details view');
    }
});

