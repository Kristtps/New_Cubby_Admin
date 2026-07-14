# 🚨 Login Troubleshooting Guide

## Can't Log In to Admin Panel?

### Quick Diagnostic Steps

#### Step 1: Use the Debug Tool
1. Open **`test-login-debug.html`** in your browser
2. Click **"Test Supabase Connection"**
3. Click **"Check Admin Table"**
4. Enter your email/password and click **"Test Login"**
5. Read the error messages - they will tell you exactly what's wrong

---

## Common Login Issues & Solutions

### Issue 1: "Invalid login credentials"

**Cause:** Email/password doesn't exist in Supabase Auth

**Solution:**
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Check if your email is listed there
3. If not, click **"Add user"** → Create with email + password
4. Make sure email confirmation is disabled (or confirm the email)

**Test:** Try logging in with that exact email/password

---

### Issue 2: "Access Denied: This account is registered as a Customer"

**Cause:** The email exists in the `customers` table

**Solution:**
```sql
-- Check if email is in customers table
SELECT * FROM customers WHERE email = 'admin@coincubby.com';

-- If found, delete it (or use a different email for admin)
DELETE FROM customers WHERE email = 'admin@coincubby.com';
```

**Alternative:** Create a new admin account with a different email

---

### Issue 3: Blank page or infinite loading

**Cause:** JavaScript errors preventing login

**Solution:**
1. Open browser console (F12)
2. Look for red error messages
3. Common errors:

**Error: "Cannot read property 'fetchAdminByEmail' of undefined"**
```
Fix: I already updated login.js to handle this gracefully
Just refresh the page and try again
```

**Error: "Supabase client not initialized"**
```
Fix: Check internet connection
Check Supabase credentials in js/supabase-client.js
```

**Error: "Failed to fetch"**
```
Fix: Check Supabase URL and API key in js/supabase-client.js
Make sure Supabase project is not paused
```

---

### Issue 4: "Email not confirmed"

**Cause:** Supabase requires email confirmation

**Solution:**
1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. Find **"Email Confirmations"**
3. Disable confirmation requirement
4. Or confirm the email from the verification link

---

### Issue 5: Login works but redirects to login again

**Cause:** Authentication state not being saved

**Solution:**
1. Check browser console for errors
2. Check if localStorage is enabled in your browser
3. Try clearing browser cache and cookies
4. Try a different browser

---

## Step-by-Step: Create Admin Account in Supabase

If you don't have an admin account yet:

### Method 1: Using Supabase Dashboard

1. **Go to Supabase Dashboard**
2. **Click "Authentication"** in left sidebar
3. **Click "Users"** tab
4. **Click "Add user"** button
5. **Fill in:**
   - Email: `admin@coincubby.com` (or your email)
   - Password: `yourpassword123`
   - Auto Confirm: **Enable** (turn on)
6. **Click "Create user"**
7. **Done!** Try logging in with these credentials

### Method 2: Using SQL

```sql
-- This creates a user in Supabase Auth
-- Note: You need to do this in Supabase Dashboard UI, not SQL
```

---

## Testing Checklist

After fixing issues, verify:

- [ ] Can access login page
- [ ] Supabase connection works (test-login-debug.html)
- [ ] Admin table exists and has records
- [ ] User exists in Supabase Auth
- [ ] User does NOT exist in customers table
- [ ] Can submit login form
- [ ] No JavaScript errors in console
- [ ] Login succeeds and redirects to dashboard

---

## Emergency Fix: Bypass Admin Checks

If you just want to get in quickly, you can temporarily comment out the admin checks:

### In `js/login.js`, around line 143:

```javascript
// TEMPORARY: Comment out admin table checks
/*
try {
    if (typeof dbOps !== 'undefined' && dbOps.updateAdminLastLogin) {
        await dbOps.updateAdminLastLogin(data.user.email);
    }
    if (typeof dbOps !== 'undefined' && dbOps.fetchAdminByEmail) {
        const adminAccount = await dbOps.fetchAdminByEmail(data.user.email);
        if (adminAccount && adminAccount.full_name) {
            adminFullName = adminAccount.full_name;
        }
    }
} catch (adminErr) {
    console.warn('Could not update admin info:', adminErr);
}
*/
```

**Warning:** This is temporary! The rate history won't show proper names until you set up the admin table.

---

## Still Can't Login?

### Check These:

1. **Supabase Project Status**
   - Is your project active/not paused?
   - Check Supabase dashboard for any warnings

2. **Browser Issues**
   - Try incognito/private mode
   - Try different browser (Chrome, Firefox, Edge)
   - Clear browser cache completely

3. **Network Issues**
   - Check internet connection
   - Try disabling VPN/proxy
   - Check if Supabase is accessible: https://status.supabase.com

4. **Credentials**
   - Double-check email spelling
   - Double-check password (case-sensitive!)
   - Try resetting password in Supabase Auth

---

## Get More Help

1. **Run diagnostic tool:** `test-login-debug.html`
2. **Check browser console:** F12 → Console (copy error messages)
3. **Check Supabase logs:** Dashboard → Logs
4. **Check network tab:** F12 → Network (look for failed requests)

Take screenshots of any errors and we can troubleshoot further!

---

## Quick Commands

### Check if admin account exists in Auth:
Go to: Supabase Dashboard → Authentication → Users

### Check if email is blocked as customer:
```sql
SELECT * FROM customers WHERE email = 'your@email.com';
```

### Check admin table:
```sql
SELECT * FROM admin;
```

### Test Supabase connection:
Open browser console and run:
```javascript
window.supabase.from('admin').select('count')
```

Should return data, not an error.

---

## Success Indicators

When login is working properly, you should see:

**In Browser Console:**
```
✓ Supabase Client initialized and ready
✓ User authenticated: admin@coincubby.com
Login successful! Redirecting...
```

**In UI:**
- Green success message
- Redirect to dashboard after 1-2 seconds
- No error messages

If you see these, login is working! 🎉
