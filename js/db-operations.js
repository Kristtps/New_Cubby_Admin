// ========================================
// DATABASE OPERATIONS - SUPABASE QUERIES
// ========================================

// Helper function to get Supabase client
function getSupabaseClient() {
    const client = window.supabaseClient || window.supabase;
    if (!client || typeof client.from !== 'function') {
        throw new Error('Supabase client not initialized. Make sure supabase-client.js is loaded.');
    }
    return client;
}

/**
 * RENTALS TABLE OPERATIONS
 */

/**
 * Fetch all rentals
 */
async function fetchAllRentals() {
    try {
        const supabase = getSupabaseClient();
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
        const supabase = getSupabaseClient();
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
        const supabase = getSupabaseClient();
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
async function updateRentalStatus(transactionId, status) {
    try {
        const supabase = getSupabaseClient();
        const updatePayload = { status: status };
        if (status === 'Completed') {
            updatePayload.end_time = new Date().toISOString();
        }
        const { data, error } = await supabase
            .from('transactions')
            .update(updatePayload)
            .eq('transaction_id', transactionId)
            .select();

        if (error) throw error;
        console.log('✓ Transaction status updated:', data);
        return data;
    } catch (error) {
        console.error('Error updating transaction status:', error);
        return null;
    }
}

/**
 * Find and complete any active transaction for a specific locker
 */
async function completeActiveTransactionForLocker(lockerId) {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('transactions')
            .update({
                status: 'Completed',
                end_time: new Date().toISOString()
            })
            .eq('locker_id', lockerId)
            .eq('status', 'Active')
            .select();

        if (error) throw error;
        console.log('✓ Active transaction completed for locker ID:', lockerId, data);
        return data;
    } catch (error) {
        console.error('Error completing active transaction for locker:', error);
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
        const supabase = getSupabaseClient();
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
        const supabase = getSupabaseClient();
        console.log('🔍 Fetching customer by ID:', customerId);

        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('customer_id', customerId)
            .single();

        if (error) {
            console.error('❌ Error fetching customer:', error);
            throw error;
        }

        console.log('✓ Customer data from DB:', data);

        // Map database columns to expected UI properties
        if (data) {
            const mappedData = {
                ...data,
                // Try multiple possible column names
                name: data.full_name || data.name || data.customer_name || 'N/A',
                phone: data.contact_number || data.phone || data.phone_number || 'N/A',
                email: data.email || 'N/A'
            };
            console.log('✓ Mapped customer data:', mappedData);
            return mappedData;
        }
        return data;
    } catch (error) {
        console.error('❌ Error in fetchCustomerById:', error);
        return null;
    }
}

/**
 * Fetch locker by locker_number (code like "S2", "M1")
 */
async function fetchLockerByCode(lockerNumber) {
    try {
        const supabase = getSupabaseClient();
        console.log('🔍 fetchLockerByCode searching for:', lockerNumber);

        // We will try querying locker_number first, then locker_id.
        // We also try with modules join, and fallback to simple select if join fails.
        const columnsToTry = ['locker_number', 'locker_id'];

        for (const col of columnsToTry) {
            try {
                // Try with modules join
                const { data, error } = await supabase
                    .from('lockers')
                    .select('*, modules(*)')
                    .eq(col, lockerNumber)
                    .limit(1);

                if (!error && data && data.length > 0) {
                    console.log(`✓ Locker fetched by ${col} (with modules join):`, data[0]);
                    return data[0];
                }
            } catch (err) {
                console.warn(`Join query failed on column ${col}:`, err);
            }

            try {
                // Try without join
                const { data, error } = await supabase
                    .from('lockers')
                    .select('*')
                    .eq(col, lockerNumber)
                    .limit(1);

                if (!error && data && data.length > 0) {
                    console.log(`✓ Locker fetched by ${col} (without join):`, data[0]);
                    return data[0];
                }
            } catch (err) {
                console.warn(`Simple query failed on column ${col}:`, err);
            }
        }

        console.warn('⚠️ Locker not found by any identifier:', lockerNumber);
        return null;
    } catch (error) {
        console.error('Error fetching locker by number:', error);
        return null;
    }
}

/**
 * Fetch active rental/transaction for a specific locker by locker_number
 * Includes payment information from the payments table
 */
async function fetchActiveRentalByLocker(lockerNumber) {
    try {
        const supabase = getSupabaseClient();

        console.log('🔍 Fetching active rental for locker:', lockerNumber);

        // First get the locker_id from locker_number
        const { data: lockerData, error: lockerError } = await supabase
            .from('lockers')
            .select('locker_id, status')
            .eq('locker_number', lockerNumber)
            .single();

        if (lockerError) throw lockerError;
        if (!lockerData) {
            console.log('❌ Locker not found:', lockerNumber);
            return null;
        }

        console.log('✓ Locker found:', lockerData);

        // Fetch active transaction with payment information
        // Join with payments table to get amount. Since payments table references transactions,
        // we can query payments(amount, payment_method, payment_date).
        let transaction = null;

        try {
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    payments(amount, payment_method, payment_date)
                `)
                .eq('locker_id', lockerData.locker_id)
                .eq('status', 'Active')
                .order('start_time', { ascending: false })
                .limit(1);

            if (error) {
                // If it's a join/relation error (e.g. PGRST200 or PGRST116), try fetching transaction without join
                console.warn('⚠️ Join query failed, falling back to separate queries:', error);
                throw error;
            }

            if (data && data.length > 0) {
                transaction = data[0];
                if (transaction.payments && transaction.payments.length > 0) {
                    transaction.amount_paid = transaction.payments[0].amount;
                    transaction.payment_method = transaction.payments[0].payment_method;
                    transaction.payment_date = transaction.payments[0].payment_date;
                } else {
                    transaction.amount_paid = null;
                }
            }
        } catch (fallbackError) {
            // Fallback: Query transaction first, then query payments separately
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('locker_id', lockerData.locker_id)
                .eq('status', 'Active')
                .order('start_time', { ascending: false })
                .limit(1);

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('ℹ️ No active rental found for locker:', lockerNumber);
                    return null;
                }
                throw error;
            }

            if (data && data.length > 0) {
                transaction = data[0];

                // Fetch payment separately
                const { data: payData, error: payError } = await supabase
                    .from('payments')
                    .select('amount, payment_method, payment_date')
                    .eq('transaction_id', transaction.transaction_id)
                    .limit(1);

                if (!payError && payData && payData.length > 0) {
                    transaction.amount_paid = payData[0].amount;
                    transaction.payment_method = payData[0].payment_method;
                    transaction.payment_date = payData[0].payment_date;
                } else {
                    transaction.amount_paid = null;
                }
            }
        }

        if (transaction) {
            console.log('✓ Active rental found:', transaction);
            return transaction;
        }

        console.log('ℹ️ No active rental data found for locker:', lockerNumber);
        return null;
    } catch (error) {
        console.error('❌ Error fetching active rental by locker:', error);
        return null;
    }
}

/**
 * Fetch all data needed for the Rental Details modal.
 * Uses explicit separate queries per table to avoid FK join failures.
 *
 * Tables touched: lockers, storage_size_type, modules,
 *                 transactions, customers, rates
 *
 * @param {string} lockerNumber - e.g. "S1", "M2"
 * @returns {Promise<Object|null>}
 *   {
 *     locker_number, status, size_name, module_name,
 *     transaction_id?, start_time?, duration_minutes?,
 *     customer_full_name?, customer_email?, customer_phone?,
 *     rate_price?
 *   }
 */
async function fetchLockerRentalDetails(lockerNumber) {
    try {
        const supabase = getSupabaseClient();
        console.log('🔍 [fetchLockerRentalDetails] locker:', lockerNumber);

        // ── Step 1: Fetch the locker row (with modules join — confirmed working) ──
        const { data: locker, error: lockerErr } = await supabase
            .from('lockers')
            .select('locker_id, locker_number, status, size_type_id, module_id, modules(name)')
            .eq('locker_number', lockerNumber)
            .single();

        if (lockerErr) {
            console.error('❌ [fetchLockerRentalDetails] locker error:', lockerErr);
            return null;
        }
        if (!locker) {
            console.warn('⚠️ [fetchLockerRentalDetails] locker not found:', lockerNumber);
            return null;
        }
        console.log('✓ locker row:', locker);

        // ── Step 2: Resolve size name ────────────────────────────────────────
        // Try FK join first; fall back to direct lookup; then manual mapping.
        let sizeName = locker.storage_size_type?.size_name || null;

        if (!sizeName && locker.size_type_id != null) {
            // Try a direct lookup on storage_size_type
            const { data: sizeRow } = await supabase
                .from('storage_size_type')
                .select('size_name')
                .eq('size_type_id', locker.size_type_id)
                .single();

            sizeName = sizeRow?.size_name || null;
            console.log('✓ size lookup:', sizeName);
        }

        // Last resort manual mapping (1=Small, 2=Medium, 3=Large)
        if (!sizeName) {
            const sizeMap = { 1: 'Small', 2: 'Medium', 3: 'Large' };
            sizeName = sizeMap[locker.size_type_id] || null;
        }

        const result = {
            locker_number: locker.locker_number,
            status: locker.status,
            size_name: sizeName,
            module_name: locker.modules?.name || null,
        };
        console.log('✓ base result:', result);

        // ── Step 3: Fetch the active transaction for this locker ─────────────
        const { data: txRows, error: txErr } = await supabase
            .from('transactions')
            .select('transaction_id, start_time, duration_minutes, status, customer_id, rate_id')
            .eq('locker_id', locker.locker_id)
            .eq('status', 'Active')
            .order('start_time', { ascending: false })
            .limit(1);

        if (txErr) {
            console.warn('⚠️ [fetchLockerRentalDetails] tx error (non-fatal):', txErr);
            return result;
        }
        if (!txRows || txRows.length === 0) {
            console.log('ℹ️ no active transaction for locker:', lockerNumber);
            return result;
        }

        const tx = txRows[0];
        console.log('✓ transaction row:', tx);
        result.transaction_id = tx.transaction_id;
        result.start_time = tx.start_time;
        result.duration_minutes = tx.duration_minutes;

        // ── Step 4: Fetch customer ───────────────────────────────────────────
        if (tx.customer_id) {
            const { data: customer, error: custErr } = await supabase
                .from('customers')
                .select('full_name, email, contact_number')
                .eq('customer_id', tx.customer_id)
                .single();

            if (!custErr && customer) {
                console.log('✓ customer:', customer);
                result.customer_full_name = customer.full_name || null;
                result.customer_email = customer.email || null;
                result.customer_phone = customer.contact_number || null;
            } else {
                console.warn('⚠️ customer lookup error:', custErr);
            }
        }

        // ── Step 5: Fetch rate price ─────────────────────────────────────────
        if (tx.rate_id != null) {
            const { data: rate, error: rateErr } = await supabase
                .from('rates')
                .select('price')
                .eq('rate_id', tx.rate_id)
                .single();

            if (!rateErr && rate) {
                console.log('✓ rate:', rate);
                result.rate_price = rate.price;
            } else {
                console.warn('⚠️ rate lookup error:', rateErr);
            }
        }

        console.log('✓ [fetchLockerRentalDetails] final result:', result);
        return result;
    } catch (error) {
        console.error('❌ [fetchLockerRentalDetails] unexpected error:', error);
        return null;
    }
}

/**
 * Fetch a rate row by its integer rate_id.
 * @param {number} rateId
 * @returns {Promise<Object|null>}  e.g. { rate_id, price, ... }
 */
async function fetchRateById(rateId) {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('rates')
            .select('*')
            .eq('rate_id', rateId)
            .single();
        if (error) throw error;
        console.log('✓ Rate fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching rate by ID:', error);
        return null;
    }
}

/**
 * Generate a unique 6-character user ID
 * Format: Alphanumeric (A-Z, 0-9)
 */
async function generateUniqueUserId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        let userId = '';
        for (let i = 0; i < 6; i++) {
            userId += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check if this user_id already exists
        try {
            const client = getSupabaseClient();
            const { data, error } = await client
                .from('customers')
                .select('user_id')
                .eq('user_id', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // PGRST116 means no rows returned, which is good - ID is unique
                return userId;
            }
            if (error && error.code !== 'PGRST116') {
                console.error('Error checking user_id uniqueness:', error);
            }
        } catch (err) {
            console.error('Error in generateUniqueUserId:', err);
        }

        attempts++;
    }

    throw new Error('Failed to generate unique user ID after 10 attempts');
}

/**
 * Create a new customer
 */
async function createCustomer(customerData) {
    try {
        // Generate user_id if not provided
        if (!customerData.user_id) {
            customerData.user_id = await generateUniqueUserId();
        }

        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('customers')
            .insert([customerData])
            .select();

        if (error) throw error;

        await logConfigChangeEvent('Customer Created', `New customer profile created: ${customerData.full_name || 'Unnamed'} (ID: ${customerData.user_id}).`, customerData);

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
 * Synchronize locker status with active rentals
 * This ensures locker status accurately reflects whether it's currently rented
 */
async function syncLockerStatusWithActiveRentals() {
    try {
        const client = getSupabaseClient();
        if (!client || typeof client.from !== 'function') {
            throw new Error('Supabase client is not initialized');
        }

        console.log('Syncing locker status with active rentals...');

        // 1. Get all active rentals
        const { data: activeRentals, error: rentalsError } = await client
            .from('transactions')
            .select('locker_id, status')
            .eq('status', 'Active');

        if (rentalsError) throw rentalsError;

        // 2. Get all lockers
        const { data: allLockers, error: lockersError } = await client
            .from('lockers')
            .select('locker_id, status');

        if (lockersError) throw lockersError;

        // 3. Get lockers in maintenance (don't change these)
        const maintenanceLockerIds = allLockers
            .filter(l => l.status === 'Maintenance')
            .map(l => l.locker_id);

        // 4. Get locker IDs that have active rentals
        const rentedLockerIds = activeRentals
            .filter(r => r.status === 'Active')
            .map(r => r.locker_id);

        console.log('Active rentals:', rentedLockerIds.length, 'Maintenance lockers:', maintenanceLockerIds.length);

        // 5. Update rented lockers to "Occupied"
        for (const lockerId of rentedLockerIds) {
            if (!maintenanceLockerIds.includes(lockerId)) {
                await client
                    .from('lockers')
                    .update({ status: 'Occupied' })
                    .eq('locker_id', lockerId);
            }
        }

        // 6. Update available lockers to "Available" (those not rented and not in maintenance)
        const availableLockerIds = allLockers
            .filter(l => !rentedLockerIds.includes(l.locker_id) &&
                !maintenanceLockerIds.includes(l.locker_id) &&
                l.status !== 'Available')
            .map(l => l.locker_id);

        for (const lockerId of availableLockerIds) {
            await client
                .from('lockers')
                .update({ status: 'Available' })
                .eq('locker_id', lockerId);
        }

        console.log('✓ Locker status synchronized:', {
            occupiedCount: rentedLockerIds.length,
            availableCount: availableLockerIds.length,
            maintenanceCount: maintenanceLockerIds.length
        });

        return true;
    } catch (error) {
        console.error('Error syncing locker status:', error);
        return false;
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
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                customers (full_name, email, contact_number),
                lockers (locker_number),
                payments (amount, payment_method, payment_date),
                rates (rate_id, price_per_hour)
            `)
            .order('start_time', { ascending: false });

        if (error) throw error;

        // Flatten payment data into transaction objects
        if (data) {
            data.forEach(transaction => {
                if (transaction.payments && transaction.payments.length > 0) {
                    transaction.amount_paid = transaction.payments[0].amount;
                    transaction.payment_method = transaction.payments[0].payment_method;
                } else {
                    transaction.amount_paid = 0;
                }
            });
        }

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
        const supabase = getSupabaseClient();
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                customers (full_name, email, contact_number),
                lockers (locker_number),
                payments (amount, payment_method, payment_date)
            `)
            .gte('start_time', `${today}T00:00:00`)
            .lte('start_time', `${today}T23:59:59`)
            .order('start_time', { ascending: false });

        if (error) throw error;

        // Flatten payment data into transaction objects
        if (data) {
            data.forEach(transaction => {
                if (transaction.payments && transaction.payments.length > 0) {
                    transaction.amount_paid = transaction.payments[0].amount;
                    transaction.payment_method = transaction.payments[0].payment_method;
                } else {
                    transaction.amount_paid = 0;
                }
            });
        }

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
        const supabase = getSupabaseClient();
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
        const supabase = getSupabaseClient();
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
        const supabase = getSupabaseClient();
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
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('rates')
            .select('*');

        if (error) throw error;

        // Map the rows back to the object structure the UI expects
        const rates = { small: null, medium: null, large: null };

        data.forEach(row => {
            // Handle new schema containing price_per_hour, fallback to old schema containing price_per_minute
            const hourlyRate = parseFloat(row.price_per_hour !== undefined ? row.price_per_hour : (row.price_per_minute ? row.price_per_minute * 60 : 0)).toFixed(2);
            // Default minimum rate to the hourly rate since min_charge_minutes is no longer in the schema
            const minPrice = parseFloat(row.price_per_hour !== undefined ? row.price_per_hour : (row.price_per_minute ? row.price_per_minute * row.min_charge_minutes : 0)).toFixed(2);

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
        const supabase = getSupabaseClient();
        const sizes = [
            {
                id: 1,
                name: 'small',
                data: {
                    size_type_id: 1,
                    price_per_hour: ratesData.small.rate
                }
            },
            {
                id: 2,
                name: 'medium',
                data: {
                    size_type_id: 2,
                    price_per_hour: ratesData.medium.rate
                }
            },
            {
                id: 3,
                name: 'large',
                data: {
                    size_type_id: 3,
                    price_per_hour: ratesData.large.rate
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
        const supabase = getSupabaseClient();
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

async function getDashboardStats(dateFrom, dateTo) {
    const stats = {
        totalLockers: 0,
        totalCustomers: 0,
        todayRevenue: 0,
        activeRentals: 0,
        recentRentals: [],
        last7DaysSales: []
    };

    try {
        const supabase = getSupabaseClient();
        const recentRentalsPromise = supabase
            .from('transactions')
            .select('*, customers(full_name), lockers(locker_number), payments(amount)')
            .order('start_time', { ascending: false })
            .limit(5);

        // Date range calculation (default: 14 days ago to now)
        const toDate = dateTo instanceof Date ? dateTo : new Date();
        const fromDate = dateFrom instanceof Date ? dateFrom : (() => {
            const d = new Date();
            d.setDate(d.getDate() - 14);
            d.setHours(0, 0, 0, 0);
            return d;
        })();

        // Get revenue within custom/filtered date range instead of just today
        const rangeRevenuePromise = (async () => {
            try {
                const { data, error } = await supabase
                    .from('payments')
                    .select('amount')
                    .gte('payment_date', fromDate.toISOString())
                    .lte('payment_date', toDate.toISOString());
                if (error) throw error;
                return data.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            } catch (err) {
                console.error('Error getting range revenue:', err);
                return 0;
            }
        })();

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
            rangeRevenuePromise,
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
                const lockerDate = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Asia/Manila',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(new Date(tx.start_time));
                return {
                    id: tx.transaction_id,
                    customerName: tx.customers ? tx.customers.full_name : 'Unknown',
                    lockerInfo: `${tx.lockers ? tx.lockers.locker_number : 'Locker'} • ${lockerDate}`,
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
        const supabase = getSupabaseClient();
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
        const supabase = getSupabaseClient();
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
        const supabase = getSupabaseClient();
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
        const supabase = getSupabaseClient();
        // Resolve date range – default to last 14 days
        const toDate = dateTo instanceof Date ? dateTo : new Date();
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
                .select('start_time, locker_id, lockers(locker_number, size_type_id)')
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
        const supabase = getSupabaseClient();
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
        const supabase = getSupabaseClient();
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
        const supabase = getSupabaseClient();
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
    completeActiveTransactionForLocker,
    fetchActiveRentalByLocker,

    // Customers
    fetchAllCustomers,
    fetchCustomerById,
    createCustomer,

    // Lockers
    fetchAllLockers,
    fetchLockerByCode,
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

    // Rates History
    createRateHistory,
    fetchRateHistory,
    clearRateHistory,

    // Admin Accounts
    fetchAdminByEmail,
    updateAdminLastLogin,
    getAdminDisplayName,
    fetchAllAdmins,
    upsertAdminAccount,

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
            .order('locker_id', { ascending: true });

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


/**
 * ADMIN ACCOUNTS TABLE OPERATIONS
 */

/**
 * Fetch admin account by email
 * @param {string} email - Admin email
 * @returns {Promise<Object|null>} Admin account data
 */
async function fetchAdminByEmail(email) {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('admin_accounts')
            .select('*')
            .eq('email', email)
            .eq('is_active', true)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned - admin not found
                console.warn(`Admin account not found for email: ${email}`);
                return null;
            }
            throw error;
        }

        console.log('✓ Admin account fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching admin account:', error);
        return null;
    }
}

/**
 * Update admin's last login timestamp
 * @param {string} email - Admin email
 * @returns {Promise<boolean>} Success status
 */
async function updateAdminLastLogin(email) {
    try {
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from('admin_accounts')
            .update({ last_login: new Date().toISOString() })
            .eq('email', email)
            .eq('is_active', true);

        if (error) throw error;
        console.log('✓ Admin last login updated:', email);
        return true;
    } catch (error) {
        console.error('Error updating admin last login:', error);
        return false;
    }
}

/**
 * Get admin's display name (from database or fallback to email)
 * @param {string} email - Admin email
 * @returns {Promise<string>} Admin display name
 */
async function getAdminDisplayName(email) {
    try {
        const admin = await fetchAdminByEmail(email);
        if (admin && admin.full_name) {
            return admin.full_name;
        }
        // Fallback: use email username part
        return email.split('@')[0];
    } catch (error) {
        console.error('Error getting admin display name:', error);
        return email.split('@')[0];
    }
}

/**
 * Fetch all admin accounts
 * @returns {Promise<Array>} Array of admin accounts
 */
async function fetchAllAdmins() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('admin_accounts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        console.log('✓ Admin accounts fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching admin accounts:', error);
        return [];
    }
}

/**
 * Create or update admin account
 * @param {Object} adminData - Admin account data
 * @returns {Promise<Object|null>} Created/updated admin account
 */
async function upsertAdminAccount(adminData) {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('admin_accounts')
            .upsert(adminData, { onConflict: 'email' })
            .select();

        if (error) throw error;
        console.log('✓ Admin account upserted:', data);
        return data[0];
    } catch (error) {
        console.error('Error upserting admin account:', error);
        return null;
    }
}

/**
 * RATES HISTORY TABLE OPERATIONS
 */

/**
 * Create rate change history entry in database
 * @param {Object} historyData - Rate change history data
 * @returns {Promise<Object>} Created history entry
 */
async function createRateHistory(historyData) {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('rates_history')
            .insert([{
                changed_by: historyData.changedBy,
                small_rate: historyData.rates.small,
                medium_rate: historyData.rates.medium,
                large_rate: historyData.rates.large,
                previous_small: historyData.previous?.small || null,
                previous_medium: historyData.previous?.medium || null,
                previous_large: historyData.previous?.large || null,
                changed_at: historyData.savedAt || new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        console.log('✓ Rate history saved to database:', data);
        return data[0];
    } catch (error) {
        console.error('Error saving rate history:', error);
        return null;
    }
}

/**
 * Fetch all rate change history from database
 * @param {number} limit - Maximum number of records to fetch (default: 100)
 * @returns {Promise<Array>} Array of rate history entries
 */
async function fetchRateHistory(limit = 100) {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('rates_history')
            .select('*')
            .order('changed_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        console.log('✓ Rate history fetched from database:', data);
        return data;
    } catch (error) {
        console.error('Error fetching rate history:', error);
        return [];
    }
}

/**
 * Clear all rate history (admin function)
 * @returns {Promise<boolean>} Success status
 */
async function clearRateHistory() {
    try {
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from('rates_history')
            .delete()
            .neq('history_id', 0); // Delete all records

        if (error) throw error;

        await logConfigChangeEvent('Rates History Cleared', 'All rate change history was cleared from the database.', {});

        console.log('✓ Rate history cleared from database');
        return true;
    } catch (error) {
        console.error('Error clearing rate history:', error);
        return false;
    }
}
