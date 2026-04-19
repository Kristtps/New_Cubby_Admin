// Customers page specific functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    initializeCustomersPage();
});

/**
 * Initialize customers page
 */
function initializeCustomersPage() {
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;
    
    // Add event listeners for customer rows if needed
    tbody.addEventListener('click', function(e) {
        const row = e.target.closest('tr');
        if (row) {
            const customerId = row.getAttribute('data-customer-id');
            console.log('Customer selected:', customerId);
            // Implement navigation or detail view logic here
        }
    });
}

/**
 * Update customer wallet balance
 * @param {string|number} customerId - Customer ID
 * @param {number} amount - New wallet balance
 */
function updateCustomerWallet(customerId, amount) {
    const row = document.querySelector(`[data-customer-id="${customerId}"]`);
    if (row) {
        const walletCell = row.querySelector('[data-field="wallet"]');
        if (walletCell) {
            const currency = walletCell.getAttribute('data-currency') || '₱';
            walletCell.textContent = currency + parseFloat(amount).toFixed(2);
        }
    }
}

/**
 * Update customer rental count
 * @param {string|number} customerId - Customer ID
 * @param {number} count - Number of active rentals
 */
function updateCustomerRentals(customerId, count) {
    const row = document.querySelector(`[data-customer-id="${customerId}"]`);
    if (row) {
        const rentalsCell = row.querySelector('[data-field="rentals"]');
        if (rentalsCell) {
            rentalsCell.textContent = count;
        }
    }
}

/**
 * Update customer total spent
 * @param {string|number} customerId - Customer ID
 * @param {number} amount - Total amount spent
 */
function updateCustomerSpent(customerId, amount) {
    const row = document.querySelector(`[data-customer-id="${customerId}"]`);
    if (row) {
        const spentCell = row.querySelector('[data-field="spent"]');
        if (spentCell) {
            const currency = spentCell.getAttribute('data-currency') || '₱';
            spentCell.textContent = currency + parseFloat(amount).toFixed(2);
        }
    }
}

/**
 * Update customer role
 * @param {string|number} customerId - Customer ID
 * @param {string} role - New role ('admin', 'user', 'moderator')
 */
function updateCustomerRole(customerId, role) {
    const row = document.querySelector(`[data-customer-id="${customerId}"]`);
    if (row) {
        const roleCell = row.querySelector('.role-badge');
        if (roleCell) {
            // Remove old role classes
            roleCell.className = 'role-badge';
            // Add new role class
            roleCell.classList.add(role);
            roleCell.textContent = role;
        }
    }
}

/**
 * Add new customer row to table
 * @param {object} customerData - Customer data object
 */
function addCustomerRow(customerData) {
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;
    
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-customer-id', customerData.id);
    
    newRow.innerHTML = `
        <td class="name-cell"><span data-field="name">${customerData.name}</span></td>
        <td class="email-cell"><span data-field="email">${customerData.email}</span></td>
        <td class="role-cell"><span class="role-badge ${customerData.role}" data-field="role">${customerData.role}</span></td>
        <td class="wallet-cell"><span data-field="wallet" data-currency="₱">${parseFloat(customerData.wallet).toFixed(2)}</span></td>
        <td class="rentals-cell"><span data-field="rentals">${customerData.rentals}</span></td>
        <td class="spent-cell"><span data-field="spent" data-currency="₱">${parseFloat(customerData.spent).toFixed(2)}</span></td>
        <td class="joined-cell"><span data-field="joined">${customerData.joined}</span></td>
    `;
    
    tbody.appendChild(newRow);
}

/**
 * Update multiple customer data at once
 * @param {array} customers - Array of customer objects
 */
function updateAllCustomers(customers) {
    customers.forEach(customer => {
        updateCustomerWallet(customer.id, customer.wallet);
        updateCustomerRentals(customer.id, customer.rentals);
        updateCustomerSpent(customer.id, customer.spent);
        if (customer.role) {
            updateCustomerRole(customer.id, customer.role);
        }
    });
}

/**
 * Remove customer row from table
 * @param {string|number} customerId - Customer ID to remove
 */
function removeCustomerRow(customerId) {
    const row = document.querySelector(`[data-customer-id="${customerId}"]`);
    if (row) {
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            row.remove();
        }, 300);
    }
}

/**
 * Refresh all customer data from database
 * @param {array} customersData - Array of all customer objects from API
 */
function refreshCustomersFromDatabase(customersData) {
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;
    
    // Clear current rows
    tbody.innerHTML = '';
    
    // Add updated rows
    customersData.forEach(customer => {
        addCustomerRow(customer);
    });
}
