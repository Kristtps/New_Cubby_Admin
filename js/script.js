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
    initializeCustomDropdowns();
    await updateUserProfile(); // Load profile from database

    // Check which page we're on
    if (document.getElementById('lockers-table')) {
        await initializeLockerManagement();
        // Start AJAX Auto-Refresh for Lockers (every 30 seconds)
        setInterval(async function () {
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
        setInterval(async function () {
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
                // Keep data-locker-id as the display code for existing status
                // updates, and carry the primary key separately for the modal.
                const rentalLockerId = locker.locker_id || locker.id || lockerId;
                const size = locker.size || (locker.size_type_id === 1 ? 'S' : locker.size_type_id === 2 ? 'M' : 'L');
                const sizeLabel = locker.size || (locker.size_type_id === 1 ? 'Small' : locker.size_type_id === 2 ? 'Medium' : 'Large');

                let icon = '<path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 7v10"></path><path d="M12 12v10"></path><path d="M22 7v10"></path>';
                if (status === 'available') {
                    icon = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>';
                } else if (status === 'maintenance') {
                    icon = '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>';
                }

                return `
                            <div class="locker ${status}" data-locker-id="${lockerId}" data-rental-locker-id="${rentalLockerId}" data-status="${status}" data-size="${size[0]}">
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
        attachLockerClickHandlers();
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
 * Attach click handlers to locker cards in overview to show rental details
 */
function attachLockerClickHandlers() {
    const lockerCards = document.querySelectorAll('.locker[data-locker-id]');

    lockerCards.forEach(card => {
        // Remove existing listener if any
        card.style.cursor = 'pointer';

        card.addEventListener('click', async function (e) {
            e.preventDefault();
            const lockerId = this.getAttribute('data-rental-locker-id') || this.getAttribute('data-locker-id');
            const status = this.getAttribute('data-status');

            await showRentalDetailsModal(lockerId, status);
        });
    });
}

/**
 * Show rental details modal for a locker.
 *
 * Queries used (matching exact schema):
 *   lockers          → locker_id, locker_number, status, size_type_id, module_id
 *   modules          → name  (via FK join in fetchLockerByCode)
 *   transactions     → transaction_id, customer_id, rate_id, locker_id,
 *                      start_time, duration_minutes, status
 *                      NOTE: NO payments join — payments table not in schema
 *   customers        → full_name, email, contact_number
 *   rates            → price
 */
async function showRentalDetailsModal(lockerId, status) {
    const modal = document.getElementById('rentalDetailsModal');
    if (!modal) return;

    // ── Helper: safely set element text ───────────────────────────────────
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = (value !== null && value !== undefined && value !== '') ? value : 'N/A';
    };

    // ── Open modal immediately with loading placeholders ───────────────────
    modal.classList.add('active');
    modal.style.display = 'flex';
    set('detail-locker-number', lockerId);
    set('detail-locker-size', 'Loading…');
    set('detail-locker-module', 'Loading…');
    set('detail-locker-status', status || '—');
    set('detail-customer-name', 'Loading…');
    set('detail-customer-email', 'Loading…');
    set('detail-customer-phone', 'Loading…');
    set('detail-start-time', 'Loading…');
    set('detail-duration', 'Loading…');
    set('detail-rental-type', 'Loading…');
    set('detail-overtime', 'Loading…');
    const overtimeColumnsEl = document.getElementById('detail-overtime-columns');
    if (overtimeColumnsEl) overtimeColumnsEl.style.display = 'none';
    const amountEl = document.getElementById('detail-amount');
    if (amountEl) amountEl.textContent = '₱—';
    const additionalChargeEl = document.getElementById('detail-additional-charge');
    if (additionalChargeEl) additionalChargeEl.textContent = '₱—';

    console.log('=== RENTAL DETAILS MODAL ===', { lockerId, status });

    try {
        // ── Wait for Supabase to initialise ────────────────────────────────
        if (window.supabasePromise) await window.supabasePromise;
        const supabase = window.supabaseClient || window.supabase;

        if (!supabase || typeof supabase.from !== 'function') {
            throw new Error('Supabase client not ready');
        }

        // Keep the modal data flow in one place. The caller passes the unique
        // locker_id, which is then used to look up its transaction.
        if (typeof fetchLockerRentalDetails !== 'function') {
            throw new Error('fetchLockerRentalDetails is not available');
        }
        const details = await fetchLockerRentalDetails(lockerId);
        console.log('Rental Details returned to modal:', details);

        if (details) {
            set('detail-locker-number', details.locker_number || lockerId);
            set('detail-locker-size', details.size_name);
            set('detail-locker-module', details.module_name);

            const detailStatus = String(details.status || status || '').toLowerCase();
            const statusEl = document.getElementById('detail-locker-status');
            if (statusEl) {
                statusEl.textContent = detailStatus
                    ? detailStatus.charAt(0).toUpperCase() + detailStatus.slice(1)
                    : 'N/A';
                statusEl.style.color = getStatusColor(detailStatus);
            }

            const ids = ['renterInfoSection', 'rentalTimeSection', 'renterDivider', 'rentalDivider2'];
            const hide = detailStatus === 'available' || detailStatus === 'maintenance';
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = hide ? 'none' : 'block';
            });

            set('detail-customer-name', details.customer_full_name);
            set('detail-customer-email', details.customer_email);
            set('detail-customer-phone', details.customer_phone);
            set('detail-start-time', details.start_time ? formatForDisplay(details.start_time) : null);

            if (details.duration_minutes != null) {
                const minutes = Number(details.duration_minutes) || 0;
                const h = Math.floor(minutes / 60);
                const m = minutes % 60;
                set('detail-duration', h > 0 ? `${h}h ${m}m` : `${m}m`);
            } else {
                set('detail-duration', null);
            }

            const overtimeMinutes = Number(details.overtime_minutes) || 0;
            const hasOvertime = Boolean(details.transaction_id && details.is_fixed_time && overtimeMinutes > 0);

            if (!details.transaction_id) {
                set('detail-rental-type', 'N/A');
            } else if (details.is_fixed_time) {
                set('detail-rental-type', 'Fixed Time');
            } else {
                set('detail-rental-type', 'Open Hour');
            }

            if (hasOvertime) {
                const hours = Math.floor(overtimeMinutes / 60);
                const minutes = overtimeMinutes % 60;
                set('detail-overtime', hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
                if (overtimeColumnsEl) overtimeColumnsEl.style.display = 'contents';
            } else if (overtimeColumnsEl) {
                overtimeColumnsEl.style.display = 'none';
            }
            if (additionalChargeEl) {
                additionalChargeEl.textContent = `₱${Number(details.additional_charge || 0).toFixed(2)}`;
            }

            if (amountEl) amountEl.textContent = `₱${Number(details.amount_paid || 0).toFixed(2)}`;
            console.log('✓ Modal fully populated');
            console.log('=== END RENTAL DETAILS MODAL ===');
            return;
        }

        // ── STEP 1: Fetch locker (uses fetchLockerByCode — confirmed working) ─
        // Returns: locker_id, locker_number, status, size_type_id, module_id,
        //          modules { name }
        let lockerData = null;
        if (typeof fetchLockerByCode === 'function') {
            lockerData = await fetchLockerByCode(lockerId);
        }
        console.log('step1 lockerData:', lockerData);

        // ── STEP 2: Fill Locker Information ───────────────────────────────
        if (lockerData) {
            set('detail-locker-number', lockerData.locker_number || lockerId);

            // Map size_type_id → readable label (no storage_size_type FK needed)
            const SIZE_MAP = { 1: 'Small', 2: 'Medium', 3: 'Large' };
            set('detail-locker-size',
                lockerData.size ||
                SIZE_MAP[Number(lockerData.size_type_id)] ||
                String(lockerData.size_type_id || 'N/A'));

            // modules.name comes from the FK join inside fetchLockerByCode
            set('detail-locker-module',
                lockerData.modules?.name ||
                (lockerData.module_id ? `Module ${lockerData.module_id}` : 'N/A'));
        } else {
            set('detail-locker-size', 'N/A');
            set('detail-locker-module', 'N/A');
        }

        const resolvedStatus = (status || lockerData?.status || '').toLowerCase();
        const statusEl = document.getElementById('detail-locker-status');
        if (statusEl) {
            statusEl.textContent = resolvedStatus
                ? resolvedStatus.charAt(0).toUpperCase() + resolvedStatus.slice(1)
                : 'N/A';
            statusEl.style.color = getStatusColor(resolvedStatus);
        }

        // ── STEP 3: Toggle renter sections visibility ─────────────────────
        const ids = ['renterInfoSection', 'rentalTimeSection', 'renterDivider', 'rentalDivider2'];
        const hide = resolvedStatus === 'available' || resolvedStatus === 'maintenance';
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = hide ? 'none' : 'block';
        });

        if (hide) {
            console.log('Available/Maintenance — no rental info needed.');
            console.log('=== END RENTAL DETAILS MODAL ===');
            return;
        }

        // ── STEP 4: Fetch active transaction (DIRECT — no payments join) ──
        // The transactions table FK list: customer_id, rate_id, locker_id
        // There is NO payments FK, so we NEVER join payments here.
        let tx = null;

        // In some schemas, the primary key of lockers is `locker_id` (integer) or `id` (UUID).
        // In other schemas, transactions references lockers via the alphanumeric string (e.g. "S2").
        // We collect all possible locker identifier fields to query transactions.locker_id.
        const lockerIdentifiers = [
            lockerData?.locker_id,
            lockerData?.id,
            lockerData?.locker_number,
            lockerId // The alphanumeric code passed to this function
        ].filter(val => val !== null && val !== undefined && val !== '');

        if (lockerIdentifiers.length > 0) {
            console.log('🔍 Querying transactions using potential locker identifiers:', lockerIdentifiers);
            for (const ident of lockerIdentifiers) {
                const { data: txRows, error: txErr } = await supabase
                    .from('transactions')
                    .select('transaction_id, customer_id, rate_id, locker_id, start_time, duration_minutes, status')
                    .eq('locker_id', ident)
                    .eq('status', 'Active')
                    .order('start_time', { ascending: false })
                    .limit(1);

                if (txErr) {
                    console.error(`❌ transactions query error for identifier ${ident}:`, txErr);
                } else if (txRows && txRows.length > 0) {
                    tx = txRows[0];
                    console.log(`✓ Active transaction found using identifier ${ident}:`, tx);
                    break;
                }
            }
        } else {
            console.warn('⚠️ No locker identifier available — cannot query transactions');
        }

        // ── STEP 5: Fetch customer ─────────────────────────────────────────
        let customerData = null;
        if (tx?.customer_id) {
            const { data: cust, error: custErr } = await supabase
                .from('customers')
                .select('full_name, email, contact_number')
                .eq('customer_id', tx.customer_id)
                .single();

            if (!custErr && cust) {
                customerData = cust;
                console.log('step5 customer:', customerData);
            } else {
                console.error('❌ customers query error:', custErr);
            }
        }

        set('detail-customer-name', customerData?.full_name || 'N/A');
        set('detail-customer-email', customerData?.email || 'N/A');
        set('detail-customer-phone', customerData?.contact_number || 'N/A');

        // ── STEP 6: Rental time & duration ────────────────────────────────
        if (tx?.start_time) {
            set('detail-start-time', formatForDisplay(tx.start_time));

            if (tx.duration_minutes > 0) {
                const h = Math.floor(tx.duration_minutes / 60);
                const m = tx.duration_minutes % 60;
                set('detail-duration', h > 0 ? `${h}h ${m}m` : `${m}m`);
            } else {
                // Compute elapsed time since rental started
                const mins = Math.max(0, Math.floor((Date.now() - new Date(tx.start_time)) / 60000));
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                set('detail-duration', h > 0 ? `${h}h ${m}m` : `${m}m`);
            }
        } else {
            set('detail-start-time', 'N/A');
            set('detail-duration', 'N/A');
        }

        // ── STEP 7: Fetch payment amount from payments table ─────────────
        let price = null;
        if (tx?.transaction_id) {
            const { data: payRows, error: payErr } = await supabase
                .from('payments')
                .select('amount')
                .eq('transaction_id', tx.transaction_id)
                .limit(1);

            if (!payErr && payRows && payRows.length > 0) {
                price = payRows[0].amount;
                console.log('step7 price from payments table:', price);
            } else {
                if (payErr) console.error('❌ payments query error:', payErr);
            }
        }

        if (amountEl) {
            amountEl.textContent = (price !== null && price !== undefined)
                ? `₱${Number(price).toFixed(2)}`
                : '₱0.00';
        }

        console.log('✓ Modal fully populated');
        console.log('=== END RENTAL DETAILS MODAL ===');

    } catch (error) {
        console.error('❌ showRentalDetailsModal error:', error);
        set('detail-locker-size', 'N/A');
        set('detail-locker-module', 'N/A');
        set('detail-customer-name', 'N/A');
        set('detail-customer-email', 'N/A');
        set('detail-customer-phone', 'N/A');
        set('detail-start-time', 'N/A');
        set('detail-duration', 'N/A');
        set('detail-rental-type', 'N/A');
        if (overtimeColumnsEl) overtimeColumnsEl.style.display = 'none';
        if (amountEl) amountEl.textContent = '₱0.00';
        if (additionalChargeEl) additionalChargeEl.textContent = '₱0.00';
    }
}

/**
 * Close rental details modal
 */
function closeRentalDetailsModal() {
    const modal = document.getElementById('rentalDetailsModal');
    if (modal) {
        modal.classList.remove('active');
        // Also handle display style for compatibility
        modal.style.display = 'none';
    }
}

// Set up rental details modal close on outside click
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function () {
        const rentalModal = document.getElementById('rentalDetailsModal');
        if (rentalModal) {
            rentalModal.addEventListener('click', function (e) {
                if (e.target === this) {
                    closeRentalDetailsModal();
                }
            });
        }
    });
}

/**
 * Get color for status
 */
function getStatusColor(status) {
    const statusColors = {
        'available': 'var(--color-available)',
        'occupied': 'var(--color-occupied)',
        'payment': 'var(--color-payment)',
        'maintenance': 'var(--color-maintenance)'
    };
    return statusColors[status] || 'var(--color-text)';
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
 * Update user profile in sidebar from admin table database
 */
async function updateUserProfile() {
    try {
        const authData = JSON.parse(localStorage.getItem('coincubby_auth') || '{}');
        const email = authData.email || 'Admin';
        let displayName = email;

        // Try to load full name from database
        if (typeof window.supabase !== 'undefined' && window.supabase) {
            try {
                const { data, error } = await window.supabase
                    .from('admin')
                    .select('full_name')
                    .eq('email', email)
                    .single();

                if (!error && data && data.full_name) {
                    displayName = data.full_name;
                    // Store in localStorage for quick access
                    localStorage.setItem('coincubby_admin_name', data.full_name);
                    console.log('✓ Admin name loaded from database:', displayName);
                }
            } catch (dbError) {
                console.warn('Could not load name from database:', dbError);
                // Fallback to localStorage if available
                const savedName = localStorage.getItem('coincubby_admin_name');
                if (savedName) {
                    displayName = savedName;
                }
            }
        } else {
            // Fallback to localStorage if Supabase not available
            const savedName = localStorage.getItem('coincubby_admin_name');
            if (savedName) {
                displayName = savedName;
            }
        }

        // Update user name in sidebar
        const userNameElems = document.querySelectorAll('.user-name, #sidebar-name');
        userNameElems.forEach(elem => {
            if (elem) {
                elem.textContent = displayName;
                elem.title = email; // Show email on hover
            }
        });

        // Update avatar initial
        const avatarElems = document.querySelectorAll('.avatar, #sidebar-avatar');
        avatarElems.forEach(elem => {
            if (elem) {
                elem.textContent = displayName.charAt(0).toUpperCase();
            }
        });
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

                // Initialize module counter based on existing modules
                initializeModuleCounter();
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

    // Action buttons removed - locker rows are clickable to show rental details
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
    newRow.setAttribute('data-locker-code', lockerData.code);
    newRow.setAttribute('data-locker-status', lockerData.status);

    // Make the row clickable (except when clicking action buttons)
    newRow.style.cursor = 'pointer';

    newRow.innerHTML = `
        <td class="code-cell"><span class="locker-code" data-field="code">${lockerData.code}</span></td>
        <td class="size-cell"><span data-field="size">${lockerData.size}</span></td>
        <td class="module-cell"><span data-field="module">${lockerData.module}</span></td>
        <td class="device-cell"><span data-field="device">${lockerData.device}</span></td>
        <td class="status-cell"><span class="status-badge ${lockerData.status}" data-field="status">${lockerData.status}</span></td>
    `;

    // Add click event to show rental details
    newRow.addEventListener('click', async function (e) {
        const lockerCode = this.getAttribute('data-locker-code');
        const status = this.getAttribute('data-locker-status');

        if (lockerId) {
            await showRentalDetailsModal(lockerId, status);
        }
    });

    tbody.appendChild(newRow);
}

function renderLockersTable() {
    const tbody = document.getElementById('lockers-tbody');
    if (!tbody) return;

    // Build the definitive list of modules with display numbers
    let modulesList = [];
    if (typeof moduleRecords !== 'undefined' && Array.isArray(moduleRecords) && moduleRecords.length > 0) {
        // Sort modules by their database name to maintain consistent order
        const sortedModules = [...moduleRecords].sort((a, b) => {
            const aNum = parseInt(String(a.name || a.module_id).replace(/\D/g, '')) || 0;
            const bNum = parseInt(String(b.name || b.module_id).replace(/\D/g, '')) || 0;
            return aNum - bNum;
        });

        // Assign display numbers sequentially (1, 2, 3...)
        modulesList = sortedModules.map((m, index) => {
            const displayNumber = index + 1; // Sequential display number
            const displayLabel = `M${displayNumber}`;
            return {
                id: String(m.module_id || m.id),
                name: displayLabel,
                dbName: m.name // Keep original DB name for reference
            };
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

    // Render the filter tabs
    renderModuleTabs(modulesList);

    tbody.innerHTML = '';

    // Filter modules to render based on current filter
    const modulesToRender = modulesList.filter(mod => currentModuleFilter === 'All' || mod.id === currentModuleFilter);

    if (modulesToRender.length === 0) {
        const filterName = modulesList.find(m => m.id === currentModuleFilter)?.name || currentModuleFilter;
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted);">No lockers to display in ${currentModuleFilter === 'All' ? 'any module' : filterName}.</td></tr>`;
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
            emptyRow.innerHTML = `<td colspan="6" style="text-align:center; color:var(--color-text-muted);">No lockers in this module.</td>`;
            tbody.appendChild(emptyRow);
        } else {
            moduleLockers.forEach(locker => addLockerRow(locker));
        }
    });

    if (!displayedAnyLockers && currentModuleFilter === 'All') {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted);">No lockers currently in the system.</td></tr>`;
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

    // Set default module name using DISPLAY number (sequential)
    const nextDisplayNumber = getNextModuleDisplayNumber();
    const moduleNameInput = document.getElementById('module-name');
    if (moduleNameInput) {
        moduleNameInput.value = `M${nextDisplayNumber}`;
        moduleNameInput.readOnly = true; // Make it read-only since it's auto-generated
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
        newBtn.addEventListener('click', function () {
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

    // Focus on first compartment count input
    const firstInput = document.getElementById('small_count');
    if (firstInput) firstInput.focus();
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

        // Get the next module number for DATABASE storage (persistent counter)
        const nextModuleNumber = getNextModuleNumber();

        // Get the next module number for UI DISPLAY (sequential)
        const displayNumber = getNextModuleDisplayNumber();
        const moduleName = `M${displayNumber}`;

        // Generate default device ID using display number for user-friendly naming
        const deviceId = `DEV-${String(displayNumber).padStart(2, '0')}`;

        if (!confirm(`Create module "${moduleName}" with ${totalCompartments} compartments?\n\nModule ID: ${moduleId}`)) {
            return;
        }

        let createdModuleId = null;

        // Create module record in database (using persistent counter)
        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
            typeof dbOps !== 'undefined' && dbOps.createModule) {
            try {
                const moduleResult = await dbOps.createModule({
                    module_id: moduleId,
                    name: nextModuleNumber, // Database uses persistent counter
                    status: 'Active'
                });

                if (moduleResult && moduleResult[0]) {
                    createdModuleId = moduleResult[0].module_id;
                    console.log('✓ Module created in database:', createdModuleId);
                    console.log(`  → Database name: ${nextModuleNumber}`);
                    console.log(`  → UI display: ${moduleName}`);

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
                module: moduleName, // UI display name
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
                module: moduleName, // UI display name
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
                module: moduleName, // UI display name
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

/**
 * Get display number for a module (sequential 1, 2, 3...).
 * This is different from the database ID which uses a persistent counter.
 * 
 * @param {object} module - Module record from database
 * @param {array} allModules - All module records (sorted)
 * @returns {number} Display number (1-based index)
 */
function getModuleDisplayNumber(module, allModules) {
    if (!allModules || allModules.length === 0) return 1;

    // Sort modules by their actual name/ID to maintain consistent order
    const sorted = [...allModules].sort((a, b) => {
        const aNum = parseInt(String(a.name || a.module_id).replace(/\D/g, '')) || 0;
        const bNum = parseInt(String(b.name || b.module_id).replace(/\D/g, '')) || 0;
        return aNum - bNum;
    });

    // Find the index (position) of this module
    const moduleId = module.module_id || module.id;
    const index = sorted.findIndex(m => (m.module_id || m.id) === moduleId);

    return index >= 0 ? index + 1 : 1; // 1-based numbering
}

/**
 * Get the next display number for a new module.
 * This shows what the user will see in the UI (sequential).
 * 
 * @returns {number} Next display number
 */
function getNextModuleDisplayNumber() {
    if (!Array.isArray(moduleRecords) || moduleRecords.length === 0) {
        return 1;
    }
    return moduleRecords.length + 1;
}

/**
 * Initialize the module counter based on existing modules in the database.
 * This should be called when the page loads to sync the counter.
 */
function initializeModuleCounter() {
    const MODULE_COUNTER_KEY = 'coincubby_module_counter';

    try {
        if (Array.isArray(moduleRecords) && moduleRecords.length > 0) {
            const nums = moduleRecords.map(m => {
                const raw = m.name != null ? m.name : (m.module_id || m.id);
                return parseInt(String(raw).replace('M', ''), 10);
            }).filter(n => !isNaN(n));
            const maxNum = nums.length ? Math.max(...nums) : 0;
            localStorage.setItem(MODULE_COUNTER_KEY, maxNum);
            console.log(`✓ Module counter initialized to ${maxNum} (based on ${moduleRecords.length} existing modules)`);
            console.log(`  → Database will use: Module ${maxNum + 1}`);
            console.log(`  → UI will display: Module ${moduleRecords.length + 1}`);
        } else {
            // No modules exist, start from 0
            localStorage.setItem(MODULE_COUNTER_KEY, '0');
            console.log('✓ Module counter initialized to 0 (no existing modules)');
        }
    } catch (error) {
        console.error('Error initializing module counter:', error);
    }
}

/**
 * Get the next module number using a persistent counter.
 * This counter never resets even if modules are deleted,
 * ensuring unique sequential module names.
 * 
 * Example: If you have modules 1 and 2, deleting module 2 and adding a new one
 * will create module 3 (not module 2 again).
 * 
 * @returns {number} Next module number
 */
function getNextModuleNumber() {
    // Use a persistent counter that never resets, even if modules are deleted
    const MODULE_COUNTER_KEY = 'coincubby_module_counter';

    try {
        // Get the current counter from localStorage
        let counter = localStorage.getItem(MODULE_COUNTER_KEY);

        if (counter === null) {
            // Initialize counter based on existing modules in DB
            if (Array.isArray(moduleRecords) && moduleRecords.length > 0) {
                const nums = moduleRecords.map(m => {
                    const raw = m.name != null ? m.name : (m.module_id || m.id);
                    return parseInt(String(raw).replace('M', ''), 10);
                }).filter(n => !isNaN(n));
                counter = nums.length ? Math.max(...nums) : 0;
            } else {
                // Fallback: infer from loaded lockerRecords
                const modules = (lockerRecords || []).map(l => parseInt((l.module || '').replace('M', ''), 10)).filter(n => !isNaN(n));
                counter = modules.length ? Math.max(...modules) : 0;
            }

            // Save the initialized counter
            localStorage.setItem(MODULE_COUNTER_KEY, counter);
        }

        // Increment and save the counter
        counter = parseInt(counter) + 1;
        localStorage.setItem(MODULE_COUNTER_KEY, counter);

        return counter;
    } catch (error) {
        console.error('Error getting next module number:', error);
        // Fallback to old logic if localStorage fails
        if (Array.isArray(moduleRecords) && moduleRecords.length > 0) {
            const nums = moduleRecords.map(m => {
                const raw = m.name != null ? m.name : (m.module_id || m.id);
                return parseInt(String(raw).replace('M', ''), 10);
            }).filter(n => !isNaN(n));
            return nums.length ? Math.max(...nums) + 1 : 1;
        }
        const modules = (lockerRecords || []).map(l => parseInt((l.module || '').replace('M', ''), 10)).filter(n => !isNaN(n));
        return modules.length ? Math.max(...modules) + 1 : 1;
    }
}

/**
 * Reset the persistent module counter (admin function).
 * This will recalculate the counter based on existing modules in the database.
 * Use this only if the counter gets out of sync.
 */
function resetModuleCounter() {
    const MODULE_COUNTER_KEY = 'coincubby_module_counter';

    try {
        if (Array.isArray(moduleRecords) && moduleRecords.length > 0) {
            const nums = moduleRecords.map(m => {
                const raw = m.name != null ? m.name : (m.module_id || m.id);
                return parseInt(String(raw).replace('M', ''), 10);
            }).filter(n => !isNaN(n));
            const maxNum = nums.length ? Math.max(...nums) : 0;
            localStorage.setItem(MODULE_COUNTER_KEY, maxNum);
            console.log(`✓ Module counter reset to ${maxNum}`);
            alert(`Module counter reset to ${maxNum}. Your next module will be Module ${maxNum + 1}.`);
            return maxNum;
        } else {
            localStorage.removeItem(MODULE_COUNTER_KEY);
            console.log('✓ Module counter cleared');
            alert('Module counter cleared. Your next module will be Module 1.');
            return 0;
        }
    } catch (error) {
        console.error('Error resetting module counter:', error);
        return null;
    }
}

// Make resetModuleCounter available globally for console access
window.resetModuleCounter = resetModuleCounter;

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

/**
 * Visual Dropdown Upgrade Helper
 * Converts any native .filter-combo select visually into a fully CSS-stylable menu.
 */
function initializeCustomDropdowns() {
    const filterCombos = document.querySelectorAll('.filter-combo');

    filterCombos.forEach(combo => {
        const select = combo.querySelector('select');
        if (!select || select.classList.contains('custom-hidden')) return;

        // Hide original native select
        select.classList.add('custom-hidden');

        // Create custom visual trigger
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';

        const selectedOption = select.options[select.selectedIndex];
        const label = document.createElement('span');
        label.textContent = selectedOption ? selectedOption.textContent : 'Select Range';
        trigger.appendChild(label);
        combo.appendChild(trigger);

        // Create custom options dropdown list container
        const menu = document.createElement('div');
        menu.className = 'custom-options-menu';

        // Convert options to custom menu items
        Array.from(select.options).forEach(opt => {
            const item = document.createElement('div');
            item.className = 'custom-option-item';
            if (opt.selected) item.classList.add('selected');
            item.textContent = opt.textContent;
            item.setAttribute('data-value', opt.value);

            item.addEventListener('click', function (e) {
                e.stopPropagation();

                // Toggle active selected classes
                menu.querySelectorAll('.custom-option-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                // Update trigger label
                label.textContent = opt.textContent;

                // Hide menu
                combo.classList.remove('active');

                // Update original select and fire its change listener
                select.value = opt.value;
                select.dispatchEvent(new Event('change'));
            });

            menu.appendChild(item);
        });

        combo.appendChild(menu);

        // Open/Close menu handlers
        trigger.addEventListener('click', function (e) {
            e.stopPropagation();

            // Close other open combos
            document.querySelectorAll('.filter-combo').forEach(c => {
                if (c !== combo) c.classList.remove('active');
            });

            combo.classList.toggle('active');
        });
    });

    // Close all menus when clicking outside
    document.addEventListener('click', function () {
        document.querySelectorAll('.filter-combo').forEach(c => c.classList.remove('active'));
    });
}

