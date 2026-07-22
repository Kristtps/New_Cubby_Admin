// ========================================
// LOGIN PAGE — ADMIN TABLE AUTHENTICATION
// ========================================

const SUPABASE_URL     = "https://cjuimxgxovdmijuenagr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdWlteGd4b3ZkbWlqdWVuYWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQ0OTEsImV4cCI6MjA5MjAxMDQ5MX0.t6ixuFiD2iYzrNZsc1QjG3gpdTdBuMY37qTKzwxdg18";

let supabaseClient = null;

// ── Build Supabase client ─────────────────────────────────────
function buildSupabaseClient() {
    try {
        const lib = window.supabase;
        if (!lib || typeof lib.createClient !== 'function') return null;
        return lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession:    false,
                autoRefreshToken:  false,
                detectSessionInUrl: false
            }
        });
    } catch (e) {
        console.error('Could not create Supabase client:', e);
        return null;
    }
}

// ── DOMContentLoaded ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // Already logged in? Go straight to dashboard.
    try {
        const existing = JSON.parse(localStorage.getItem('coincubby_auth') || 'null');
        if (existing && existing.isAuthenticated === true) {
            window.location.href = 'index.html';
            return;
        }
    } catch (_) {
        localStorage.removeItem('coincubby_auth');
    }

    // Build client
    supabaseClient = buildSupabaseClient();

    if (!supabaseClient) {
        // Retry once after 800 ms (CDN might not have finished loading)
        setTimeout(() => {
            supabaseClient = buildSupabaseClient();
            if (!supabaseClient) {
                showError('Database connection failed. Please refresh the page.');
            } else {
                console.log('✓ Supabase client ready (retry)');
            }
        }, 800);
    } else {
        console.log('✓ Supabase client ready');
    }

    initializeLoginForm();
});

// ── Form initialization ───────────────────────────────────────
function initializeLoginForm() {
    const form          = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const emailInput    = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    if (form)           form.addEventListener('submit', handleLoginSubmit);
    if (emailInput)     emailInput.addEventListener('input',  () => clearFieldError('emailError'));
    if (passwordInput)  passwordInput.addEventListener('input', () => clearFieldError('passwordError'));

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', (e) => {
            e.preventDefault();
            const isText = passwordInput.type === 'text';
            passwordInput.type = isText ? 'password' : 'text';
            togglePassword.style.transform = isText ? '' : 'scaleX(-1)';
        });
    }

    if (emailInput) emailInput.focus();
}

// ── Login handler ─────────────────────────────────────────────
async function handleLoginSubmit(e) {
    e.preventDefault();
    clearMessages();

    const email    = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('rememberMe')?.checked ?? false;

    // Basic validation
    let valid = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldError('emailError', 'Enter a valid email address.');
        valid = false;
    }
    if (!password) {
        showFieldError('passwordError', 'Password is required.');
        valid = false;
    }
    if (!valid) return;

    // Make sure the client is ready
    if (!supabaseClient) {
        supabaseClient = buildSupabaseClient();
    }
    if (!supabaseClient) {
        showError('Database connection not available. Please refresh the page.');
        return;
    }

    // Disable button
    const btn     = document.querySelector('.btn-login');
    const btnText = btn?.querySelector('.btn-text');
    if (btn)     btn.disabled = true;
    if (btnText) btnText.textContent = 'Signing in…';

    try {
        console.log('🔐 Querying admin table for:', email);

        const { data, error } = await supabaseClient
            .from('admin')
            .select('id, email, full_name, password, role')
            .eq('email', email)
            .maybeSingle();

        if (error) {
            console.error('DB error:', error);
            showError('Database error: ' + error.message);
            return;
        }

        if (!data) {
            console.warn('No admin row found for email:', email);
            showError('Invalid email or password. Please try again.');
            return;
        }

        // Plain-text password comparison (matches your schema)
        if (data.password !== password) {
            console.warn('Password mismatch for:', email);
            showError('Invalid email or password. Please try again.');
            return;
        }

        // ── SUCCESS ──────────────────────────────────────────
        console.log('✓ Login successful for:', data.email);
        showSuccess('Login successful! Redirecting…');

        // Persist auth
        localStorage.setItem('coincubby_auth', JSON.stringify({
            isAuthenticated: true,
            id:        data.id,
            email:     data.email,
            name:      data.full_name || data.email.split('@')[0],
            role:      data.role || 'Admin',
            loginTime: new Date().toISOString(),
            rememberMe: remember
        }));

        // Update last_login in background — don't await, don't block redirect
        supabaseClient
            .from('admin')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.id)
            .then(() => console.log('✓ last_login updated'))
            .catch(err => console.warn('last_login update failed (non-fatal):', err));

        // Redirect after a short pause so the success message is visible
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1200);

    } catch (err) {
        console.error('Unexpected login error:', err);
        showError('An unexpected error occurred. Please try again.');
    } finally {
        // Re-enable button (except when redirecting)
        setTimeout(() => {
            if (btn)     btn.disabled = false;
            if (btnText) btnText.textContent = 'Sign In';
        }, 1500);
    }
}

// ── UI helpers ────────────────────────────────────────────────
function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function clearFieldError(id) {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
}

function showError(msg) {
    clearMessages();
    const el = document.getElementById('loginError');
    if (el) { el.textContent = msg; el.style.display = 'flex'; }
}

function showSuccess(msg) {
    clearMessages();
    const el = document.getElementById('loginSuccess');
    if (el) { el.textContent = msg; el.style.display = 'flex'; }
}

function clearMessages() {
    ['loginError', 'loginSuccess'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

// ── Auth utilities (used by other pages) ─────────────────────
function getAuthData() {
    try {
        const raw = localStorage.getItem('coincubby_auth');
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        localStorage.removeItem('coincubby_auth');
        return null;
    }
}

function isUserAuthenticated() {
    const auth = getAuthData();
    return !!(auth && auth.isAuthenticated === true);
}

function logoutUser() {
    localStorage.removeItem('coincubby_auth');
    window.location.href = 'login.html';
}

function protectPage() {
    if (!isUserAuthenticated() && !window._redirecting) {
        window._redirecting = true;
        window.location.href = 'login.html';
    }
}

// Expose for use by script.js / profile.js
window.isUserAuthenticated = isUserAuthenticated;
window.logoutUser          = logoutUser;
window.protectPage         = protectPage;
window.getAuthData         = getAuthData;
