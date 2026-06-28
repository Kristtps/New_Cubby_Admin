// ========================================
// DATABASE OPERATIONS - SUPABASE QUERIES
// ========================================

/**
 * RENTALS TABLE OPERATIONS
 */

/**
 * Fetch all rentals
 */
async function fetchAllRentals() {
    try {
        const { data, error } = await supabase
            .from('rentals')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        console.log('✓ Rentals fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching rentals:', error);
        return [];
    }
}

/**
 * Fetch pending/active rentals only
 */
async function fetchActiveRentals() {
    try {
        const { data, error } = await supabase
            .from('rentals')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching active rentals:', error);
        return [];
    }
}

/**
 * Create a new rental
 */
async function createRental(rentalData) {
    try {
        const { data, error } = await supabase
            .from('rentals')
            .insert([rentalData])
            .select();

        if (error) throw error;
        console.log('✓ Rental created:', data);
        return data;
    } catch (error) {
        console.error('Error creating rental:', error);
        return null;
    }
}

/**
 * Update rental status
 */
async function updateRentalStatus(rentalId, status) {
    try {
        const { data, error } = await supabase
            .from('rentals')
            .update({ status: status, updated_at: new Date() })
            .eq('id', rentalId)
            .select();

        if (error) throw error;
        console.log('✓ Rental updated:', data);
        return data;
    } catch (error) {
        console.error('Error updating rental:', error);
        return null;
    }
}

/**
 * CUSTOMERS TABLE OPERATIONS
 */

/**
 * Fetch all customers
 */
async function fetchAllCustomers() {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        console.log('✓ Customers fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching customers:', error);
        return [];
    }
}

/**
 * Fetch customer by ID
 */
async function fetchCustomerById(customerId) {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('customer_id', customerId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching customer:', error);
        return null;
    }
}

/**
 * Create a new customer
 */
async function createCustomer(customerData) {
    try {
        const { data, error } = await supabase
            .from('customers')
            .insert([customerData])
            .select();

        if (error) throw error;
        
        await logConfigChangeEvent('Customer Created', `New customer profile created: ${customerData.full_name || 'Unnamed'}.`, customerData);
        
        console.log('✓ Customer created:', data);
        return data;
    } catch (error) {
        console.error('Error creating customer:', error);
        return null;
    }
}

/**
 * MODULES TABLE OPERATIONS
 */

/**
 * Fetch all modules
 */
