-- ================================================================
-- CoinCubby Admin - Simplified Notifications System
-- ================================================================
-- This creates notifications only for tables that exist:
-- - feedback
-- - customers
-- ================================================================

-- ================================================================
-- 1. CREATE NOTIFICATIONS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    notification_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    related_id uuid NULL,
    related_table character varying(50) NULL,
    is_read boolean NOT NULL DEFAULT false,
    priority character varying(20) NOT NULL DEFAULT 'normal',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    read_at timestamp with time zone NULL,
    
    CONSTRAINT notifications_pkey PRIMARY KEY (notification_id),
    CONSTRAINT notifications_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
) TABLESPACE pg_default;

-- Add comments
COMMENT ON TABLE public.notifications IS 'Admin notifications for various system events';
COMMENT ON COLUMN public.notifications.notification_id IS 'Unique identifier for the notification';
COMMENT ON COLUMN public.notifications.type IS 'Type of notification (new_feedback, new_customer, etc.)';
COMMENT ON COLUMN public.notifications.title IS 'Short notification title';
COMMENT ON COLUMN public.notifications.message IS 'Detailed notification message';
COMMENT ON COLUMN public.notifications.related_id IS 'ID of the related record (feedback_id, customer_id, etc.)';
COMMENT ON COLUMN public.notifications.related_table IS 'Table name of the related record';
COMMENT ON COLUMN public.notifications.is_read IS 'Whether the notification has been read by admin';
COMMENT ON COLUMN public.notifications.priority IS 'Notification priority level';
COMMENT ON COLUMN public.notifications.created_at IS 'When the notification was created';
COMMENT ON COLUMN public.notifications.read_at IS 'When the notification was marked as read';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);

-- ================================================================
-- 2. CREATE NOTIFICATION FUNCTIONS
-- ================================================================

-- Function: Create notification for new feedback
CREATE OR REPLACE FUNCTION notify_new_feedback()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
    rating_text TEXT;
BEGIN
    -- Get customer name
    SELECT full_name INTO customer_name
    FROM customers
    WHERE customer_id = NEW.customer_id;
    
    -- Determine priority based on rating
    IF NEW.rating <= 2 THEN
        rating_text := 'LOW RATING ⚠️';
    ELSIF NEW.rating = 5 THEN
        rating_text := 'EXCELLENT RATING ⭐';
    ELSE
        rating_text := 'New Rating';
    END IF;
    
    -- Create notification
    INSERT INTO notifications (
        type,
        title,
        message,
        related_id,
        related_table,
        priority
    ) VALUES (
        'new_feedback',
        rating_text,
        'Customer "' || COALESCE(customer_name, 'Unknown') || '" left a ' || NEW.rating || '-star review',
        NEW.feedback_id,
        'feedback',
        CASE 
            WHEN NEW.rating <= 2 THEN 'high'
            ELSE 'normal'
        END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Create notification for new customer
CREATE OR REPLACE FUNCTION notify_new_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification
    INSERT INTO notifications (
        type,
        title,
        message,
        related_id,
        related_table,
        priority
    ) VALUES (
        'new_customer',
        'New Customer Registered',
        'New customer "' || NEW.full_name || '" has registered',
        NEW.customer_id,
        'customers',
        'low'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 3. CREATE TRIGGERS
-- ================================================================

-- Trigger for new feedback
DROP TRIGGER IF EXISTS trigger_notify_new_feedback ON feedback;
CREATE TRIGGER trigger_notify_new_feedback
    AFTER INSERT ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_feedback();

-- Trigger for new customers
DROP TRIGGER IF EXISTS trigger_notify_new_customer ON customers;
CREATE TRIGGER trigger_notify_new_customer
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_customer();

-- ================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to notifications"
    ON public.notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ================================================================
-- 5. GRANT PERMISSIONS
-- ================================================================

GRANT ALL ON public.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- ================================================================
-- 6. NOTIFICATION TYPES (Currently Supported)
-- ================================================================

/*
Notification Types:
- new_feedback: When customer submits feedback
- new_customer: When a new customer registers

Priority Levels:
- low: Informational notifications
- normal: Standard notifications
- high: Important notifications requiring attention (low ratings)
- urgent: Critical notifications requiring immediate action
*/

-- ================================================================
-- 7. SAMPLE QUERIES
-- ================================================================

-- Get all unread notifications (most recent first)
-- SELECT * FROM notifications WHERE is_read = false ORDER BY created_at DESC;

-- Get unread notification count
-- SELECT COUNT(*) FROM notifications WHERE is_read = false;

-- Get unread count by type
-- SELECT type, COUNT(*) as count FROM notifications WHERE is_read = false GROUP BY type;

-- Mark notification as read
-- UPDATE notifications SET is_read = true, read_at = now() WHERE notification_id = 'uuid-here';

-- Mark all notifications as read
-- UPDATE notifications SET is_read = true, read_at = now() WHERE is_read = false;

-- Get notifications from last 24 hours
-- SELECT * FROM notifications WHERE created_at > now() - INTERVAL '24 hours' ORDER BY created_at DESC;

-- Get high priority unread notifications
-- SELECT * FROM notifications WHERE is_read = false AND priority IN ('high', 'urgent') ORDER BY created_at DESC;

-- Delete old read notifications (older than 30 days)
-- DELETE FROM notifications WHERE is_read = true AND created_at < now() - INTERVAL '30 days';

-- ================================================================
-- 8. TEST THE SYSTEM
-- ================================================================

-- Insert a test feedback to trigger notification
-- INSERT INTO feedback (transaction_id, customer_id, rating, comment)
-- VALUES (
--     (SELECT transaction_id FROM transactions LIMIT 1),
--     (SELECT customer_id FROM customers LIMIT 1),
--     2,
--     'Test low rating - should create HIGH priority notification'
-- );

-- Check if notification was created
-- SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;

-- ================================================================
-- 9. VERIFICATION
-- ================================================================

-- Check if table was created
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Check if triggers were created
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_notify%';

-- Check if functions were created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name LIKE 'notify_%'
AND routine_schema = 'public';

-- ================================================================
-- 10. MANUALLY CREATE NOTIFICATIONS
-- ================================================================

-- You can manually create notifications for any event:

/*
-- General notification
INSERT INTO notifications (type, title, message, priority)
VALUES ('system', 'System Update', 'System will be updated tonight at 2 AM', 'normal');

-- Custom high priority notification
INSERT INTO notifications (type, title, message, priority)
VALUES ('alert', 'Important Alert', 'Please check locker maintenance status', 'high');
*/

-- ================================================================
-- 11. CLEANUP (if needed)
-- ================================================================
-- Uncomment to drop everything (WARNING: This will delete all data!)

/*
-- Drop triggers
DROP TRIGGER IF EXISTS trigger_notify_new_feedback ON feedback;
DROP TRIGGER IF EXISTS trigger_notify_new_customer ON customers;

-- Drop functions
DROP FUNCTION IF EXISTS notify_new_feedback();
DROP FUNCTION IF EXISTS notify_new_customer();

-- Drop table
DROP TABLE IF EXISTS public.notifications CASCADE;
*/
