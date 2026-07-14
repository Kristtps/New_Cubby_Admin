# Admin Accounts Setup Guide

## Overview
This guide helps you set up the admin accounts system so that rate changes and system logs show the correct admin names (not just emails).

## 🎯 What This Solves
- Rate history will show **"John Doe"** instead of **"admin@coincubby.com"**
- Tracks which admin made changes
- Links your Supabase Auth users to admin profiles
- Stores admin information (full name, role, last login, etc.)

---

## 📋 Step 1: Create Admin Accounts Table

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your CoinCubby project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New Query"

3. **Run the SQL Script**
   - Open the file: `docs/DATABASE_SCHEMA_ADMIN_ACCOUNTS.sql`
   - Copy the ENTIRE contents
   - Paste into Supabase SQL Editor
   - Click **"Run"** (or press Ctrl+Enter)

4. **Verify Success**
   - Should see: `Success. No rows returned` (this is good!)
   - Go to "Table Editor" → You should now see `admin_accounts` table

---

## 📝 Step 2: Add Your Admin Users

### Option A: Automatic Sync (Recommended)

If you already have users in Supabase Auth, run this query to auto-create admin accounts:

```sql
-- Auto-sync: Create admin accounts for all Supabase Auth users (excluding customers)
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
```

### Option B: Manual Entry

Add your admin accounts manually with custom names and roles:

```sql
-- Replace with your actual admin details
INSERT INTO admin_accounts (email, full_name, role, created_by, notes)
VALUES 
    ('admin@coincubby.com', 'John Doe', 'Super Admin', 'System', 'Primary administrator'),
    ('manager@coincubby.com', 'Jane Smith', 'Manager', 'System', 'Store manager'),
    ('your.email@example.com', 'Your Full Name', 'Admin', 'System', 'Your description')
ON CONFLICT (email) DO UPDATE 
SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();
```

---

## 🔍 Step 3: Verify the Data

Run this query to see your admin accounts:

```sql
SELECT admin_id, email, full_name, role, is_active, last_login, created_at 
FROM admin_accounts 
ORDER BY created_at;
```

You should see something like:

| admin_id | email | full_name | role | is_active | last_login |
|----------|-------|-----------|------|-----------|------------|
| 1 | admin@coincubby.com | John Doe | Super Admin | true | null |
| 2 | manager@coincubby.com | Jane Smith | Manager | true | null |

---

## 🧪 Step 4: Test the Integration

### Test 1: Login and Check Name Storage

1. **Login to your admin panel** with your admin account
2. **Open browser console** (F12)
3. **Check stored auth data:**
   ```javascript
   JSON.parse(localStorage.getItem('coincubby_auth'))
   ```
4. **Should show:**
   ```json
   {
     "isAuthenticated": true,
     "email": "admin@coincubby.com",
     "name": "John Doe",  // <-- Should show full name, not email
     "loginTime": "2024-01-15T10:30:00.000Z",
     "rememberMe": false
   }
   ```

### Test 2: Check Last Login Update

After logging in, run this query in Supabase:

```sql
SELECT email, full_name, last_login 
FROM admin_accounts 
WHERE email = 'admin@coincubby.com';
```

The `last_login` field should now have a timestamp.

### Test 3: Make a Rate Change

1. **Go to Rates page**
2. **Click "Edit Rates"**
3. **Change any rate** (e.g., Small from 10 to 11)
4. **Click "Save Changes"**
5. **Check the Rate History** section below
6. **Should show:** "John Doe" (or your full name) instead of email

### Test 4: Verify in Database

```sql
SELECT changed_by, small_rate, medium_rate, large_rate, changed_at
FROM rates_history
ORDER BY changed_at DESC
LIMIT 5;
```

The `changed_by` column should show full names like "John Doe" instead of emails.

---

