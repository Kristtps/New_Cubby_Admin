-- ========================================
-- COMPLETE SETUP - COPY AND RUN THIS ENTIRE SCRIPT
-- ========================================
-- This sets up everything needed for:
-- 1. Admin names in rate history
-- 2. Last login tracking
-- 3. Admin roles
-- ========================================

-- ========================================
-- STEP 1: UPDATE ADMIN TABLE
-- ========================================

-- Add full_name column
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Add role column
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Admin';

-- Add last_login column
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add updated_at column
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set default full_name from email
UPDATE admin 
SET full_name = split_part(email, '@', 1)
WHERE full_name IS NULL OR full_name = '';

-- Set default role
UPDATE admin 
SET role = 'Admin'
WHERE role IS NULL OR role = '';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);
CREATE INDEX IF NOT EXISTS idx_admin_last_login ON admin(last_login);

-- Disable RLS
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: UPDATE YOUR ADMIN FULL NAME
-- ========================================
-- ⚠️ IMPORTANT: EDIT THIS LINE WITH YOUR ACTUAL NAME AND EMAIL

UPDATE admin 
SET full_name = 'Your Full Name Here', role = 'Super Admin'
WHERE email = 'admin@coincubby.com';

-- If you have more admins, add them here:
-- UPDATE admin SET full_name = 'Manager Name', role = 'Manager' WHERE email = 'manager@example.com';

-- ========================================
-- STEP 3: CREATE RATES HISTORY TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS rates_history (
    history_id SERIAL PRIMARY KEY,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    changed_by VARCHAR(255) NOT NULL,
    small_rate DECIMAL(10, 2) NOT NULL,
    medium_rate DECIMAL(10, 2) NOT NULL,
    large_rate DECIMAL(10, 2) NOT NULL,
    previous_small DECIMAL(10, 2),
    previous_medium DECIMAL(10, 2),
    previous_large DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rates_history_changed_at 
ON rates_history(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_rates_history_changed_by 
ON rates_history(changed_by);

-- Disable RLS
ALTER TABLE rates_history DISABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICATION
-- ========================================

-- View your admin records
SELECT 
    id, 
    email, 
    full_name, 
    role, 
    last_login, 
    created_at 
FROM admin
ORDER BY created_at;

-- Check rates_history table exists (will be empty until first rate change)
SELECT COUNT(*) as total_history_records FROM rates_history;

-- ========================================
-- ✅ SETUP COMPLETE!
-- ========================================
-- What to do next:
-- 1. Verify your full_name is set correctly (see results above)
-- 2. Login to your admin panel
-- 3. Go to Rates page
-- 4. Make a rate change
-- 5. Check Rate History - should show your full name!
-- ========================================
