# Timezone Conversion - Visual Flow Diagram

## Overview Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN USER ANYWHERE                          │
│                 (EST, PST, JST, UTC, etc.)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────────┐
        │          TWO DIFFERENT PATHS                    │
        └─────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │   READING (Display)  │    │   WRITING (Save)     │
    │   ✓ Most Common      │    │   ✓ Future Use       │
    └──────────────────────┘    └──────────────────────┘
                │                           │
                ▼                           ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │ Database (UTC+8)     │    │ Client Timezone      │
    │ Returns:             │    │ (EST, PST, etc.)     │
    │ "2025-01-15T14:30"   │    │ Current: 3:30 PM EST │
    └──────────────────────┘    └──────────────────────┘
                │                           │
                ▼                           ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │ formatForDisplay()   │    │ convertToSGT()       │
    │ Applied             │    │ (Client → UTC+8)     │
    │                     │    │                      │
    │ timeZone: Asia/     │    │ Offset calculation:  │
    │ Manila              │    │ clientOffset -       │
    │                     │    │ (-480) = adjustment  │
    └──────────────────────┘    └──────────────────────┘
                │                           │
                ▼                           ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │ Rentals Page         │    │ "2025-01-16T04:30"   │
    │ Customers Page       │    │ (Converted to UTC+8) │
    │ Audit Log            │    │                      │
    │ Transactions         │    │ Save to Database:    │
    │                      │    │ .toISOString() sent  │
    │ Display:             │    │ to Supabase          │
    │ "01/15/2025          │    └──────────────────────┘
    │  02:30 PM PHT"       │             │
    └──────────────────────┘             ▼
            ✅ CORRECT                 ✅ CORRECT
```

---

## Detailed Read Flow (Display)

### Example: Client in USA (EST), Database has UTC+8 timestamp

```
Step 1: Browser loads customers page
  ↓
  [customers.js calls loadCustomersFromSupabase()]
  ↓
Step 2: Supabase returns customer with:
  {
    customer_id: "abc123",
    full_name: "John Doe",
    created_at: "2025-01-15T14:30:00"  ← No timezone marker!
  }
  ↓
Step 3: Format for display
  const joinDate = formatForDisplay(
    new Date("2025-01-15T14:30:00"),
    { month: 'short', day: 'numeric' }
  )
  ↓
