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
    
    // Try to load transactions from database
    if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected()) {
        try {
            console.log('Loading transactions from Supabase...');
            if (typeof dbOps !== 'undefined' && dbOps.fetchAllTransactions) {
                const transactions = await dbOps.fetchAllTransactions();
                populateTransactionTableFromDatabase(transactions);
                console.log('Transactions loaded from database');
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
 * Populate transaction table from database data
 */
function populateTransactionTableFromDatabase(transactions) {
    const tableBody = document.getElementById('transactionTableBody');
    
    if (!tableBody || !transactions || transactions.length === 0) {
        populateTransactionTable(); // Fall back to sample data
        return;
    }
    
    tableBody.innerHTML = transactions.map(tx => {
        // Use start_time for the date display
        const date = new Date(tx.start_time || tx.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Use joined data if available
        const customerName = tx.customers ? tx.customers.full_name : (tx.customer_name || 'Unknown');
        const customerEmail = tx.customers ? tx.customers.email : (tx.customer_email || '-');
        const lockerNumber = tx.lockers ? tx.lockers.locker_number : (tx.locker_id || '-');
        
        return `<tr data-transaction-id="${tx.transaction_id || tx.id}">
            <td class="date-cell">${date}</td>
            <td class="customer-cell">
                <div class="customer-info">
                    <div class="customer-name">${customerName}</div>
                    <div class="customer-email">${customerEmail}</div>
                </div>
            </td>
            <td class="type-cell">${tx.status || tx.type || 'Active'}</td>
            <td class="method-cell">${tx.qr_token ? 'QR Token: ' + tx.qr_token : (tx.payment_method || tx.method || '-')}</td>
            <td class="locker-cell">${lockerNumber}</td>
            <td class="amount-cell">₱${tx.amount ? parseFloat(tx.amount).toFixed(2) : '0.00'}</td>
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
