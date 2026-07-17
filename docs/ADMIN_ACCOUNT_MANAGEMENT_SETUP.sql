-- ========================================
-- ADMIN ACCOUNT MANAGEMENT SYSTEM
-- Complete Setup SQL
-- ========================================
-- Run this in your Supabase SQL Editor
-- ========================================

-- ========================================
-- 1. ADD MISSING COLUMNS TO ADMIN TABLE
-- ========================================

-- Add account status tracking
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP WITH TIME ZONE;

-- ========================================
-- 2. CREATE PASSWORD HISTORY TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS admin_password_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_admin ON admin_password_history(admin_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created ON admin_password_history(created_at DESC);

COMMENT ON TABLE admin_password_history IS 'Stores password history to prevent reuse of old passwords';

-- ========================================
-- 3. CREATE ADMIN SESSIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS admin_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
    device_info TEXT,
    browser_info TEXT,
    ip_address VARCHAR(45),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sessions_admin ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON admin_sessions(last_activity DESC);

COMMENT ON TABLE admin_sessions IS 'Tracks admin login sessions and devices';

-- ========================================
-- 4. CREATE LOGIN ATTEMPTS LOG
-- ========================================

CREATE TABLE IF NOT EXISTS admin_login_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON admin_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON admin_login_attempts(attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON admin_login_attempts(success);

COMMENT ON TABLE admin_login_attempts IS 'Logs all admin login attempts for security monitoring';

-- ========================================
-- 5. CREATE ADMIN AUDIT LOG
-- ========================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);

COMMENT ON TABLE admin_audit_log IS 'Complete audit trail of all admin actions';

-- ========================================
-- 6. CREATE 2FA TABLE (OPTIONAL - FUTURE)
-- ========================================

CREATE TABLE IF NOT EXISTS admin_2fa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID UNIQUE NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
    secret_key TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    backup_codes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enabled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_2fa_admin ON admin_2fa(admin_id);

COMMENT ON TABLE admin_2fa IS 'Two-factor authentication settings for admins';

-- ========================================
-- 7. CREATE FUNCTIONS
-- ========================================

-- Function: Log admin login attempt
CREATE OR REPLACE FUNCTION log_admin_login_attempt(
    p_email VARCHAR,
    p_ip VARCHAR,
    p_success BOOLEAN,
    p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_login_attempts (email, ip_address, success, failure_reason)
    VALUES (p_email, p_ip, p_success, p_reason);
END;
$$ LANGUAGE plpgsql;

-- Function: Reset failed login attempts
CREATE OR REPLACE FUNCTION reset_failed_attempts(p_admin_id UUID) 
RETURNS VOID AS $$
BEGIN
    UPDATE admin 
    SET failed_login_attempts = 0,
        is_locked = false,
        locked_until = NULL
    WHERE id = p_admin_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment failed login attempts
CREATE OR REPLACE FUNCTION increment_failed_attempts(p_email VARCHAR) 
RETURNS INTEGER AS $$
DECLARE
    v_attempts INTEGER;
    v_admin_id UUID;
BEGIN
    -- Get current attempts and admin_id
    SELECT id, failed_login_attempts INTO v_admin_id, v_attempts
    FROM admin
    WHERE email = p_email;
    
    IF v_admin_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Increment attempts
    v_attempts := v_attempts + 1;
    
    -- Lock account after 5 failed attempts
    IF v_attempts >= 5 THEN
        UPDATE admin 
        SET failed_login_attempts = v_attempts,
            is_locked = true,
            locked_until = NOW() + INTERVAL '30 minutes'
        WHERE id = v_admin_id;
    ELSE
        UPDATE admin 
        SET failed_login_attempts = v_attempts
        WHERE id = v_admin_id;
    END IF;
    
    RETURN v_attempts;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(p_email VARCHAR) 
RETURNS BOOLEAN AS $$
DECLARE
    v_is_locked BOOLEAN;
    v_locked_until TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT is_locked, locked_until INTO v_is_locked, v_locked_until
    FROM admin
    WHERE email = p_email;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- If lock has expired, unlock the account
    IF v_is_locked AND v_locked_until IS NOT NULL AND v_locked_until < NOW() THEN
        UPDATE admin 
        SET is_locked = false, 
            failed_login_attempts = 0,
            locked_until = NULL
        WHERE email = p_email;
        RETURN false;
    END IF;
    
    RETURN v_is_locked;
END;
$$ LANGUAGE plpgsql;

-- Function: Log admin action to audit log
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_id UUID,
    p_action VARCHAR,
    p_target_type VARCHAR DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO admin_audit_log (
        admin_id, action, target_type, target_id, details, ip_address
    ) VALUES (
        p_admin_id, p_action, p_target_type, p_target_id, p_details, p_ip
    ) RETURNING audit_id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Clean old sessions
CREATE OR REPLACE FUNCTION clean_old_sessions() 
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM admin_sessions
    WHERE last_activity < NOW() - INTERVAL '30 days'
    OR (expires_at IS NOT NULL AND expires_at < NOW());
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. CREATE TRIGGERS
-- ========================================

-- Trigger: Auto-update last_password_change
CREATE OR REPLACE FUNCTION update_password_change_time()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.password IS DISTINCT FROM NEW.password THEN
        NEW.last_password_change = NOW();
        
        -- Store old password in history
        INSERT INTO admin_password_history (admin_id, password_hash)
        VALUES (NEW.id, OLD.password);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_password_change ON admin;
CREATE TRIGGER trigger_password_change
BEFORE UPDATE ON admin
FOR EACH ROW
EXECUTE FUNCTION update_password_change_time();

-- ========================================
-- 9. ROW LEVEL SECURITY POLICIES
-- ========================================

-- Disable RLS for admin tables (since admins manage themselves)
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_password_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_2fa DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 10. CREATE VIEWS FOR EASY QUERYING
-- ========================================

-- View: Active admins with last login
CREATE OR REPLACE VIEW v_active_admins AS
SELECT 
    id,
    email,
    full_name,
    role,
    is_active,
    is_locked,
    email_verified,
    last_login,
    last_password_change,
    failed_login_attempts,
    created_at
FROM admin
WHERE is_active = true
ORDER BY last_login DESC NULLS LAST;

-- View: Recent login attempts
CREATE OR REPLACE VIEW v_recent_login_attempts AS
SELECT 
    attempt_id,
    email,
    ip_address,
    success,
    failure_reason,
    attempted_at
FROM admin_login_attempts
WHERE attempted_at > NOW() - INTERVAL '7 days'
ORDER BY attempted_at DESC;

-- View: Admin activity summary
CREATE OR REPLACE VIEW v_admin_activity AS
SELECT 
    a.id,
    a.email,
    a.full_name,
    a.role,
    COUNT(DISTINCT s.session_id) as active_sessions,
    a.last_login,
    COUNT(DISTINCT al.audit_id) as total_actions,
    MAX(al.created_at) as last_action_time
FROM admin a
LEFT JOIN admin_sessions s ON s.admin_id = a.id AND s.last_activity > NOW() - INTERVAL '30 minutes'
LEFT JOIN admin_audit_log al ON al.admin_id = a.id AND al.created_at > NOW() - INTERVAL '30 days'
WHERE a.is_active = true
GROUP BY a.id, a.email, a.full_name, a.role, a.last_login
ORDER BY a.last_login DESC NULLS LAST;

-- ========================================
-- 11. INSERT DEFAULT DATA (OPTIONAL)
-- ========================================

-- Update existing admin accounts with default values
UPDATE admin 
SET 
    is_active = COALESCE(is_active, true),
    is_locked = COALESCE(is_locked, false),
    failed_login_attempts = COALESCE(failed_login_attempts, 0),
    email_verified = COALESCE(email_verified, true)
WHERE is_active IS NULL OR is_locked IS NULL;

-- ========================================
-- 12. VERIFICATION QUERIES
-- ========================================

-- Check admin table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin' 
ORDER BY ordinal_position;

-- Count admins
SELECT 
    COUNT(*) as total_admins,
    COUNT(*) FILTER (WHERE is_active = true) as active_admins,
    COUNT(*) FILTER (WHERE is_locked = true) as locked_admins
FROM admin;

-- Show all tables created
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'admin%'
ORDER BY tablename;

-- ========================================
-- SETUP COMPLETE!
-- ========================================
-- Next steps:
-- 1. Verify all tables created successfully
-- 2. Test the functions
-- 3. Configure email settings in Supabase Auth
-- 4. Enable 2FA if needed
-- ========================================
