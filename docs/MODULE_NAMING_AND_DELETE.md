# Module Naming and Delete Functionality

## Overview
This document explains how module naming and deletion works in the CoinCubby Admin system.

## Module Naming System

### Persistent Counter
The system uses a **persistent counter** stored in localStorage that **never resets**, even when modules are deleted. This ensures:
- Unique sequential module names
- No naming conflicts
- Clear audit trail of module creation history

### How It Works

#### Example Scenario:
1. **Initial state**: You have Module 1 and Module 2
2. **Delete Module 2**: Module 2 is removed from the database
3. **Add new module**: The system creates Module **3** (not Module 2)
4. **Delete Module 1 and 3**: All modules are deleted
5. **Add new module**: The system creates Module **4**

### Counter Storage
- **Storage Key**: `coincubby_module_counter`
- **Location**: Browser localStorage
- **Type**: Integer counter
- **Initialization**: Automatically initialized based on highest existing module number in database

### Code Implementation

```javascript
function getNextModuleNumber() {
    // Retrieves and increments persistent counter
    // Returns next sequential module number
}
```

## Module Deletion with Cascade

### What Happens When You Delete a Module

When a module is deleted, the system automatically:

1. **Delete all lockers** belonging to that module first
2. **Delete the module** record itself
3. **Log the action** in audit log
4. **Update UI** by removing rows from the table
5. **Update local records** in memory

### Database CASCADE DELETE

The deletion follows proper foreign key constraints:
```
lockers.module_id → modules.module_id
```

**Important**: Lockers MUST be deleted before the module, otherwise database constraint violations will occur.

### Code Flow

```javascript
async function confirmDeleteModule() {
    // 1. Delete all lockers with this module_id
    await client.from('lockers').delete().eq('module_id', moduleId);
    
    // 2. Delete the module
    await client.from('modules').delete().eq('module_id', moduleId);
    
    // 3. Log configuration change
    await logConfigChangeEvent('Module Deleted', ...);
    
    // 4. Update UI
    // Remove rows from table
    
    // 5. Update local records
    lockerRecords = lockerRecords.filter(...);
}
```

## User Interface

### Add Module
- **Button**: "Add Module" (green button)
- **Action**: Opens modal to configure new module
- **Result**: Creates new module with sequential number

### Delete Module
- **Button**: "Delete Module" (red button)
- **Action**: Opens dropdown to select module to delete
- **Warning**: Shows confirmation dialog
- **Result**: Deletes module and all associated lockers

### Warning Messages
When deleting a module, users see:
```
⚠️ Warning: This will delete the entire module and all its lockers. 
This action cannot be undone.
```

## Administrative Functions

### Reset Module Counter
If the counter gets out of sync, you can reset it via browser console:

```javascript
resetModuleCounter()
```

This will:
- Scan all existing modules in the database
- Find the highest module number
- Set the counter to that value
- Return the new counter value

## Technical Details

### localStorage Key
```
coincubby_module_counter
```

### Database Tables Affected
1. **modules** - Module records
2. **lockers** - Locker records (cascade deleted)
3. **audit_logs** - Configuration change logs (if enabled)

### Error Handling
- If localStorage fails, falls back to calculating from existing modules
- If database operations fail, shows error message to user
- Transactions are not rolled back automatically (no DB transaction wrapper)

## Best Practices

1. **Never manually modify** the `coincubby_module_counter` in localStorage
2. **Always use the UI** to delete modules (ensures cascade delete)
3. **Check audit logs** after module deletions to verify
4. **Backup data** before deleting modules with active rentals

## Troubleshooting

### Counter is Wrong
Run `resetModuleCounter()` in browser console to recalculate from database.

### Lockers Not Deleted
Check foreign key constraints in database. The cascade delete logic is in the application layer, not database triggers.

### Module Number Gaps
This is **expected behavior**. Module numbers should have gaps after deletions. This is intentional and maintains audit integrity.

## Future Improvements

Potential enhancements:
- Database-level cascade delete constraints
- Transaction wrappers for atomic operations
- Module archival instead of hard delete
- Soft delete with restore capability
