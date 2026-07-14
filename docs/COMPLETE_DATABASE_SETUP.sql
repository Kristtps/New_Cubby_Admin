-- ========================================
-- COMPLETE DATABASE SETUP FOR COINCUBBY
-- ========================================
-- This script sets up everything needed for:
-- 1. Admin Accounts System
-- 2. Rates History Tracking
-- 3. Links admin names to rate changes
-- ========================================
-- Run this entire script in your Supabase SQL Editor
-- ========================================

-- ========================================
-- PART 1: ADMIN ACCOUNTS TABLE
-- ========================================

-- Create admin accounts table
CREATE TABLE IF NOT EXISTS admin_accounts (
    admin_id SERIAL PRIMARY KEY,
    auth_user_id UUID UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_accounts_email ON admin_accounts(email);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_auth_user_id ON admin_accounts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_is_active ON admin_accounts(is_active);

-- Disable RLS for admin access
ALTER TABLE admin_accounts DISABLE ROW LEVEL SECURITY;

-- ========================================
-- PART 2: RATES HISTORY TABLE
-- ========================================

-- Create rates history table
CREATE TABLE IF NOT EXISTS rates_history (
    history_id SERIAL PRIMARY KEY,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by VARCHAR(255) NOT NULL,
    small_rate DECIMAL(10, 2) NOT NULL,
    medium_rate DECIMAL(10, 2) NOT NULL,
    large_rate DECIMAL(10, 2) NOT NULL,
    previous_small DECIMAL(10, 2),
    previous_medium DECIMAL(10, 2),
    previous_large DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rates_history_changed_at ON rates_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_rates_history_changed_by ON rates_history(changed_by);

-- Disable RLS for admin access
ALTER TABLE rates_history DISABLE ROW LEVEL SECURITY;

-- ========================================
-- PART 3: AUTO-UPDATE FUNCTIONS
-- ========================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_admin_accounts_updated_at ON admin_accounts;
CREATE TRIGGER trigger_admin_accounts_updated_at
BEFORE UPDATE ON admin_accounts
FOR EACH ROW
EXECUTE FUNCTION update_admin_accounts_updated_at();

-- Function to update last_login
CREATE OR REPLACE FUNCTION update_admin_last_login(admin_email VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE admin_accounts
    SET last_login = NOW()
    WHERE email = admin_email AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PART 4: POPULATE DEFAULT ADMIN ACCOUNTS
-- ========================================

-- Option 1: Add specific admin accounts
-- EDIT THIS SECTION with your actual admin details
INSERT INTO admin_accounts (email, full_name, role, created_by, notes)
VALUES 
    ('admin@coincubby.com', 'System Administrator', 'Super Admin', 'System', 'Primary admin account'),
    ('manager@coincubby.com', 'Store Manager', 'Admin', 'System', 'Store manager account')
ON CONFLICT (email) DO UPDATE 
SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Option 2: Auto-sync from Supabase Auth (run this if you have existing auth users)
-- This will create admin accounts for all Supabase Auth users who are NOT customers
INSERT INTO admin_accounts (auth_user_id, email, full_name, created_by)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
    'Auto-Sync'
FROM auth.users au
LEFT JOIN customers c ON c.email = au.email
WHERE c.customer_id IS NULL  -- Only users who are NOT customers
  AND NOT EXISTS (
      SELECT 1 FROM admin_accounts aa WHERE aa.email = au.email
  )
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- PART 5: VERIFICATION QUERIES
-- ========================================

-- View all admin accounts
SELECT admin_id, email, full_name, role, is_active, last_login, created_at 
FROM admin_accounts 
ORDER BY created_at;

-- View rates history (will be empty until first rate change)
SELECT history_id, changed_by, small_rate, medium_rate, large_rate, changed_at
FROM rates_history
ORDER BY changed_at DESC
LIMIT 10;

-- ========================================
-- SETUP COMPLETE!
-- ========================================
-- Next steps:
-- 1. Verify admin_accounts table has your admin users
-- 2. Update the INSERT statement above with your actual admin details if needed
-- 3. Login to your admin panel
-- 4. Make a rate change to test the history tracking
-- 5. Check that rate history shows your full name (not email)
-- ========================================

