-- ========================================
-- VERIFY AND FIX YOUR SPECIFIC ACCOUNT
-- ========================================
-- For: admin@coincubby.com
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: Check if your account exists
SELECT 
    '=== YOUR CURRENT ACCOUNT ===' as info,
    id,
    email,
    full_name,
    role,
    password,
    created_at
FROM admin
WHERE email = 'admin@coincubby.com';

-- If you see your account above, continue...
-- If you see NO ROWS, your account doesn't exist (go to Step 3)

-- ========================================
-- Step 2: Update your password to admin12345
-- ========================================

-- Disable Row Level Security (important!)
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- Update your password
UPDATE admin
SET 
    password = 'admin12345',
    updated_at = NOW()
WHERE email = 'admin@coincubby.com';

-- ========================================
-- Step 3: If account doesn't exist, create it
-- ========================================

INSERT INTO admin (
    email,
    full_name,
    role,
    password,
    created_at,
    updated_at
) VALUES (
    'admin@coincubby.com',
    'Admin User',
    'Super Admin',
    'admin12345',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE 
SET 
    password = 'admin12345',
    updated_at = NOW();

-- ========================================
-- Step 4: Verify everything is correct
-- ========================================

SELECT 
    '✅ ACCOUNT READY! Login with these credentials:' as status,
    email,
    password,
    full_name,
    role
FROM admin
WHERE email = 'admin@coincubby.com';

-- ========================================
-- EXPECTED RESULT:
-- You should see:
-- Email: admin@coincubby.com
-- Password: admin12345
-- ========================================

-- ========================================
-- Step 5: Test database connection
-- ========================================

-- Check if RLS is disabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'admin';

-- If rowsecurity = true, run this:
-- ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- ========================================
-- NOW TRY LOGGING IN!
-- Email: admin@coincubby.com
-- Password: admin12345
-- ========================================
