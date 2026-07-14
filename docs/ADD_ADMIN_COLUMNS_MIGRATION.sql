-- ========================================
-- MIGRATION: ADD COLUMNS TO EXISTING ADMIN TABLE
-- ========================================
-- This script adds necessary columns to your existing admin table
-- Safe to run - uses "IF NOT EXISTS" so won't break if columns already exist
-- ========================================

-- Add full_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='admin' AND column_name='full_name') THEN
        ALTER TABLE admin ADD COLUMN full_name VARCHAR(255);
        RAISE NOTICE 'Added column: full_name';
    ELSE
        RAISE NOTICE 'Column full_name already exists';
    END IF;
END $$;

-- Add role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='admin' AND column_name='role') THEN
        ALTER TABLE admin ADD COLUMN role VARCHAR(50) DEFAULT 'Admin';
        RAISE NOTICE 'Added column: role';
    ELSE
        RAISE NOTICE 'Column role already exists';
    END IF;
END $$;

-- Add last_login column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='admin' AND column_name='last_login') THEN
        ALTER TABLE admin ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added column: last_login';
    ELSE
        RAISE NOTICE 'Column last_login already exists';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='admin' AND column_name='updated_at') THEN
        ALTER TABLE admin ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added column: updated_at';
    ELSE
        RAISE NOTICE 'Column updated_at already exists';
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='admin' AND column_name='is_active') THEN
        ALTER TABLE admin ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added column: is_active';
    ELSE
        RAISE NOTICE 'Column is_active already exists';
    END IF;
END $$;

-- ========================================
-- UPDATE EXISTING RECORDS
-- ========================================
-- Populate full_name from email if it's empty
UPDATE admin 
SET full_name = split_part(email, '@', 1)
WHERE full_name IS NULL OR full_name = '';

-- Set default role if empty
UPDATE admin 
SET role = 'Admin'
WHERE role IS NULL OR role = '';

-- Set all existing admins as active
UPDATE admin 
SET is_active = true
WHERE is_active IS NULL;

-- ========================================
-- CREATE INDEXES
-- ========================================
-- Create indexes for better performance (safe - won't error if exists)
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);
CREATE INDEX IF NOT EXISTS idx_admin_is_active ON admin(is_active);

-- ========================================
-- DISABLE RLS (if needed)
-- ========================================
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICATION
-- ========================================
-- View your admin table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'admin'
ORDER BY ordinal_position;

-- View your admin records
SELECT * FROM admin;

-- ========================================
-- SUCCESS!
-- ========================================
-- Your existing admin table now has:
-- - full_name (for display in rate history)
-- - role (Admin, Super Admin, etc.)
-- - last_login (tracks last login time)
-- - updated_at (tracks changes)
-- - is_active (enable/disable accounts)
-- ========================================
