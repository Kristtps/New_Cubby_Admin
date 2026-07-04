# Timezone Conversion - Quick Reference

## The Problem
- **Supabase**: Singapore (UTC+8)
- **Admin Target**: Manila (UTC+8)
- **Users**: Could be anywhere (EST, PST, JST, etc.)
- **Database**: Stores times WITHOUT timezone info

## The Solution: TWO Functions

### 1️⃣ When DISPLAYING Times (Reading from Database)
```javascript
// File: js/script.js
function formatForDisplay(date, options = {}) {
    // Returns: Time formatted for Manila timezone display
}

// Usage in pages:
formatForDisplay(startDate, { month: 'short', day: 'numeric' })
// Result: "Jan 15, 2025 03:30 PM" (Manila time)
```

**Used in**:
- ✅ Rentals page (all dates)
- ✅ Customers page (join dates)
- ✅ Audit log (timestamps)
- ✅ Transactions page (all times)

---

### 2️⃣ When SAVING Times (Writing to Database)
```javascript
// File: js/script.js
function convertToSGT(date) {
    // Converts client timezone to UTC+8 (Singapore/Manila)
    // Returns: Date object adjusted to UTC+8
}

// Usage when creating records:
const startTime = convertToSGT(new Date());
await supabase.from('transactions').insert([{
    start_time: startTime.toISOString()
}]);
```

**Used when**:
- 📝 Creating transactions
- 📝 Starting rentals
- 📝 Recording payments
- 📝 Any future time-based records

---

## Real Example: Client in USA (EST)

### Scenario
Admin in New York (EST = UTC-5) creates a rental at 3:00 PM local time.

### Step 1: Convert to Database Timezone (UTC+8)
```
Client local time:  3:00 PM EST (UTC-5)
Database timezone:  UTC+8 (13 hours ahead)
Converted time:    4:00 AM next day UTC+8

Formula: clientOffset - (-480) = 300 - (-480) = 780 minutes
```

### Step 2: Save to Database
```javascript
const rentalStart = new Date();  // 3:00 PM EST
const adjustedStart = convertToSGT(rentalStart);  // 4:00 AM UTC+8
await supabase.from('transactions').insert([{
    customer_id: 'abc123',
    start_time: adjustedStart.toISOString(),  // "2025-01-16T04:00:00"
}]);
```

### Step 3: Display on Admin Page
```javascript
// Database returns: "2025-01-16T04:00:00"
const displayText = formatForDisplay(new Date("2025-01-16T04:00:00"), {
    hour: '2-digit',
    minute: '2-digit'
});
// Result: "04:00 AM" ✅ (Correct Manila/Singapore time)
```

---

## File-by-File Implementation

### `js/script.js` (Core Functions)
```javascript
// ✅ CONVERSION: Client time → UTC+8
function convertToSGT(date) { ... }

// ✅ DISPLAY: Format for Manila/Singapore (UTC+8)
function formatForDisplay(date, options = {}) { ... }

// ✅ LEGACY: Backward compatibility
function formatPHTime(date, options = {}) {
    return formatForDisplay(date, options);
}

// ✅ DEBUG: Check if conversion is working
function checkTimezoneIssue() { ... }
```

### `js/rentals.js` (Displaying Rental Times)
```javascript
startDate: formatForDisplay(startDate, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
}),
endDate: formatForDisplay(endDate, {...})
```

### `js/customers.js` (Displaying Join Dates)
```javascript
joined: formatForDisplay(new Date(c.created_at), {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
})
```

### `js/auditlog.js` (Displaying Audit Timestamps)
```javascript
function formatTimestamp(timestamp) {
    return formatForDisplay(timestamp, {...}) + ' PHT';
}
```

### `js/db-operations.js` (Ready for Future Writes)
```javascript
// When creating transactions:
const { data } = await supabase
    .from('transactions')
    .insert([{
        start_time: convertToSGT(new Date()).toISOString(),
        customer_id: customerId
    }]);
```

---

## Timezone Math

### Offset Calculation
```javascript
const clientOffsetMinutes = new Date().getTimezoneOffset();  // Client's offset
const sgtOffsetMinutes = -480;  // UTC+8 (Singapore/Manila)
const totalAdjustment = clientOffsetMinutes - sgtOffsetMinutes;

// Examples:
// EST (UTC-5):     300 - (-480) = 780 minutes (13 hours ahead)
// PST (UTC-8):     480 - (-480) = 960 minutes (16 hours ahead)
// UTC (UTC+0):     0 - (-480) = 480 minutes (8 hours ahead)
// JST (UTC+9):    -540 - (-480) = -60 minutes (1 hour behind)
```

---

## Testing

### In Browser Console

**Check current timezone offset:**
```javascript
new Date().getTimezoneOffset()  // Your offset in minutes
```

**Test conversion:**
```javascript
checkTimezoneIssue()  // Shows diagnostic table
```

**Test formatting:**
```javascript
formatForDisplay(new Date())  // Shows formatted current time
```

**Test SGT conversion:**
```javascript
convertToSGT(new Date()).toISOString()  // Shows converted time
```

---

## Troubleshooting Checklist

| Issue | Check | Fix |
|-------|-------|-----|
| Times off by hours | `new Date().getTimezoneOffset()` | Verify calculation is correct |
| Wrong date entirely | Database timezone setting | Check if Supabase is in UTC+8 |
| Daylight saving issues | Client timezone | `formatForDisplay` handles DST automatically |
| Times not displaying | Page loads `formatForDisplay` | Check if js/script.js loaded first |
| Conversions failing | `convertToSGT` defined | Ensure js/script.js loaded before writes |

---

## Summary Table

| Need | Function | File | Example |
|------|----------|------|---------|
| Display time from DB | `formatForDisplay()` | script.js | `formatForDisplay(startTime)` |
| Save time to DB | `convertToSGT()` | script.js | `convertToSGT(new Date())` |
| Format audit logs | `formatTimestamp()` | auditlog.js | Already implemented |
| Legacy display | `formatPHTime()` | script.js | Still works for old code |
| Debug timezone | `checkTimezoneIssue()` | script.js | Run in console |

---

## Key Points

✅ **All display** automatically uses Manila/Singapore timezone (UTC+8)  
✅ **All saves** automatically convert from client timezone to UTC+8  
✅ **No manual timezone handling** needed in most cases  
✅ **Works anywhere in the world** - handles any client timezone  
✅ **Automatic DST** - no manual daylight saving adjustments  

---

## Questions?

Refer to `TIMEZONE_CONVERSION_GUIDE.md` for detailed explanation.
