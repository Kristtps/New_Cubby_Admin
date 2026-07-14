-- ========================================
-- RATES HISTORY TABLE SCHEMA
-- ========================================
-- This table stores a complete history of all rate changes
-- for audit purposes and tracking price adjustments over time.
-- ========================================

CREATE TABLE IF NOT EXISTS rates_history (
    history_id SERIAL PRIMARY KEY,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by VARCHAR(255) NOT NULL,
    
    -- Current rates (after change)
    small_rate DECIMAL(10, 2) NOT NULL,
    medium_rate DECIMAL(10, 2) NOT NULL,
    large_rate DECIMAL(10, 2) NOT NULL,
    
    -- Previous rates (before change) - NULL for first entry
    previous_small DECIMAL(10, 2),
    previous_medium DECIMAL(10, 2),
    previous_large DECIMAL(10, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_rates_history_changed_at ON rates_history(changed_at DESC);
CREATE INDEX idx_rates_history_changed_by ON rates_history(changed_by);

-- Add comments for documentation
COMMENT ON TABLE rates_history IS 'Complete audit trail of all locker rate changes';
COMMENT ON COLUMN rates_history.history_id IS 'Unique identifier for each rate change entry';
COMMENT ON COLUMN rates_history.changed_at IS 'Timestamp when rates were changed (Asia/Manila timezone)';
COMMENT ON COLUMN rates_history.changed_by IS 'Admin user who made the change';
COMMENT ON COLUMN rates_history.small_rate IS 'New small locker rate (₱/hour)';
COMMENT ON COLUMN rates_history.medium_rate IS 'New medium locker rate (₱/hour)';
COMMENT ON COLUMN rates_history.large_rate IS 'New large locker rate (₱/hour)';
COMMENT ON COLUMN rates_history.previous_small IS 'Previous small locker rate (NULL if first entry)';
COMMENT ON COLUMN rates_history.previous_medium IS 'Previous medium locker rate (NULL if first entry)';
COMMENT ON COLUMN rates_history.previous_large IS 'Previous large locker rate (NULL if first entry)';

-- Example data insertion (optional - for testing)
-- INSERT INTO rates_history (changed_by, small_rate, medium_rate, large_rate, previous_small, previous_medium, previous_large)
-- VALUES ('admin@example.com', 10.00, 20.00, 35.00, 8.00, 15.00, 30.00);