async function fetchAllModules() {
    try {
        const client = getSupabaseClient();
        if (!client || typeof client.from !== 'function') {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await client
            .from('modules')
            .select('*')
            .order('module_id', { ascending: true });

        if (error) throw error;
        console.log('✓ Modules fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching modules:', error);
        return [];
    }
}

/**
 * Create a new module
 */
async function createModule(moduleData) {
    try {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from('modules')
            .insert([moduleData])
            .select();

        if (error) throw error;
        
        await logConfigChangeEvent('Module Created', `New module created: ${moduleData.name || 'Unnamed'}.`, moduleData);
        
        console.log('✓ Module created:', data);
        return data;
    } catch (error) {
        console.error('Error creating module:', error);
        return null;
    }
}

/**
 * Update module
 */
async function updateModule(moduleId, moduleData) {
    try {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from('modules')
            .update(moduleData)
            .eq('module_id', moduleId)
            .select();

        if (error) throw error;
        console.log('✓ Module updated:', data);
        return data;
    } catch (error) {
        console.error('Error updating module:', error);
        return null;
    }
}

/**
 * Delete module
 */
async function deleteModule(moduleId) {
    try {
        const client = getSupabaseClient();
        const { error } = await client
            .from('modules')
            .delete()
            .eq('module_id', moduleId);

        if (error) throw error;
        console.log('✓ Module deleted:', moduleId);
        return true;
    } catch (error) {
        console.error('Error deleting module:', error);
        return false;
    }
}

/**
 * LOCKERS TABLE OPERATIONS
 */

function getSupabaseClient() {
    return window.supabaseClient || window.supabase;
}

/**
 * Fetch all lockers with module details
 */
async function fetchAllLockers() {
    try {
        const client = getSupabaseClient();
        if (!client || typeof client.from !== 'function') {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await client
            .from('lockers')
            .select('*, modules(*)')
            .order('locker_id', { ascending: true });

        if (error) throw error;
        console.log('✓ Lockers fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching lockers:', error);
        return null;
    }
}

/**
 * Update locker status
 */
async function updateLockerStatus(lockerId, status) {
    try {
        const client = getSupabaseClient();
        if (!client || typeof client.from !== 'function') {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await client
            .from('lockers')
            .update({ status: status })
            .eq('locker_id', lockerId)
            .select();

        if (error) throw error;
        
        // Internal logging for system admin tracking
        if (data && data.length > 0) {
            await logConfigChangeEvent('Locker Update', `Locker ID ${lockerId} status updated to ${status}.`, { lockerId, status });
        }
        
        console.log('✓ Locker status updated:', data);
        return data;
    } catch (error) {
        console.error('Error updating locker status:', error);
        return null;
    }
}

/**
 * Delete a locker
 */
async function deleteLocker(lockerId) {
    try {
        const client = getSupabaseClient();
        if (!client || typeof client.from !== 'function') {
            throw new Error('Supabase client is not initialized');
        }

        const { error } = await client
            .from('lockers')
            .delete()
            .eq('locker_id', lockerId);

        if (error) throw error;
        
        await logConfigChangeEvent('Locker Deleted', `Locker ID ${lockerId} was deleted from database.`, { lockerId });
        
        console.log('✓ Locker deleted:', lockerId);
        return true;
    } catch (error) {
        console.error('Error deleting locker:', error);
        return false;
    }
}

/**
 * Create a single locker
 */
async function createLocker(lockerData) {
    try {
        const client = getSupabaseClient();
        if (!client || typeof client.from !== 'function') {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await client
            .from('lockers')
            .insert([lockerData])
            .select();

        if (error) throw error;
        console.log('✓ Locker created:', data);
        return data;
    } catch (error) {
        console.error('Error creating locker:', error);
        return null;
    }
}

/**
 * Create multiple lockers at once
 */
async function createLockersBatch(lockersData) {
    try {
        const client = getSupabaseClient();
        if (!client || typeof client.from !== 'function') {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await client
            .from('lockers')
            .insert(lockersData)
            .select();

        if (error) throw error;
        
        // Log the system expansion
        await logConfigChangeEvent('Module Added', `New locker module added with ${lockersData.length} lockers.`, { count: lockersData.length });
        
        console.log('✓ Lockers batch created:', data);
        return data;
    } catch (error) {
        console.error('Error creating lockers batch:', error);
        return null;
    }
}

/**
 * Get locker count by status
 */
async function getLockerCountByStatus(status) {
    try {
        const { count, error } = await supabase
            .from('lockers')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);

        if (error) throw error;
        return count;
    } catch (error) {
        console.error('Error getting locker count:', error);
        return 0;
    }
}

/**
 * TRANSACTIONS TABLE OPERATIONS
 */

/**
 * Fetch all transactions with customer and locker details
 */
async function fetchAllTransactions() {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                customers (full_name, email),
                lockers (locker_number),
                payments (amount, payment_method)
            `)
            .order('start_time', { ascending: false });

        if (error) throw error;
        console.log('✓ Transactions fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

/**
 * Fetch today's transactions with customer and locker details
 */
async function fetchTodayTransactions() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                customers (full_name, email),
                lockers (locker_number)
            `)
            .gte('start_time', `${today}T00:00:00`)
            .lte('start_time', `${today}T23:59:59`)
            .order('start_time', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching today transactions:', error);
        return [];
    }
}

/**
 * Create a new transaction
 */
async function createTransaction(transactionData) {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .insert([transactionData])
            .select();

        if (error) throw error;
        console.log('✓ Transaction created:', data);
        return data;
    } catch (error) {
        console.error('Error creating transaction:', error);
        return null;
    }
}

/**
 * AUDIT LOG TABLE OPERATIONS
 */

/**
 * Fetch all audit logs ordered by timestamp
 */
async function fetchAllAuditLogs() {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;
        console.log('✓ Audit logs fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
}

/**
 * Create audit log entry
 */
async function createAuditLog(logData) {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .insert([logData])
            .select();

        if (error) throw error;
        console.log('✓ Audit log created:', data);
        return data;
    } catch (error) {
        console.error('Error creating audit log:', error);
        return null;
    }
}

/**
 * RATES TABLE OPERATIONS
 */

/**
 * Fetch current rates
 */
async function fetchRates() {
    try {
        const { data, error } = await supabase
            .from('rates')
            .select('*');

        if (error) throw error;
        
        // Map the rows back to the object structure the UI expects
        const rates = { small: null, medium: null, large: null };
        
        data.forEach(row => {
            const hourlyRate = (row.price_per_minute * 60).toFixed(2);
            const minPrice = (row.price_per_minute * row.min_charge_minutes).toFixed(2);
            
            const rateObj = { rate: hourlyRate, minimum: minPrice };
            
            if (row.size_type_id === 1) rates.small = rateObj;
            else if (row.size_type_id === 2) rates.medium = rateObj;
            else if (row.size_type_id === 3) rates.large = rateObj;
        });

        console.log('✓ Rates fetched from DB:', rates);
        return rates;
    } catch (error) {
        console.error('Error fetching rates:', error);
        return null;
    }
}

async function updateRates(ratesData) {
    try {
        const sizes = [
            { 
                id: 1, 
                name: 'small',
                data: { 
                    size_type_id: 1, 
                    price_per_minute: ratesData.small.rate / 60, 
                    min_charge_minutes: Math.round((ratesData.small.minimum / ratesData.small.rate) * 60)
                }
            },
            { 
                id: 2, 
                name: 'medium',
                data: { 
                    size_type_id: 2, 
                    price_per_minute: ratesData.medium.rate / 60, 
                    min_charge_minutes: Math.round((ratesData.medium.minimum / ratesData.medium.rate) * 60)
                }
            },
            { 
                id: 3, 
                name: 'large',
                data: { 
                    size_type_id: 3, 
                    price_per_minute: ratesData.large.rate / 60, 
                    min_charge_minutes: Math.round((ratesData.large.minimum / ratesData.large.rate) * 60)
                }
            }
        ];

        const results = [];

        // Update each size individually to retain the original rate_id
        for (const size of sizes) {
            const { data, error } = await supabase
                .from('rates')
                .update(size.data)
                .eq('size_type_id', size.id)
                .select();

            if (error) throw error;

            // If the row doesn't exist yet, create it
            if (!data || data.length === 0) {
                const { data: newData, error: insertError } = await supabase
                    .from('rates')
                    .insert([size.data])
                    .select();
                
                if (insertError) throw insertError;
                results.push(newData[0]);
            } else {
                results.push(data[0]);
            }
        }
        
        await logConfigChangeEvent('Rates Updated', 'System rates updated in place.', ratesData);
        console.log('✓ Rates updated successfully (IDs retained):', results);
        return results;
    } catch (error) {
        console.error('Error in updateRates:', error);
        throw error;
    }
}

/**
 * LOGGING HELPER FUNCTIONS
 */

/**
 * Log a login event
 */
async function logLoginEvent(userEmail, success = true, details = '') {
    return await createAuditLog({
        action: success ? 'Admin Login' : 'Failed Login Attempt',
        user_id: null, // Could be linked to admin table if exists
        timestamp: new Date().toISOString(),
        details: {
            description: success ? `User ${userEmail} logged in successfully.` : `Failed login attempt for ${userEmail}. ${details}`,
            type: 'system',
            icon: success ? 'success' : 'error',
            badge: 'AUTH',
            badgeType: success ? 'primary' : 'danger'
        }
    });
}

/**
 * Log a logout event
 */
async function logLogoutEvent(userEmail) {
    return await createAuditLog({
        action: 'Admin Logout',
        user_id: null,
        timestamp: new Date().toISOString(),
        details: {
            description: `User ${userEmail} logged out.`,
            type: 'system',
            icon: 'info',
            badge: 'AUTH',
            badgeType: 'secondary'
        }
    });
}

/**
 * Log a configuration change
 */
async function logConfigChangeEvent(action, description, configData) {
    return await createAuditLog({
        action: action,
        user_id: null,
        timestamp: new Date().toISOString(),
        details: {
            description: description,
            type: 'system',
            icon: 'warning',
            badge: 'CONFIG',
            badgeType: 'warning',
            data: configData
        }
    });
}

/**
 * Get total revenue for today based on payments
 */
async function getTodayRevenue() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data, error } = await supabase
            .from('payments')
            .select('amount')
            .gte('payment_date', today.toISOString());

        if (error) throw error;
        
        const total = data.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        return total;
    } catch (error) {
        console.error('Error getting today revenue:', error);
        return 0;
    }
}

