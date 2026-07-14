# CoinCubby Pricing Logic Documentation

## Overview
This document explains the complete pricing calculation system for the CoinCubby locker rental service.

---

## 1. Rate Source

### Database-Driven Rates
All pricing rates come directly from your **database** via the admin panel:
- **Small Locker**: ₱10/hour (default)
- **Medium Locker**: ₱20/hour (default)  
- **Large Locker**: ₱35/hour (default)

### How It Works:
```javascript
// Rates are fetched from Supabase
const rates = await getRatesFromDatabase();
// { small: 10, medium: 20, large: 35 }

// Admin can update rates anytime via Rates page
// Changes apply immediately to new rentals
```

---

## 2. Fixed-Duration (Prepaid Hours)

### Description
Customer pays **upfront** before using the locker for a specific number of hours.

### Calculation
```
Total = Hours × Hourly Rate
```

### Examples (₱15/hr rate):
| Hours | Calculation | Total |
|-------|-------------|-------|
| 1 Hour | 1 × ₱15 | **₱15.00** |
| 2 Hours | 2 × ₱15 | **₱30.00** |
| 3 Hours | 3 × ₱15 | **₱45.00** |
| 4 Hours | 4 × ₱15 | **₱60.00** |

### Code Example:
```javascript
function calculateFixedDuration(hours, hourlyRate) {
    return hours * hourlyRate;
}

// Usage:
const fee = calculateFixedDuration(2, 15); // ₱30.00
```

---

## 3. Open Hour (Pay-as-you-go)

### Description
Customer pays based on **actual time used**, charged in **30-minute steps**.

### Rules:
- **No free time**
- Charged in 30-minute increments
- First 30 minutes: **Half** of hourly rate
- Next 30 minutes: **Full** hourly rate (cumulative total)

### Calculation Logic:
```
Block 1 (0-30 min):  Half-rate
Block 2 (31-60 min): Half-rate (totals to full-rate)
Block 3 (61-90 min): Half-rate
...and so on
```

### Examples (₱15/hr rate):

#### Short Duration:
| Time Used | Calculation | Total |
|-----------|-------------|-------|
| 15 minutes | 15 min × (₱15/30min) | **₱7.50** |
| 30 minutes | 30 min × (₱15/30min) | **₱7.50** |

#### Crossing Into Second Block:
| Time Used | Calculation | Total |
|-----------|-------------|-------|
| 45 minutes | Block 1: ₱7.50 + Block 2: ₱3.75 | **₱11.25** |
| 60 minutes | Block 1: ₱7.50 + Block 2: ₱7.50 | **₱15.00** |

#### Extended Usage:
| Time Used | Calculation | Total |
|-----------|-------------|-------|
| 90 minutes | Block 1: ₱7.50 + Block 2: ₱7.50 + Block 3: ₱7.50 | **₱22.50** |
| 120 minutes | 4 blocks × ₱7.50 | **₱30.00** |

### Code Example:
```javascript
const result = calculateOpenHour(45, 15);
// Returns: { totalFee: 11.25, breakdown: [...] }
```

---

## 4. Overtime (Exceeding Prepaid Hours)

### Description
When a customer exceeds their **prepaid time**, overtime charges apply.

### Rules:
- Charged in **30-minute steps**
- **10-minute free grace period** at the start of each 30-minute block
- After grace: Charges **half-rate** for that block

### Grace Period Pattern:
```
Every 30-minute block:
├─ 0-10 minutes: FREE (Grace)
└─ 11-30 minutes: CHARGED (Half-rate)
```

### Examples (₱15/hr rate):

#### First Overtime Block (0-30 min late):
| Minutes Late | Breakdown | Fee |
|--------------|-----------|-----|
| 5 min | Grace (0-5 min) | **₱0.00** |
| 10 min | Grace (0-10 min) | **₱0.00** |
| 15 min | Grace (0-10 min) + Charged (11-15 min) | **₱7.50** |
| 20 min | Grace (0-10 min) + Charged (11-20 min) | **₱7.50** |
| 30 min | Grace (0-10 min) + Charged (11-30 min) | **₱7.50** |

#### Second Overtime Block (31-60 min late):
| Minutes Late | Breakdown | Fee |
|--------------|-----------|-----|
| 35 min | Block 1: ₱7.50 + Block 2: Grace (31-35 min) | **₱7.50** |
| 40 min | Block 1: ₱7.50 + Block 2: Grace (31-40 min) | **₱7.50** |
| 45 min | Block 1: ₱7.50 + Block 2: Grace + Charged | **₱15.00** |
| 60 min | Block 1: ₱7.50 + Block 2: Charged | **₱15.00** |

#### Extended Overtime (61-90 min late):
| Minutes Late | Breakdown | Total Fee |
|--------------|-----------|-----------|
| 65 min | Block 1: ₱7.50 + Block 2: ₱7.50 + Block 3: Grace | **₱15.00** |
| 70 min | Block 1: ₱7.50 + Block 2: ₱7.50 + Block 3: Grace | **₱15.00** |
| 75 min | 2 full blocks + partial charged | **₱22.50** |
| 90 min | 3 full blocks | **₱22.50** |

### Visual Timeline:
```
Prepaid: [========2 Hours========]
         0                      120 min

Overtime Block 1: [Grace][Charged]
                  120   130      150 min
                   ↑     ↑       ↑
                  Free  Start   Full
                        Charge  Block

Overtime Block 2: [Grace][Charged]
                  150   160      180 min
```

