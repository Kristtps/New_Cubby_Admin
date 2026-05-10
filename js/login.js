// ========================================
// LOGIN PAGE - JAVASCRIPT FUNCTIONALITY
// ========================================

const SUPABASE_URL = "https://cjuimxgxovdmijuenagr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdWlteGd4b3ZkbWlqdWVuYWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQ0OTEsImV4cCI6MjA5MjAxMDQ5MX0.t6ixuFiD2iYzrNZsc1QjG3gpdTdBuMY37qTKzwxdg18"; // your full key

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

    // Force show login for demo/reset - CLEAR STORED AUTH
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
 * Handle login form submission
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
            showError('Supabase client not initialized. Check your internet connection.');
            return;
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            showError(error.message || 'Incorrect email or password. Please try again.');
            
            // LOG SECURITY EVENT: Failed Login
            try {
                if (typeof dbOps !== 'undefined' && dbOps.logConfigChangeEvent) {
                    await dbOps.logConfigChangeEvent('Failed Login', `Failed login attempt for ${email}. Error: ${error.message}`, { email, error: error.message });
                }
            } catch (logErr) { console.warn('Logging failed:', logErr); }
            
            validatePassword();
            return;
        }

        // Login successful - Now check if this is an Admin (not a Customer)
        const { data: customerData, error: customerError } = await supabaseClient
            .from('customers')
            .select('customer_id')
            .eq('email', email)
            .maybeSingle();

        if (customerData) {
            // User exists in the customers table, so they are not an admin
            await supabaseClient.auth.signOut();
            showError('Access Denied: This account is registered as a Customer. Only Administrators can access the Admin Panel.');
            
            // Log security event
            try {
                if (typeof dbOps !== 'undefined' && dbOps.logConfigChangeEvent) {
                    await dbOps.logConfigChangeEvent('Unauthorized Access Attempt', `Customer ${email} attempted to access Admin Panel.`, { email });
                }
            } catch (logErr) { console.warn('Logging failed:', logErr); }
            
            return;
        }

        showSuccess('Login successful! Redirecting...');

        // LOG AUTH EVENT: Successful Login
        try {
            if (typeof dbOps !== 'undefined' && dbOps.logLoginEvent) {
                await dbOps.logLoginEvent(data.user.email);
            }
        } catch (logErr) { console.warn('Logging failed:', logErr); }

        storeLoginCredentials({
            email: data.user.email,
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe
        });

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

    if (password.length < 6) {
        showFieldError('passwordError', 'Password must be at least 6 characters');
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
        email: credentials.email,
        loginTime: credentials.loginTime,
        rememberMe: credentials.rememberMe || false
    };
    localStorage.setItem('coincubby_auth', JSON.stringify(authData));
    console.log('✓ User authenticated:', credentials.email);
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
    const authData = getAuthData();
    const email = authData ? authData.email : 'Unknown';
    
    // LOG AUTH EVENT: Logout
    try {
        if (typeof dbOps !== 'undefined' && dbOps.logLogoutEvent) {
            await dbOps.logLogoutEvent(email);
        }
    } catch (e) { console.warn('Logout logging failed:', e); }
    
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
