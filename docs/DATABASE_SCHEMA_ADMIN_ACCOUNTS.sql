-- ========================================
-- ADMIN ACCOUNTS TABLE SCHEMA
-- ========================================
-- This table stores admin user accounts for the CoinCubby Admin Panel
-- Links with Supabase Auth for authentication
-- Tracks who makes changes to rates and system settings
-- ========================================

-- Create admin accounts table
CREATE TABLE IF NOT EXISTS admin_accounts (
    admin_id SERIAL PRIMARY KEY,
    auth_user_id UUID UNIQUE, -- Links to Supabase auth.users.id (optional)
    
    -- Admin Information
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Admin',
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_by VARCHAR(255),
    notes TEXT
);

-- Create indexes for faster queries
CREATE INDEX idx_admin_accounts_email ON admin_accounts(email);
CREATE INDEX idx_admin_accounts_auth_user_id ON admin_accounts(auth_user_id);
CREATE INDEX idx_admin_accounts_is_active ON admin_accounts(is_active);

-- Add comments for documentation
COMMENT ON TABLE admin_accounts IS 'Admin user accounts for CoinCubby Admin Panel';
COMMENT ON COLUMN admin_accounts.admin_id IS 'Unique identifier for each admin account';
COMMENT ON COLUMN admin_accounts.auth_user_id IS 'Links to Supabase auth.users.id (NULL for hardcoded accounts)';
COMMENT ON COLUMN admin_accounts.email IS 'Admin email address (used for login)';
COMMENT ON COLUMN admin_accounts.full_name IS 'Admin full name (displayed in UI)';
COMMENT ON COLUMN admin_accounts.role IS 'Admin role (Admin, Super Admin, etc.)';
COMMENT ON COLUMN admin_accounts.is_active IS 'Whether the account is active';
COMMENT ON COLUMN admin_accounts.last_login IS 'Last login timestamp';

-- Disable RLS for admin access (or configure policies if needed)
ALTER TABLE admin_accounts DISABLE ROW LEVEL SECURITY;

-- ========================================
-- INSERT DEFAULT ADMIN ACCOUNTS
-- ========================================
-- These match your Supabase Auth users
-- Add your admin accounts here

-- Example: Insert admin accounts
-- Replace with your actual admin emails from Supabase Auth

INSERT INTO admin_accounts (email, full_name, role, created_by, notes)
VALUES 
    ('admin@coincubby.com', 'System Administrator', 'Super Admin', 'System', 'Primary admin account'),
    ('manager@coincubby.com', 'Store Manager', 'Admin', 'System', 'Store manager account')
ON CONFLICT (email) DO UPDATE 
SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- ========================================
-- FUNCTION TO AUTO-UPDATE updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_admin_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_admin_accounts_updated_at
BEFORE UPDATE ON admin_accounts
FOR EACH ROW
EXECUTE FUNCTION update_admin_accounts_updated_at();

-- ========================================
-- FUNCTION TO UPDATE last_login
-- ========================================
-- This function can be called from your app after successful login
CREATE OR REPLACE FUNCTION update_admin_last_login(admin_email VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE admin_accounts
    SET last_login = NOW()
    WHERE email = admin_email AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- HELPER QUERIES
-- ========================================

-- View all admin accounts
-- SELECT admin_id, email, full_name, role, is_active, last_login FROM admin_accounts ORDER BY created_at;

-- Get active admins only
-- SELECT * FROM admin_accounts WHERE is_active = true ORDER BY full_name;

-- Find admin by email
-- SELECT * FROM admin_accounts WHERE email = 'admin@coincubby.com';

-- Update admin's last login
-- SELECT update_admin_last_login('admin@coincubby.com');

-- Deactivate an admin account
-- UPDATE admin_accounts SET is_active = false WHERE email = 'user@example.com';

-- ========================================
-- SYNC WITH SUPABASE AUTH USERS
-- ========================================
-- Run this to automatically create admin accounts for all Supabase Auth users
-- (excluding customers)

-- This will create admin_accounts entries for all auth users who are NOT in the customers table
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
-- NOTES
-- ========================================
-- 1. After creating this table, run the sync query above to populate it with your existing Supabase Auth users
-- 2. Update your login.js to call update_admin_last_login() after successful login
-- 3. The rates_history table already has changed_by VARCHAR(255) which will store the admin's full_name
-- 4. Make sure to add all your admin users to Supabase Auth first, then run the sync query