### Code Example:
```javascript
const overtime = calculateOvertime(45, 15);
// Returns: { 
//   totalFee: 15.00, 
//   breakdown: [
//     { block: 1, minutes: 10, type: 'Grace', fee: 0 },
//     { block: 1, minutes: 20, type: 'Half-rate', fee: 7.50 },
//     { block: 2, minutes: 10, type: 'Grace', fee: 0 },
//     { block: 2, minutes: 5, type: 'Half-rate', fee: 7.50 }
//   ]
// }
```

---

## Complete Rental Calculation

### Scenario 1: Fixed-Duration WITHOUT Overtime
```javascript
const rental = {
    type: 'fixed',
    prepaidHours: 2,
    startTime: new Date('2024-01-01 10:00'),
    endTime: new Date('2024-01-01 11:45'), // Only 1h 45min used
    hourlyRate: 15
};

const result = calculateRentalFee(rental);
// Returns:
// {
//   totalFee: 30.00,      // Only prepaid amount
//   prepaidFee: 30.00,
//   overtimeFee: 0,
//   breakdown: { ... }
// }
```

### Scenario 2: Fixed-Duration WITH Overtime
```javascript
const rental = {
    type: 'fixed',
    prepaidHours: 2,
    startTime: new Date('2024-01-01 10:00'),
    endTime: new Date('2024-01-01 12:25'), // 25 min overtime
    hourlyRate: 15
};

const result = calculateRentalFee(rental);
// Returns:
// {
//   totalFee: 37.50,      // Prepaid + Overtime
//   prepaidFee: 30.00,    // 2 hours × ₱15
//   overtimeFee: 7.50,    // 10 min grace + 15 min charged
//   breakdown: { ... }
// }
```

### Scenario 3: Open Hour
```javascript
const rental = {
    type: 'open',
    startTime: new Date('2024-01-01 10:00'),
    endTime: new Date('2024-01-01 10:45'), // 45 minutes
    hourlyRate: 15
};

const result = calculateRentalFee(rental);
// Returns:
// {
//   totalFee: 11.25,      // 30 min × ₱7.50 + 15 min × ₱3.75
//   prepaidFee: 0,
//   overtimeFee: 0,
//   breakdown: { ... }
// }
```

---

## Implementation Files

### Core Module
- **File**: `js/pricing.js`
- **Functions**:
  - `getRatesFromDatabase()` - Fetch current rates
  - `calculateFixedDuration()` - Calculate prepaid fee
  - `calculateOpenHour()` - Calculate pay-as-you-go
  - `calculateOvertime()` - Calculate overtime fees
  - `calculateRentalFee()` - Master calculation function

### Usage in Your App
```html
<!-- Include pricing module -->
<script src="../js/pricing.js"></script>

<script>
// Use the pricing module
const rates = await PricingModule.getRatesFromDatabase();
const fee = PricingModule.calculateRentalFee({
    type: 'fixed',
    prepaidHours: 3,
    startTime: rentalStart,
    endTime: new Date(),
    hourlyRate: rates.medium
});

console.log('Total Fee:', PricingModule.formatFee(fee.totalFee));
</script>
```

---

## Summary Table

| Rental Type | Charging Method | Grace Period | Example (₱15/hr) |
|-------------|----------------|--------------|------------------|
| **Fixed-Duration** | Hours × Rate | No | 2hr = ₱30 |
| **Open Hour** | 30-min blocks, half-rate | No | 45min = ₱11.25 |
| **Overtime** | 30-min blocks, half-rate | 10 min per block | 25min late = ₱7.50 |

---

## Testing Your Implementation

### Test Cases to Verify:

1. **Fixed 1 Hour (₱15/hr)**: Should equal ₱15.00 ✓
2. **Fixed 3 Hours (₱15/hr)**: Should equal ₱45.00 ✓
3. **Open 30 Minutes (₱15/hr)**: Should equal ₱7.50 ✓
4. **Open 60 Minutes (₱15/hr)**: Should equal ₱15.00 ✓
5. **Overtime 10 Minutes**: Should equal ₱0.00 (grace) ✓
6. **Overtime 25 Minutes**: Should equal ₱7.50 ✓
7. **Overtime 40 Minutes**: Should equal ₱7.50 (grace reset) ✓
8. **Overtime 60 Minutes**: Should equal ₱15.00 ✓

### Run Tests:
```javascript
// Open browser console and run:
// Test files located in: tests/pricing.test.js
```

---

## Customer-Friendly Explanation

### For Your Kiosk Display:

**Prepaid Hours**
"Pay upfront! ₱15 per hour"
- 1 Hour: ₱15
- 2 Hours: ₱30
- 3 Hours: ₱45

**Flexible Time**
"Pay for what you use!"
- Up to 30 min: ₱7.50
- Up to 1 hour: ₱15.00

**Running Late?**
"Don't worry! We give you grace time:"
- First 10 minutes: FREE
- After that: Small fee applies

---

## Questions?

This pricing system is designed to be:
- ✅ **Fair** - Grace periods for late returns
- ✅ **Flexible** - Multiple rental options
- ✅ **Transparent** - Clear calculations
- ✅ **Database-driven** - Easy to update rates

Your exact specification has been implemented! 🎯
