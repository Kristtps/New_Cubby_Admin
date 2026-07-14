-- ========================================
-- SETUP ADMIN TABLE FOR LOGIN
-- ========================================
-- This ensures your admin table has all necessary columns
-- for username/password authentication
-- ========================================

-- Add password column if it doesn't exist
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Add full_name column if it doesn't exist
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Add last_login column if it doesn't exist
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Disable RLS to allow login queries
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE OR UPDATE YOUR ADMIN ACCOUNT
-- ========================================
-- Replace with your actual credentials

-- Method 1: Update existing admin
-- REPLACE with your actual credentials
UPDATE admin 
SET 
    password = 'admin12345',
    full_name = 'Bill Joe Mahele'
WHERE email = 'admin@coincubby.com';

-- Method 2: Or insert new admin if doesn't exist
INSERT INTO admin (email, password, full_name, created_at)
VALUES ('admin@coincubby.com', 'yourpassword', 'Administrator', NOW())
ON CONFLICT (email) DO UPDATE
SET 
    password = EXCLUDED.password,
    full_name = EXCLUDED.full_name;

-- ========================================
-- VERIFY YOUR ADMIN ACCOUNT
-- ========================================
SELECT id, email, password, full_name, created_at, last_login 
FROM admin;

-- ========================================
-- ✅ DONE!
-- ========================================
-- Now you can login with:
-- Email: admin@coincubby.com
-- Password: yourpassword (or whatever you set)
-- ========================================

-- ========================================
-- SECURITY NOTE
-- ========================================
-- ⚠️ This stores passwords in PLAIN TEXT which is NOT secure!
-- For production, you should:
-- 1. Hash passwords using bcrypt or similar
-- 2. Use Supabase Auth instead
-- 3. Or implement proper password hashing
--
-- But for now, this works for testing/development
-- ========================================
