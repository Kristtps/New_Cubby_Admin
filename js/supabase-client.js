// ========================================
// SUPABASE CLIENT INITIALIZATION
// ========================================

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://cjuimxgxovdmijuenagr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdWlteGd4b3ZkbWlqdWVuYWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQ0OTEsImV4cCI6MjA5MjAxMDQ5MX0.t6ixuFiD2iYzrNZsc1QjG3gpdTdBuMY37qTKzwxdg18';

// Initialize Supabase client
function initSupabase() {
    // The Supabase JS library is loaded via <script> tag in HTML before this file.
    // If it's already present, create the client synchronously (no extra network round-trip).
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.supabase = client;
            window.supabaseClient = client;
            console.log('✓ Supabase Client initialized (sync)');
            return client;
        } catch (e) {
            console.error('Error creating Supabase client:', e);
            return null;
        }
    }

    // Fallback: library tag hasn't loaded yet (shouldn't happen if HTML order is correct)
    console.warn('Supabase library not ready, deferring init...');
    return null;
}

// Start initialization immediately — sync when the <script> tag is loaded first
(function bootSupabase() {
    const client = initSupabase();
    if (client) {
        // Already ready — resolve immediately so awaiters don't stall
        window.supabasePromise = Promise.resolve(client);
    } else {
        // CDN tag still loading; retry once DOM is ready
        window.supabasePromise = new Promise((resolve) => {
            document.addEventListener('DOMContentLoaded', () => {
                const c = initSupabase();
                resolve(c);
            });
        });
    }
})();

/**
 * Check if Supabase is properly initialized
 */
function isSupabaseConnected() {
    return window.supabase && typeof window.supabase.from === 'function';
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
