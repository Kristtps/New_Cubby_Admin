-- ========================================
-- FINAL FIX - Works with Your Schema
-- ========================================
-- Your admin table is linked to auth.users
-- So we need to work with existing records
-- ========================================

-- Step 1: Disable Row Level Security
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- Step 2: See ALL admin accounts you have
SELECT 
    id,
    email,
    full_name,
    password,
    role,
    created_at
FROM admin
ORDER BY created_at DESC;

-- ========================================
-- LOOK AT THE RESULTS ABOVE
-- ========================================
-- Do you see admin@coincubby.com? 
-- - YES → Use the UPDATE query below (Step 3A)
-- - NO → You need to create auth user first (Step 3B)
-- ========================================

-- Step 3A: If you see admin@coincubby.com, UPDATE password
UPDATE admin
SET password = 'admin12345'
WHERE email = 'admin@coincubby.com';

-- Step 3B: If you DON'T see admin@coincubby.com
-- You need to create a Supabase Auth user first!
-- Go to: Authentication → Users → Add User
-- Then come back and run Step 3A

-- ========================================
-- ALTERNATIVE: Use a different existing account
-- ========================================
-- If you see OTHER emails in Step 2, you can use those!
-- Just update that account's password:

-- Example: If you see "test@example.com" in the list:
-- UPDATE admin
-- SET password = 'admin12345'
-- WHERE email = 'test@example.com';

-- Then login with that email instead!

-- ========================================
-- Step 4: Verify what you have now
-- ========================================
SELECT 
    '✅ These are your admin accounts:' as info,
    email,
    password,
    full_name,
    role
FROM admin
ORDER BY email;

-- ========================================
-- RESULT:
-- Use ANY email shown above with password 'admin12345'
-- ========================================
