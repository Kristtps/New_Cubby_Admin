-- ================================================================
-- CoinCubby Admin - Notifications System Setup
-- ================================================================
-- This script creates a comprehensive notification system for admin
-- Events tracked: New Rentals, New Feedback, New Customers, 
-- Low Ratings, Maintenance Needed, etc.
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
COMMENT ON COLUMN public.notifications.type IS 'Type of notification (new_rental, new_feedback, new_customer, etc.)';
COMMENT ON COLUMN public.notifications.title IS 'Short notification title';
COMMENT ON COLUMN public.notifications.message IS 'Detailed notification message';
COMMENT ON COLUMN public.notifications.related_id IS 'ID of the related record (rental_id, feedback_id, etc.)';
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

-- Function: Create notification for new rental
CREATE OR REPLACE FUNCTION notify_new_rental()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
    locker_code TEXT;
BEGIN
    -- Get customer name
    SELECT full_name INTO customer_name
    FROM customers
    WHERE customer_id = NEW.customer_id;
    
    -- Get locker code
    SELECT locker_number INTO locker_code
    FROM lockers
    WHERE locker_id = NEW.locker_id;
    
    -- Create notification
    INSERT INTO notifications (
        type,
        title,
        message,
        related_id,
        related_table,
        priority
    ) VALUES (
        'new_rental',
        'New Rental Started',
        'Customer "' || COALESCE(customer_name, 'Unknown') || '" started renting locker ' || COALESCE(locker_code, 'Unknown'),
        NEW.rental_id,
        'rentals',
        'normal'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Function: Create notification for locker maintenance
CREATE OR REPLACE FUNCTION notify_locker_maintenance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if status changed TO maintenance
    IF NEW.status = 'maintenance' AND (OLD.status IS NULL OR OLD.status != 'maintenance') THEN
        INSERT INTO notifications (
            type,
            title,
            message,
            related_id,
            related_table,
            priority
        ) VALUES (
            'locker_maintenance',
            'Locker Needs Maintenance',
            'Locker ' || NEW.locker_number || ' has been marked for maintenance',
            NEW.locker_id,
            'lockers',
            'high'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Create notification for completed rental
CREATE OR REPLACE FUNCTION notify_rental_completed()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
    locker_code TEXT;
    rental_duration INTERVAL;
    duration_text TEXT;
BEGIN
    -- Only trigger when rental is completed (end_time is set)
    IF NEW.end_time IS NOT NULL AND (OLD.end_time IS NULL OR OLD.end_time != NEW.end_time) THEN
        -- Get customer name
        SELECT full_name INTO customer_name
        FROM customers
        WHERE customer_id = NEW.customer_id;
        
        -- Get locker code
        SELECT locker_number INTO locker_code
        FROM lockers
        WHERE locker_id = NEW.locker_id;
        
        -- Calculate duration
        rental_duration := NEW.end_time - NEW.start_time;
        duration_text := EXTRACT(EPOCH FROM rental_duration)::INTEGER / 3600 || ' hours';
        
        -- Create notification
        INSERT INTO notifications (
            type,
            title,
            message,
            related_id,
            related_table,
            priority
        ) VALUES (
            'rental_completed',
            'Rental Completed',
            'Customer "' || COALESCE(customer_name, 'Unknown') || '" completed rental of locker ' || COALESCE(locker_code, 'Unknown') || ' (Duration: ' || duration_text || ')',
            NEW.rental_id,
            'rentals',
            'low'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 3. CREATE TRIGGERS
-- ================================================================

-- Trigger for new rentals
DROP TRIGGER IF EXISTS trigger_notify_new_rental ON rentals;
CREATE TRIGGER trigger_notify_new_rental
    AFTER INSERT ON rentals
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_rental();

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

-- Trigger for locker maintenance
DROP TRIGGER IF EXISTS trigger_notify_locker_maintenance ON lockers;
CREATE TRIGGER trigger_notify_locker_maintenance
    AFTER UPDATE ON lockers
    FOR EACH ROW
    EXECUTE FUNCTION notify_locker_maintenance();

-- Trigger for completed rentals
DROP TRIGGER IF EXISTS trigger_notify_rental_completed ON rentals;
CREATE TRIGGER trigger_notify_rental_completed
    AFTER UPDATE ON rentals
    FOR EACH ROW
    EXECUTE FUNCTION notify_rental_completed();

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

-- Policy: Admins can view all notifications
-- Uncomment if you have admin role system
-- CREATE POLICY "Admins can view all notifications"
--     ON public.notifications
--     FOR SELECT
--     TO authenticated
--     USING (
--         EXISTS (
--             SELECT 1 FROM admin_accounts 
--             WHERE admin_id = auth.uid() 
--             AND role = 'admin'
--         )
--     );

-- ================================================================
-- 5. GRANT PERMISSIONS
-- ================================================================

GRANT ALL ON public.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- ================================================================
-- 6. NOTIFICATION TYPES REFERENCE
-- ================================================================

/*
Notification Types:
- new_rental: When a new rental is created
- rental_completed: When a rental is completed
- new_feedback: When customer submits feedback
- new_customer: When a new customer registers
- locker_maintenance: When a locker needs maintenance
- low_rating: When feedback rating is 1-2 stars (handled by new_feedback)
- high_rating: When feedback rating is 5 stars (handled by new_feedback)

Priority Levels:
- low: Informational notifications
- normal: Standard notifications
- high: Important notifications requiring attention
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
-- 8. VERIFICATION
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
-- 9. CLEANUP (if needed)
-- ================================================================
-- Uncomment to drop everything (WARNING: This will delete all data!)

/*
-- Drop triggers
DROP TRIGGER IF EXISTS trigger_notify_new_rental ON rentals;
DROP TRIGGER IF EXISTS trigger_notify_new_feedback ON feedback;
DROP TRIGGER IF EXISTS trigger_notify_new_customer ON customers;
DROP TRIGGER IF EXISTS trigger_notify_locker_maintenance ON lockers;
DROP TRIGGER IF EXISTS trigger_notify_rental_completed ON rentals;

-- Drop functions
DROP FUNCTION IF EXISTS notify_new_rental();
DROP FUNCTION IF EXISTS notify_new_feedback();
DROP FUNCTION IF EXISTS notify_new_customer();
DROP FUNCTION IF EXISTS notify_locker_maintenance();
DROP FUNCTION IF EXISTS notify_rental_completed();

-- Drop table
DROP TABLE IF EXISTS public.notifications CASCADE;
*/
