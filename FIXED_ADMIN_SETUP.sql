-- ========================================
-- CORRECTED: SETUP ADMIN TABLE FOR LOGIN
-- ========================================
-- Copy and run this ENTIRE script in Supabase SQL Editor
-- ========================================

-- Step 1: Add columns if they don't exist
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Step 2: Disable RLS
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- Step 3: Set your credentials
-- IMPORTANT: Replace 'admin12345' with YOUR password
-- IMPORTANT: Replace 'Bill Joe Mahele' with YOUR full name
-- IMPORTANT: Replace 'admin@coincubby.com' with YOUR email if different

UPDATE admin 
SET 
    password = 'admin12345',
    full_name = 'Bill Joe Mahele'
WHERE email = 'admin@coincubby.com';

-- Step 4: Verify it worked
SELECT id, email, password, full_name, created_at, last_login 
FROM admin;

-- ========================================
-- ✅ DONE!
-- ========================================
-- Now you can login with:
-- Email: admin@coincubby.com
-- Password: admin12345 (or whatever you set above)
-- ========================================
