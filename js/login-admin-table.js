// ========================================
// LOGIN PAGE - ADMIN TABLE AUTHENTICATION
// ========================================
// This version authenticates against the admin table in Supabase
// NOT Supabase Auth - uses your custom admin table

const SUPABASE_URL = "https://cjuimxgxovdmijuenagr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdWlteGd4b3ZkbWlqdWVuYWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQ0OTEsImV4cCI6MjA5MjAxMDQ5MX0.t6ixuFiD2iYzrNZsc1QjG3gpdTdBuMY37qTKzwxdg18";

let supabaseClient;

// Initialize login page
document.addEventListener('DOMContentLoaded', async function () {
    // Load Supabase script dynamically if it's missing
    if (!window.supabase) {
        try {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        } catch (e) {
            console.error('Failed to load Supabase script:', e);
            showError('Initialization failed. Please check your internet connection.');
        }
    }

    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // Clear stored auth for demo/reset
    localStorage.removeItem('coincubby_auth');
    console.log('✓ Demo mode: Auth cleared, login form will show');

    // Only initialize login form if we're on login page
    if (document.getElementById('loginForm')) {
        initializeLoginForm();
    }
});

/**
 * Initialize login form event listeners
 */
function initializeLoginForm() {
    const form = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Form submission
    if (form) {
        form.addEventListener('submit', handleLoginSubmit);
    }

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function (e) {
            e.preventDefault();
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.style.transform = type === 'text' ? 'scaleX(-1)' : 'scaleX(1)';
        });
    }

    // Real-time validation
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
        emailInput.addEventListener('input', function () {
            clearError('emailError');
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('blur', validatePassword);
        passwordInput.addEventListener('input', function () {
            clearError('passwordError');
        });
    }

    // Auto-focus email on load
    if (emailInput) {
        emailInput.focus();
    }
}

/**
 * Handle login form submission - AUTHENTICATE AGAINST ADMIN TABLE
 */
async function handleLoginSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    clearMessages();

    if (!validateEmail() || !validatePassword()) {
        return;
    }

    const submitBtn = document.querySelector('.btn-login');
    const originalText = submitBtn.querySelector('.btn-text').textContent;
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = 'Signing in...';

    try {
        if (!supabaseClient) {
            showError('Database connection not initialized. Check your internet connection.');
            return;
        }

        console.log('Authenticating against admin table...');

        // Query admin table for matching email and password
        const { data: adminData, error: adminError } = await supabaseClient
            .from('admin')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .maybeSingle();

        if (adminError) {
            console.error('Database error:', adminError);
            showError('Database error. Please try again.');
            return;
        }

        if (!adminData) {
            // No matching admin found
            showError('Invalid email or password. Please try again.');
            console.log('Login failed: No matching admin in database');
            return;
        }

        // Login successful!
        console.log('✓ Admin authenticated:', adminData.email);
        showSuccess('Login successful! Redirecting...');

        // Request desktop notification permission since this is tied to a user gesture
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            try {
                await Notification.requestPermission();
                console.log('Notification permission requested during login');
            } catch (err) {
                console.warn('Could not request notification permission:', err);
            }
        }

        // Store auth data
        storeLoginCredentials({
            id: adminData.id,
            email: adminData.email,
            name: adminData.full_name || adminData.email.split('@')[0],
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe
        });

        // Update last_login in database (if column exists)
        try {
            await supabaseClient
                .from('admin')
                .update({ last_login: new Date().toISOString() })
                .eq('id', adminData.id);
            console.log('✓ Last login updated');
        } catch (updateErr) {
            console.warn('Could not update last_login (column may not exist):', updateErr);
        }

        setTimeout(() => {
            redirectToDashboard();
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred during login. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = originalText;
    }
}

/**
 * Validate email format
 */
function validateEmail() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        showFieldError('emailError', 'Email is required');
        return false;
    }

    if (!emailRegex.test(email)) {
        showFieldError('emailError', 'Please enter a valid email');
        return false;
    }

    clearError('emailError');
    return true;
}

/**
 * Validate password
 */
function validatePassword() {
    const passwordInput = document.getElementById('password');
    const password = passwordInput.value;

    if (!password) {
        showFieldError('passwordError', 'Password is required');
        return false;
    }

    clearError('passwordError');
    return true;
}

/**
 * Show field-specific error
 */
function showFieldError(errorElementId, message) {
    const errorElement = document.getElementById(errorElementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

/**
 * Clear field error
 */
function clearError(errorElementId) {
    const errorElement = document.getElementById(errorElementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

/**
 * Show error message
 */
function showError(message) {
    const errorAlert = document.getElementById('loginError');
    if (errorAlert) {
        errorAlert.textContent = message;
        errorAlert.style.display = 'flex';
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Show success message
 */
function showSuccess(message) {
    const successAlert = document.getElementById('loginSuccess');
    if (successAlert) {
        successAlert.textContent = message;
        successAlert.style.display = 'flex';
        successAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Clear all messages
 */
function clearMessages() {
    const errorAlert = document.getElementById('loginError');
    const successAlert = document.getElementById('loginSuccess');
    if (errorAlert) errorAlert.style.display = 'none';
    if (successAlert) successAlert.style.display = 'none';
}

// ==================== AUTHENTICATION MANAGEMENT ====================

/**
 * Store login credentials in localStorage
 */
function storeLoginCredentials(credentials) {
    const authData = {
        isAuthenticated: true,
        id: credentials.id,
        email: credentials.email,
        name: credentials.name,
        loginTime: credentials.loginTime,
        rememberMe: credentials.rememberMe || false
    };
    localStorage.setItem('coincubby_auth', JSON.stringify(authData));
    console.log('✓ User authenticated:', credentials.email, '-', credentials.name);
}

/**
 * Get stored authentication data
 */
function getAuthData() {
    try {
        const authData = localStorage.getItem('coincubby_auth');
        if (!authData) return null;
        return JSON.parse(authData);
    } catch (error) {
        console.error('Error reading auth data:', error);
        localStorage.removeItem('coincubby_auth');
        return null;
    }
}

/**
 * Check if user is authenticated
 */
function isUserAuthenticated() {
    const authData = getAuthData();
    return authData && authData.isAuthenticated === true;
}

/**
 * Logout user
 */
async function logoutUser() {
    localStorage.removeItem('coincubby_auth');
    console.log('✓ User logged out');
    window.location.href = 'login.html';
}

/**
 * Redirect to dashboard
 */
function redirectToDashboard() {
    window.location.href = 'index.html';
}

/**
 * Protect pages
 */
function protectPage() {
    const authData = getAuthData();
    if (!authData || !authData.isAuthenticated) {
        if (!window.redirecting) {
            window.redirecting = true;
            window.location.href = 'login.html';
        }
    }
}
