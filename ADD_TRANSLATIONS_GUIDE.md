# How to Add Tagalog Translations to All Pages

## Current Status:
- ✅ **Profile page** - Already translated (has `data-i18n` attributes)
- ❌ **All other pages** - Need `data-i18n` attributes added

## The Problem:
You switched to Tagalog in Profile, but other pages don't change because they don't have `data-i18n` attributes yet.

## The Solution:
Add `data-i18n="translation.key"` to every text element you want to translate.

---

## Quick Reference: What to Change

### 1. Sidebar Navigation (IN ALL PAGES)

**Find this in EVERY HTML file:**
```html
<span>Overview</span>
<span>Lockers</span>
<span>Customers</span>
<span>Transactions</span>
<span>Rentals</span>
<span>Rates</span>
<span>Reports</span>
<span>Feedback</span>
<span>Audit Log</span>
```

**Change to:**
```html
<span data-i18n="nav.overview">Overview</span>
<span data-i18n="nav.lockers">Lockers</span>
<span data-i18n="nav.customers">Customers</span>
<span data-i18n="nav.transactions">Transactions</span>
<span data-i18n="nav.rentals">Rentals</span>
<span data-i18n="nav.rates">Rates</span>
<span data-i18n="nav.reports">Reports</span>
<span data-i18n="nav.feedback">Feedback</span>
<span data-i18n="nav.auditlog">Audit Log</span>
```

**Also change:**
```html
<p class="text-muted">Admin Panel</p>
<p class="user-role">Admin</p>
```

**To:**
```html
<p class="text-muted" data-i18n="sidebar.adminPanel">Admin Panel</p>
<p class="user-role" data-i18n="profile.admin">Admin</p>
```

---

### 2. Lockers Page (`pages/lockers.html`)

**Find:**
```html
<h1>Locker Management</h1>
<p class="subtitle">Control compartments, toggle maintenance, and configure modules.</p>
```

**Change to:**
```html
<h1 data-i18n="lockers.title">Locker Management</h1>
<p class="subtitle" data-i18n="lockers.subtitle">Control compartments, toggle maintenance, and configure modules.</p>
```

**Find:**
```html
Add Module
Delete Module
```

**Change to:**
```html
<span data-i18n="lockers.addModule">Add Module</span>
<span data-i18n="lockers.deleteModule">Delete Module</span>
```

**Find (Status Legend):**
```html
<span>Available</span>
<span>Occupied</span>
<span>Payment Required</span>
<span>Maintenance</span>
```

**Change to:**
```html
<span data-i18n="status.available">Available</span>
<span data-i18n="status.occupied">Occupied</span>
<span data-i18n="status.payment">Payment Required</span>
<span data-i18n="status.maintenance">Maintenance</span>
```

**Find (Table Headers):**
```html
<th>Code</th>
<th>Size</th>
<th>Module</th>
<th>Device</th>
<th>Status</th>
```

**Change to:**
```html
<th data-i18n="lockers.code">Code</th>
<th data-i18n="lockers.size">Size</th>
<th data-i18n="lockers.module">Module</th>
<th data-i18n="lockers.device">Device</th>
<th data-i18n="lockers.status">Status</th>
```

**Find (Rental Details Modal):**
```html
<h2>Rental Details</h2>
Locker Information
Locker Number:
Size:
Module:
Status:
Renter Information
Customer Name:
Email:
Phone:
Rental Details
Start Time:
Duration:
Amount Paid:
```

**Change to:**
```html
<h2 data-i18n="modal.rentalDetails">Rental Details</h2>
<span data-i18n="modal.lockerInfo">Locker Information</span>
<span data-i18n="modal.lockerNumber">Locker Number:</span>
<span data-i18n="modal.size">Size:</span>
<span data-i18n="modal.module">Module:</span>
<span data-i18n="modal.status">Status:</span>
<span data-i18n="modal.renterInfo">Renter Information</span>
<span data-i18n="modal.customerName">Customer Name:</span>
<span data-i18n="modal.email">Email:</span>
<span data-i18n="modal.phone">Phone:</span>
<span data-i18n="modal.rentalTime">Rental Details</span>
<span data-i18n="modal.startTime">Start Time:</span>
<span data-i18n="modal.duration">Duration:</span>
<span data-i18n="modal.amount">Amount Paid:</span>
```

