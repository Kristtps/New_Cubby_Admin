# Timezone Conversion Guide

## Current Setup
- **Supabase Server Location**: Singapore (ap-southeast-1) = **UTC+8**
- **Admin Display Target**: Manila (PHT) = **UTC+8**
- **Database Storage**: Timestamps stored WITHOUT timezone info (assumes UTC+8)

## Key Understanding

Since both Singapore and Manila are **UTC+8**, they are technically the same timezone. However, the conversion still matters because:

1. **Admin users may be in different timezones** (e.g., USA, Europe, etc.)
2. **Database stores times without timezone markers** - assumes they're already in UTC+8
3. **We need to ensure consistency** across reading, writing, and displaying

---

## How Timezone Conversion Works in This System

### When READING from Database (DISPLAYING)

**Location**: All display pages (customers, rentals, audit log, transactions)

**Function**: `formatForDisplay()` in `js/script.js`

**How it works**:
```javascript
// Database sends: "2025-01-15T14:30:00" (no timezone info)
// JavaScript interprets this as client's local time
// We format it using Asia/Manila timezone

return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', // UTC+8
    // ... date/time options
}).format(dateObj);
```

**Result**: Times display as Manila timezone (UTC+8) ✓

**Used in**:
- `rentals.js` - Rental start/end times
- `customers.js` - Customer join dates
- `auditlog.js` - Audit log timestamps
- `transactions.js` - Transaction times
- `reports.js` - Report dates

---

### When WRITING to Database (SAVING)

**Location**: When creating transactions, rentals, or other time-based records

**Function**: `convertToSGT()` in `js/script.js`

**How it works**:
```javascript
// Client local time: "3:30 PM EST" 
const clientOffsetMinutes = new Date().getTimezoneOffset(); // 300 for EST
const sgtOffsetMinutes = -480; // UTC+8
const totalOffset = clientOffsetMinutes - sgtOffsetMinutes; // 780

// Adjust timestamp to UTC+8 before sending to database
const adjustedTime = new Date(dateObj.getTime() + (totalOffset * 60 * 1000));

// Send adjustedTime to Supabase
```

**Example**:
```javascript
// Client in USA (EST = UTC-5):
// Local time: 2025-01-15 03:30:00 PM (EST)
// Adjusted to: 2025-01-16 08:30:00 AM (SGT/UTC+8)
// Stored in DB: "2025-01-16T08:30:00"
```

**Used when**:
- Creating new transactions
- Updating rental times
- Recording audit events
- Adding payments

---

## Implementation Guide

### For Display (Most Common)

**All pages automatically use `formatForDisplay()`:**

```javascript
// In rentals.js
startDate: formatForDisplay(startDate, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
})

// In customers.js
joined: formatForDisplay(new Date(c.created_at), {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
})

// In auditlog.js
formatTimestamp(timestamp)  // Calls formatForDisplay internally
```

### For Writing (When Creating Records)

**Use `convertToSGT()` before saving:**

```javascript
// When creating a new transaction
const transactionData = {
    customer_id: customerId,
    start_time: convertToSGT(new Date()).toISOString(),  // Convert client time to SGT
    end_time: null,
    status: 'Active'
};

const { data, error } = await supabase
    .from('transactions')
    .insert([transactionData])
    .select();
```

### For Backward Compatibility

**`formatPHTime()` is now an alias to `formatForDisplay()`:**

```javascript
// Old code still works:
formatPHTime(date)

// New code preferred:
formatForDisplay(date)
```

---

## Timezone Offset Reference

### Common Timezone Offsets

| Location | Timezone | Offset | getTimezoneOffset() |
|----------|----------|--------|---------------------|
| Singapore | SGT | UTC+8 | -480 |
| Manila | PHT | UTC+8 | -480 |
| London | GMT/BST | UTC±0/+1 | 0/-60 |
| New York | EST/EDT | UTC-5/-4 | 300/240 |
| Los Angeles | PST/PDT | UTC-8/-7 | 480/420 |
| Tokyo | JST | UTC+9 | -540 |
| Sydney | AEDT | UTC+11 | -660 |

