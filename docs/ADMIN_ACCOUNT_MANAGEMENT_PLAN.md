# 🔐 Admin Account Management System - Implementation Plan

## Overview
Complete admin account management system with forgot password, email verification, and security features.

---

## 🎯 Recommended Features

### 1. **Forgot Password Flow**
**User Flow:**
1. User clicks "Forgot Password?" on login page
2. User enters their email address
3. System sends password reset email via Supabase Auth
4. User clicks link in email
5. User enters new password
6. User is redirected to login page with success message

**Implementation:**
- Use Supabase Auth built-in password reset
- No need to build custom email service
- Secure and reliable

### 2. **Email Verification** (Optional but Recommended)
**User Flow:**
1. When admin account is created, send verification email
2. Admin must verify email before first login
3. Unverified admins cannot access dashboard

### 3. **Session Management**
- Auto logout after 30 minutes of inactivity
- "Remember me" extends session to 30 days
- Multi-device login tracking
- Logout from all devices option

### 4. **Password Requirements**
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- Password strength indicator on change password page
- Prevent password reuse (last 3 passwords)

### 5. **Two-Factor Authentication (2FA)** (Future Enhancement)
- Optional 2FA via email or authenticator app
- Required for Super Admin role
- Backup codes for account recovery

### 6. **Admin Account Management Page**
**Features:**
- View all admin accounts
- Add new admin
- Edit admin details (name, role, permissions)
- Deactivate/reactivate accounts
- Delete accounts (with confirmation)
- View last login time
- Audit log of admin actions

---

## 📋 Implementation Priority

### Phase 1: Essential (Implement First) ✅
1. ✅ Forgot Password Flow
2. ✅ Change Password in Profile
3. ✅ Session Timeout (30 min)
4. ✅ Password Requirements

### Phase 2: Enhanced Security (Next)
5. Email Verification
6. Account Lockout (after 5 failed attempts)
7. Activity Log per admin

### Phase 3: Advanced (Later)
8. Two-Factor Authentication
9. Admin Management Dashboard
10. Role-based permissions

---

## 🛠️ Technical Implementation

### Database Schema (Already Exists in `admin` table)
```sql
-- Your existing admin table structure:
- id (uuid)
- email (text)
- full_name (varchar)
- role (varchar)
- last_login (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
- password (varchar) -- hashed
```

### Additional Tables Needed

#### 1. Password Reset Tokens (Use Supabase Auth)
Supabase handles this automatically - no custom table needed!

#### 2. Admin Sessions (Optional - for device tracking)
```sql
CREATE TABLE admin_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin(id),
    device_info TEXT,
    ip_address VARCHAR,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. Password History (Prevent reuse)
```sql
CREATE TABLE admin_password_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin(id),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📄 Files to Create/Modify

### New Pages
1. `pages/forgot-password.html` - Request password reset
2. `pages/reset-password.html` - Enter new password
3. `pages/change-password.html` - Change password (in profile)
4. `pages/admin-accounts.html` - Manage all admins (Super Admin only)

### New JavaScript Files
1. `js/forgot-password.js` - Handle forgot password logic
2. `js/reset-password.js` - Handle password reset
3. `js/change-password.js` - Handle password change
4. `js/admin-accounts.js` - Admin management CRUD
5. `js/password-validation.js` - Password strength checker
6. `js/session-manager.js` - Handle session timeout

### Modified Files
1. `pages/login.html` - Link to forgot password
2. `pages/profile.html` - Add change password button
3. `js/login-admin-table.js` - Add failed login tracking

---

## 🔒 Security Best Practices

### Password Hashing
- **Use Supabase Auth** for password management (already handles hashing)
- Never store plain text passwords
- Use bcrypt with salt rounds of 10+

### Session Security
- Use HTTP-only cookies (Supabase handles this)
- CSRF protection
- Secure session storage
- Regular session cleanup

### Email Security
- Use Supabase's built-in email service
- Rate limit password reset requests (max 3 per hour)
- Reset tokens expire after 1 hour
- One-time use tokens

### Audit Logging
- Log all login attempts (success and failure)
- Log password changes
- Log admin account modifications
- Log sensitive actions (delete, deactivate)

---

## 🎨 UI/UX Flow

### Forgot Password Flow
```
Login Page
    ↓ (Click "Forgot Password?")
Forgot Password Page
    ↓ (Enter email → Submit)
Check Email Page (confirmation message)
    ↓ (User clicks link in email)
Reset Password Page
    ↓ (Enter new password → Submit)
Login Page (with success message)
```

