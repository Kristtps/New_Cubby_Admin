// ========================================
// SUPABASE CLIENT INITIALIZATION
// ========================================

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://cjuimxgxovdmijuenagr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdWlteGd4b3ZkbWlqdWVuYWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQ0OTEsImV4cCI6MjA5MjAxMDQ5MX0.t6ixuFiD2iYzrNZsc1QjG3gpdTdBuMY37qTKzwxdg18';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Check if Supabase is properly initialized
 */
function isSupabaseConnected() {
    return SUPABASE_URL !== 'https://cjuimxgxovdmijuenagr.supabase.co' &&
        SUPABASE_ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdWlteGd4b3ZkbWlqdWVuYWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQ0OTEsImV4cCI6MjA5MjAxMDQ5MX0.t6ixuFiD2iYzrNZsc1QjG3gpdTdBuMY37qTKzwxdg18';
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
