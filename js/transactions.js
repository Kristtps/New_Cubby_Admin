// Transaction data (initially empty)
const transactionData = [];

// Live amount ticker interval reference
let liveAmountTickerInterval = null;

/**
 * Returns a colored badge HTML string for a transaction type/status
 */
function typeBadgeHtml(typeStr) {
    const t = (typeStr || 'Active').toLowerCase();
    let cls = 'type-other';
    if (t === 'active') cls = 'type-active';
    else if (t === 'completed') cls = 'type-completed';
    else if (t === 'payment') cls = 'type-payment';
    else if (t.includes('wallet')) cls = 'type-wallet';
    else if (t.includes('cash') || t.includes('collection')) cls = 'type-cash';
    return `<span class="type-badge ${cls}">${typeStr || 'Active'}</span>`;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    if (typeof isUserAuthenticated !== 'undefined' && !isUserAuthenticated()) {
        console.log('User not authenticated, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    // Initialize search and filter
    initializeTransactionSearch();
    initializeTransactionFilter();

    // Try to load transactions from database
    await loadTransactions();

    // Initialize AJAX features (auto-refresh and infinite scroll)
    initializeAutoRefresh();
    initializeInfiniteScroll();

    // Start the live amount ticker for active open-hour rentals
    startLiveAmountTicker();
});

/**
 * Load transactions from Supabase or fallback to sample data
 */
async function loadTransactions() {
    if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected()) {
        try {
            console.log('Loading transactions from Supabase...');
            if (typeof dbOps !== 'undefined' && dbOps.fetchAllTransactions) {
                const transactions = await dbOps.fetchAllTransactions();

                // Store in global array for filtering/searching
                transactionData.length = 0; // Clear existing
                transactions.forEach(tx => {
                    let totalPaid = 0;
                    let methods = [];
                    if (tx.payments && Array.isArray(tx.payments)) {
                        tx.payments.forEach(p => {
                            totalPaid += parseFloat(p.amount || 0);
                            if (p.payment_method && !methods.includes(p.payment_method)) {
                                methods.push(p.payment_method);
                            }
                        });
                    }

                    // Extract hourly rate from the joined rates table
                    let hourlyRate = 0;
                    if (tx.rates) {
                        hourlyRate = parseFloat(tx.rates.price_per_hour || 0);
                    }

                    // Determine if this is an active open-hour rental (end_time is NULL)
                    const isActiveOpenHour = !tx.end_time && tx.start_time;

                    const mappedTx = {
                        id: tx.transaction_id || tx.id,
                        date: new Intl.DateTimeFormat('en-US', {
                            timeZone: 'Asia/Manila',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }).format(new Date(tx.start_time || tx.created_at)),
                        customerName: tx.customers ? tx.customers.full_name : (tx.customer_name || 'Unknown'),
                        customerEmail: tx.customers ? tx.customers.email : (tx.customer_email || '-'),
                        userId: tx.customer_id ? tx.customer_id.substring(0, 8).toUpperCase() : '-',
                        type: tx.status || tx.type || 'Active',
                        method: methods.length > 0 ? methods.join(', ') : (tx.qr_token ? 'QR Token' : (tx.payment_method || '-')),
                        locker: tx.lockers ? tx.lockers.locker_number : (tx.locker_id || '-'),
                        amount: isActiveOpenHour ? calculateLiveAmount(tx.start_time || tx.created_at, hourlyRate) : totalPaid,
                        timestamp: new Date(tx.start_time || tx.created_at).getTime(),
                        // New fields for live running amount
                        startTimeISO: tx.start_time || tx.created_at,
                        endTimeISO: tx.end_time || null,
                        hourlyRate: hourlyRate,
                        isActiveOpenHour: isActiveOpenHour
                    };
                    transactionData.push(mappedTx);
                });

                refreshTransactionTable(transactionData);
                updateSummaryStats();
                console.log('Transactions loaded from database and stats updated');
            } else {
                throw new Error('dbOps not available');
            }
        } catch (error) {
            console.error('Error loading transactions from database:', error);
            console.log('Falling back to sample data...');
            loadFallbackData();
        }
    } else {
        console.log('Supabase not connected, using sample data');
        loadFallbackData();
    }
}

/**
 * Load fallback/sample data
 */

/**
 * Update summary stats cards from transactionData
 */