## 📊 Admin Accounts Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `admin_id` | SERIAL | Primary key |
| `auth_user_id` | UUID | Links to Supabase auth.users.id |
| `email` | VARCHAR(255) | Admin email (unique) |
| `full_name` | VARCHAR(255) | Display name (e.g., "John Doe") |
| `role` | VARCHAR(50) | Admin role (Admin, Super Admin, etc.) |
| `is_active` | BOOLEAN | Account status |
| `created_at` | TIMESTAMP | Account creation date |
| `updated_at` | TIMESTAMP | Last update |
| `last_login` | TIMESTAMP | Last login time |
| `created_by` | VARCHAR(255) | Who created this account |
| `notes` | TEXT | Additional notes |

---

## 🛠️ Common Operations

### Update an admin's full name:
```sql
UPDATE admin_accounts 
SET full_name = 'New Name', updated_at = NOW()
WHERE email = 'admin@coincubby.com';
```

### Change an admin's role:
```sql
UPDATE admin_accounts 
SET role = 'Super Admin', updated_at = NOW()
WHERE email = 'manager@coincubby.com';
```

### Deactivate an admin account:
```sql
UPDATE admin_accounts 
SET is_active = false, updated_at = NOW()
WHERE email = 'old.admin@example.com';
```

### Reactivate an admin account:
```sql
UPDATE admin_accounts 
SET is_active = true, updated_at = NOW()
WHERE email = 'admin@coincubby.com';
```

### View all active admins:
```sql
SELECT email, full_name, role, last_login 
FROM admin_accounts 
WHERE is_active = true 
ORDER BY full_name;
```

### View recent logins:
```sql
SELECT email, full_name, last_login 
FROM admin_accounts 
WHERE last_login IS NOT NULL 
ORDER BY last_login DESC 
LIMIT 10;
```

---

## 🔐 Security Notes

1. **Row Level Security (RLS)** is disabled for admin_accounts table by default
   - This allows your admin panel to access it freely
   - Only enable RLS if you need strict access control

2. **Admin accounts are separate from Supabase Auth**
   - Supabase Auth handles authentication (login/logout)
   - admin_accounts table stores profile information

3. **Customers vs Admins**
   - Your login system already prevents customers from accessing admin panel
   - admin_accounts only stores admin user profiles

---

## 🚨 Troubleshooting

### Problem: Name still shows as email
**Solution:** 
1. Check if admin account exists:
   ```sql
   SELECT * FROM admin_accounts WHERE email = 'your@email.com';
   ```
2. If not found, add it manually (see Step 2)
3. Clear browser cache and login again

### Problem: last_login not updating
**Solution:**
1. Check browser console for errors
2. Verify db-operations.js is loaded in login.html
3. Check if `updateAdminLastLogin` function exists:
   ```javascript
   typeof dbOps.updateAdminLastLogin
   // Should return: "function"
   ```

### Problem: Rate history shows "Admin" instead of name
**Solution:**
1. Admin account might not exist in database
2. Run the auto-sync query from Step 2
3. Or manually add your admin account

---

## ✅ Completion Checklist

- [ ] Created admin_accounts table in Supabase
- [ ] Added admin accounts (auto-sync or manual)
- [ ] Verified admin accounts in Table Editor
- [ ] Logged in and checked localStorage auth data
- [ ] Confirmed full name is stored (not just email)
- [ ] Made a rate change
- [ ] Verified rate history shows full name
- [ ] Checked last_login timestamp updates

Once all items are checked, your admin accounts system is fully set up! 🎉

---

## 📞 Need Help?

If you encounter issues:

1. **Check browser console** (F12) for JavaScript errors
2. **Check Supabase logs** (Dashboard → Logs)
3. **Verify script loading order** in login.html and rates.html
4. **Run diagnostic queries** above to check data

---

## 🔄 Future Enhancements

Possible improvements you could add:

- Profile page to edit admin account details
- Role-based permissions (restrict certain actions by role)
- Admin activity dashboard
- Password change functionality
- Two-factor authentication
- Admin account approval workflow
