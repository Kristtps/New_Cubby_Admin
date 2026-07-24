# Quick Reference Guide - Latest Features

## 🔧 Maintenance Toggle Button

### Visual Reference
```
┌─────────────────────────────────────────────────────────────┐
│ Code │ Size │ Module │ Device │ Status    │ Action          │
├─────────────────────────────────────────────────────────────┤
│ L1   │ S    │ M1     │ DEV-01 │ Available │ [🔧 Set Main.] │ ← Outlined purple
│ L2   │ M    │ M1     │ DEV-01 │ Mainten.  │ [🔧 In Main.]  │ ← Solid purple
│ L3   │ L    │ M2     │ DEV-02 │ Occupied  │ [🔧 Set Main.] │ ← Outlined purple
└─────────────────────────────────────────────────────────────┘
```

### Button States
| Status | Button Text | Button Style | Click Result |
|--------|-------------|--------------|--------------|
| Available | 🔧 Set Maintenance | Outlined Purple | → Maintenance |
| Occupied | 🔧 Set Maintenance | Outlined Purple | → Maintenance |
| Maintenance | 🔧 In Maintenance | Solid Purple | → Available |

### CSS Classes
```css
/* Outlined (OFF state) */
.btn-maintenance.off {
    color: #8b5cf6;
    background: rgba(139,92,246,.08);
    border: 1.5px solid #8b5cf6;
}

/* Solid (ON state) */
.btn-maintenance.on {
    color: #fff;
    background: #8b5cf6;
    border: 1.5px solid #8b5cf6;
}
```

### Usage
1. Navigate to **Lockers** page
2. Find the **Action** column (rightmost)
3. Click button to toggle status
4. Status badge updates immediately
5. Change persists to database

---

## 🔔 Low Balance Notification

### Visual Reference - Toast
```
┌─────────────────────────────────────────────────────┐
│ ⚠️  Low Balance Warning                             │
│                                                      │
│ Device M1 bill compartment is at ₱15.50 —          │
│ below the ₱20 threshold. Please refill.        [×] │
└─────────────────────────────────────────────────────┘
  ↑ Yellow border     ↑ Device name   ↑ Red amount
```

### Visual Reference - Notification Entry
```
┌─────────────────────────────────────────────────────┐
│ ⚠️  Low Bill Compartment Balance    2h ago    ●    │
│                                                      │
│ Device M1 bill compartment balance is critically    │
│ low: ₱15.50. Please refill soon.                    │
│                                                      │
│ Today • 2:30 PM                                      │
└─────────────────────────────────────────────────────┘
  ↑ Yellow icon      ↑ Relative time  ↑ Unread dot
```

### Threshold
```javascript
const LOW_ALERT_THRESHOLD = 20; // ₱20
```

### Trigger Condition
```javascript
// Alert triggers when:
device.change_amount < 20
```

### Priority Levels
| Balance | Priority | Badge Color |
|---------|----------|-------------|
| ₱0 | urgent | Red |
| ₱0.01 - ₱19.99 | high | Yellow |

### Where to Check
1. **Inventory Page** → Toast notification appears automatically
2. **Notifications Page** → Full notification history
3. **Database** → `notifications` table with type `inventory_low_balance`

---

## 📁 File Locations

### Maintenance Toggle
```
pages/lockers.html          → Table structure + Action column
js/script.js                → toggleMaintenance() function
css/styles.css              → .btn-maintenance styles
```

### Low Balance Notification
```
js/inventory.js             → checkLowBalanceAlerts() function
js/notifications-page.js    → Notification display
Database: notifications     → Persistent storage
```

---

## 🎨 Color Codes

### Maintenance Button
```css
Purple: #8b5cf6
Purple Hover: #7c3aed
Purple Light: rgba(139,92,246,.08)
```

### Low Balance Alert
```css
Warning Yellow: #f59e0b
Warning Border: #fbbf24
Danger Red: #ef4444
Background Dark: #1e293b
Text Light: #f1f5f9
Text Muted: #94a3b8
```

---

## ⚙️ Configuration

### Change Maintenance Button Text
```javascript
// In js/script.js, function buildMaintenanceBtn()
const label = isMaint ? '🔧 In Maintenance' : '🔧 Set Maintenance';
```

### Change Low Balance Threshold
```javascript
// In js/inventory.js
const LOW_ALERT_THRESHOLD = 20; // Change this value
```

### Change Toast Position
```javascript
// In js/inventory.js, function showLowBalanceToast()
toast.style.cssText = `
    position: fixed;
    bottom: 24px;  // Change this
    right: 24px;   // Change this
    ...
`;
```

---

## 🔍 Debugging

### Check Maintenance Toggle
```javascript
// Browser console on Lockers page:
console.log('Lockers:', lockerRecords);

// After clicking button, look for:
"✓ Locker L1 status → Maintenance (DB ID: abc123)"
```

### Check Low Balance Alert
```javascript
// Browser console on Inventory page:
console.log('Low balance devices:', 
  inventoryData.filter(d => d.change_amount < 20)
);
```

### Check Database
```sql
-- Verify maintenance status change
SELECT locker_number, status, updated_at 
FROM lockers 
WHERE status = 'Maintenance';

-- Verify low balance notifications
SELECT * FROM notifications 
WHERE type = 'inventory_low_balance' 
ORDER BY created_at DESC;
```

---

## 📊 Database Schema Reference

### Maintenance Toggle
```sql
Table: lockers
  locker_id       UUID PRIMARY KEY
  locker_number   TEXT
  status          TEXT  -- 'Available', 'Occupied', 'Maintenance', 'Payment Required'
  module_id       UUID
  size_type_id    INTEGER
```

### Low Balance Notification
```sql
Table: notifications
  notification_id  UUID PRIMARY KEY
  type            TEXT  -- 'inventory_low_balance'
  title           TEXT
  message         TEXT
  related_id      UUID  -- device_inventory.inventory_id
  related_table   TEXT  -- 'device_inventory'
  priority        TEXT  -- 'urgent' or 'high'
  is_read         BOOLEAN
  created_at      TIMESTAMP
```

---

## 🎯 Common Tasks

### Task: Change a locker to maintenance mode
1. Go to **Lockers** page
2. Find locker row
3. Click **🔧 Set Maintenance** in Action column
4. Confirm status badge changes to "Maintenance"

### Task: View low balance alerts
1. Go to **Notifications** page
2. Look for ⚠️ warning icon notifications
3. Click to see full details
4. Mark as read after addressing

### Task: Refill a low balance device
1. Note device name from notification
2. Go to **Inventory** page
3. Find device in table
4. Click **Refill** button in Actions column
5. Enter refill amount
6. Confirm transaction

---

## ✨ Features Summary

| Feature | Page | Status | Database Connected |
|---------|------|--------|-------------------|
| Maintenance Toggle | Lockers | ✅ Working | ✅ Yes |
| Low Balance Alert | Inventory | ✅ Working | ✅ Yes |
| Notification Display | Notifications | ✅ Working | ✅ Yes |
| Theme Toggle | All Pages | ✅ Working | ✅ LocalStorage |
| Inventory History | Inventory | ✅ Working | ✅ Yes |
| Deduct/Refill | Inventory | ✅ Working | ✅ Yes |

---

**Last Updated**: Current Session
**Status**: All features implemented and verified ✅
