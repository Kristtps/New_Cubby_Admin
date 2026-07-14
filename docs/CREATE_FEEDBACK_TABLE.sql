-- ================================================================
-- CoinCubby Admin - Customer Feedback Table Setup
-- ================================================================
-- This script creates the feedback table for storing customer
-- ratings and reviews for completed transactions.
-- 
-- Run this script in your Supabase SQL Editor
-- ================================================================

-- Create the feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    feedback_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    transaction_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    rating smallint NOT NULL,
    comment text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    
    -- Primary Key
    CONSTRAINT feedback_pkey PRIMARY KEY (feedback_id),
    
    -- Unique constraint: one feedback per transaction
    CONSTRAINT feedback_transaction_id_key UNIQUE (transaction_id),
    
    -- Foreign Keys
    CONSTRAINT fk_feedback_customer 
        FOREIGN KEY (customer_id) 
        REFERENCES customers (customer_id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_feedback_transaction 
        FOREIGN KEY (transaction_id) 
        REFERENCES transactions (transaction_id) 
        ON DELETE CASCADE,
    
    -- Check constraint: rating must be between 1 and 5
    CONSTRAINT feedback_rating_check 
        CHECK ((rating >= 1) AND (rating <= 5))
) TABLESPACE pg_default;

-- Add comments for documentation
COMMENT ON TABLE public.feedback IS 'Customer feedback and ratings for completed transactions';
COMMENT ON COLUMN public.feedback.feedback_id IS 'Unique identifier for the feedback entry';
COMMENT ON COLUMN public.feedback.transaction_id IS 'Reference to the transaction being reviewed';
COMMENT ON COLUMN public.feedback.customer_id IS 'Reference to the customer who submitted the feedback';
COMMENT ON COLUMN public.feedback.rating IS 'Star rating from 1 (poor) to 5 (excellent)';
COMMENT ON COLUMN public.feedback.comment IS 'Optional text comment from the customer';
COMMENT ON COLUMN public.feedback.created_at IS 'Timestamp when the feedback was submitted';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_customer_id 
    ON public.feedback(customer_id);

CREATE INDEX IF NOT EXISTS idx_feedback_transaction_id 
    ON public.feedback(transaction_id);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at 
    ON public.feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_rating 
    ON public.feedback(rating);

-- Enable Row Level Security (RLS)
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for admin operations)
CREATE POLICY "Service role has full access to feedback"
    ON public.feedback
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Customers can insert their own feedback
CREATE POLICY "Customers can insert their own feedback"
    ON public.feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = customer_id::text);

-- Policy: Customers can view their own feedback
CREATE POLICY "Customers can view their own feedback"
    ON public.feedback
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = customer_id::text);

-- Policy: Admins can view all feedback (if you have an admin role)
-- Uncomment if you have role-based access control
-- CREATE POLICY "Admins can view all feedback"
--     ON public.feedback
--     FOR SELECT
--     TO authenticated
--     USING (
--         EXISTS (
--             SELECT 1 FROM admin_accounts 
--             WHERE admin_id = auth.uid() 
--             AND role = 'admin'
--         )
--     );

-- Grant permissions
GRANT ALL ON public.feedback TO service_role;
GRANT SELECT, INSERT ON public.feedback TO authenticated;

-- ================================================================
-- Sample Data (Optional - for testing)
-- ================================================================
-- Uncomment to insert sample feedback data
-- Make sure to replace UUIDs with actual IDs from your database

/*
INSERT INTO public.feedback (transaction_id, customer_id, rating, comment) VALUES
    ('your-transaction-uuid-1', 'your-customer-uuid-1', 5, 'Excellent service! Very convenient locker system.'),
    ('your-transaction-uuid-2', 'your-customer-uuid-2', 4, 'Good experience overall. Easy to use.'),
    ('your-transaction-uuid-3', 'your-customer-uuid-3', 3, 'It was okay, but could be better.'),
    ('your-transaction-uuid-4', 'your-customer-uuid-4', 2, 'Had some issues with the locker not opening immediately.'),
    ('your-transaction-uuid-5', 'your-customer-uuid-5', 5, 'Perfect! Will definitely use again.');
*/

-- ================================================================
-- Verification Queries
-- ================================================================

-- Check if table was created successfully
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'feedback'
ORDER BY ordinal_position;

-- Check constraints
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'feedback';

-- Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'feedback';

-- Count feedback entries
SELECT COUNT(*) as total_feedback FROM public.feedback;

-- Get average rating
SELECT 
    ROUND(AVG(rating)::numeric, 1) as average_rating,
    COUNT(*) as total_feedback,
    COUNT(*) FILTER (WHERE rating = 5) as five_star_count,
    COUNT(*) FILTER (WHERE rating <= 2) as low_rating_count
FROM public.feedback;

-- ================================================================
-- Cleanup (if needed)
-- ================================================================
-- Uncomment to drop the table (WARNING: This will delete all data!)
-- DROP TABLE IF EXISTS public.feedback CASCADE;