/**
 * STATISTICS & ANALYTICS
 */

async function getDashboardStats() {
    const stats = {
        totalLockers: 0,
        totalCustomers: 0,
        todayRevenue: 0,
        activeRentals: 0,
        recentRentals: [],
        last7DaysSales: []
    };

    try {
        const recentRentalsPromise = supabase
            .from('transactions')
            .select('*, customers(full_name), lockers(locker_number), payments(amount)')
            .order('start_time', { ascending: false })
            .limit(5);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const paymentsPromise = supabase
            .from('payments')
            .select('amount, payment_date')
            .gte('payment_date', sevenDaysAgo.toISOString())
            .order('payment_date', { ascending: true });

        // Fetch all stats concurrently to drastically improve loading time
        const results = await Promise.allSettled([
            getLockersTotalCount(),
            getCustomersTotalCount(),
            getTodayRevenue(),
            getActiveRentalsCount(),
            recentRentalsPromise,
            paymentsPromise
        ]);

        if (results[0].status === 'fulfilled') stats.totalLockers = results[0].value || 0;
        if (results[1].status === 'fulfilled') stats.totalCustomers = results[1].value || 0;
        if (results[2].status === 'fulfilled') stats.todayRevenue = results[2].value || 0;
        if (results[3].status === 'fulfilled') stats.activeRentals = results[3].value || 0;
        
        if (results[4].status === 'fulfilled' && results[4].value.data) {
            stats.recentRentals = results[4].value.data.map(tx => {
                const totalPaid = tx.payments && Array.isArray(tx.payments) ? tx.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) : 0;
                return {
                    id: tx.transaction_id,
                    customerName: tx.customers ? tx.customers.full_name : 'Unknown',
                    lockerInfo: `${tx.lockers ? tx.lockers.locker_number : 'Locker'} • ${new Date(tx.start_time).toLocaleString()}`,
                    amount: `₱${totalPaid.toFixed(2)}`
                };
            });
        }

        // Process 7 days sales
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const salesMap = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            salesMap.push({
                dateString: d.toLocaleDateString('en-CA'),
                dayName: dayNames[d.getDay()],
                amount: 0
            });
        }

        if (results[5].status === 'fulfilled' && results[5].value.data) {
            results[5].value.data.forEach(p => {
                if (p.payment_date) {
                    const dateObj = new Date(p.payment_date);
                    const localDateStr = dateObj.toLocaleDateString('en-CA');
                    const match = salesMap.find(d => d.dateString === localDateStr);
                    if (match) {
                        match.amount += parseFloat(p.amount || 0);
                    }
                }
            });
        }

        stats.last7DaysSales = salesMap;
        return stats;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return stats;
    }
}

