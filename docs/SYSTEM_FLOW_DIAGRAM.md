# System Flow Diagrams

## 🔧 Maintenance Toggle Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOCKERS PAGE LOADS                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Fetch all lockers from database                                 │
│  • Query: SELECT * FROM lockers JOIN modules                     │
│  • Store in lockerRecords array                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Render table with 6 columns                                     │
│  • Code, Size, Module, Device, Status, ACTION                    │
│  • Each row shows maintenance button                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  USER CLICKS MAINTENANCE BUTTON                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  toggleMaintenance() function executes                           │
│                                                                   │
│  Step 1: Disable button (prevent double-click)                   │
│  Step 2: Read current status from row                            │
│  Step 3: Determine new status                                    │
│         • If Maintenance → Available                             │
│         • If Available/Occupied → Maintenance                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  OPTIMISTIC UI UPDATE (immediate feedback)                       │
│  • Update button text and style                                  │
│  • Update status badge color and text                            │
│  • Update row data attribute                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  DATABASE UPDATE                                                 │
│  • Find locker_id from lockerRecords                             │
│  • Execute: UPDATE lockers SET status = 'Maintenance'            │
│             WHERE locker_id = '<uuid>'                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
          ┌─────────▼──┐  ┌──▼─────────┐
          │  SUCCESS   │  │   ERROR    │
          └─────────┬──┘  └──┬─────────┘
                    │         │
                    │         ▼
                    │  ┌─────────────────────────────────────────┐
                    │  │  ROLLBACK UI                            │
                    │  │  • Revert button to original text       │
                    │  │  • Revert status badge                  │
                    │  │  • Show error alert                     │
                    │  └─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Update in-memory lockerRecords array                            │
│  • locker.status = newStatus                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Re-enable button                                                │
│  • Button clickable again                                        │
│  • User can toggle again if needed                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔔 Low Balance Notification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVENTORY PAGE LOADS                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Fetch device inventory from database                            │
│  • Query: SELECT * FROM device_inventory JOIN devices            │
│  • Returns: device_id, device_name, change_amount, etc.          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Render inventory table                                          │
│  • Display all devices with balances                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  checkLowBalanceAlerts(inventoryData)                            │
│  • Filter devices where change_amount < 20                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────┴─────┐
                    │          │
         ┌──────────▼─┐   ┌───▼──────────┐
         │ NO DEVICES │   │ LOW DEVICES  │
         │  BELOW 20  │   │    FOUND     │
         └────────────┘   └───┬──────────┘
              (END)            │
                               ▼
                    ┌──────────────────────────┐
                    │  FOR EACH LOW DEVICE     │
                    └──────────┬───────────────┘
                               │
                         ┌─────┴─────┐
                         │           │
                         ▼           ▼
        ┌────────────────────┐  ┌────────────────────────┐
        │  SHOW TOAST        │  │  CREATE DB NOTIFICATION│
        │  NOTIFICATION      │  │                         │
        └────────┬───────────┘  └────────┬───────────────┘
                 │                       │
                 ▼                       ▼
    ┌──────────────────────┐  ┌─────────────────────────────┐
    │  Create toast div    │  │  Check for duplicates        │
    │  • Position bottom-  │  │  • Query today's notifs      │
    │    right             │  │  • Skip if already exists    │
    │  • Yellow border     │  └────────┬────────────────────┘
    │  • Device name       │           │
    │  • Balance in red    │           ▼
    │  • Close button      │  ┌─────────────────────────────┐
    └──────────┬───────────┘  │  INSERT INTO notifications  │
               │               │  • type: 'inventory_low_    │
               │               │    balance'                 │
               │               │  • title: 'Low Bill...'     │
               │               │  • message: Device details  │
               │               │  • priority: urgent/high    │
               │               │  • related_id: inventory_id │
               │               └────────┬────────────────────┘
               │                        │
               └────────────┬───────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  USER SEES BOTH:            │
              │  1. Toast on Inventory page │
              │  2. Entry in Notifications  │
              └─────────────────────────────┘
