// Sample transaction data
const transactionData = [
    {
        id: 1,
        date: 'Apr 17, 10:53',
        customerName: 'malaluanmarkangelo',
        customerEmail: 'malaluanmarkangelo@gmail.com',
        type: 'Wallet Load',
        method: 'App',
        locker: '-',
        amount: 50.00
    },
    {
        id: 2,
        date: 'Apr 17, 05:43',
        customerName: 'Samantha Claire Balon',
        customerEmail: 'smthbalon@gmail.com',
        type: 'Rental Payment',
        method: 'Wallet',
        locker: 'S1',
        amount: 10.00
    },
    {
        id: 3,
        date: 'Apr 17, 04:54',
        customerName: 'malaluanmarkangelo',
        customerEmail: 'malaluanmarkangelo@gmail.com',
        type: 'Wallet Load',
        method: 'App',
        locker: '-',
        amount: 200.00
    },
    {
        id: 4,
        date: 'Apr 17, 01:16',
        customerName: 'Samantha Claire Balon',
        customerEmail: 'smthbalon@gmail.com',
        type: 'Wallet Load',
        method: 'App',
        locker: '-',
        amount: 100.00
    }
];

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
    
    if (!tableBody || transactions.length === 0) {
        populateTransactionTable(); // Fall back to sample data
        return;
    }
    
    tableBody.innerHTML = transactions.map(tx => {
        const date = new Date(tx.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `<tr data-transaction-id="${tx.id}">
            <td class="date-cell">${date}</td>
            <td class="customer-cell">
                <div class="customer-info">
                    <div class="customer-name">${tx.customer_name || 'Unknown'}</div>
                    <div class="customer-email">${tx.customer_email || '-'}</div>
                </div>
            </td>
            <td class="type-cell">${tx.type || 'Payment'}</td>
            <td class="method-cell">${tx.payment_method || tx.method || '-'}</td>
            <td class="locker-cell">${tx.locker_id || '-'}</td>
            <td class="amount-cell">₱${parseFloat(tx.amount).toFixed(2)}</td>
        </tr>`;
    }).join('');
}

/**
 * Populate the transaction table with data
 */
function populateTransactionTable() {
    const tableBody = document.getElementById('transactionTableBody');
    
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