### Change Password Flow (Logged In)
```
Profile Page
    ↓ (Click "Change Password")
Change Password Modal/Page
    ↓ (Enter current password + new password)
Success Message
    ↓ (Optional: Force re-login)
```

---

## 📧 Email Templates

### Password Reset Email
```
Subject: Reset Your CoinCubby Admin Password

Hi [Admin Name],

You requested to reset your password for your CoinCubby Admin account.

Click the link below to reset your password:
[Reset Password Button/Link]

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
CoinCubby Team
```

### Account Created Email
```
Subject: Welcome to CoinCubby Admin Panel

Hi [Admin Name],

Your admin account has been created!

Email: [email]
Role: [role]

Please click the link below to verify your email and set your password:
[Set Password Link]

Best regards,
CoinCubby Team
```

---

## 🚀 Quick Start Implementation

### Step 1: Enable Supabase Auth Email
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Enable "Confirm signup", "Reset password" templates
3. Customize email templates with CoinCubby branding

### Step 2: Create Forgot Password Page
- Simple form with email input
- Call Supabase `resetPasswordForEmail()`
- Show confirmation message

### Step 3: Create Reset Password Page
- Form with new password input
- Password strength indicator
- Call Supabase `updateUser()`

### Step 4: Add to Profile Page
- "Change Password" button
- Modal with current + new password fields
- Validation and submission

---

## 📊 Admin Dashboard Features

### Admin Accounts Page (Super Admin Only)

**Table Columns:**
- Avatar/Initials
- Full Name
- Email
- Role (Admin, Super Admin)
- Status (Active, Inactive)
- Last Login
- Created Date
- Actions (Edit, Deactivate, Delete)

**Actions:**
- ➕ Add New Admin
- 🔍 Search by name/email
- 🎯 Filter by role/status
- 📤 Export admin list
- 🗑️ Bulk deactivate

**Add/Edit Admin Form:**
```
Full Name: [text input]
Email: [email input]
Role: [dropdown: Admin, Super Admin]
Status: [toggle: Active/Inactive]
Send Welcome Email: [checkbox]
```

---

## 🔔 Notifications & Alerts

### Email Notifications (to Admin)
- Welcome email with account details
- Password reset confirmation
- Password changed successfully
- Account locked (after failed attempts)
- New login from unrecognized device

### In-App Notifications (to Super Admin)
- New admin account created
- Admin account deleted
- Multiple failed login attempts
- Admin account locked

---

## 🧪 Testing Checklist

### Forgot Password
- [ ] Can request password reset
- [ ] Email is received
- [ ] Link in email works
- [ ] Can set new password
- [ ] Old password no longer works
- [ ] New password works for login
- [ ] Expired link shows error
- [ ] Invalid email shows appropriate message

### Security
- [ ] Rate limiting on reset requests
- [ ] Session expires after 30 min
- [ ] Cannot reuse old passwords
- [ ] Strong password enforced
- [ ] Account locks after 5 failed attempts

### Admin Management
- [ ] Super admin can view all admins
- [ ] Can create new admin
- [ ] Can edit admin details
- [ ] Can deactivate admin
- [ ] Inactive admins cannot login
- [ ] Can delete admin
- [ ] Audit log records all changes

---

## 💡 Recommended: Use Supabase Auth

**Why Supabase Auth?**
- ✅ Built-in password reset flow
- ✅ Secure email handling
- ✅ No custom email server needed
- ✅ Rate limiting included
- ✅ Token expiration handled
- ✅ Password hashing automatic
- ✅ Session management built-in

**What You Need to Build:**
- ✅ Forgot password page (calls Supabase)
- ✅ Reset password page (calls Supabase)
- ✅ Change password in profile
- ✅ Admin management UI
- ✅ Custom business logic

**What Supabase Handles:**
- ✅ Email delivery
- ✅ Token generation/validation
- ✅ Password hashing
- ✅ Session cookies
- ✅ Security headers

---

## 📝 Next Steps

1. **Review this plan** - Confirm which features you want
2. **Phase 1 Implementation** - I can build:
   - Forgot password page
   - Reset password page
   - Change password in profile
   - Password validation
3. **Test with real email** - Configure Supabase email settings
4. **Phase 2** - Add admin management page
5. **Phase 3** - Add 2FA if needed

---

## 🎯 Quick Win: Minimal Implementation (30 minutes)

If you want the essentials quickly:
1. Forgot password page (10 min)
2. Reset password page (10 min)
3. Update profile with change password (10 min)

This gives you full password management without complex setup!

---

Would you like me to implement Phase 1 (Forgot Password + Change Password) right now?
