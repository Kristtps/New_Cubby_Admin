// ========================================
// SUPABASE CLIENT INITIALIZATION
// ========================================

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://cjuimxgxovdmijuenagr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdWlteGd4b3ZkbWlqdWVuYWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQ0OTEsImV4cCI6MjA5MjAxMDQ5MX0.t6ixuFiD2iYzrNZsc1QjG3gpdTdBuMY37qTKzwxdg18';

// Initialize Supabase client
async function initSupabase() {
    // 1. Load Supabase script dynamically if it's missing from the page
    if (!window.supabase) {
        console.log('Supabase library missing, attempting to load from CDN...');
        try {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                script.onload = resolve;
                script.onerror = (e) => reject(new Error('Failed to load Supabase script from CDN'));
                document.head.appendChild(script);
            });
            console.log('✓ Supabase library loaded successfully');
        } catch (e) {
            console.error('Critical Error: Could not load Supabase library:', e);
            return null;
        }
    }

    // 2. Create the client
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.supabase = client; // Export to global scope
            window.supabaseClient = client; // Compatibility with login.js patterns
            console.log('✓ Supabase Client initialized and ready');
            return client;
        } catch (e) {
            console.error('Error creating Supabase client:', e);
            return null;
        }
    } else {
        console.error('⚠ window.supabase is not the expected library object.');
        return null;
    }
}

// Start initialization immediately and export the promise
window.supabasePromise = initSupabase();
// For backward compatibility with scripts that look at window.supabase immediately
// we can't do much if it's async, but window.supabase should be set once the promise resolves.

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

// Supabase client is already exported to window.supabase above