**Important**: `getTimezoneOffset()` returns minutes to subtract from UTC
- Positive values = West of UTC (negative timezones)
- Negative values = East of UTC (positive timezones)

---

## Diagnostic Function

**To verify timezone conversion is working:**

1. Open browser console (F12)
2. Run: `checkTimezoneIssue()`
3. Check the diagnostic table that appears

**Output shows**:
- Client timezone offset
- Manila timezone offset
- Adjustment being made
- Formatted output

---

## Database Timestamp Format

**Current format in transactions table**:

```sql
start_time timestamp without time zone not null
end_time timestamp without time zone null
```

**Why "without time zone"?**
- Stored as local time without timezone marker
- Assumes the server's timezone (Singapore UTC+8)
- Simpler for queries, but requires manual timezone handling in code

**Alternative (if needed in future)**:
```sql
start_time timestamp with time zone not null
-- Automatically handles timezone conversion
```

---

## Troubleshooting

### Times are off by several hours

**Problem**: Likely client in different timezone than Manila

**Solution**: 
```javascript
// Check what conversion is happening:
console.log('Client offset:', new Date().getTimezoneOffset());
console.log('Should be converting by:', (new Date().getTimezoneOffset() - (-480)));
// Should match your timezone difference from UTC+8
```

### All times show wrong date

**Problem**: Database might be storing in UTC instead of SGT

**Solution**: 
- Check if database is actually in UTC+8 timezone
- Verify data coming from Supabase with: `formatForDisplay(date)`
- Should display correctly if database is in UTC+8

### Daylight saving time issues

**Note**: Manila and Singapore **do NOT observe daylight saving time**
- PHT is always UTC+8
- SGT is always UTC+8
- Your client timezone might change twice per year though!

**How to handle**:
- `formatForDisplay()` automatically accounts for client DST
- No manual DST handling needed

---

## Summary

| Operation | Function | Usage |
|-----------|----------|-------|
| **Display times** | `formatForDisplay()` | All read operations |
| **Save times** | `convertToSGT()` | All write operations |
| **Legacy display** | `formatPHTime()` | Old code (alias to formatForDisplay) |
| **Format timestamp** | `formatTimestamp()` | Audit log (calls formatForDisplay) |
| **Diagnostics** | `checkTimezoneIssue()` | Debugging in console |

---

## Example Workflow

### Creating a rental in admin (client in USA)

```javascript
// 1. User clicks "Start Rental" at 3:30 PM EST
const startTime = new Date();  // "2025-01-15 15:30:00 EST"

// 2. Convert to SGT before saving
const startTimeInSGT = convertToSGT(startTime);  
// Result: "2025-01-16 04:30:00" (next day in Manila!)

// 3. Save to database
const { data } = await supabase
    .from('transactions')
    .insert([{
        customer_id: customerId,
        start_time: startTimeInSGT.toISOString(),  // "2025-01-16T04:30:00"
        status: 'Active'
    }]);

// 4. When admin views rentals page
// Database returns: "2025-01-16T04:30:00"
// formatForDisplay converts for Manila display: "01/16/2025 04:30 AM PHT"
// User sees correct time!
```

---

## Files Modified

1. **js/script.js**
   - `convertToSGT()` - Convert client time to database timezone
   - `formatForDisplay()` - Format for display
   - `formatPHTime()` - Legacy alias
   - `checkTimezoneIssue()` - Diagnostics

2. **js/rentals.js**
   - Uses `formatForDisplay()` for start/end times

3. **js/customers.js**
   - Uses `formatForDisplay()` for joined dates

4. **js/auditlog.js**
   - `formatTimestamp()` calls `formatForDisplay()`

5. **js/db-operations.js**
   - Ready for `convertToSGT()` when writing transactions

---

## Next Steps

If times are still incorrect:

1. **Check client timezone offset**: Open console → `new Date().getTimezoneOffset()`
2. **Verify database timezone**: Contact Supabase support or check region setting
3. **Test conversion**: Call `checkTimezoneIssue()` in console
4. **Check stored data**: Query Supabase directly to see what's being stored
5. **File an issue**: If conversion is still off, provide console output and timezone info
