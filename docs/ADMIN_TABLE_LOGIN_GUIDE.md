# 🔐 Admin Table Login - Setup Guide

## Overview

I've changed the login system to authenticate against your **`admin` table** in Supabase (not Supabase Auth).

Now login checks:
- Email in `admin` table
- Password in `admin` table
- Direct database authentication

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Add Password Column to Admin Table

Run this SQL in Supabase:

```sql
-- Add password column
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Add full_name column (for rate history)
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Add last_login column
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Disable RLS
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;
```

### Step 2: Set Your Admin Credentials

**Replace with YOUR actual email/password/name:**

```sql
-- If you already have an admin record, update it
UPDATE admin 
SET 
    password = 'your_password_here',
    full_name = 'Your Full Name'
WHERE email = 'admin@coincubby.com';

-- Or insert new admin
INSERT INTO admin (email, password, full_name, created_at)
VALUES ('admin@coincubby.com', 'your_password_here', 'Administrator', NOW())
ON CONFLICT (email) DO UPDATE
SET 
    password = EXCLUDED.password,
    full_name = EXCLUDED.full_name;
```

**Example:**
```sql
UPDATE admin 
SET 
    password = 'mypassword123',
    full_name = 'John Doe'
WHERE email = 'admin@coincubby.com';
```

### Step 3: Try Logging In

1. Go to `pages/login.html`
2. Email: `admin@coincubby.com` (or whatever you set)
3. Password: `mypassword123` (or whatever you set)
4. Click "Sign In"
5. ✅ Should work!

---

## 📊 How It Works Now

**Old Way (Supabase Auth):**
```
Login → Supabase Auth → Check email/password → Success
```

**New Way (Admin Table):**
```
Login → Your admin table → Check email/password → Success
```

**Benefits:**
- ✅ Uses YOUR existing admin table
- ✅ No Supabase Auth needed
- ✅ Simple and direct
- ✅ Full control over credentials

---

## 🔍 Verify Your Admin Table

Run this to see your admin records:

```sql
SELECT id, email, password, full_name, created_at, last_login 
FROM admin;
```

Should show something like:
```
email: admin@coincubby.com
password: mypassword123
full_name: John Doe
```

---

## 🎯 What Changed

### Files Modified:

1. **`js/login-admin-table.js`** (NEW)
   - Custom authentication against admin table
   - Queries: `SELECT * FROM admin WHERE email = ? AND password = ?`
   - No Supabase Auth needed

2. **`pages/login.html`**
   - Now uses `login-admin-table.js` instead of `login.js`

### What Stayed the Same:

- Login UI (same look and feel)
- Form validation
- Error messages
- Dashboard redirect
- localStorage auth storage

---

## 🧪 Test Your Setup

### Test 1: Check Admin Table Structure

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin';
```

Should show:
- ✅ id
- ✅ email
- ✅ password
- ✅ full_name
- ✅ created_at
- ✅ last_login

### Test 2: Check Your Admin Record

```sql
SELECT * FROM admin WHERE email = 'admin@coincubby.com';
```

Should return your admin record with password set.

### Test 3: Try Logging In

1. Open login page
2. Enter email/password
3. Should see "Login successful! Redirecting..."
4. Should redirect to dashboard

---

## 🚨 Troubleshooting

### "Invalid email or password"

**Cause:** Email or password doesn't match database

**Solution:**
```sql
-- Check what's in your admin table
SELECT email, password FROM admin;

-- Make sure email and password match exactly what you're typing
-- Passwords are case-sensitive!
```

### "Database error"

**Cause:** Can't connect to admin table

**Solution:**
```sql
-- Make sure RLS is disabled
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;

-- Check if admin table exists
SELECT * FROM admin LIMIT 1;
```

### "Column 'password' does not exist"

**Cause:** Password column not added yet

**Solution:**
```sql
ALTER TABLE admin ADD COLUMN password VARCHAR(255);
```

### Still shows old Supabase Auth error

**Cause:** Browser cache

**Solution:**
- Clear browser cache
- Try incognito/private mode
- Hard refresh (Ctrl+Shift+R)

---

## 🔒 Security Warning

⚠️ **IMPORTANT:** This stores passwords in PLAIN TEXT in the database!

**This is NOT secure for production!**

### For Testing/Development:
- ✅ This works fine
- ✅ Simple and easy

### For Production:
- ❌ DO NOT use plain text passwords!
- ✅ Use password hashing (bcrypt, argon2)
- ✅ Or use Supabase Auth instead

**To add password hashing later**, you would need to:
1. Hash passwords before storing
2. Hash login password and compare hashes
3. Use a library like bcrypt

But for now, plain text works for testing! 🔧

---

## 📝 Admin Table Structure

After setup, your admin table should look like:

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| email | text | Login email |
| password | varchar(255) | Login password (plain text) |
| full_name | varchar(255) | Display name |
| created_at | timestamptz | Account creation |
| last_login | timestamptz | Last login time (auto-updated) |

---

## ✅ Success Checklist

- [ ] Added password column to admin table
- [ ] Added full_name column to admin table
- [ ] Set your email/password in admin table
- [ ] Disabled RLS on admin table
- [ ] Verified admin record exists (SELECT * FROM admin)
- [ ] Tried logging in
- [ ] Login worked and redirected to dashboard
- [ ] Rate history shows your full name

---

## 🎉 You're Done!

Once setup:
- ✅ Login with email/password from admin table
- ✅ No Supabase Auth needed
- ✅ Full control over credentials
- ✅ Rate history shows your full name

---

## 📞 Need Help?

Run these diagnostic queries:

```sql
-- 1. Check admin table structure
\d admin

-- 2. See all admins
SELECT * FROM admin;

-- 3. Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admin';

-- 4. Test login query manually
SELECT * FROM admin 
WHERE email = 'admin@coincubby.com' 
AND password = 'mypassword123';
```

If the last query returns a row, login should work!

---

## Summary

**What:** Login now uses your admin table directly  
**How:** Checks email + password in database  
**Why:** So you can use existing admin accounts  
**Result:** Simple, direct authentication ✅

Enjoy! 🚀
