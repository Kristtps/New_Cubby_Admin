# 🔐 Fix Login Issue - Step by Step Guide

## Problem
You're getting "Invalid email or password" error when trying to login.

## Root Cause
Either:
1. No admin account exists in database, OR
2. Admin account exists but password doesn't match

---

## ✅ SOLUTION: Follow These Steps

### Step 1: Open Supabase SQL Editor
1. Go to [supabase.com](https://supabase.com)
2. Open your CoinCubby project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Check Your Admin Accounts
Copy and paste this query:

```sql
SELECT 
    id,
    email,
    full_name,
    password,
    role,
    created_at
FROM admin
ORDER BY created_at DESC;
```

Click **"Run"** ▶️

**What you'll see:**
- ✅ **If you see rows**: You have admin accounts (go to Step 3A)
- ❌ **If you see no rows**: You need to create an account (go to Step 3B)

---

### Step 3A: If You Have Accounts (Update Password)

Run this query (⚠️ **CHANGE THE EMAIL TO YOURS**):

```sql
-- Disable security
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- Update your password
UPDATE admin
SET password = 'mypassword123'
WHERE email = 'your.email@example.com';

-- Verify it worked
SELECT email, password, full_name 
FROM admin 
WHERE email = 'your.email@example.com';
```

**Replace:**
- `your.email@example.com` → Your actual email
- `mypassword123` → Your desired password

---

### Step 3B: If You Have NO Accounts (Create One)

Run this query (⚠️ **CHANGE EMAIL, NAME, AND PASSWORD**):

```sql
-- Disable security
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- Create admin account
INSERT INTO admin (
    email,
    full_name,
    role,
    password
) VALUES (
    'admin@coincubby.com',  -- ⚠️ Your email here
    'Admin User',           -- ⚠️ Your name here
    'Super Admin',
    'password123'           -- ⚠️ Your password here
);

-- Verify it worked
SELECT email, password, full_name FROM admin;
```

---

### Step 4: Try Logging In

1. Go to your login page
2. Enter the **exact email and password** you just set
3. Click "Sign In"

**It should work now!** ✅

---

## 🚨 Still Not Working?

### Debug: Check Browser Console
1. Open your login page
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try logging in
5. Look for error messages

### Common Issues:

**Issue 1: "Database error"**
- Solution: Run `ALTER TABLE admin DISABLE ROW LEVEL SECURITY;`

**Issue 2: "Supabase client not initialized"**
- Solution: Check internet connection, refresh page

**Issue 3: Still says "Invalid email or password"**
- Solution: Copy the EXACT password from database and paste it in login

---

## 📋 Quick Test Credentials

If you just want to test quickly, create this account:

```sql
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

INSERT INTO admin (email, full_name, role, password)
VALUES ('test@test.com', 'Test Admin', 'Admin', 'test123')
ON CONFLICT (email) DO UPDATE SET password = 'test123';
```

Then login with:
- **Email**: `test@test.com`
- **Password**: `test123`

---

## ✅ Success Checklist

After running the SQL:
- [ ] I can see my admin account in the database
- [ ] The password column shows my password
- [ ] I disabled Row Level Security
- [ ] I'm using the EXACT same email and password to login
- [ ] Browser console shows no errors

---

## 🎯 What's Next?

Once you can login successfully:
1. ✅ Create your real admin account with your email
2. ✅ Delete test accounts
3. ✅ Later: Implement proper password hashing (for security)

---

Need more help? Share:
1. Screenshot of the SQL result (Step 2)
2. Screenshot of login error
3. Screenshot of browser console (F12)
