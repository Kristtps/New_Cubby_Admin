# CoinCubby Admin - Notifications System Guide

## Overview
The notifications system automatically tracks important events in your CoinCubby system and notifies admins in real-time.

## Setup

### 1. Create Database Tables and Triggers
Run the SQL script in your Supabase SQL Editor:
```
docs/CREATE_NOTIFICATIONS_SYSTEM.sql
```

This will create:
- `notifications` table
- Automatic triggers for various events
- Functions to generate notifications
- Row Level Security policies

### 2. Files Created
- **SQL**: `docs/CREATE_NOTIFICATIONS_SYSTEM.sql`
- **Page**: `pages/notifications.html`
- **JavaScript**: `js/notifications.js`, `js/notifications-page.js`
- **CSS**: Added to `css/styles.css`

## Notification Types

### 1. **New Rental** (`new_rental`)
- **When**: Customer starts a new rental
- **Priority**: Normal
- **Message**: Shows customer name and locker number
- **Example**: "Customer 'John Doe' started renting locker L1"

### 2. **New Feedback** (`new_feedback`)
- **When**: Customer submits feedback
- **Priority**: High (if rating ≤ 2), Normal (otherwise)
- **Message**: Shows customer name and star rating
- **Example**: "Customer 'Jane Smith' left a 5-star review"
- **Special**: Low ratings (1-2 stars) get HIGH priority

### 3. **New Customer** (`new_customer`)
- **When**: New customer registers
- **Priority**: Low
- **Message**: Shows customer name
- **Example**: "New customer 'Mike Johnson' has registered"

### 4. **Locker Maintenance** (`locker_maintenance`)
- **When**: Locker status changed to 'maintenance'
- **Priority**: High
- **Message**: Shows locker number
- **Example**: "Locker M5 has been marked for maintenance"

### 5. **Rental Completed** (`rental_completed`)
- **When**: Rental is completed (end_time is set)
- **Priority**: Low
- **Message**: Shows customer, locker, and duration
- **Example**: "Customer 'Sarah Lee' completed rental of locker S3 (Duration: 2 hours)"

## Features

### Notification Bell 🔔
- Located in top-right corner of dashboard
- Shows count of unread notifications
- Red badge with pulsing animation
- Click to view all notifications

### Notifications Page
- **View All**: See all notifications in chronological order
- **Unread Indicator**: Unread notifications highlighted with green background
- **Priority Badges**: Visual indicators for urgent/high priority items
- **Mark as Read**: Click any notification to mark it as read
- **Bulk Actions**:
  - Mark All as Read
  - Clear All Read Notifications

### Auto-Refresh
- Checks for new notifications every 30 seconds
- Updates badge count automatically
- No page reload required

## Priority Levels

| Priority | Color | Use Case |
|----------|-------|----------|
| **Urgent** | Red | Critical issues requiring immediate action |
| **High** | Yellow | Important items needing attention soon |
| **Normal** | Blue | Standard notifications |
| **Low** | Gray | Informational updates |

## Database Schema

```sql
notifications (
    notification_id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    related_table VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT now(),
    read_at TIMESTAMP
)
```

## How It Works

### Automatic Triggers
1. **Event Occurs** (e.g., new rental created)
2. **Trigger Fires** (e.g., `trigger_notify_new_rental`)
3. **Function Executes** (e.g., `notify_new_rental()`)
4. **Notification Created** in `notifications` table
5. **Admin Badge Updates** within 30 seconds
6. **Admin Views** in notifications page

### Manual Notifications
You can also create notifications manually:

```sql
INSERT INTO notifications (type, title, message, priority, related_id, related_table)
VALUES (
    'custom',
    'System Maintenance',
    'Scheduled maintenance will occur tonight at 2 AM',
    'high',
    NULL,
    NULL
);
```

## API Usage

### JavaScript Functions

```javascript
// Check for unread notifications
await window.notificationSystem.checkUnread();

// Get unread count
const count = await window.notificationSystem.getUnreadCount();

// Update badge manually
window.notificationSystem.updateBadge(5);
```

### SQL Queries

```sql
-- Get all unread notifications
SELECT * FROM notifications 
WHERE is_read = false 
ORDER BY created_at DESC;

-- Get unread count by type
SELECT type, COUNT(*) as count 
FROM notifications 
WHERE is_read = false 
GROUP BY type;

-- Mark as read
UPDATE notifications 
SET is_read = true, read_at = now() 
WHERE notification_id = 'uuid-here';

-- Delete old notifications (30+ days)
DELETE FROM notifications 
WHERE is_read = true 
AND created_at < now() - INTERVAL '30 days';
```

## Customization

### Add New Notification Type

1. **Create Function**:
```sql
CREATE OR REPLACE FUNCTION notify_your_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (type, title, message, priority)
    VALUES ('your_event', 'Title Here', 'Message here', 'normal');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

2. **Create Trigger**:
```sql
CREATE TRIGGER trigger_notify_your_event
    AFTER INSERT ON your_table
    FOR EACH ROW
    EXECUTE FUNCTION notify_your_event();
```

3. **Add Icon** in `notifications-page.js`:
```javascript
const icons = {
    'your_event': '<svg>...</svg>'
};
```

## Best Practices

1. **Regular Cleanup**: Delete old read notifications monthly
2. **Priority Usage**: Reserve URGENT for critical issues only
3. **Clear Messages**: Write descriptive notification messages
4. **Monitor Volume**: If too many notifications, adjust triggers
5. **Test Triggers**: Insert test data to verify notifications work

## Troubleshooting

### Badge Not Updating
1. Check browser console for errors
2. Verify Supabase connection
3. Check `notifications` table exists
4. Verify triggers are active

### No Notifications Appearing
1. Check if triggers are created: 
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name LIKE 'trigger_notify%';
   ```
2. Verify functions exist:
   ```sql
   SELECT * FROM information_schema.routines 
   WHERE routine_name LIKE 'notify_%';
   ```
3. Test manually:
   ```sql
   INSERT INTO rentals (...) VALUES (...);
   -- Check if notification was created
   SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;
   ```

### Performance Issues
If you have thousands of notifications:
1. Add indexes (already included in SQL script)
2. Implement pagination in notifications page
3. Auto-delete old read notifications
4. Limit query to last 100 notifications

## Security

- Row Level Security (RLS) enabled
- Service role has full access
- Authenticated users can read/insert
- Consider adding admin-only policies

## Future Enhancements

Potential improvements:
- Email notifications for urgent items
- Push notifications (browser)
- Notification preferences/settings
- Notification categories/filters
- Export notifications to CSV
- Notification analytics dashboard

---

**Quick Start**: Run `CREATE_NOTIFICATIONS_SYSTEM.sql` in Supabase, then test by creating a new rental or feedback entry!