```

---

## 📊 Data Flow Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                          │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │   lockers   │  │ device_inventory │  │  notifications   │    │
│  └──────┬──────┘  └────────┬─────────┘  └────────┬─────────┘    │
└─────────┼───────────────────┼──────────────────────┼──────────────┘
          │                   │                      │
          │                   │                      │
┌─────────▼───────────────────▼──────────────────────▼──────────────┐
│                    SUPABASE CLIENT (JS)                            │
│  • Initialized in supabase-client.js                               │
│  • Manages connections and authentication                          │
│  • Provides real-time subscriptions                                │
└─────────┬───────────────────┬──────────────────────┬──────────────┘
          │                   │                      │
          │                   │                      │
┌─────────▼────────┐ ┌───────▼────────┐ ┌──────────▼───────────┐
│  script.js       │ │ inventory.js   │ │ notifications-       │
│                  │ │                │ │ page.js              │
│ • toggleMain-    │ │ • checkLow-    │ │                      │
│   tenance()      │ │   Balance()    │ │ • loadNotifi-        │
│ • renderLockers  │ │ • showToast()  │ │   cations()          │
│   Table()        │ │ • render       │ │ • renderNotifi-      │
│                  │ │   Inventory    │ │   cations()          │
└─────────┬────────┘ └────────┬───────┘ └──────────┬───────────┘
          │                   │                     │
          │                   │                     │
┌─────────▼───────────────────▼─────────────────────▼──────────────┐
│                         BROWSER DOM                                │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐    │
│  │ lockers.html │  │ inventory.html  │  │notifications.html│    │
│  └──────────────┘  └─────────────────┘  └──────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔄 User Interaction Flows

### Maintenance Toggle Journey:
```
Admin User
    │
    ├─► Opens Lockers page
    │       │
    │       ├─► Sees list of all lockers
    │       │
    │       └─► Finds locker needing maintenance
    │
    ├─► Clicks "🔧 Set Maintenance" button
    │       │
    │       ├─► Button instantly changes to "🔧 In Maintenance"
    │       │
    │       ├─► Status badge turns yellow/orange
    │       │
    │       └─► Database updates in background
    │
    ├─► Performs physical maintenance on locker
    │
    └─► Clicks "🔧 In Maintenance" to restore
            │
            ├─► Button changes back to "🔧 Set Maintenance"
            │
            ├─► Status badge turns green (Available)
            │
            └─► Locker ready for customers
```

### Low Balance Alert Journey:
```
System (Automatic)
    │
    ├─► Every time Inventory page loads
    │       │
    │       └─► Checks all device balances
    │
    ├─► Finds Device M1 at ₱15 (< ₱20 threshold)
    │       │
    │       ├─► Creates toast notification
    │       │       │
    │       │       └─► Admin sees warning popup
    │       │
    │       └─► Creates database notification
    │               │
    │               └─► Persists for later review
    │
Admin User
    │
    ├─► Sees toast on Inventory page
    │       │
    │       └─► Notes which device is low
    │
    ├─► Goes to Notifications page (optional)
    │       │
    │       └─► Reviews all low balance alerts
    │
    ├─► Returns to Inventory page
    │
    ├─► Clicks "Refill" button for Device M1
    │       │
    │       ├─► Enters refill amount
    │       │
    │       └─► Confirms transaction
    │
    └─► Balance now above ₱20 → No more alerts
