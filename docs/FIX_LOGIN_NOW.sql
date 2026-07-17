-- ========================================
-- FIX LOGIN ISSUE - RUN THIS NOW
-- ========================================
-- Copy and paste this entire script into Supabase SQL Editor
-- ========================================

-- STEP 1: Check what's in your admin table
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
-- If you see NO ROWS above, run OPTION A
-- If you see rows but can't login, run OPTION B
-- ========================================

-- ========================================
-- OPTION A: CREATE NEW ADMIN ACCOUNT
-- ========================================
-- Run this if you have NO admin accounts

-- First, disable RLS
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- Create admin account
-- ⚠️ CHANGE THE EMAIL AND PASSWORD BELOW!
INSERT INTO admin (
    email,
    full_name,
    role,
    password
) VALUES (
    'admin@example.com',  -- ⚠️ CHANGE THIS
    'Admin User',         -- ⚠️ CHANGE THIS
    'Super Admin',
    'admin123'            -- ⚠️ CHANGE THIS
);

-- ========================================
-- OPTION B: RESET EXISTING ADMIN PASSWORD
-- ========================================
-- Run this if you have accounts but can't login

-- Update password for existing admin
-- ⚠️ CHANGE THE EMAIL TO YOUR ACTUAL EMAIL
UPDATE admin
SET password = 'admin123'  -- ⚠️ CHANGE THIS PASSWORD
WHERE email = 'YOUR_EMAIL@example.com';  -- ⚠️ CHANGE THIS

-- ========================================
-- STEP 2: VERIFY THE ACCOUNT
-- ========================================
-- Check if the account was created/updated
SELECT 
    id,
    email,
    full_name,
    password,
    role
FROM admin
WHERE email = 'admin@example.com';  -- ⚠️ CHANGE TO YOUR EMAIL

-- ========================================
-- RESULT INTERPRETATION:
-- ========================================
-- If you see a row with your email and password,
-- you should now be able to login!
--
-- Login credentials:
-- Email: (whatever you set above)
-- Password: (whatever you set above)
-- ========================================
