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

    // Initialize search functionality
    initializeCustomerSearch();
    
    // Initialize sort functionality
    initializeCustomerSort();
}

/**
 * Store current sort state
 */
let customerSortNewest = true;

/**
 * Initialize customer sort functionality
 */
function initializeCustomerSort() {
    const sortBtn = document.getElementById('sort-customers-btn');
    if (!sortBtn) return;

    sortBtn.addEventListener('change', function () {
        const sortValue = this.value;
        
        // Apply sorting based on selection
        if (sortValue === 'newest') {
            customerSortNewest = true;
        } else if (sortValue === 'oldest') {
            customerSortNewest = false;
        } else if (sortValue === 'name-asc') {
            sortCustomersByName('asc');
            return;
        } else if (sortValue === 'name-desc') {
            sortCustomersByName('desc');
            return;
        }
        
        // Sort by date
        sortCustomersTable();
    });
}

/**
 * Sort customers table by join date
 */
function sortCustomersTable() {
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr:not(#no-search-results)'));
    
    rows.sort((a, b) => {
        // Get joined dates from the rows
        const joinedA = a.querySelector('[data-field="joined"]')?.textContent || '';
        const joinedB = b.querySelector('[data-field="joined"]')?.textContent || '';
        
        // Convert to Date objects for comparison
        const dateA = new Date(joinedA);
        const dateB = new Date(joinedB);
        
        // Sort based on current sort direction
        if (customerSortNewest) {
            return dateB - dateA; // Newest first
        } else {
            return dateA - dateB; // Oldest first
        }
    });

    // Re-append sorted rows
    rows.forEach(row => {
        tbody.appendChild(row);
    });
}

/**
 * Sort customers table by name
 * @param {string} direction - 'asc' for A-Z, 'desc' for Z-A
 */
function sortCustomersByName(direction) {
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr:not(#no-search-results)'));
    
    rows.sort((a, b) => {
        // Get names from the rows
        const nameA = a.querySelector('[data-field="name"]')?.textContent.toLowerCase() || '';
        const nameB = b.querySelector('[data-field="name"]')?.textContent.toLowerCase() || '';
        
        // Sort alphabetically
        if (direction === 'asc') {
            return nameA.localeCompare(nameB); // A-Z
        } else {
            return nameB.localeCompare(nameA); // Z-A
        }
    });

    // Re-append sorted rows
    rows.forEach(row => {
        tbody.appendChild(row);
    });
}

/**
 * Initialize customer search functionality
 */
function initializeCustomerSearch() {
    const searchInput = document.getElementById('customer-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        const tbody = document.getElementById('customers-tbody');
        const rows = tbody.querySelectorAll('tr');

        rows.forEach(row => {
            const name = row.querySelector('[data-field="name"]')?.textContent.toLowerCase() || '';
            const email = row.querySelector('[data-field="email"]')?.textContent.toLowerCase() || '';
            const userId = row.querySelector('[data-field="user-id"]')?.textContent.toLowerCase() || '';

            const matches = name.includes(searchTerm) || 
                           email.includes(searchTerm) || 
                           userId.includes(searchTerm);

            row.style.display = matches || searchTerm === '' ? '' : 'none';
        });

        // Show "no results" message if all rows are hidden
        const visibleRows = tbody.querySelectorAll('tr:not([style*="display: none"])');
        if (visibleRows.length === 0 && searchTerm !== '') {
            if (!document.getElementById('no-search-results')) {
                const noResultsRow = document.createElement('tr');
                noResultsRow.id = 'no-search-results';
                noResultsRow.innerHTML = `<td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 2rem;">No customers found matching "${searchTerm}"</td>`;
                tbody.appendChild(noResultsRow);
            }
        } else if (document.getElementById('no-search-results')) {
            document.getElementById('no-search-results').remove();
        }
    });
}

/**
 * Load customers from Supabase and refresh the table
 */
async function loadCustomersFromSupabase() {
    try {
        // Wait for Supabase initialization if needed
        if (window.supabasePromise) {
            await window.supabasePromise;
        }

        // Ensure we have the client
        const client = window.supabase;

        if (!client || typeof client.from !== 'function') {
            throw new Error('Supabase client not properly initialized. Check supabase-client.js');
        }

        console.log('📡 Attempting to load customers with transactions and wallets relationship...');

        // First, try to load customers with transactions and wallets relationship
        let { data: customers, error } = await client
            .from('customers')
            .select(`
                *,
                wallets ( balance ),
                transactions (
                    transaction_id,
                    payments ( amount )
                )
            `);

        // If relationship query fails, fall back to just transactions or simple query
        if (error) {
            console.warn('⚠️ Primary query failed, attempting transactions-only query:', error.message);
            const { data: customersData, error: txError } = await client
                .from('customers')
                .select(`
                    *,
                    transactions (
                        transaction_id,
                        payments ( amount )
                    )
                `);

            if (txError) {
                console.warn('⚠️ Transactions relationship query failed:', txError.message, 'Code:', txError.code);
                if (txError.code === 'PGRST204' || txError.message.includes('relation')) {
                    console.log('📡 Falling back to simple customers query without relationships...');
                    const { data: simpleData, error: customerError } = await client
                        .from('customers')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    if (customerError) throw customerError;
                    customers = simpleData;
                } else {
                    throw txError;
                }
            } else {
                customers = customersData;
            }
        }

        console.log('✓ Customers loaded from Supabase:', customers);

        // Map Supabase data to the format expected by refreshCustomersFromDatabase
        // Columns match THE ACTUAL database schema from your screenshot
        const mapped = (customers || []).map(c => {
            let totalSpent = 0;
            let rentalsCount = 0;

            if (c.transactions && Array.isArray(c.transactions)) {
                rentalsCount = c.transactions.length;
                c.transactions.forEach(tx => {
                    if (tx.payments && Array.isArray(tx.payments)) {
                        tx.payments.forEach(p => {
                            totalSpent += parseFloat(p.amount || 0);
                        });
                    }
                });
            }

            // Extract wallet balance from wallets relationship
            let walletBalance = 50.00; // Default wallet balance in DB is 50.00
            if (c.wallets) {
                if (Array.isArray(c.wallets)) {
                    if (c.wallets.length > 0) {
                        walletBalance = parseFloat(c.wallets[0].balance !== undefined ? c.wallets[0].balance : 50.00);
                    }
                } else {
                    walletBalance = parseFloat(c.wallets.balance !== undefined ? c.wallets.balance : 50.00);
                }
            }

            return {
                id:      c.customer_id,
                name:    c.full_name || 'N/A',
                email:   c.email || 'N/A',
                userId:  c.user_id || 'N/A',
                role:    'Customer',
                wallet:  walletBalance, 
                rentals: rentalsCount,
                spent:   totalSpent,
                // FORMAT FOR DISPLAY: Use formatForDisplay for consistency
                joined:  c.created_at ? formatForDisplay(new Date(c.created_at), {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }) : 'N/A'
            };
        });

        if (mapped.length === 0) {
            console.log('ℹ️ No customers found in database');
            const tbody = document.getElementById('customers-tbody');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 3rem;">No customers found in the database.</td></tr>`;
            }
        } else {
            console.log(`✓ Successfully mapped ${mapped.length} customers for display`);
            refreshCustomersFromDatabase(mapped);
        }

    } catch (err) {
        console.error('❌ Failed to load customers:', err);
        const tbody = document.getElementById('customers-tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-occupied); padding: 1rem;">Failed to load customers: ${err.message}</td></tr>`;
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

    // Dynamic helper to add 'na-value' style if text matches 'N/A'
    const getVal = (val) => String(val).trim() === 'N/A' ? `<span class="na-value">N/A</span>` : val;

    newRow.innerHTML = `
        <td class="name-cell"><span data-field="name">${getVal(customerData.name)}</span></td>
        <td class="email-cell"><span data-field="email">${getVal(customerData.email)}</span></td>
        <td class="user-id-cell"><span data-field="user-id">${getVal(customerData.userId)}</span></td>
        <td class="wallet-cell"><span data-field="wallet" data-currency="₱">${customerData.wallet === 'N/A' ? '<span class="na-value">N/A</span>' : parseFloat(customerData.wallet).toFixed(2)}</span></td>
        <td class="rentals-cell"><span data-field="rentals">${getVal(customerData.rentals)}</span></td>
        <td class="spent-cell"><span data-field="spent" data-currency="₱">${customerData.spent === 'N/A' ? '<span class="na-value">N/A</span>' : parseFloat(customerData.spent).toFixed(2)}</span></td>
        <td class="joined-cell"><span data-field="joined">${getVal(customerData.joined)}</span></td>
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

    // Store all customers for lazy loading
    allCustomersData = customersData;
    
    // Clear current rows
    tbody.innerHTML = '';

    // Initially load only first ITEMS_PER_LOAD items, or all if less
    const initialBatch = customersData.slice(0, Math.max(ITEMS_PER_LOAD, customersData.length));
    initialBatch.forEach(customer => {
        addCustomerRow(customer);
    });

    console.log(`✓ Loaded ${initialBatch.length} customers (${customersData.length} total)`);
}

// ==================== AJAX FUNCTIONALITY ====================

/**
 * Store current sort state and all customers data
 */
let allCustomersData = []; // Store all customers for filtering
let autoRefreshInterval = null;
let isLoadingMore = false;
let displayedCount = 0;
const ITEMS_PER_LOAD = 20;

/**
 * Initialize auto-refresh for real-time updates (every 30 seconds)
 */
function initializeAutoRefresh() {
    // Auto-refresh customer data every 30 seconds
    autoRefreshInterval = setInterval(async function() {
        try {
            await loadCustomersFromSupabase();
            console.log('✓ Customer data auto-refreshed');
        } catch (error) {
            console.error('Auto-refresh error:', error);
        }
    }, 30000); // 30 seconds
}

/**
 * Stop auto-refresh
 */
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

/**
 * Initialize infinite scroll / lazy load functionality
 */
function initializeInfiniteScroll() {
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;

    const container = tbody.closest('.customers-table-wrapper') || tbody.parentElement;
    
    container.addEventListener('scroll', function() {
        // Check if user scrolled near the bottom
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
            loadMoreCustomers();
        }
    });
}

/**
 * Load more customers for infinite scroll
 */
function loadMoreCustomers() {
    if (isLoadingMore) return;
    
    isLoadingMore = true;
    const tbody = document.getElementById('customers-tbody');
    
    if (!tbody) return;

    const allRows = tbody.querySelectorAll('tr:not(#no-search-results)');
    const currentCount = allRows.length;

    // If we've already loaded all customers, don't load more
    if (currentCount >= allCustomersData.length) {
        isLoadingMore = false;
        return;
    }

    // Simulate loading delay for better UX
    setTimeout(() => {
        const nextBatch = allCustomersData.slice(currentCount, currentCount + ITEMS_PER_LOAD);
        nextBatch.forEach(customer => {
            addCustomerRow(customer);
        });
        isLoadingMore = false;
        console.log(`✓ Loaded ${nextBatch.length} more customers`);
    }, 300);
}

/**
 * Store all customers for lazy loading
 */
function storeAllCustomersData(customersData) {
    allCustomersData = customersData;
}
