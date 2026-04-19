// ========================================
// SUPABASE CLIENT INITIALIZATION
// ========================================

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Check if Supabase is properly initialized
 */
function isSupabaseConnected() {
    return SUPABASE_URL !== 'https://your-project.supabase.co' && 
           SUPABASE_ANON_KEY !== 'your-anon-key-here';
}

/**
 * Log Supabase connection status
 */
function logSupabaseStatus() {
    if (isSupabaseConnected()) {
        console.log('✓ Supabase connected:', SUPABASE_URL);
    } else {
        console.warn('⚠ Supabase not configured. Please add your credentials to supabase-client.js');
    }
}

// Check connection on load
document.addEventListener('DOMContentLoaded', logSupabaseStatus);

// Export supabase client
window.supabase = supabase;
