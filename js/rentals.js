// Rentals page specific functionality

document.addEventListener('DOMContentLoaded', function () {
    initializeSidebar();
    initializeRentalsPage();
});

/**
 * Store rental data and state
 */
let allRentalsData = [];
let autoRefreshRentalsInterval = null;
let isLoadingMoreRentals = false;
let countdownIntervals = {}; // Store countdown intervals for each rental
let showingRentalHistory = false;
const RENTALS_PER_LOAD = 25;

/**
 * Initialize rentals page
 */
async function initializeRentalsPage() {
    const tbody = document.getElementById('rentals-tbody');
    if (!tbody) return;

    // Wait for Supabase to be initialized if the promise exists
    if (window.supabasePromise) {
        await window.supabasePromise;
    }

    // Load actual data from Supabase
    await loadRentalsFromSupabase();

    // Initialize search functionality
    initializeRentalsSearch();
    initializeRentalDetailsModal();
    initializeRentalHistoryToggle();

    // Initialize auto-refresh (every 20 seconds)
    initializeRentalsAutoRefresh();

    // Initialize infinite scroll
    initializeRentalsInfiniteScroll();
}

/**
 * Load rentals from Supabase and refresh the table
 */
async function loadRentalsFromSupabase() {
    try {
        const client = window.supabase;

        if (!client || typeof client.from !== 'function') {
            throw new Error('Supabase client not properly initialized');
        }

        const { data: transactions, error } = await client
            .from('transactions')
            .select(`
                *,
                customers (full_name),
                lockers (locker_number),
                payments (amount),
                rates (rate_id, price_per_hour)
            `)
            .order('start_time', { ascending: false });

        if (error) throw error;

        // History is every non-active transaction. Use the stored status rather
        // than assuming its casing so completed rentals are always included.
        const displayedTransactions = (transactions || []).filter(tx => {
            const isActive = String(tx?.status || '').trim().toLowerCase() === 'active';
            return showingRentalHistory ? !isActive : isActive;
        });

        // Map Supabase data to rental format
        const mapped = displayedTransactions.map(tx => {
            const startDate = new Date(tx.start_time);
            const endDate = tx.end_time ? new Date(tx.end_time) : null;

            // Calculate duration in minutes if we have both start and end times
            let durationMinutes = tx.duration_minutes || 0;
            if (endDate && startDate) {
                durationMinutes = Math.round((endDate - startDate) / (1000 * 60));
            }

            let duration = 'Active';
            if (endDate) {
                const hours = Math.floor(durationMinutes / 60);
                const mins = durationMinutes % 60;
                duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            }

            let totalAmount = 0;
            if (tx.payments && Array.isArray(tx.payments)) {
                tx.payments.forEach(p => {
                    totalAmount += parseFloat(p.amount || 0);
                });
            }

            // Extract hourly rate from the joined rates table
            let hourlyRate = 0;
            if (tx.rates) {
                hourlyRate = parseFloat(tx.rates.price_per_hour || 0);
            }

            return {
                id: tx.transaction_id,
                customer: tx.customers ? tx.customers.full_name : 'Unknown',
                locker: tx.lockers ? tx.lockers.locker_number : 'N/A',
                // FORMAT FOR DISPLAY: Use formatForDisplay since data is already in SGT from database
                startDate: formatForDisplay(startDate, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                endDate: endDate ? formatForDisplay(endDate, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'Ongoing',
                endTime: tx.end_time, // Keep raw end time for countdown
                startTimeRaw: tx.start_time, // Keep raw start time for count-up
                durationMinutes: durationMinutes, // Store duration in minutes
                duration: duration,
                status: tx.status || 'Active',
                amount: totalAmount,
                hourlyRate: hourlyRate
            };
        });

        if (mapped.length === 0) {
            const tbody = document.getElementById('rentals-tbody');
            if (tbody) {
                const emptyMessage = showingRentalHistory
                    ? 'No rental history found.'
                    : 'No active rentals at the moment.';
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 3rem;">${emptyMessage}</td></tr>`;
                allRentalsData = [];
            }
        } else {
            allRentalsData = mapped;
            refreshRentalsFromDatabase(mapped);
        }

    } catch (err) {
        console.error('Failed to load rentals:', err.message);
        const tbody = document.getElementById('rentals-tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-occupied); padding: 1rem;">Failed to load rentals: ${err.message}</td></tr>`;
        }
    }
}

/**
 * Refresh rentals table with data
 */
function refreshRentalsFromDatabase(rentalsData) {
    const tbody = document.getElementById('rentals-tbody');
    if (!tbody) return;

    allRentalsData = rentalsData;

    // Clear current rows and stop all existing countdowns
    stopAllCountdowns();
    tbody.innerHTML = '';

    // Load all items (no lazy loading for active rentals)
    rentalsData.forEach(rental => {
        addRentalRow(rental);
    });

    console.log(`✓ Loaded ${rentalsData.length} ${showingRentalHistory ? 'historical' : 'active'} rentals`);
}

/**
 * Add rental row to table
 */
function addRentalRow(rentalData) {
    const tbody = document.getElementById('rentals-tbody');
    if (!tbody) return;

    const newRow = document.createElement('tr');
    newRow.setAttribute('data-rental-id', rentalData.id);
    newRow.setAttribute('tabindex', '0');
    newRow.setAttribute('role', 'button');
    newRow.setAttribute('aria-label', `View details for rental ${rentalData.id}`);
    newRow.style.cursor = 'pointer';

    const isActiveRental = String(rentalData.status || '').trim().toLowerCase() === 'active';
    const statusBadgeClass = isActiveRental ? 'status-badge occupied' : 'status-badge available';

    // An active rental without an end time is Open Hour.
    const isOngoingOpenHour = isActiveRental && !rentalData.endTime;
    const fixedPricing = isActiveRental && rentalData.endTime ? calculateRentalOvertime(rentalData) : null;
    const initialAmount = isOngoingOpenHour
        ? calculateOpenHourAmount(Math.max(0, (new Date() - new Date(rentalData.startTimeRaw)) / 1000 / 60), rentalData.hourlyRate)
        : (fixedPricing ? fixedPricing.prepaidAmount : rentalData.amount);
    const durationValue = isActiveRental ? '--:--:--' : rentalData.duration;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const overtimeColor = isDark ? '#f87171' : '#b91c1c';

    newRow.innerHTML = `
        <td class="customer-cell">
            <div class="customer-info">
                <span class="customer-name">${rentalData.customer}</span>
            </div>
        </td>
        <td class="locker-cell">${rentalData.locker}</td>
        <td class="date-cell">${rentalData.startDate}</td>
        <td class="date-cell">${rentalData.endDate}</td>
        <td class="date-cell"><span data-duration-id="${rentalData.id}" class="duration-countdown" style="font-weight: 600; font-family: monospace;">${durationValue}</span></td>
        <td class="status-cell"><span class="${statusBadgeClass}">${rentalData.status}</span></td>
        <td class="amount-cell">
            <span data-amount-id="${rentalData.id}">₱${parseFloat(initialAmount).toFixed(2)}</span>
            <span data-overtime-id="${rentalData.id}" style="${fixedPricing && fixedPricing.isOvertime ? '' : 'display: none;'} margin-left: 6px; color: ${overtimeColor}; font-size: 0.9rem; font-weight: 700;">+</span>
            <span data-overtime-fee-id="${rentalData.id}" style="display: ${fixedPricing && fixedPricing.isOvertime ? 'block' : 'none'}; margin-top: 3px; color: ${overtimeColor}; font-size: 0.75rem; font-weight: 600;">Additional: ₱${fixedPricing ? fixedPricing.additionalFee.toFixed(2) : '0.00'}</span>
        </td>
    `;

    tbody.appendChild(newRow);

    newRow.addEventListener('click', () => showRentalTableDetails(rentalData));
    newRow.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            showRentalTableDetails(rentalData);
        }
    });

    // Start timer/countdown appropriately
    if (isActiveRental) {
        if (rentalData.endTime) {
            startCountdown(rentalData);
        } else {
            startOpenHourTimer(rentalData.id, rentalData.startTimeRaw, rentalData.hourlyRate);
        }
    }
}

