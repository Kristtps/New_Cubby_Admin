// ========================================
// LOGIN PAGE - JAVASCRIPT FUNCTIONALITY
// ========================================

// Demo credentials for testing
const DEMO_CREDENTIALS = {
    email: 'admin@coincubby.com',
    password: 'password123'
};

// Initialize login page
document.addEventListener('DOMContentLoaded', function() {
    // Force show login for demo/reset - CLEAR STORED AUTH
    localStorage.removeItem('coincubby_auth');
    console.log('✓ Demo mode: Auth cleared, login form will show');
    
    // Only initialize login form if we're on login page
    if (document.getElementById('loginForm')) {
        initializeLoginForm();
        // Skip checkAuthStatus() to always show login
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
        togglePassword.addEventListener('click', function(e) {
            e.preventDefault();
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            // Rotate icon
            this.style.transform = type === 'text' ? 'scaleX(-1)' : 'scaleX(1)';
        });
    }

    // Real-time validation
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
        emailInput.addEventListener('input', function() {
            clearError('emailError');
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('blur', validatePassword);
        passwordInput.addEventListener('input', function() {
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

    // Clear previous messages
    clearMessages();

    // Validate inputs
    if (!validateEmail() || !validatePassword()) {
        return;
    }

    // Disable submit button
    const submitBtn = document.querySelector('.btn-login');
    const originalText = submitBtn.querySelector('.btn-text').textContent;
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = 'Signing in...';

    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Check credentials (in production, this would be an API call)
        if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
            // Login successful
            showSuccess('Login successful! Redirecting...');
            
            // Store authentication
            storeLoginCredentials({
                email: email,
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe
            });

            // Redirect to dashboard after short delay
            setTimeout(() => {
                redirectToDashboard();
            }, 1500);
        } else if (email === DEMO_CREDENTIALS.email) {
            // Wrong password
            showError('Incorrect password. Please try again.');
            validatePassword();
        } else {
            // Email not found
            showError('Invalid email address. Use: admin@coincubby.com');
            validateEmail();
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred during login. Please try again.');
    } finally {
        // Re-enable submit button
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
        if (!authData) {
            console.log('No auth data found');
            return null;
        }
        const parsed = JSON.parse(authData);
        console.log('✓ Auth data retrieved:', parsed.email);
        return parsed;
    } catch (error) {
        console.error('Error reading auth data:', error);
        // Clear corrupted data
        try {
            localStorage.removeItem('coincubby_auth');
        } catch (e) {
            console.error('Could not clear auth data:', e);
        }
        return null;
    }
}

/**
 * Check if user is authenticated
 */
function isUserAuthenticated() {
    const authData = getAuthData();
    const isAuth = authData && authData.isAuthenticated === true;
    console.log('Authentication check:', isAuth ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
    return isAuth;
}

/**
 * Check authentication status on login page
 * If already logged in, redirect to dashboard
 */
function checkAuthStatus() {
    if (isUserAuthenticated()) {
        console.log('User already authenticated, redirecting to dashboard...');
        redirectToDashboard();
    }
}

/**
 * Logout user
 */
function logoutUser() {
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

// ==================== PAGE PROTECTION ====================

/**
 * Protect pages - add this to every HTML file before </body>
 * This will redirect to login if user is not authenticated
 */
function protectPage() {
    // Only run on non-login pages
    const currentPath = window.location.pathname;
    const fileName = currentPath.split('/').pop();
    
    // Don't protect login page itself
    if (fileName === 'login.html' || fileName === '') {
        return;
    }

    // Check if user is authenticated
    const authData = getAuthData();
    
    if (!authData || !authData.isAuthenticated) {
        // Prevent infinite redirects with a flag
        if (!window.redirecting) {
            window.redirecting = true;
            console.log('User not authenticated, redirecting to login...');
            window.location.href = 'login.html';
        }
    }
}

/**
 * Add logout button to sidebar
 * Call this from script.js or other dashboard pages
 */
function addLogoutButton() {
    const nav = document.querySelector('.nav-menu');
    if (!nav) return;

    const existingLogout = document.getElementById('logout-btn');
    if (existingLogout) return; // Already added

    const logoutItem = document.createElement('a');
    logoutItem.id = 'logout-btn';
    logoutItem.href = '#';
    logoutItem.className = 'nav-item logout-item';
    logoutItem.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Logout</span>
    `;

    logoutItem.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            logoutUser();
        }
    });

    nav.appendChild(logoutItem);
}
