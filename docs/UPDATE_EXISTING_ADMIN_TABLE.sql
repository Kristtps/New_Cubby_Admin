-- ========================================
-- UPDATE EXISTING ADMIN TABLE
-- ========================================
-- This adds columns to your existing admin table
-- Safe to run multiple times - checks if columns exist first
-- ========================================

-- Add full_name column (this will show in rate history instead of email)
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Add role column (Admin, Super Admin, Manager, etc.)
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Admin';

-- Add last_login timestamp (auto-updated when user logs in)
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add updated_at timestamp (tracks when record was modified)
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ========================================
-- POPULATE FULL_NAME FROM EMAIL
-- ========================================
-- Set full_name to email username if not already set
UPDATE admin 
SET full_name = split_part(email, '@', 1)
WHERE full_name IS NULL OR full_name = '';

-- ========================================
-- SET DEFAULT ROLE
-- ========================================
UPDATE admin 
SET role = 'Admin'
WHERE role IS NULL OR role = '';

-- ========================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);
CREATE INDEX IF NOT EXISTS idx_admin_last_login ON admin(last_login);

-- ========================================
-- DISABLE RLS (ROW LEVEL SECURITY)
-- ========================================
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICATION - View your updated table
-- ========================================
SELECT * FROM admin;

-- ========================================
-- NOW UPDATE YOUR ADMIN FULL NAMES
-- ========================================
-- Replace 'admin@coincubby.com' with your actual email
-- Replace 'Your Full Name' with the name you want to show in rate history

UPDATE admin 
SET full_name = 'Your Full Name Here', role = 'Super Admin'
WHERE email = 'admin@coincubby.com';

-- Add more UPDATE statements for other admins if you have them:
-- UPDATE admin SET full_name = 'Manager Name', role = 'Manager' WHERE email = 'manager@example.com';

-- ========================================
-- SUCCESS!
-- ========================================
-- Your admin table now has:
-- ✓ id (existing)
-- ✓ email (existing)
-- ✓ created_at (existing)
-- ✓ full_name (NEW - displays in rate history)
-- ✓ role (NEW - Admin/Super Admin/Manager)
-- ✓ last_login (NEW - tracks last login)
-- ✓ updated_at (NEW - tracks changes)
-- ========================================