/**
 * Start countdown timer for a rental
 * Uses end_time to calculate remaining time for active rentals
 */
function startCountdown(rentalData) {
    const { id: rentalId, endTime } = rentalData;
    // Clear existing countdown if any
    if (countdownIntervals[rentalId]) {
        clearInterval(countdownIntervals[rentalId]);
    }

    const updateCountdown = () => {
        const endDate = new Date(endTime);
        const now = new Date();
        const diff = endDate - now;

        const durationElement = document.querySelector(`[data-duration-id="${rentalId}"]`);
        const overtimeIndicator = document.querySelector(`[data-overtime-id="${rentalId}"]`);
        const overtimeFeeElement = document.querySelector(`[data-overtime-fee-id="${rentalId}"]`);
        if (!durationElement) return;

        const row = durationElement.closest('tr');

        if (diff <= 0) {
            // Overtime - show count-up from the reserved duration
            const overtime = Math.abs(diff);
            const overtimeMinutes = Math.floor(overtime / (1000 * 60));
            const overtimeSeconds = Math.floor((overtime % (1000 * 60)) / 1000);
            const hours = Math.floor(overtimeMinutes / 60);
            const mins = overtimeMinutes % 60;

            // Format as +HH:MM:SS
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const overtimeString = `+${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(overtimeSeconds).padStart(2, '0')}`;
            durationElement.textContent = overtimeString;
            durationElement.style.color = isDark ? '#f87171' : '#7f1d1d';
            durationElement.style.fontWeight = 'bold';
            if (row) row.style.backgroundColor = isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(127, 29, 29, 0.06)';

            if (overtimeIndicator) overtimeIndicator.style.display = 'inline';
            const pricing = calculateRentalOvertime(rentalData);
            if (overtimeFeeElement) {
                overtimeFeeElement.textContent = `Additional: ₱${pricing.additionalFee.toFixed(2)}`;
                overtimeFeeElement.style.display = 'block';
            }

            // Continue counting up
            return;
        }

        // Calculate time remaining (countdown from end time)
        const remainingMinutes = Math.floor(diff / (1000 * 60));
        const remainingSeconds = Math.floor((diff % (1000 * 60)) / 1000);
        const hours = Math.floor(remainingMinutes / 60);
        const mins = remainingMinutes % 60;

        // Format as HH:MM:SS
        const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        durationElement.textContent = timeString;
        if (overtimeIndicator) overtimeIndicator.style.display = 'none';
        if (overtimeFeeElement) overtimeFeeElement.style.display = 'none';

        // Change color based on time remaining
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (diff <= 1800000) { // 30 minutes or less
            durationElement.style.color = '#ef4444';
            durationElement.style.fontWeight = 'bold';
            if (row) row.style.backgroundColor = isDark ? 'rgba(248, 113, 113, 0.12)' : 'rgba(239, 68, 68, 0.06)';
        } else if (diff <= 3600000) { // 1 hour or less
            durationElement.style.color = '#f59e0b';
            durationElement.style.fontWeight = '600';
            if (row) row.style.backgroundColor = isDark ? 'rgba(251, 191, 36, 0.12)' : 'rgba(245, 158, 11, 0.06)';
        } else {
            durationElement.style.color = isDark ? '#34d399' : '#10b981';
            durationElement.style.fontWeight = '600';
            if (row) row.style.backgroundColor = isDark ? 'rgba(52, 211, 153, 0.08)' : 'rgba(16, 185, 129, 0.04)';
        }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    countdownIntervals[rentalId] = setInterval(updateCountdown, 1000);
}

/** Toggle between currently active rentals and completed rental history. */
function initializeRentalHistoryToggle() {
    const button = document.getElementById('rentals-history-toggle');
    if (!button) return;

    button.addEventListener('click', async () => {
        showingRentalHistory = !showingRentalHistory;
        button.textContent = showingRentalHistory ? 'Active Rentals' : 'History';
        button.setAttribute('aria-pressed', String(showingRentalHistory));

        const title = document.getElementById('rentals-page-title');
        const subtitle = document.getElementById('rentals-page-subtitle');
        if (title) title.textContent = showingRentalHistory ? 'Rental History' : 'Rentals';
        if (subtitle) subtitle.textContent = showingRentalHistory
            ? 'View completed and past locker rentals.'
            : 'Track active locker rentals.';

        await loadRentalsFromSupabase();
    });
}

/**
 * Calculates the display-only overtime addition for a fixed-duration rental.
 * The existing end time is the deadline; the first 10 late minutes are free,
 * then each started 30-minute block costs half of the hourly rate.
 */
function calculateRentalOvertime(rentalData) {
    const overtimeMinutes = Math.max(0, (new Date() - new Date(rentalData.endTime)) / 1000 / 60);
    const hourlyRate = Math.max(0, Number(rentalData.hourlyRate) || 0);
    const selectedHours = Math.max(0, Number(rentalData.durationMinutes) || 0) / 60;
    const additionalFee = overtimeMinutes <= 10 || hourlyRate <= 0
        ? 0
        : Math.ceil((overtimeMinutes - 10) / 30) * (hourlyRate / 2);
    const prepaidAmount = selectedHours * hourlyRate;

    return {
        isOvertime: overtimeMinutes > 0,
        prepaidAmount,
        additionalFee,
    };
}

/**
 * Opens the Rentals-table details modal using the rental data already loaded
 * for the row. This keeps the table click action independent of schema changes.
 */
function showRentalTableDetails(rentalData) {
    const modal = document.getElementById('rental-table-details-modal');
    if (!modal) return;

    const set = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value || 'N/A';
    };
    const visibleAmount = document.querySelector(`[data-amount-id="${rentalData.id}"]`)?.textContent;
    const visibleDuration = document.querySelector(`[data-duration-id="${rentalData.id}"]`)?.textContent;
    const pricing = rentalData.endTime ? calculateRentalOvertime(rentalData) : null;

    set('rental-detail-customer', rentalData.customer);
    set('rental-detail-locker', rentalData.locker);
    set('rental-detail-start', rentalData.startDate);
    set('rental-detail-end', rentalData.endDate);
    set('rental-detail-duration', visibleDuration);
    set('rental-detail-status', rentalData.status);
    set('rental-detail-type', rentalData.endTime ? 'Fixed Duration' : 'Open Hour');
    set('rental-detail-amount', visibleAmount);
    set('rental-detail-overtime', pricing?.isOvertime ? 'Yes' : 'No');
    set('rental-detail-additional-fee', `₱${(pricing?.additionalFee || 0).toFixed(2)}`);

    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
}

