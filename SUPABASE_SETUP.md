# SUPABASE SETUP GUIDE FOR COINCUBBY

## Step 1: Get Your Supabase Credentials

1. **Go to Supabase Dashboard** - https://app.supabase.com
2. **Create a new project** (if you don't have one)
3. **Get your credentials:**
   - Project URL: `Settings > API > Project URL`
   - Anon Key: `Settings > API > Project API keys > anon`

## Step 2: Add Credentials to supabase-client.js

Open [supabase-client.js](supabase-client.js) and replace:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

With your actual credentials:

```javascript
const SUPABASE_URL = 'https://abc123.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...xxxxx';
```

## Step 3: Create Database Tables in Supabase

Go to **Supabase Dashboard > SQL Editor** and run these queries:

### Create Rentals Table
```sql
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  locker_id TEXT NOT NULL,
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_hours INTEGER,
  amount DECIMAL(10, 2),
  status TEXT DEFAULT 'active' (active, completed, cancelled),
  payment_method TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Create Customers Table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  wallet_balance DECIMAL(10, 2) DEFAULT 0,
  total_rentals INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Create Lockers Table
```sql
CREATE TABLE lockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locker_id TEXT UNIQUE NOT NULL,
  size TEXT (small, medium, large),
  location TEXT,
  status TEXT DEFAULT 'available' (available, occupied, payment, maintenance),
  device_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Create Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  rental_id UUID,
  type TEXT (payment, wallet_load, cash_collection),
  amount DECIMAL(10, 2),
  payment_method TEXT,
  status TEXT DEFAULT 'completed' (pending, completed, failed),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Create Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  user_id TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Create Rates Table
```sql
CREATE TABLE rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size TEXT NOT NULL (small, medium, large),
  rate_per_hour DECIMAL(10, 2),
  minimum_charge DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Step 4: Include Scripts in Your HTML

Add these lines to your HTML files before the closing `</body>` tag:

**For index.html, rates.html, reports.html, auditlog.html:**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-client.js"></script>
<script src="db-operations.js"></script>
<script src="your-page.js"></script>
```

## Step 5: Update Your JavaScript Files

### Example: Updating Transactions Page

**transactions.js** - Replace the populateTransactionTable function:

```javascript
document.addEventListener('DOMContentLoaded', function() {
    if (isSupabaseConnected()) {
        loadTransactionsFromDatabase();
    } else {
        populateTransactionTable(); // Use sample data
    }
});

async function loadTransactionsFromDatabase() {
    try {
        const transactions = await fetchAllTransactions();
        updateTransactionTableFromDatabase(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
        populateTransactionTable(); // Fallback to sample data
    }
}

function updateTransactionTableFromDatabase(transactions) {
    const tableBody = document.getElementById('transactionTableBody');
    
    tableBody.innerHTML = transactions.map(tx => `
        <tr>
            <td class="date-cell">${new Date(tx.created_at).toLocaleString()}</td>
            <td class="customer-cell">
                <div class="customer-info">
                    <div class="customer-name">${tx.customer_name}</div>
                    <div class="customer-email">${tx.customer_email}</div>
                </div>
            </td>
            <td class="type-cell">${tx.type}</td>
            <td class="method-cell">${tx.payment_method}</td>
            <td class="locker-cell">${tx.locker_id || '-'}</td>
            <td class="amount-cell">₱${tx.amount.toFixed(2)}</td>
        </tr>
    `).join('');
}
```

### Example: Updating Audit Log Page

**auditlog.js** - Replace the initializeAuditLog function:

```javascript
async function initializeAuditLog() {
    if (isSupabaseConnected()) {
        const entries = await fetchAllAuditLogs();
        displayAuditLog(entries);
    } else {
        loadAuditLogEntries();
        displayAuditLog();
    }
}
```

### Example: Updating Rates Page

**rates.js** - Load and save rates from database:

```javascript
async function initializeRatesPage() {
    if (isSupabaseConnected()) {
        const rates = await fetchRates();
        if (rates) {
            document.getElementById('smallRate').value = rates.small.rate;
            document.getElementById('smallMinimum').value = rates.small.minimum;
            // ... set other rates
        }
    } else {
        loadSavedRates();
    }
    setupFormListeners();
}

async function saveRates(isAutoSave = false) {
    // ... validation code ...
    
    if (isSupabaseConnected()) {
        await updateRates(rates);
    } else {
        localStorage.setItem('coincubby_rates', JSON.stringify(rates));
    }
    
    showSuccessMessage('Rates saved successfully!');
}
```

## Step 6: Update Dashboard (index.html)

**script.js** - Load dashboard data from Supabase:

```javascript
document.addEventListener('DOMContentLoaded', async function() {
    initializeSidebar();
    
    if (isSupabaseConnected()) {
        const stats = await getDashboardStats();
        if (stats) {
            updateAllStats({
                'total-lockers': stats.totalLockers,
                'active-rentals': stats.activeRentals,
                'total-customers': stats.totalCustomers,
                'today-revenue': stats.todayRevenue.toFixed(2)
            });
        }
    }
    
    initializeLockers();
    animateStats();
});
```

## Step 7: Set Up Real-time Updates (Optional)

For real-time data updates, use Supabase subscriptions:

```javascript
// Subscribe to rental changes
const realtimeRentals = supabase
    .channel('public:rentals')
    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rentals' },
        (payload) => {
            console.log('Rental update:', payload);
            // Refresh your UI here
            loadTransactionsFromDatabase();
        }
    )
    .subscribe();
```

## Testing Your Setup

1. **Check Supabase connection:**
   ```javascript
   console.log(isSupabaseConnected()); // Should be true
   ```

2. **Test fetching data:**
   ```javascript
   dbOps.getDashboardStats().then(stats => console.log(stats));
   ```

3. **Test creating records:**
   ```javascript
   dbOps.createTransaction({
       customer_id: 'xxx',
       type: 'payment',
       amount: 100,
       payment_method: 'wallet'
   });
   ```

## Troubleshooting

- **"Supabase not configured"** - Check your credentials in supabase-client.js
- **CORS errors** - Enable CORS in Supabase: Settings > API > CORS
- **"Table not found"** - Make sure tables are created in your database
- **Check console** - Browser console shows detailed error messages

## Next Steps

1. Insert sample data into your Supabase tables
2. Test each page loads data correctly
3. Set up authentication (optional)
4. Configure Row Level Security (RLS) for production

---

For questions, check [Supabase Docs](https://supabase.com/docs)
