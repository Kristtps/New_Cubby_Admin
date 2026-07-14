# ✅ Login Now Uses Your Admin Table!

## What I Changed

Login now authenticates against your **`admin` table** in Supabase, NOT Supabase Auth.

### The Query:
```sql
SELECT * FROM admin 
WHERE email = 'your@email.com' 
AND password = 'yourpassword'
```

If a match is found → Login successful! ✅

---

## 🚀 Quick Setup (2 Minutes)

### Step 1: Add Password to Admin Table

Open Supabase SQL Editor and run:

```sql
-- Add password column
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Add full_name column
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Disable RLS
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;
```

### Step 2: Set Your Password

**Replace with YOUR info:**

```sql
UPDATE admin 
SET 
    password = 'yourpassword',
    full_name = 'Your Name'
WHERE email = 'admin@coincubby.com';
```

**Example:**
```sql
UPDATE admin 
SET 
    password = 'admin123',
    full_name = 'John Doe'
WHERE email = 'admin@coincubby.com';
```

### Step 3: Login!

1. Go to login page
2. Email: `admin@coincubby.com`
3. Password: `admin123` (or whatever you set)
4. Click "Sign In"
5. ✅ Done!

---

## 📁 What Changed

### New File:
- **`js/login-admin-table.js`** - Authenticates against admin table

### Modified:
- **`pages/login.html`** - Now uses `login-admin-table.js`

### Removed Dependencies:
- ❌ No Supabase Auth needed
- ❌ No external authentication
- ✅ Pure database authentication

---

## 🎯 Benefits

1. **Uses your existing admin table** - No need for separate auth system
2. **Simple** - Just email + password in database
3. **Full control** - Manage credentials directly in your table
4. **Works with rate history** - Uses full_name from admin table

---

## 🔍 Verify Setup

Run this to see your admin:

```sql
SELECT id, email, password, full_name FROM admin;
```

Should show:
- ✅ Your email
- ✅ Your password (plain text)
- ✅ Your full name

---

## ⚠️ Security Note

This stores passwords in **plain text** (not encrypted).

**For testing/development:** This is fine ✅  
**For production:** Use password hashing! ⚠️

---

## 🚨 Troubleshooting

### "Invalid email or password"
→ Run: `SELECT * FROM admin WHERE email = 'your@email.com'`  
→ Check email/password match exactly

### "Database error"  
→ Run: `ALTER TABLE admin DISABLE ROW LEVEL SECURITY;`

### Password column doesn't exist
→ Run: `ALTER TABLE admin ADD COLUMN password VARCHAR(255);`

---

## ✅ Summary

**Before:** Login used Supabase Auth (separate system)  
**Now:** Login uses your admin table (database query)  
**Result:** Simple, direct, uses your existing table ✅

**Login credentials:** Whatever is in your admin table!

---

## 📚 Full Guide

For complete details, see: `ADMIN_TABLE_LOGIN_GUIDE.md`

---

Try logging in now! 🚀