function closeRentalTableDetails() {
    const modal = document.getElementById('rental-table-details-modal');
    if (!modal) return;

    modal.classList.remove('active');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
}

function initializeRentalDetailsModal() {
    const modal = document.getElementById('rental-table-details-modal');
    const closeButton = document.getElementById('rental-table-details-close');
    if (!modal) return;

    closeButton?.addEventListener('click', closeRentalTableDetails);
    modal.addEventListener('click', event => {
        if (event.target === modal) closeRentalTableDetails();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal.classList.contains('active')) {
            closeRentalTableDetails();
        }
    });
}

/**
 * Initialize rentals search functionality
 */
function initializeRentalsSearch() {
    const searchInput = document.getElementById('rentals-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        const tbody = document.getElementById('rentals-tbody');
        const rows = tbody.querySelectorAll('tr');

        rows.forEach(row => {
            const customer = row.querySelector('.customer-name')?.textContent.toLowerCase() || '';
            const locker = row.querySelector('.locker-cell')?.textContent.toLowerCase() || '';

            const matches = customer.includes(searchTerm) || locker.includes(searchTerm);

            row.style.display = matches || searchTerm === '' ? '' : 'none';
        });

        // Show "no results" message if all rows are hidden
        const visibleRows = tbody.querySelectorAll('tr:not([style*="display: none"])');
        if (visibleRows.length === 0 && searchTerm !== '') {
            if (!document.getElementById('no-rentals-results')) {
                const noResultsRow = document.createElement('tr');
                noResultsRow.id = 'no-rentals-results';
                noResultsRow.innerHTML = `<td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 2rem;">No rentals found matching "${searchTerm}"</td>`;
                tbody.appendChild(noResultsRow);
            }
        } else if (document.getElementById('no-rentals-results')) {
            document.getElementById('no-rentals-results').remove();
        }
    });
}