/**
 * Get total lockers count
 */
async function getLockersTotalCount() {
    try {
        const { count, error } = await supabase
            .from('lockers')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error getting lockers count:', error);
        return 0;
    }
}

/**
 * Get total customers count
 */
async function getCustomersTotalCount() {
    try {
        const { count, error } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error getting customers count:', error);
        return 0;
    }
}

/**
 * Get active rentals count
 */
async function getActiveRentalsCount() {
    try {
        const { count, error } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Active');

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error getting active rentals count:', error);
        return 0;
    }
}

/**
 * Get historical data for reports
 */
async function getReportData(dateFrom, dateTo) {
    try {
        // Resolve date range – default to last 14 days
        const toDate   = dateTo   instanceof Date ? dateTo   : new Date();
        const fromDate = dateFrom instanceof Date ? dateFrom : (() => {
            const d = new Date();
            d.setDate(d.getDate() - 14);
            return d;
        })();

        const [paymentsResponse, transactionsResponse] = await Promise.all([
            supabase
                .from('payments')
                .select('amount, payment_date')
                .gte('payment_date', fromDate.toISOString())
                .lte('payment_date', toDate.toISOString()),
            supabase
                .from('transactions')
                .select('start_time, locker_id, lockers(size_type_id)')
                .gte('start_time', fromDate.toISOString())
                .lte('start_time', toDate.toISOString())
        ]);

        if (paymentsResponse.error) throw paymentsResponse.error;
        if (transactionsResponse.error) throw transactionsResponse.error;

        return {
            payments: paymentsResponse.data,
            transactions: transactionsResponse.data
        };
    } catch (error) {
        console.error('Error getting report data:', error);
        return { payments: [], transactions: [] };
    }
}

/**
 * LOGGING HELPERS
 */

async function logLoginEvent(email) {
    return createAuditLog({
        action: 'Admin Login',
        details: {
            description: `User ${email} logged in successfully.`,
            type: 'system',
            icon: 'login',
            badge: 'AUTH',
            badgeType: 'primary'
        }
    });
}

async function logLogoutEvent(email) {
    return createAuditLog({
        action: 'Admin Logout',
        details: {
            description: `User ${email} logged out.`,
            type: 'system',
            icon: 'logout',
            badge: 'AUTH',
            badgeType: 'secondary'
        }
    });
}

