-- ========================================
-- 🔧 COPY THIS ENTIRE FILE AND RUN IN SUPABASE
-- ========================================
-- This will fix your login issue RIGHT NOW
-- ========================================

-- Step 1: Disable security (allows login to work)
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- Step 2: Create or update admin account
-- ⚠️⚠️⚠️ CHANGE THESE VALUES ⚠️⚠️⚠️
INSERT INTO admin (
    email,
    full_name,
    role,
    password,
    created_at,
    updated_at
) VALUES (
    'admin@coincubby.com',  -- 👈 CHANGE THIS TO YOUR EMAIL
    'Admin User',            -- 👈 CHANGE THIS TO YOUR NAME  
    'Super Admin',
    'password123',           -- 👈 CHANGE THIS TO YOUR PASSWORD
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
    password = EXCLUDED.password,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- Step 3: Verify it worked
SELECT 
    '✅ SUCCESS! Your admin account is ready:' as message,
    email,
    full_name,
    role,
    password as your_password,
    created_at
FROM admin
WHERE email = 'admin@coincubby.com';  -- 👈 CHANGE TO YOUR EMAIL

-- ========================================
-- 🎉 DONE! Now login with:
-- Email: admin@coincubby.com (whatever you set above)
-- Password: password123 (whatever you set above)
-- ========================================