/**
 * Initialize auto-refresh for real-time updates (every 20 seconds)
 */
function initializeRentalsAutoRefresh() {
    autoRefreshRentalsInterval = setInterval(async function () {
        try {
            await loadRentalsFromSupabase();
            console.log('✓ Rentals data auto-refreshed');
        } catch (error) {
            console.error('Auto-refresh error:', error);
        }
    }, 20000); // 20 seconds
}

/**
 * Stop auto-refresh
 */
function stopRentalsAutoRefresh() {
    if (autoRefreshRentalsInterval) {
        clearInterval(autoRefreshRentalsInterval);
        autoRefreshRentalsInterval = null;
    }
}

/**
 * Stop all countdown timers
 */
function stopAllCountdowns() {
    Object.values(countdownIntervals).forEach(interval => {
        clearInterval(interval);
    });
    countdownIntervals = {};
}

/**
 * Initialize infinite scroll for rentals
 */
function initializeRentalsInfiniteScroll() {
    const container = document.querySelector('.transactions-table-wrapper');
    if (!container) return;

    container.addEventListener('scroll', function () {
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
            loadMoreRentals();
        }
    });
}

/**
 * Load more rentals for infinite scroll
 */
function loadMoreRentals() {
    if (isLoadingMoreRentals) return;

    isLoadingMoreRentals = true;
    const tbody = document.getElementById('rentals-tbody');

    if (!tbody) return;

    const allRows = tbody.querySelectorAll('tr:not(#no-rentals-results)');
    const currentCount = allRows.length;

    // If we've already loaded all rentals, don't load more
    if (currentCount >= allRentalsData.length) {
        isLoadingMoreRentals = false;
        return;
    }

    // Simulate loading delay for better UX
    setTimeout(() => {
        const nextBatch = allRentalsData.slice(currentCount, currentCount + RENTALS_PER_LOAD);
        nextBatch.forEach(rental => {
            addRentalRow(rental);
        });
        isLoadingMoreRentals = false;
        console.log(`✓ Loaded ${nextBatch.length} more rentals`);
    }, 300);
}

