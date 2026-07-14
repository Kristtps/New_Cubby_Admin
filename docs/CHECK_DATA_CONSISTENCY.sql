-- ========================================
-- DATA CONSISTENCY CHECK FOR RENTAL DETAILS
-- ========================================
-- Run these queries in your Supabase SQL Editor to diagnose the N/A issue
-- ========================================

-- Query 1: Check all lockers and their status
SELECT 
    locker_id,
    locker_number,
    status,
    size_type_id,
    module_id
FROM lockers
ORDER BY locker_number;

-- Query 2: Check all active transactions
SELECT 
    t.transaction_id,
    t.customer_id,
    t.locker_id,
    l.locker_number,
    c.full_name as customer_name,
    c.email,
    c.contact_number,
    t.start_time,
    t.status,
    t.duration_minutes
FROM transactions t
LEFT JOIN lockers l ON l.locker_id = t.locker_id
LEFT JOIN customers c ON c.customer_id = t.customer_id
WHERE t.status = 'Active'
ORDER BY t.start_time DESC;

-- Query 3: Check payments for active transactions
SELECT 
    p.payment_id,
    p.transaction_id,
    p.amount,
    p.payment_method,
    p.payment_date,
    t.status as transaction_status,
    l.locker_number
FROM payments p
LEFT JOIN transactions t ON t.transaction_id = p.transaction_id
LEFT JOIN lockers l ON l.locker_id = t.locker_id
WHERE t.status = 'Active'
ORDER BY p.payment_date DESC;

-- Query 4: Check for data inconsistency
-- This finds lockers marked as "Occupied" but have no active transaction
SELECT 
    l.locker_id,
    l.locker_number,
    l.status as locker_status,
    COUNT(t.transaction_id) as active_transaction_count
FROM lockers l
LEFT JOIN transactions t ON t.locker_id = l.locker_id AND t.status = 'Active'
WHERE l.status = 'Occupied'
GROUP BY l.locker_id, l.locker_number, l.status
HAVING COUNT(t.transaction_id) = 0;

-- Query 5: Check specific locker (M1)
SELECT 
    l.locker_id,
    l.locker_number,
    l.status,
    l.size_type_id,
    l.module_id,
    m.name as module_name,
    t.transaction_id,
    t.status as transaction_status,
    t.customer_id,
    t.start_time,
    c.full_name,
    c.email,
    c.contact_number,
    p.amount
FROM lockers l
LEFT JOIN modules m ON m.module_id = l.module_id
LEFT JOIN transactions t ON t.locker_id = l.locker_id AND t.status = 'Active'
LEFT JOIN customers c ON c.customer_id = t.customer_id
LEFT JOIN payments p ON p.transaction_id = t.transaction_id
WHERE l.locker_number = 'M1';

-- Query 6: Get all transactions for locker M1 (any status)
SELECT 
    t.transaction_id,
    t.status,
    t.start_time,
    t.end_time,
    t.duration_minutes,
    c.full_name,
    c.email,
    p.amount
FROM transactions t
LEFT JOIN lockers l ON l.locker_id = t.locker_id
LEFT JOIN customers c ON c.customer_id = t.customer_id
LEFT JOIN payments p ON p.transaction_id = t.transaction_id
WHERE l.locker_number = 'M1'
ORDER BY t.start_time DESC
LIMIT 5;

-- ========================================
-- EXPECTED RESULTS:
-- ========================================
-- If Query 4 returns rows: You have occupied lockers without active transactions (DATA INCONSISTENCY)
-- If Query 5 shows NULL transaction_id: Locker M1 has no active transaction
-- If Query 6 is empty: Locker M1 has never been rented
-- ========================================

-- ========================================
-- FIX FOR DATA INCONSISTENCY:
-- ========================================
-- If a locker is marked "Occupied" but has no active transaction, run this:

-- Option A: Set locker back to Available if it shouldn't be occupied
-- UPDATE lockers 
-- SET status = 'Available' 
-- WHERE status = 'Occupied' 
-- AND locker_id NOT IN (
--     SELECT locker_id FROM transactions WHERE status = 'Active'
-- );

-- Option B: Create a test transaction for testing (replace UUIDs with actual values)
-- First, get a customer_id:
-- SELECT customer_id FROM customers LIMIT 1;

-- Then create a transaction (replace the UUIDs and IDs):
-- INSERT INTO transactions (customer_id, rate_id, locker_id, start_time, status)
-- VALUES (
--     'YOUR_CUSTOMER_UUID',  -- from customers table
--     1,                      -- rate_id (1=small, 2=medium, 3=large)
--     (SELECT locker_id FROM lockers WHERE locker_number = 'M1'),
--     NOW(),
--     'Active'
-- );

-- Then create a payment for it:
-- INSERT INTO payments (transaction_id, amount, payment_method)
-- VALUES (
--     (SELECT transaction_id FROM transactions WHERE locker_id = (SELECT locker_id FROM lockers WHERE locker_number = 'M1') AND status = 'Active'),
--     50.00,
--     'Cash'
-- );
