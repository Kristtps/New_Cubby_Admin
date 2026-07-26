-- ====================================================================
-- 🔧 COINCUBBY - UPDATE NOTIFICATION TERMINOLOGY TO COIN CHANGE
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO UPDATE EXISTING NOTIFICATIONS
-- ====================================================================

UPDATE public.notifications
SET title = REPLACE(title, 'Bill Compartment', 'Coin Change'),
    message = REPLACE(message, 'bill compartment', 'coin change')
WHERE title LIKE '%Bill Compartment%' OR message LIKE '%bill compartment%';

UPDATE public.notifications
SET title = REPLACE(title, 'Low Change Balance', 'Low Coin Change Balance')
WHERE title = 'Low Change Balance';

-- Verification query
SELECT notification_id, type, title, message, created_at 
FROM public.notifications 
WHERE type = 'inventory_low_balance' OR message LIKE '%coin change%' OR message LIKE '%change balance%'
ORDER BY created_at DESC 
LIMIT 20;
