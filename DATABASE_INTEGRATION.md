# CoinCubby Admin Panel - Database Integration Guide

## Overview
The UI is structured to remain visually identical when connected to your database. All data attributes and IDs have been added to allow seamless integration with backend data without changing the design.

## How It Works

The UI uses **data attributes** and **IDs** to identify elements that will be populated with database values. When you fetch data from your database, use the provided JavaScript functions to update the UI.

---

## Key Features

### 1. No UI Changes on Database Connection
- The HTML structure remains unchanged
- CSS styling is preserved
- Only the **content/values** get updated from the database

### 2. Easy Data Binding
- Use `data-stat`, `data-locker-id`, `data-module-id` attributes to identify elements
- Update any field without touching HTML or CSS

### 3. Responsive Functions
- Pre-built JavaScript functions handle all UI updates
- Simple function calls to refresh dashboard data

---

## Database Integration Functions

### Update Individual Stats

```javascript
// Update a single stat value
updateStat('total-lockers', 20);
updateStat('active-rentals', 3);
updateStat('total-customers', 5);
updateStat('today-revenue', '150.50');
```

**Stat Keys Available:**
- `total-lockers` - Total number of lockers
- `active-rentals` - Currently active rentals
- `total-customers` - Total customers
- `today-revenue` - Revenue for today

---

### Update All Stats at Once

```javascript
// Update multiple stats with one call
updateAllStats({
    'total-lockers': 20,
    'active-rentals': 3,
    'total-customers': 5,
    'today-revenue': '150.50'
});
```

---

### Update Locker Status

```javascript
// Update single locker status
updateLockerStatus('L1', 'occupied');
updateLockerStatus('M2', 'available');
updateLockerStatus('S3', 'payment');

// Available statuses: 'available', 'occupied', 'payment', 'maintenance'
```

---

### Update Multiple Lockers

```javascript
// Update multiple lockers at once
updateLockerStatuses({
    'L1': 'occupied',
    'L2': 'maintenance',
    'M1': 'available',
    'M2': 'available',
    'S1': 'occupied',
    'S2': 'payment'
});
```

---

### Update Module Available Count

```javascript
// Update available count for a module
updateModuleAvailableCount(1, 5);  // Module 1 has 5 available
updateModuleAvailableCount(2, 8);  // Module 2 has 8 available
```

---

### Update Recent Rentals

```javascript
// Add/Update a single rental
updateRental({
    id: 1,
    customerName: 'John Doe',
    lockerInfo: 'Locker L1 • Apr 17, 10:30',
    amount: '₱25'
});
```

---

### Update Entire Rentals List

```javascript
// Replace entire rentals list
updateRentalsList([
    {
        id: 1,
        customerName: 'John Doe',
        lockerInfo: 'Locker L1 • Apr 17, 10:30',
        amount: '₱25'
    },
    {
        id: 2,
        customerName: 'Jane Smith',
        lockerInfo: 'Locker M2 • Apr 17, 09:15',
        amount: '₱15'
    }
]);
```

---

### Complete Dashboard Refresh (Recommended)

**Use this function to update entire dashboard from database with one call:**

```javascript
// Refresh entire dashboard with database data
refreshDashboardFromDatabase({
    stats: {
        'total-lockers': 20,
        'active-rentals': 3,
        'total-customers': 5,
        'today-revenue': '150.50'
    },
    lockers: {
        'L1': 'occupied',
        'L2': 'available',
        'L3': 'maintenance',
        'M1': 'available',
        'M2': 'occupied',
        'M3': 'available',
        'M4': 'available',
        'S1': 'occupied',
        'S2': 'payment',
        'S3': 'available',
        'S4': 'available',
        'S5': 'available',
        'S6': 'available'
    },
    modules: {
        1: { availableCount: 3 },
        2: { availableCount: 6 }
    },
    recentRentals: [
        {
            id: 1,
            customerName: 'Samantha Claire Balon',
            lockerInfo: 'Locker S1 • Apr 17, 05:43',
            amount: '₱10'
        }
    ]
});
```

---

## Implementation Example

### 1. Setup Initial Load
```javascript
// When page loads, fetch from your database
document.addEventListener('DOMContentLoaded', function() {
    fetchDashboardData();
});

async function fetchDashboardData() {
    try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();
        
        // Update UI with database data
        refreshDashboardFromDatabase(data);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}
```

### 2. Real-time Updates
```javascript
// Poll for updates every 30 seconds
setInterval(async () => {
    const response = await fetch('/api/dashboard');
    const data = await response.json();
    refreshDashboardFromDatabase(data);
}, 30000);
```

### 3. WebSocket for Live Updates
```javascript
const socket = new WebSocket('ws://your-server/dashboard');

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    refreshDashboardFromDatabase(data);
};
```

---

## Expected Database Format

Your API should return data in this structure:

```json
{
    "stats": {
        "total-lockers": 20,
        "active-rentals": 3,
        "total-customers": 5,
        "today-revenue": "150.50"
    },
    "lockers": {
        "L1": "occupied",
        "L2": "available",
        "M1": "available",
        "M2": "occupied",
        "S1": "available",
        "S2": "payment"
    },
    "modules": {
        "1": { "availableCount": 3 },
        "2": { "availableCount": 6 }
    },
    "recentRentals": [
        {
            "id": 1,
            "customerName": "Customer Name",
            "lockerInfo": "Locker ID • Date, Time",
            "amount": "₱XXX"
        }
    ]
}
```

---

## HTML Structure Reference

### Available Data Attributes

```html
<!-- Stats -->
<div class="stat-card" data-stat="total-lockers">
    <p class="stat-value" data-value="16">16</p>
</div>

<!-- Lockers -->
<div class="locker" data-locker-id="L1" data-status="available" data-size="L"></div>

<!-- Modules -->
<div class="module" data-module-id="1">
    <div class="lockers-grid" data-module="1"></div>
</div>

<!-- Rentals -->
<div class="rental-item" data-rental-id="1">
    <p data-field="customer-name">Name</p>
    <p data-field="locker-info">Info</p>
    <p data-field="rental-amount">Amount</p>
</div>
```

---

## Important Notes

✅ **The UI Design Will NOT Change** - All visual styling remains identical
✅ **CSS is Preserved** - No changes to styles needed
✅ **Responsive Design** - All responsive features work as-is
✅ **Animations Continue** - All interactive effects persist
❌ **Do NOT modify HTML structure** - Keep the DOM structure intact
❌ **Do NOT change class names** - Classes control the styling

---

## Troubleshooting

### Stats not updating?
- Check that stat key matches exactly: `'total-lockers'`, `'active-rentals'`, etc.
- Verify data type (string for revenue, number for others)

### Locker status not changing?
- Ensure locker ID matches exactly (case-sensitive): `'L1'`, `'M2'`, `'S3'`
- Valid statuses: `'available'`, `'occupied'`, `'payment'`, `'maintenance'`

### Module count not updating?
- Module ID must be 1 or 2
- Use `updateModuleAvailableCount(moduleId, count)`

---

## Still Questions?

All functions are documented in `script.js` with detailed comments and examples.
Refer to the function definitions for the most up-to-date information.