```

---

## 🎯 Component Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                         APP STRUCTURE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐                                              │
│  │  Login Page    │                                              │
│  │  (login.html)  │                                              │
│  └───────┬────────┘                                              │
│          │ Authentication                                        │
│          ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              Main Admin Panel                        │        │
│  │  ┌────────────────────────────────────────────────┐ │        │
│  │  │          Sidebar (Navigation)                   │ │        │
│  │  │  • Overview • Lockers • Customers              │ │        │
│  │  │  • Transactions • Rentals • Inventory          │ │        │
│  │  │  • Rates • Reports • Feedback • Audit          │ │        │
│  │  └────────────────────────────────────────────────┘ │        │
│  │                                                       │        │
│  │  ┌────────────────────────────────────────────────┐ │        │
│  │  │            Content Area                         │ │        │
│  │  │                                                  │ │        │
│  │  │  ┌──────────────┐  ┌───────────────────┐      │ │        │
│  │  │  │ Lockers Page │  │ Inventory Page    │      │ │        │
│  │  │  │              │  │                   │      │ │        │
│  │  │  │ • Table with │  │ • Device balances │      │ │        │
│  │  │  │   Action col │  │ • Refill/Deduct   │      │ │        │
│  │  │  │ • Mainten-   │  │ • Low balance     │      │ │        │
│  │  │  │   ance button│  │   toast alerts    │      │ │        │
│  │  │  └──────┬───────┘  └─────────┬─────────┘      │ │        │
│  │  │         │                     │                 │ │        │
│  │  │         └─────────┬───────────┘                 │ │        │
│  │  │                   │                             │ │        │
│  │  │                   ▼                             │ │        │
│  │  │         ┌──────────────────┐                   │ │        │
│  │  │         │ Notifications    │                   │ │        │
│  │  │         │ Page             │                   │ │        │
│  │  │         │ • Shows alerts   │                   │ │        │
│  │  │         │ • Mark as read   │                   │ │        │
│  │  │         │ • Filter/search  │                   │ │        │
│  │  │         └──────────────────┘                   │ │        │
│  │  └────────────────────────────────────────────────┘ │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Overview

```
┌────────────────────────────────────────────────────────────────┐
│                      SUPABASE TABLES                            │
└────────────────────────────────────────────────────────────────┘

╔════════════════╗
║    lockers     ║  ← Maintenance toggle writes here
╠════════════════╣
║ locker_id      ║ (PK, UUID)
║ locker_number  ║ (TEXT) Display code (L1, M2, etc.)
║ status         ║ (TEXT) 'Available', 'Occupied', 'Maintenance'
║ module_id      ║ (FK → modules)
║ size_type_id   ║ (FK → storage_size_type)
║ device_id      ║ (FK → devices)
╚════════════════╝
        │
        │ References
        ▼
╔════════════════╗
║    modules     ║
╠════════════════╣
║ module_id      ║ (PK)
║ name           ║ (TEXT) M1, M2, etc.
╚════════════════╝

╔══════════════════════╗
║  device_inventory    ║  ← Low balance check reads here
╠══════════════════════╣
║ inventory_id         ║ (PK, UUID)
║ device_id            ║ (FK → devices)
║ change_amount        ║ (NUMERIC) Bill compartment balance
║ coin_amount          ║ (NUMERIC) Coin balance
║ last_refill_date     ║ (TIMESTAMP)
╚══════════════════════╝
        │
        │ Triggers alert when change_amount < 20
        │
        ▼
╔══════════════════════╗
║   notifications      ║  ← Low balance alert creates here
╠══════════════════════╣
║ notification_id      ║ (PK, UUID)
║ type                 ║ (TEXT) 'inventory_low_balance'
║ title                ║ (TEXT) Alert title
║ message              ║ (TEXT) Alert message
║ related_id           ║ (UUID) → device_inventory
║ related_table        ║ (TEXT) 'device_inventory'
║ priority             ║ (TEXT) 'urgent' or 'high'
║ is_read              ║ (BOOLEAN) false by default
║ created_at           ║ (TIMESTAMP) Auto
║ read_at              ║ (TIMESTAMP) Nullable
╚══════════════════════╝
```

---

**End of System Flow Diagrams** 📊
