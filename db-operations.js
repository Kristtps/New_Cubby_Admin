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
        console.log('✓ Customer created:', data);
        return data;
    } catch (error) {
        console.error('Error creating customer:', error);
        return null;
    }
}

/**
 * LOCKERS TABLE OPERATIONS
 */

/**
 * Fetch all lockers
 */
async function fetchAllLockers() {
    try {
        const { data, error } = await supabase
            .from('lockers')
            .select('*')
            .order('locker_id', { ascending: true });

        if (error) throw error;
        console.log('✓ Lockers fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching lockers:', error);
        return [];
    }
}

/**
 * Update locker status
 */
async function updateLockerStatus(lockerId, status) {
    try {
        const { data, error } = await supabase
            .from('lockers')
            .update({ status: status, updated_at: new Date() })
            .eq('locker_id', lockerId)
            .select();

        if (error) throw error;
        console.log('✓ Locker status updated:', data);
        return data;
    } catch (error) {
        console.error('Error updating locker status:', error);
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
 * Fetch all transactions
 */
async function fetchAllTransactions() {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        console.log('✓ Transactions fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

/**
 * Fetch today's transactions
 */
async function fetchTodayTransactions() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`)
            .order('created_at', { ascending: false });

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
 * Get today's total revenue
 */
async function getTodayRevenue() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('transactions')
            .select('amount')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);

        if (error) throw error;

        const total = data.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        return total;
    } catch (error) {
        console.error('Error calculating revenue:', error);
        return 0;
    }
}

/**
 * AUDIT LOG TABLE OPERATIONS
 */

/**
 * Fetch all audit logs
 */
async function fetchAllAuditLogs() {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false });

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
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;
        console.log('✓ Rates fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching rates:', error);
        return null;
    }
}

/**
 * Update rates
 */
async function updateRates(ratesData) {
    try {
        const { data, error } = await supabase
            .from('rates')
            .insert([ratesData])
            .select();

        if (error) throw error;
        console.log('✓ Rates updated:', data);
        return data;
    } catch (error) {
        console.error('Error updating rates:', error);
        return null;
    }
}

/**
 * STATISTICS & ANALYTICS
 */

/**
 * Get dashboard statistics
 */
async function getDashboardStats() {
    try {
        const [lockersCount, customersCount, todayRevenue, activeRentals] = await Promise.all([
            getLockersTotalCount(),
            getCustomersTotalCount(),
            getTodayRevenue(),
            getActiveRentalsCount()
        ]);

        return {
            totalLockers: lockersCount,
            totalCustomers: customersCount,
            todayRevenue: todayRevenue,
            activeRentals: activeRentals
        };
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return null;
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
            .from('rentals')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error getting active rentals count:', error);
        return 0;
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
    getLockerCountByStatus,

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
    getActiveRentalsCount
};