async function logConfigChangeEvent(action, description, metadata = {}) {
    const authData = JSON.parse(localStorage.getItem('coincubby_auth') || '{}');
    return createAuditLog({
        action: action,
        details: {
            description: description,
            admin: authData.email || 'System',
            type: 'config',
            icon: 'settings',
            badge: 'CONFIG',
            badgeType: 'warning',
            ...metadata
        }
    });
}

/**
 * PAYMENTS TABLE OPERATIONS
 */

async function fetchAllPayments() {
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*, transactions(transaction_id, customer_id, customers(full_name))')
            .order('payment_date', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching payments:', error);
        return [];
    }
}

async function fetchPaymentsByTransaction(transactionId) {
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('transaction_id', transactionId)
            .order('payment_date', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching transaction payments:', error);
        return [];
    }
}

async function createPayment(paymentData) {
    try {
        const { data, error } = await supabase
            .from('payments')
            .insert([paymentData])
            .select();

        if (error) throw error;
        
        // Log the payment
        await logConfigChangeEvent('Payment Received', `Payment of ₱${paymentData.amount} received via ${paymentData.payment_method}.`, { transactionId: paymentData.transaction_id });
        
        console.log('✓ Payment recorded:', data);
        return data;
    } catch (error) {
        console.error('Error creating payment:', error);
        return null;
    }
}

// Make functions globally accessible
window.dbOps = {
    // Rentals
    fetchAllRentals,
    fetchActiveRentals,
    createRental,
    updateRentalStatus,

    // Customers
    fetchAllCustomers,
    fetchCustomerById,
    createCustomer,

    // Lockers
    fetchAllLockers,
    updateLockerStatus,
    createLocker,
    createLockersBatch,
    getLockerCountByStatus,
    deleteLocker,

    // Modules
    fetchAllModules,
    createModule,
    updateModule,
    deleteModule,

    // Transactions
    fetchAllTransactions,
    fetchTodayTransactions,
    createTransaction,
    getTodayRevenue,

    // Audit Logs
    fetchAllAuditLogs,
    createAuditLog,

    // Rates
    fetchRates,
    updateRates,

    // Statistics
    getDashboardStats,
    getLockersTotalCount,
    getCustomersTotalCount,
    getActiveRentalsCount,
    getReportData,
    
    // Payments
    fetchAllPayments,
    fetchPaymentsByTransaction,
    createPayment,

    // System Logging
    logLoginEvent,
    logLogoutEvent,
    logConfigChangeEvent,
    fixLockerNumbersPerModule
};

/**
 * Fix Locker Numbers
 * Renumbers every locker per module, grouped by size prefix:
 *   Small (size_type_id=1) => S1, S2...
 *   Medium (size_type_id=2) => M1, M2...
 *   Large  (size_type_id=3) => L1, L2...
 */
async function fixLockerNumbersPerModule() {
    try {
        const client = getSupabaseClient();
        if (!client || typeof client.from !== 'function') {
            throw new Error('Supabase client not initialized');
        }

        const { data: lockers, error } = await client
            .from('lockers')
            .select('locker_id, locker_number, module_id, size_type_id')
            .order('module_id', { ascending: true })
            .order('locker_id',  { ascending: true });

        if (error) throw error;
        if (!lockers || lockers.length === 0) return true;

        // Group by module_id then by size prefix
        const byModule = {};
        lockers.forEach(l => {
            const mod = l.module_id ?? 0;
            if (!byModule[mod]) byModule[mod] = { S: [], M: [], L: [] };
            const prefix = l.size_type_id === 2 ? 'M' : l.size_type_id === 3 ? 'L' : 'S';
            byModule[mod][prefix].push(l.locker_id);
        });

        // Build update list
        const updates = [];
        for (const mod of Object.keys(byModule)) {
            for (const [prefix, ids] of Object.entries(byModule[mod])) {
                ids.forEach((id, idx) => {
                    updates.push({ locker_id: id, locker_number: `${prefix}${idx + 1}` });
                });
            }
        }

        // Apply in parallel batches of 20
        const BATCH = 20;
        for (let i = 0; i < updates.length; i += BATCH) {
            await Promise.all(
                updates.slice(i, i + BATCH).map(u =>
                    client.from('lockers')
                        .update({ locker_number: u.locker_number })
                        .eq('locker_id', u.locker_id)
                )
            );
        }

        await logConfigChangeEvent('Fix Locker Numbers', `Sequential locker numbers applied to ${updates.length} lockers.`, { count: updates.length });
        console.log(`✓ Fixed locker numbers for ${updates.length} lockers.`);
        return true;
    } catch (error) {
        console.error('Error fixing locker numbers:', error);
        return false;
    }
}
