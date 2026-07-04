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
                payments (amount)
            `)
            .eq('status', 'Active')
            .order('start_time', { ascending: false });

        if (error) throw error;

        // Map Supabase data to rental format
        const mapped = (transactions || []).map(tx => {
            const startDate = new Date(tx.start_time);
            const endDate = tx.end_time ? new Date(tx.end_time) : null;
            
            let duration = 'Active';
            if (endDate) {
                const hours = Math.round((endDate - startDate) / (1000 * 60 * 60));
                duration = `${hours}h`;
            }

            let totalAmount = 0;
            if (tx.payments && Array.isArray(tx.payments)) {
                tx.payments.forEach(p => {
                    totalAmount += parseFloat(p.amount || 0);
                });
            }

            return {
                id: tx.transaction_id,
                customer: tx.customers ? tx.customers.full_name : 'Unknown',
                locker: tx.lockers ? tx.lockers.locker_number : 'N/A',
                startDate: new Intl.DateTimeFormat('en-US', { 
                    timeZone: 'Asia/Manila',
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(startDate),
                endDate: endDate ? new Intl.DateTimeFormat('en-US', { 
                    timeZone: 'Asia/Manila',
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(endDate) : 'Ongoing',
                endTime: tx.end_time, // Keep raw end time for countdown
                duration: duration,
                status: tx.status || 'Active',
                amount: totalAmount
            };
        });

        if (mapped.length === 0) {
            const tbody = document.getElementById('rentals-tbody');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">No active rentals at the moment.</td></tr>`;
            }
        } else {
            allRentalsData = mapped;
            refreshRentalsFromDatabase(mapped);
        }

    } catch (err) {
        console.error('Failed to load rentals:', err.message);
        const tbody = document.getElementById('rentals-tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 1rem;">Failed to load rentals: ${err.message}</td></tr>`;
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

    console.log(`✓ Loaded ${rentalsData.length} active rentals`);
}

/**
 * Add rental row to table
 */
function addRentalRow(rentalData) {
    const tbody = document.getElementById('rentals-tbody');
    if (!tbody) return;

    const newRow = document.createElement('tr');
    newRow.setAttribute('data-rental-id', rentalData.id);

    const statusBadgeClass = rentalData.status === 'Active' ? 'status-badge occupied' : 'status-badge available';
    
    newRow.innerHTML = `
        <td class="customer-cell">
            <div class="customer-info">
                <span class="customer-name">${rentalData.customer}</span>
            </div>
        </td>
        <td class="locker-cell">${rentalData.locker}</td>
        <td class="date-cell">${rentalData.startDate}</td>
        <td class="date-cell">${rentalData.endDate}</td>
        <td class="date-cell"><span data-duration-id="${rentalData.id}" class="duration-countdown" style="font-weight: 600; font-family: monospace;">--:--:--</span></td>
        <td class="status-cell"><span class="${statusBadgeClass}">${rentalData.status}</span></td>
        <td class="amount-cell">₱${parseFloat(rentalData.amount).toFixed(2)}</td>
    `;

    tbody.appendChild(newRow);

    // Always start countdown for active rentals with end time
    if (rentalData.status === 'Active' && rentalData.endTime) {
        startCountdown(rentalData.id, rentalData.endTime);
    }
}

/**
 * Start countdown timer for a rental
 */
function startCountdown(rentalId, endTime) {
    // Clear existing countdown if any
    if (countdownIntervals[rentalId]) {
        clearInterval(countdownIntervals[rentalId]);
    }

    const updateCountdown = () => {
        const endDate = new Date(endTime);
        const now = new Date();
        const diff = endDate - now;

        const durationElement = document.querySelector(`[data-duration-id="${rentalId}"]`);
        if (!durationElement) return;

        if (diff <= 0) {
            // Overtime - show count-up
            const overtime = Math.abs(diff);
            const hours = Math.floor(overtime / (1000 * 60 * 60));
            const minutes = Math.floor((overtime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((overtime % (1000 * 60)) / 1000);

            // Format as +HH:MM:SS
            const overtimeString = `+${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            durationElement.textContent = overtimeString;
            durationElement.style.color = '#ef4444'; // Red for overtime
            durationElement.style.fontWeight = 'bold';

            // Continue counting up
            return;
        }

        // Calculate time remaining (countdown)
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Format as HH:MM:SS
        const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        durationElement.textContent = timeString;

        // Change color based on time remaining
        if (diff <= 1800000) { // 30 minutes or less
            durationElement.style.color = '#ef4444'; // Red urgent
            durationElement.style.fontWeight = 'bold';
        } else if (diff <= 3600000) { // 1 hour or less
            durationElement.style.color = '#f59e0b'; // Orange warning
            durationElement.style.fontWeight = 'normal';
        } else {
            durationElement.style.color = 'inherit'; // Normal
            durationElement.style.fontWeight = '600';
        }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    countdownIntervals[rentalId] = setInterval(updateCountdown, 1000);
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
                noResultsRow.innerHTML = `<td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No rentals found matching "${searchTerm}"</td>`;
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
    autoRefreshRentalsInterval = setInterval(async function() {
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

    container.addEventListener('scroll', function() {
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
