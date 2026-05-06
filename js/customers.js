// Customers page specific functionality

document.addEventListener('DOMContentLoaded', function () {
    initializeSidebar();
    initializeCustomersPage();
});

/**
 * Initialize customers page
 */
async function initializeCustomersPage() {
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;

    // Wait for Supabase to be initialized if the promise exists
    if (window.supabasePromise) {
        await window.supabasePromise;
    }

    // Load actual data from Supabase
    await loadCustomersFromSupabase();

    // Add event listeners for customer rows
    tbody.addEventListener('click', function (e) {
        const row = e.target.closest('tr');
        if (row) {
            const customerId = row.getAttribute('data-customer-id');
            console.log('Customer selected:', customerId);
            // Implement navigation or detail view logic here
        }
    });
}

/**
 * Load customers from Supabase and refresh the table
 */
async function loadCustomersFromSupabase() {
    try {
        // Ensure we have the client, not the factory library
        const client = window.supabase;

        if (!client || typeof client.from !== 'function') {
            throw new Error('Supabase client not properly initialized. Check supabase-client.js');
        }

        const { data: customers, error } = await client
            .from('customers')
            .select('*');

        if (error) throw error;

        // Map Supabase data to the format expected by refreshCustomersFromDatabase
        // Columns match THE ACTUAL database schema from your screenshot
        const mapped = (customers || []).map(c => ({
            id:      c.customer_id,
            name:    c.full_name || 'N/A',
            email:   c.email || 'N/A',
            role:    'customer',
            wallet:  0, // Dropped from DB, defaulting to 0
            rentals: 0, // Dropped from DB, defaulting to 0
            spent:   0, // Dropped from DB, defaulting to 0
            joined:  'N/A' // Dropped from DB, defaulting to N/A
        }));

        if (mapped.length === 0) {
            const tbody = document.getElementById('customers-tbody');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">No customers found in the database.</td></tr>`;
            }
        } else {
            refreshCustomersFromDatabase(mapped);
        }

    } catch (err) {
        console.error('Failed to load customers:', err.message);
        const tbody = document.getElementById('customers-tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 1rem;">Failed to load customers: ${err.message}</td></tr>`;
        }
    }
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