function updateSummaryStats() {
    const todayTotalElem = document.getElementById('today-total');
    const allCountElem = document.getElementById('all-transactions-count');
    const coinsOnHandElem = document.getElementById('coins-on-hand');

    if (!transactionData || transactionData.length === 0) return;

    // 1. All Transactions Count
    if (allCountElem) allCountElem.textContent = transactionData.length;

    // 2. Today's Total
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTotal = transactionData
        .filter(tx => tx.timestamp >= today.getTime())
        .reduce((sum, tx) => sum + tx.amount, 0);

    if (todayTotalElem) todayTotalElem.textContent = `₱${todayTotal.toFixed(2)}`;

    // 3. Coins on Hand (Heuristic based on amount for demo)
    // Check if there's a stored reset offset
    const resetOffset = parseFloat(localStorage.getItem('coins_on_hand_offset') || '0');
    const coinsTotal = transactionData.reduce((sum, tx) => sum + (tx.amount <= 20 ? tx.amount : 0), 0);
    const adjustedCoins = Math.max(0, coinsTotal - resetOffset);

    if (coinsOnHandElem) {
        coinsOnHandElem.textContent = `₱${adjustedCoins.toFixed(2)}`;
        coinsOnHandElem.setAttribute('data-value', adjustedCoins.toFixed(2));
    }
}

/**
 * Open reset coins modal
 */
