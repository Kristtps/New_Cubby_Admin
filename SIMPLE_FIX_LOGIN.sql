-- ========================================
-- SIMPLE FIX - Just Update Your Password
-- ========================================
-- Run each query ONE AT A TIME in Supabase
-- ========================================

-- Query 1: Disable security
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- Query 2: Check your account exists
SELECT 
    id,
    email,
    full_name,
    password,
    role
FROM admin
WHERE email = 'admin@coincubby.com';

-- If you see your account above ✅, run Query 3
-- If you see NO ROWS ❌, run Query 4 instead

-- Query 3: Update password (if account exists)
UPDATE admin
SET password = 'admin12345'
WHERE email = 'admin@coincubby.com';

-- Query 4: Insert new account (if account doesn't exist)
INSERT INTO admin (email, full_name, role, password)
VALUES ('admin@coincubby.com', 'Admin User', 'Super Admin', 'admin12345');

-- Query 5: Verify it worked
SELECT 
    '✅ YOU CAN NOW LOGIN!' as message,
    email,
    password,
    full_name
FROM admin
WHERE email = 'admin@coincubby.com';

-- ========================================
-- NOW TRY LOGGING IN!
-- Email: admin@coincubby.com
-- Password: admin12345
-- ========================================