/**
 * Calculates dynamic Open Hour rental amount based on billing rules:
 * - Charged in 30-minute steps
 * - amount = CEIL(elapsedMinutes / 30) * (hourlyRate / 2)
 */
function calculateOpenHourAmount(elapsedMinutes, hourlyRate) {
    const halfRate = hourlyRate / 2;
    return Math.ceil(elapsedMinutes / 30) * halfRate;
}

/**
 * Starts a count-up timer and dynamic amount updates for an active Open Hour rental
 */
function startOpenHourTimer(rentalId, startTimeRaw, hourlyRate) {
    // Clear any existing countdown/timer interval for this rental ID
    if (countdownIntervals[rentalId]) {
        clearInterval(countdownIntervals[rentalId]);
    }

    const updateTimer = () => {
        const start = new Date(startTimeRaw);
        const now = new Date();
        const diff = Math.max(0, now - start); // Milliseconds elapsed

        const durationElement = document.querySelector(`[data-duration-id="${rentalId}"]`);
        const amountElement = document.querySelector(`[data-amount-id="${rentalId}"]`);

        if (!durationElement) return;

        // Calculate elapsed time components
        const totalMinutes = diff / (1000 * 60);
        const elapsedSeconds = Math.floor(diff / 1000) % 60;
        const elapsedMinutes = Math.floor(diff / (1000 * 60)) % 60;
        const elapsedHours = Math.floor(diff / (1000 * 60 * 60));

        // Format duration display as HH:MM:SS
        const timeString = `${String(elapsedHours).padStart(2, '0')}:${String(elapsedMinutes).padStart(2, '0')}:${String(elapsedSeconds).padStart(2, '0')}`;
        durationElement.textContent = timeString;

        // Active Open Hour timer styling - blue color for running status
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        durationElement.style.color = isDark ? '#60a5fa' : '#3b82f6';
        durationElement.style.fontWeight = '600';

        // Calculate and update the dynamic running amount
        if (amountElement) {
            const currentAmount = calculateOpenHourAmount(totalMinutes, hourlyRate);
            amountElement.textContent = `₱${currentAmount.toFixed(2)}`;
        }
    };

    // Run first update immediately
    updateTimer();

    // Update once every second
    countdownIntervals[rentalId] = setInterval(updateTimer, 1000);
}

// Re-render rentals on theme change so duration colors update
window.addEventListener('themechange', function() {
    Object.keys(countdownIntervals).forEach(id => {
        clearInterval(countdownIntervals[id]);
        delete countdownIntervals[id];
    });
    loadRentalsFromSupabase();
});