function openResetCoinsModal() {
    const modal = document.getElementById('resetCoinsModal');
    const coinsOnHandElem = document.getElementById('coins-on-hand');
    const modalAmountElem = document.getElementById('modal-coins-amount');

    if (modal) {
        // Update modal with current amount
        if (modalAmountElem && coinsOnHandElem) {
            modalAmountElem.textContent = coinsOnHandElem.textContent;
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close reset coins modal
 */
function closeResetCoinsModal() {
    const modal = document.getElementById('resetCoinsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Confirm and reset coins on hand to zero (after physical collection)
 */
function confirmResetCoins() {
    // Calculate current coins total
    const coinsTotal = transactionData.reduce((sum, tx) => sum + (tx.amount <= 20 ? tx.amount : 0), 0);

    // Store the offset (cumulative reset amount)
    const currentOffset = parseFloat(localStorage.getItem('coins_on_hand_offset') || '0');
    const newOffset = currentOffset + (coinsTotal - currentOffset);
    localStorage.setItem('coins_on_hand_offset', newOffset.toString());

    // Update display
    const coinsOnHandElem = document.getElementById('coins-on-hand');
    if (coinsOnHandElem) {
        coinsOnHandElem.textContent = '₱0.00';
        coinsOnHandElem.setAttribute('data-value', '0.00');
    }

    // Close modal
    closeResetCoinsModal();

    // Show success message
    showResetNotification('Coins on Hand has been reset to ₱0.00');
}

/**
 * Show notification after reset
 */
function showResetNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'reset-notification';
    notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close modal when clicking outside
document.addEventListener('click', function (e) {
    const modal = document.getElementById('resetCoinsModal');
    if (e.target === modal) {
        closeResetCoinsModal();
    }
});

/**
 * Refresh transaction table with data (clears and loads initial batch)
 */
function refreshTransactionTable(data) {
    const tableBody = document.getElementById('transactionTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Load initial batch
    const initialBatch = data.slice(0, Math.min(ITEMS_PER_LOAD, data.length));
    if (initialBatch.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: var(--color-text-muted);">No transactions found</td></tr>`;
        return;
    }

    tableBody.innerHTML = initialBatch.map(transaction => `
        <tr>
            <td class="date-cell">${transaction.date}</td>
            <td class="customer-cell">
                <div class="customer-info">
                    <div class="customer-name">${transaction.customerName}</div>
                    <div class="customer-email">${transaction.customerEmail}</div>
                </div>
            </td>
            <td class="userid-cell">${transaction.userId}</td>
            <td class="type-cell">${typeBadgeHtml(transaction.type)}</td>
            <td class="method-cell">${transaction.method}</td>
            <td class="locker-cell">${transaction.locker}</td>
            ${renderAmountCell(transaction)}
        </tr>
    `).join('');
}

/**
 * Initialize transaction search functionality
 */
function initializeTransactionSearch() {
    const searchInput = document.getElementById('transaction-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        applySearchAndFilter(searchTerm, null);
    });
}

/**
 * Initialize transaction filter functionality
 */
function initializeTransactionFilter() {
    const filterSelect = document.getElementById('transaction-filter');
    if (!filterSelect) return;

    filterSelect.addEventListener('change', function (e) {
        const filterValue = e.target.value;
        const searchInput = document.getElementById('transaction-search');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        applySearchAndFilter(searchTerm, filterValue);
    });
}

/**
 * Apply both search and filter to transactions
 * @param {string} searchTerm - Search term to match against customer, locker, or type
 * @param {string|null} filterType - Filter type (all, payment, wallet-load, cash-collection)
 */
function applySearchAndFilter(searchTerm, filterType) {
    const tableBody = document.getElementById('transactionTableBody');
    if (!tableBody) return;

    // Get current filter value if not provided
    if (filterType === null) {
        const filterSelect = document.getElementById('transaction-filter');
        filterType = filterSelect ? filterSelect.value : 'all';
    }

    // Filter transactions based on both search and filter
    let filtered = transactionData.filter(tx => {
        // Apply filter by type
        let passesFilter = true;
        if (filterType !== 'all') {
            const typeMap = {
                'payment': ['Payment', 'Active', 'Completed'],
                'wallet-load': ['Wallet Load', 'Wallet'],
                'cash-collection': ['Cash Collection', 'Collection']
            };

            const acceptedTypes = typeMap[filterType] || [];
            passesFilter = acceptedTypes.some(type =>
                tx.type && tx.type.toLowerCase().includes(type.toLowerCase())
            ) || acceptedTypes.some(type =>
                tx.method && tx.method.toLowerCase().includes(type.toLowerCase())
            );
        }

        // Apply search term
        let passesSearch = true;
        if (searchTerm) {
            passesSearch =
                (tx.customerName && tx.customerName.toLowerCase().includes(searchTerm)) ||
                (tx.locker && String(tx.locker).toLowerCase().includes(searchTerm)) ||
                (tx.type && tx.type.toLowerCase().includes(searchTerm)) ||
                (tx.method && tx.method.toLowerCase().includes(searchTerm));
        }

        return passesFilter && passesSearch;
    });

    refreshTransactionTable(filtered);
}

// ==================== AJAX FUNCTIONALITY ====================

let autoRefreshInterval = null;
let isLoadingMore = false;
const ITEMS_PER_LOAD = 20;

/**
 * Initialize auto-refresh for real-time updates (every 30 seconds)
 */
function initializeAutoRefresh() {
    autoRefreshInterval = setInterval(async function () {
        try {
            await loadTransactions();
            console.log('✓ Transaction data auto-refreshed via AJAX polling');
        } catch (error) {
            console.error('Auto-refresh error:', error);
        }
    }, 30000); // 30 seconds
}

/**
 * Initialize infinite scroll / lazy load functionality
 */
function initializeInfiniteScroll() {
    const tbody = document.getElementById('transactionTableBody');
    if (!tbody) return;

    const container = tbody.closest('.transactions-table-wrapper') || tbody.parentElement;

    container.addEventListener('scroll', function () {
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
            loadMoreTransactions();
        }
    });
}

/**
 * Load more transactions for infinite scroll
 */
function loadMoreTransactions() {
    if (isLoadingMore) return;

    isLoadingMore = true;
    const tbody = document.getElementById('transactionTableBody');
    if (!tbody) return;

    const currentCount = tbody.querySelectorAll('tr').length;

    // Filter search/filter states to see actual filtered data subset
    const searchInput = document.getElementById('transaction-search');
    const filterSelect = document.getElementById('transaction-filter');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const filterType = filterSelect ? filterSelect.value : 'all';

    let filtered = transactionData.filter(tx => {
        let passesFilter = true;
        if (filterType !== 'all') {
            const typeMap = {
                'payment': ['Payment', 'Active', 'Completed'],
                'wallet-load': ['Wallet Load', 'Wallet'],
                'cash-collection': ['Cash Collection', 'Collection']
            };
            const acceptedTypes = typeMap[filterType] || [];
            passesFilter = acceptedTypes.some(type =>
                tx.type && tx.type.toLowerCase().includes(type.toLowerCase())
            ) || acceptedTypes.some(type =>
                tx.method && tx.method.toLowerCase().includes(type.toLowerCase())
            );
        }
        let passesSearch = true;
        if (searchTerm) {
            passesSearch =
                (tx.customerName && tx.customerName.toLowerCase().includes(searchTerm)) ||
                (tx.locker && String(tx.locker).toLowerCase().includes(searchTerm)) ||
                (tx.type && tx.type.toLowerCase().includes(searchTerm)) ||
                (tx.method && tx.method.toLowerCase().includes(searchTerm));
        }
        return passesFilter && passesSearch;
    });

    if (currentCount >= filtered.length) {
        isLoadingMore = false;
        return;
    }

    setTimeout(() => {
        const nextBatch = filtered.slice(currentCount, currentCount + ITEMS_PER_LOAD);
        const rowsHtml = nextBatch.map(transaction => `
            <tr>
                <td class="date-cell">${transaction.date}</td>
                <td class="customer-cell">
                    <div class="customer-info">
                        <div class="customer-name">${transaction.customerName}</div>
                        <div class="customer-email">${transaction.customerEmail}</div>
                    </div>
                </td>
                <td class="userid-cell">${transaction.userId}</td>
                <td class="type-cell">${typeBadgeHtml(transaction.type)}</td>
                <td class="method-cell">${transaction.method}</td>
                <td class="locker-cell">${transaction.locker}</td>
                ${renderAmountCell(transaction)}
            </tr>
        `).join('');

        tbody.insertAdjacentHTML('beforeend', rowsHtml);
        isLoadingMore = false;
        console.log(`✓ Loaded ${nextBatch.length} more transactions via infinite scroll`);
    }, 300);
}

/**
 * Calculates the live rental amount for an active open-hour rental
 * @param {string} startTimeISO - Start time of the rental
 * @param {number} hourlyRate - Hourly rate for the locker type
 * @returns {number} The calculated dynamic amount
 */
function calculateLiveAmount(startTimeISO, hourlyRate) {
    if (!startTimeISO) return 0;
    const start = new Date(startTimeISO);
    const now = new Date();
    const elapsedMinutes = Math.max(0, (now - start) / 1000 / 60);
    return Math.ceil(elapsedMinutes / 30) * (hourlyRate / 2);
}

/**
 * Renders the amount cell HTML. If the rental is active, it includes data attributes for live updates.
 * @param {Object} transaction - The mapped transaction object
 * @returns {string} The HTML string for the td element
 */
function renderAmountCell(transaction) {
    if (transaction.isActiveOpenHour) {
        const liveAmt = calculateLiveAmount(transaction.startTimeISO, transaction.hourlyRate);
        return `<td class="amount-cell live-amount-cell" data-transaction-id="${transaction.id}" data-start-time="${transaction.startTimeISO}" data-hourly-rate="${transaction.hourlyRate}">₱${liveAmt.toFixed(2)}</td>`;
    } else {
        return `<td class="amount-cell">₱${transaction.amount.toFixed(2)}</td>`;
    }
}

/**
 * Starts the interval ticker to update live amount cells and summary stats dynamically.
 */
function startLiveAmountTicker() {
    if (liveAmountTickerInterval) {
        clearInterval(liveAmountTickerInterval);
    }

    liveAmountTickerInterval = setInterval(() => {
        const liveCells = document.querySelectorAll('.live-amount-cell');
        if (liveCells.length === 0) return;

        let needsStatsUpdate = false;

        liveCells.forEach(cell => {
            const startTimeISO = cell.getAttribute('data-start-time');
            const hourlyRate = parseFloat(cell.getAttribute('data-hourly-rate') || '0');
            const txId = cell.getAttribute('data-transaction-id');

            if (startTimeISO) {
                const liveAmt = calculateLiveAmount(startTimeISO, hourlyRate);
                cell.textContent = `₱${liveAmt.toFixed(2)}`;

                // Keep the global transactionData updated for summary stats calculation
                const tx = transactionData.find(t => String(t.id) === String(txId));
                if (tx && tx.amount !== liveAmt) {
                    tx.amount = liveAmt;
                    needsStatsUpdate = true;
                }
            }
        });

        if (needsStatsUpdate) {
            updateSummaryStats();
        }
    }, 1000);
}

// Re-render transactions table on theme change
window.addEventListener('themechange', function() {
    if (transactionData.length > 0) {
        refreshTransactionTable(transactionData);
    }
});
