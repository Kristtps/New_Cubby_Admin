// Transaction data (initially empty)
const transactionData = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
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
                        method: methods.length > 0 ? methods.join(', ') : (tx.qr_token ? 'QR Token' : (tx.payment_method || 'Unpaid')),
                        locker: tx.lockers ? tx.lockers.locker_number : (tx.locker_id || '-'),
                        amount: totalPaid,
                        timestamp: new Date(tx.start_time || tx.created_at).getTime()
                    };
                    transactionData.push(mappedTx);
                });

                populateTransactionTableFromDatabase(transactions);
                updateSummaryStats();
                console.log('Transactions loaded from database and stats updated');
            } else {
                throw new Error('dbOps not available');
            }
        } catch (error) {
            console.error('Error loading transactions from database:', error);
            console.log('Falling back to sample data...');
            populateTransactionTable();
        }
    } else {
        console.log('Supabase not connected, using sample data');
        populateTransactionTable();
    }
});

/**
 * Update summary stats cards from transactionData
 */
function updateSummaryStats() {
    const todayTotalElem = document.getElementById('today-total');
    const allCountElem = document.getElementById('all-transactions-count');
    const coinsOnHandElem = document.getElementById('coins-on-hand');
    const billsOnHandElem = document.getElementById('bills-on-hand');

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

    // 3. Coins vs Bills (Heuristic based on amount for demo, or method if available)
    // For this demonstration, let's assume amounts <= 20 are coins, > 20 are bills
    const coinsTotal = transactionData.reduce((sum, tx) => sum + (tx.amount <= 20 ? tx.amount : 0), 0);
    const billsTotal = transactionData.reduce((sum, tx) => sum + (tx.amount > 20 ? tx.amount : 0), 0);

    if (coinsOnHandElem) coinsOnHandElem.textContent = `₱${coinsTotal.toFixed(2)}`;
    if (billsOnHandElem) billsOnHandElem.textContent = `₱${billsTotal.toFixed(2)}`;
}

/**
 * Populate transaction table from database data
 */
function populateTransactionTableFromDatabase(transactions) {
    const tableBody = document.getElementById('transactionTableBody');
    
    if (!tableBody || !transactions || transactions.length === 0) {
        populateTransactionTable(); // Fall back to sample data
        return;
    }
    
    tableBody.innerHTML = transactions.map(tx => {
        // Use start_time for the date display in Philippine timezone
        const date = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Manila',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(tx.start_time || tx.created_at));
        
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

        // Use joined data if available
        const customerName = tx.customers ? tx.customers.full_name : (tx.customer_name || 'Unknown');
        const customerEmail = tx.customers ? tx.customers.email : (tx.customer_email || '-');
        const userId = tx.customer_id ? tx.customer_id.substring(0, 8).toUpperCase() : '-';
        const lockerNumber = tx.lockers ? tx.lockers.locker_number : (tx.locker_id || '-');
        const methodStr = methods.length > 0 ? methods.join(', ') : (tx.qr_token ? 'QR Token: ' + tx.qr_token : (tx.payment_method || '-'));
        
        return `<tr data-transaction-id="${tx.transaction_id || tx.id}">
            <td class="date-cell">${date}</td>
            <td class="customer-cell">
                <div class="customer-info">
                    <div class="customer-name">${customerName}</div>
                    <div class="customer-email">${customerEmail}</div>
                </div>
            </td>
            <td class="userid-cell">${userId}</td>
            <td class="type-cell">${tx.status || tx.type || 'Active'}</td>
            <td class="method-cell">${methodStr}</td>
            <td class="locker-cell">${lockerNumber}</td>
            <td class="amount-cell">₱${totalPaid.toFixed(2)}</td>
        </tr>`;
    }).join('');
}

/**
 * Populate the transaction table with data
 */
function populateTransactionTable() {
    const tableBody = document.getElementById('transactionTableBody');
    
    if (!tableBody) return;

    tableBody.innerHTML = transactionData.map(transaction => `
        <tr>
            <td class="date-cell">${transaction.date}</td>
            <td class="customer-cell">
                <div class="customer-info">
                    <div class="customer-name">${transaction.customerName}</div>
                    <div class="customer-email">${transaction.customerEmail}</div>
                </div>
            </td>
            <td class="userid-cell">${transaction.userId}</td>
            <td class="type-cell">${transaction.type}</td>
            <td class="method-cell">${transaction.method}</td>
            <td class="locker-cell">${transaction.locker}</td>
            <td class="amount-cell">₱${transaction.amount.toFixed(2)}</td>
        </tr>
    `).join('');
}

/**
 * Add a new transaction to the table
 * @param {Object} transaction - Transaction object
 */