---

### 3. Login Page (`pages/login.html`)

**Find:**
```html
<h1>Admin Login</h1>
<p>Sign in to your CoinCubby admin panel</p>
<label>Email Address</label>
<input placeholder="Enter your email">
<label>Password</label>
<input placeholder="Enter your password">
<button>Sign In</button>
```

**Change to:**
```html
<h1 data-i18n="login.title">Admin Login</h1>
<p data-i18n="login.subtitle">Sign in to your CoinCubby admin panel</p>
<label data-i18n="login.email">Email Address</label>
<input data-i18n-placeholder="login.emailPlaceholder" placeholder="Enter your email">
<label data-i18n="login.password">Password</label>
<input data-i18n-placeholder="login.passwordPlaceholder" placeholder="Enter your password">
<button data-i18n="login.signIn">Sign In</button>
```

---

### 4. Overview Page (`pages/index.html`)

**Find:**
```html
<h1>Admin Overview</h1>
<p>Real-time status of your CoinCubby network.</p>
TOTAL LOCKERS
ACTIVE RENTALS
CUSTOMERS
TOTAL REVENUE
```

**Change to:**
```html
<h1 data-i18n="overview.title">Admin Overview</h1>
<p data-i18n="overview.subtitle">Real-time status of your CoinCubby network.</p>
<span data-i18n="stat.totalLockers">TOTAL LOCKERS</span>
<span data-i18n="stat.activeRentals">ACTIVE RENTALS</span>
<span data-i18n="stat.customers">CUSTOMERS</span>
<span data-i18n="stat.totalRevenue">TOTAL REVENUE</span>
```

---

### 5. Customers Page (`pages/customers.html`)

**Find:**
```html
<h1>Customers</h1>
<p>All registered users of your CoinCubby.</p>
<th>NAME</th>
<th>EMAIL</th>
<th>USER ID</th>
```

**Change to:**
```html
<h1 data-i18n="customers.title">Customers</h1>
<p data-i18n="customers.subtitle">All registered users of your CoinCubby.</p>
<th data-i18n="customers.name">NAME</th>
<th data-i18n="customers.email">EMAIL</th>
<th data-i18n="customers.userId">USER ID</th>
```

---

### 6. Transactions Page (`pages/transactions.html`)

**Find:**
```html
<h1>Transactions</h1>
<p>View all payment and transaction history.</p>
<th>TRANSACTION ID</th>
<th>DATE & TIME</th>
<th>CUSTOMER</th>
<th>AMOUNT</th>
```

**Change to:**
```html
<h1 data-i18n="transactions.title">Transactions</h1>
<p data-i18n="transactions.subtitle">View all payment and transaction history.</p>
<th data-i18n="transactions.id">TRANSACTION ID</th>
<th data-i18n="transactions.date">DATE & TIME</th>
<th data-i18n="transactions.customer">CUSTOMER</th>
<th data-i18n="transactions.amount">AMOUNT</th>
```

---

## Easiest Way to Do This:

### Option 1: Use Find & Replace in VS Code

1. Open VS Code
2. Press `Ctrl + H` (Find and Replace)
3. Enable "Use Regular Expression" (the .* button)
4. Copy one pattern at a time from above
5. Replace across all files in `pages/` folder

### Option 2: I Can Update Files For You

Tell me which pages you want updated and I'll do them one by one:
- "Update lockers page"
- "Update login page"  
- "Update overview page"
- "Update all pages"

---

## Testing After Adding `data-i18n`:

1. Save the HTML file
2. Reload the page in browser
3. Go to Profile page
4. Change language to Tagalog
5. Go back to the page you updated
6. Text should now be in Tagalog!

---

## All Translation Keys Available:

See `js/language.js` for the complete list of available translation keys.

Most common:
- `nav.*` - Navigation items
- `status.*` - Status badges
- `btn.*` - Buttons
- `lockers.*` - Lockers page
- `customers.*` - Customers page
- `transactions.*` - Transactions page
- `rentals.*` - Rentals page
- `modal.*` - Modal dialogs

---

## Need Help?

Just say:
- "Add translations to lockers page" 
- "Add translations to all pages"
- "Show me how to do login page"

And I'll help you!