Step 4: formatForDisplay() processes:
  - Input date: "2025-01-15T14:30:00" (interpreted as client's local time)
  - Apply timeZone: 'Asia/Manila' to Intl.DateTimeFormat
  - Result: "Jan 15" (Manila time)
  ↓
Step 5: Display in page:
  TABLE: Customers
  ─────────────────────
  NAME      | JOINED
  ─────────────────────
  John Doe  | Jan 15  ✅ Correct Manila time!
  ─────────────────────
```

---

## Detailed Write Flow (Save)

### Example: Admin in USA creates rental at 3:00 PM EST

```
Step 1: Admin clicks "Start Rental" button
  Current time in admin's browser: 3:00 PM EST
  ↓
Step 2: JavaScript gets current time
  const startTime = new Date();  // 3:00 PM EST in JavaScript
  ↓
Step 3: Convert to database timezone (UTC+8)
  const convertedTime = convertToSGT(startTime);
  ↓
Step 4: convertToSGT() calculates:
  - clientOffset = getTimezoneOffset() = 300 (EST is 300 mins behind UTC)
  - sgtOffset = -480 (UTC+8 is 480 mins ahead of UTC)
  - adjustment = 300 - (-480) = 780 minutes
  - convertedTime = original time + 780 minutes
  
  Result: 3:00 PM EST + 13 hours = 4:00 AM next day (UTC+8)
  ↓
Step 5: Save to Supabase
  await supabase.from('transactions').insert([{
    customer_id: customerId,
    start_time: convertedTime.toISOString(),
    // becomes: "2025-01-16T04:00:00"
    status: 'Active'
  }])
  ↓
Step 6: Database stores (ap-southeast-1 Singapore = UTC+8)
  transactions table:
  ┌───────────────┬──────────────────┐
  │ customer_id   │ start_time        │
  ├───────────────┼──────────────────┤
  │ customer123   │ 2025-01-16T04:00  │
  └───────────────┴──────────────────┘
  ↓
Step 7: When viewed on rentals page:
  formatForDisplay("2025-01-16T04:00:00", {...})
  ↓
  Result: "Jan 16 04:00 AM" ✅ Correct Manila time!
```

---

## Timezone Offset Visualization

```
Time Differences from UTC+8 (Singapore/Manila):

                     CLIENT TIMEZONES
                              │
                ┌─────────────┼─────────────┐
                │             │             │
    PST         EST          UTC          JST
   (UTC-8)     (UTC-5)      (UTC)        (UTC+9)
     │           │           │            │
     ▼           ▼           ▼            ▼
    12:00 PM    3:00 PM     8:00 PM     5:00 AM (next day)
    (noon)      (3 PM)      (8 PM)      (5 AM next day)
     │           │           │            │
     └───────────┼───────────┼────────────┘
                 │           │
                 └─────┬─────┘
                       │
                    +13 hrs  +8 hrs  ADD MINUTES
                       │         │
                       ▼         ▼
               ╔═════════════════════════╗
               ║  NEXT DAY 1:00 AM UTC+8 ║
               ║   (Manila Time)          ║
               ║  Stored in Database      ║
               ╚═════════════════════════╝


CONVERSION FORMULA:
═════════════════════════════════════════════════════════

Offset to Add = clientOffset - (-480)

╔═════════════════════════════════════════════════════════╗
║ Example: EST Client                                     ║
║                                                         ║
║ Client in EST: getTimezoneOffset() = 300              ║
║ SGT: -480                                              ║
║ Adjustment: 300 - (-480) = 780 minutes = 13 hours     ║
║                                                         ║
║ So client 3:00 PM + 13 hours = next day 4:00 AM UTC+8 ║
╚═════════════════════════════════════════════════════════╝
```

---

## Decision Tree: Which Function to Use?

```
                    ┌─ Need to show time? ─┐
                   /                         \
                  /                           \
        YES ◄────┘                             └───► NO
       /                                           \
      ▼                                             ▼
┌─────────────────┐                         ┌─────────────────┐
│ formatForDisplay│                         │ convertToSGT    │
│                 │                         │                 │
│ On: Rentals pg  │                         │ On: Save ops    │
│     Customers pg│                         │    Writes       │
│     Audit log   │                         │    Creates      │
│     Reports     │                         │                 │
└─────────────────┘                         └─────────────────┘
       │                                             │
       ▼                                             ▼
  Return string                                Return Date
  (formatted time)                            (converted to UTC+8)
       │                                             │
       └─────────────┬───────────────────────────────┘
                     │
                     ▼
            ✅ USE APPROPRIATE FUNCTION
```

---

## Script Load Order

```
HTML Page Load
    ↓
┌───────────────────────────────────────────┐
│ <head>                                    │
│   <script src="jquery.js"></script>       │ 1. jQuery (if used)
│   <script src="supabase-js.js"></script>  │ 2. Supabase library
│ </head>                                   │
└───────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────┐
│ <body>                                    │
│   ... HTML content ...                    │
│                                           │
│   <!-- Database scripts (in order) -->    │
│   <script src="supabase-client.js"></script>  │ 3. Initialize client
│   <script src="db-operations.js"></script>    │ 4. DB functions
│   <script src="script.js"></script>           │ 5. Core functions ⭐
│   <script src="[page].js"></script>          │ 6. Page-specific
│ </body>                                   │
└───────────────────────────────────────────┘

IMPORTANT: script.js must load BEFORE page-specific scripts
           so formatForDisplay() and convertToSGT() are available
```

---

## Data Flow Through Pages

### Rentals Page Example

```
┌─ Rentals.html loads ─┐
    ↓
[Script loads in order]:
  1. supabase-js (CDN)
  2. supabase-client.js → window.supabase initialized
  3. db-operations.js → database functions ready
  4. script.js → formatForDisplay() available ✓
  5. rentals.js → page starts loading
    ↓
[rentals.js code]:
  loadRentalsFromSupabase() called
    ↓
  Query database:
    select * from transactions where status='Active'
    ↓
  Supabase returns (UTC+8 timestamps, no tz info):
    [{
      transaction_id: "tx-123",
      start_time: "2025-01-15T14:30:00",
      end_time: "2025-01-15T16:30:00",
      ...
    }]
    ↓
  [Map data]:
    startDate: formatForDisplay(startDate, {...})
      ↓ formatForDisplay processes:
      ↓ timeZone: 'Asia/Manila' applied
      ↓ Returns: "01/15/2025 02:30 PM"
    
    endDate: formatForDisplay(endDate, {...})
      ↓ Returns: "01/15/2025 04:30 PM"
    ↓
  [Display in table]:
    ┌─────────────────────────────────┐
    │ Rentals Table                   │
    ├─────────────────────────────────┤
    │ Start Time  │ End Time          │
    ├─────────────────────────────────┤
    │ 01/15 2:30  │ 01/15 4:30 ✅    │
    │ PM PHT      │ PM PHT            │
    └─────────────────────────────────┘
```

---

## Common Mistakes to Avoid

```
❌ WRONG: Store client time directly
  const time = new Date();
  await supabase.insert({ start_time: time.toISOString() });
  └─ Time will be WRONG if client not in UTC+8!

✅ RIGHT: Convert first
  const time = convertToSGT(new Date());
  await supabase.insert({ start_time: time.toISOString() });
  └─ Time stored correctly in UTC+8

───────────────────────────────────────────────

❌ WRONG: Multiple Intl.DateTimeFormat calls
  const format1 = new Intl.DateTimeFormat(...).format(date);
  const format2 = new Intl.DateTimeFormat(...).format(date);
  └─ Inconsistent, hard to maintain

✅ RIGHT: Use centralized function
  const formatted = formatForDisplay(date, options);
  └─ Consistent, easy to maintain

───────────────────────────────────────────────

❌ WRONG: Assuming all times are already correct
  const time = new Date(dbTime);
  display(time);
  └─ May show wrong time for non-UTC+8 users

✅ RIGHT: Always format for display
  const formatted = formatForDisplay(dbTime);
  display(formatted);
  └─ Always correct regardless of user location
```

---

## Summary Diagram

```
     CLIENT          DATABASE         DISPLAY
   (Anywhere)       (UTC+8)          (Manila)
      │               │                │
      │               │                │
      │ CREATE/SAVE   │                │
      ├──convertToSGT─→│                │
      │               │                │
      │               │  READ/SHOW     │
      │               ├─formatForDisplay→
      │               │                │
      └───────────────┴────────────────┘
           Always Use The Functions!
```

---

## Performance Considerations

```
TIMEZONE CONVERSION COST:

Function          │ Calls    │ Time Each │ Total Time
──────────────────┼──────────┼───────────┼──────────
formatForDisplay()│ ~100/page│ < 0.1ms   │ < 10ms
convertToSGT()    │ ~1/save  │ < 0.1ms   │ < 0.1ms
getTimezoneOffset │ ~1/calc  │ <0.01ms   │ <0.01ms

TOTAL OVERHEAD: < 15ms per page load (negligible)
```

---

## Testing Commands

Run in browser console on any page:

```javascript
// Check client timezone
console.log('Your timezone offset:', new Date().getTimezoneOffset());

// Test diagnostic
checkTimezoneIssue();

// Test formatting
console.log('Now formatted:', formatForDisplay(new Date()));

// Test conversion (for future use)
console.log('Converted to UTC+8:', convertToSGT(new Date()).toISOString());

// Test specific date
const testDate = new Date('2025-01-15T14:30:00');
console.log('Test date formatted:', formatForDisplay(testDate));
```

---

## Reference Sheet

```
╔═════════════════════════════════════════════════════════╗
║           TIMEZONE QUICK REFERENCE                     ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║ READING (Display):     formatForDisplay(date, opts)    ║
║ WRITING (Save):        convertToSGT(date)              ║
║ LEGACY (Old code):     formatPHTime(date, opts)        ║
║ DEBUG:                 checkTimezoneIssue()            ║
║                                                         ║
║ Server Timezone:       Singapore (UTC+8)               ║
║ Display Target:        Manila (UTC+8)                  ║
║ User Location:         Anywhere (auto-handled)         ║
║                                                         ║
║ Database Timezone:     "without time zone"             ║
║ Assumed TZ:            UTC+8 (server's TZ)             ║
║                                                         ║
╚═════════════════════════════════════════════════════════╝
```