function addTransaction(transaction) {
    transactionData.unshift(transaction);
    populateTransactionTable();
}

/**
 * Filter transactions by type
 * @param {string} type - Transaction type to filter
 */
function filterTransactionsByType(type) {
    const tableBody = document.getElementById('transactionTableBody');
    
    const filtered = transactionData.filter(t => t.type === type);
    
    tableBody.innerHTML = filtered.map(transaction => `
        <tr>
            <td class="date-cell">${transaction.date}</td>
            <td class="customer-cell">
                <div class="customer-info">
                    <div class="customer-name">${transaction.customerName}</div>
                    <div class="customer-email">${transaction.customerEmail}</div>
                </div>
            </td>
            <td class="userid-cell">${transaction.userId}</td>
            <td class="type-cell">${transaction.type}</td>
            <td class="method-cell">${transaction.method}</td>
            <td class="locker-cell">${transaction.locker}</td>
            <td class="amount-cell">₱${transaction.amount.toFixed(2)}</td>
        </tr>
    `).join('');
}

/**
 * Filter transactions by customer
 * @param {string} customerName - Customer name to search
 */
function filterTransactionsByCustomer(customerName) {
    const tableBody = document.getElementById('transactionTableBody');
    
    const filtered = transactionData.filter(t => 
        t.customerName.toLowerCase().includes(customerName.toLowerCase())
    );
    
    tableBody.innerHTML = filtered.map(transaction => `
        <tr>
            <td class="date-cell">${transaction.date}</td>
            <td class="customer-cell">
                <div class="customer-info">
                    <div class="customer-name">${transaction.customerName}</div>
                    <div class="customer-email">${transaction.customerEmail}</div>
                </div>
            </td>
            <td class="userid-cell">${transaction.userId}</td>
            <td class="type-cell">${transaction.type}</td>
            <td class="method-cell">${transaction.method}</td>
            <td class="locker-cell">${transaction.locker}</td>
            <td class="amount-cell">₱${transaction.amount.toFixed(2)}</td>
        </tr>
    `).join('');
}

/**
 * Search transactions by date
 * @param {string} date - Date to search (format: 'Apr 17')
 */
function searchTransactionByDate(date) {
    const tableBody = document.getElementById('transactionTableBody');
    
    const filtered = transactionData.filter(t => t.date.includes(date));
    
    tableBody.innerHTML = filtered.map(transaction => `
        <tr>
            <td class="date-cell">${transaction.date}</td>
            <td class="customer-cell">
                <div class="customer-info">
                    <div class="customer-name">${transaction.customerName}</div>
                    <div class="customer-email">${transaction.customerEmail}</div>
                </div>
            </td>
            <td class="userid-cell">${transaction.userId}</td>
            <td class="type-cell">${transaction.type}</td>
            <td class="method-cell">${transaction.method}</td>
            <td class="locker-cell">${transaction.locker}</td>
            <td class="amount-cell">₱${transaction.amount.toFixed(2)}</td>
        </tr>
    `).join('');
}

/**
 * Get total amount from all transactions
 * @returns {number} Total amount
 */
function getTotalTransactionAmount() {
    return transactionData.reduce((sum, transaction) => sum + transaction.amount, 0);
}

/**
 * Get transaction count
 * @returns {number} Total number of transactions
 */
function getTransactionCount() {
    return transactionData.length;
}

/**
 * Export transactions as CSV
 */
function exportTransactionsAsCSV() {
    const headers = ['Date', 'Customer Name', 'Email', 'Type', 'Method', 'Locker', 'Amount'];
    const rows = transactionData.map(t => [
        t.date,
        t.customerName,
        t.customerEmail,
        t.type,
        t.method,
        t.locker,
        `₱${t.amount.toFixed(2)}`
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

/**
 * Initialize transaction search functionality
 */
function initializeTransactionSearch() {
    const searchInput = document.getElementById('transaction-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
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
    
    filterSelect.addEventListener('change', function(e) {
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
            // Map filter values to transaction type/status
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
    
    // Render filtered results
    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #9ca3af;">No transactions found</td></tr>`;
        return;
    }
    
    tableBody.innerHTML = filtered.map(transaction => `
        <tr>
            <td class="date-cell">${transaction.date}</td>
            <td class="customer-cell">
                <div class="customer-info">
                    <div class="customer-name">${transaction.customerName}</div>
                    <div class="customer-email">${transaction.customerEmail}</div>
                </div>
            </td>
            <td class="userid-cell">${transaction.userId}</td>
            <td class="type-cell">${transaction.type}</td>
            <td class="method-cell">${transaction.method}</td>
            <td class="locker-cell">${transaction.locker}</td>
            <td class="amount-cell">₱${transaction.amount.toFixed(2)}</td>
        </tr>
    `).join('');
}
