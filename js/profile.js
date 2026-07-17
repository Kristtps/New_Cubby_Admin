// ========================================
// PROFILE PAGE - JAVASCRIPT FUNCTIONALITY
// Connected to admin table in Supabase
// ========================================

// Cached admin data from the DB
let adminData = null;

document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    if (typeof isUserAuthenticated !== 'undefined' && !isUserAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    await loadProfileFromDatabase();
    setupKioskForm();
    setupPasswordForm();
    setupProfileThemeToggle();
    setupLanguageSelector();
});

// ─────────────────────────────────────────
// 1. LOAD PROFILE DATA
// ─────────────────────────────────────────

/**
 * Load profile data from admin table and populate the UI
 */
async function loadProfileFromDatabase() {
    try {
        const auth = JSON.parse(localStorage.getItem('coincubby_auth') || '{}');
        const userEmail = auth.email;

        if (!userEmail) {
            console.warn('No user email found in auth');
            return;
        }

        // Wait for supabase
        if (window.supabasePromise) {
            await window.supabasePromise;
        }

        if (typeof window.supabase === 'undefined' || !window.supabase || typeof window.supabase.from !== 'function') {
            console.warn('Supabase not initialized');
            return;
        }

        console.log('Loading profile from database for:', userEmail);

        const { data, error } = await window.supabase
            .from('admin')
            .select('id, email, full_name, created_at, last_login, kiosk_admin_id, kiosk_admin_password')
            .eq('email', userEmail)
            .single();

        if (error) {
            console.error('Error loading profile:', error);
            return;
        }

        if (!data) return;

        adminData = data;
        console.log('✓ Profile loaded from database');

        // ── Header Card ──
        const mainName = document.getElementById('main-name');
        const mainEmail = document.getElementById('main-email');
        const sidebarName = document.getElementById('sidebar-name');

        if (data.full_name) {
            mainName.textContent = data.full_name;
            sidebarName.textContent = data.full_name;
            setAvatarInitials(data.full_name);
        }
        if (data.email) {
            mainEmail.textContent = data.email;
        }

        // ── Account Information (read-only fields) ──
        setField('info-full-name', data.full_name);
        setField('info-email', data.email);
        setField('info-created-at', formatDate(data.created_at));
        setField('info-last-login', formatDate(data.last_login));

        // ── Kiosk Credentials ──
        const kioskIdInput = document.getElementById('kiosk-admin-id');
        const kioskPwInput = document.getElementById('kiosk-admin-password');
        if (data.kiosk_admin_id) kioskIdInput.value = data.kiosk_admin_id.trim();
        if (data.kiosk_admin_password) kioskPwInput.value = data.kiosk_admin_password.trim();

        // ── Persist to localStorage for sidebar, quick access ──
        localStorage.setItem('coincubby_admin_name', data.full_name || userEmail.split('@')[0]);
        localStorage.setItem('coincubby_admin_email', data.email);

    } catch (err) {
        console.error('Error in loadProfileFromDatabase:', err);
    }
}

/** Helper to set an info-value span */
function setField(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '—';
}

/** Format a timestamp nicely */
function formatDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

/** Set avatar initials across all avatar elements */
function setAvatarInitials(name) {
    const initial = name ? name.charAt(0).toUpperCase() : 'A';
    ['main-avatar', 'sidebar-avatar'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.backgroundImage = '';
            el.textContent = initial;
        }
    });
}
window.setAvatarInitials = setAvatarInitials;

// ─────────────────────────────────────────
// 2. KIOSK CREDENTIALS FORM
// ─────────────────────────────────────────

function setupKioskForm() {
    const form = document.getElementById('kiosk-form');
    const idInput = document.getElementById('kiosk-admin-id');
    const pwInput = document.getElementById('kiosk-admin-password');
    const idHint = document.getElementById('kiosk-id-hint');
    const pwHint = document.getElementById('kiosk-pw-hint');
    const saveMsg = document.getElementById('kiosk-save-msg');
    const saveBtn = document.getElementById('save-kiosk-btn');
    const togglePwBtn = document.getElementById('toggle-kiosk-pw');
    const eyeIcon = document.getElementById('kiosk-pw-eye-icon');

    if (!form) return;

    // ── Show/Hide kiosk password ──
    let pwVisible = false;
    togglePwBtn.addEventListener('click', () => {
        pwVisible = !pwVisible;
        pwInput.type = pwVisible ? 'text' : 'password';
        // Swap icon between eye-open and eye-off
        if (pwVisible) {
            eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
        } else {
            eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
        }
    });

    // ── Only allow digits ──
    [idInput, pwInput].forEach(input => {
        input.addEventListener('input', () => {
            input.value = input.value.replace(/\D/g, '').slice(0, 6);
        });
    });

    // ── Validate helper ──
    function validate6Digits(val) {
        return /^[0-9]{6}$/.test(val);
    }

    // ── Submit ──
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveMsg.textContent = '';
        saveMsg.className = 'kiosk-save-msg';

        // Reset hints
        idHint.textContent = 'Must be exactly 6 digits (0-9).';
        idHint.classList.remove('error');
        pwHint.textContent = 'Must be exactly 6 digits (0-9).';
        pwHint.classList.remove('error');
        idInput.classList.remove('input-error');
        pwInput.classList.remove('input-error');

        let valid = true;

        if (!validate6Digits(idInput.value)) {
            idHint.textContent = 'Kiosk Admin ID must be exactly 6 digits.';
            idHint.classList.add('error');
            idInput.classList.add('input-error');
            valid = false;
        }

        if (!validate6Digits(pwInput.value)) {
            pwHint.textContent = 'Kiosk Admin Password must be exactly 6 digits.';
            pwHint.classList.add('error');
            pwInput.classList.add('input-error');
            valid = false;
        }

        if (!valid) return;

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving…';

        try {
            const auth = JSON.parse(localStorage.getItem('coincubby_auth') || '{}');
            const userEmail = auth.email;
            if (!userEmail) throw new Error('No user email');

            const { error } = await window.supabase
                .from('admin')
                .update({
                    kiosk_admin_id: idInput.value,
                    kiosk_admin_password: pwInput.value,
                    updated_at: new Date().toISOString()
                })
                .eq('email', userEmail);

            if (error) throw error;

            saveMsg.textContent = '✓ Kiosk credentials saved successfully.';
            saveMsg.className = 'kiosk-save-msg success';
            showToast('Kiosk credentials updated!', 'success');

            // Update local cache
            if (adminData) {
                adminData.kiosk_admin_id = idInput.value;
                adminData.kiosk_admin_password = pwInput.value;
            }

        } catch (err) {
            console.error('Error saving kiosk credentials:', err);
            const msg = err.message || 'Failed to save kiosk credentials.';
            // Check for unique constraint violation on kiosk_admin_id
            if (msg.includes('admin_kiosk_admin_id_key') || msg.includes('duplicate key')) {
                saveMsg.textContent = '✕ That Kiosk Admin ID is already in use.';
            } else {
                saveMsg.textContent = '✕ ' + msg;
            }
            saveMsg.className = 'kiosk-save-msg error';
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Kiosk Credentials';
        }
    });
}

// ─────────────────────────────────────────
// 3. SECURITY — CHANGE WEB PASSWORD
// ─────────────────────────────────────────

async function setupPasswordForm() {
    const passwordForm = document.getElementById('password-form');
    const currentPassword = document.getElementById('current-password');
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    const errorMsg = document.getElementById('password-error');
    const successMsg = document.getElementById('password-success');

    if (!passwordForm) return;

    passwordForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';

        if (newPassword.value !== confirmPassword.value) {
            errorMsg.textContent = "New passwords do not match.";
            errorMsg.style.display = 'block';
            return;
        }

        if (newPassword.value.length < 6) {
            errorMsg.textContent = "Password must be at least 6 characters.";
            errorMsg.style.display = 'block';
            return;
        }

        const auth = JSON.parse(localStorage.getItem('coincubby_auth') || '{}');
        const userEmail = auth.email;

        if (!userEmail) {
            errorMsg.textContent = "Error: No user email found";
            errorMsg.style.display = 'block';
            return;
        }

        try {
            if (typeof window.supabase !== 'undefined' && window.supabase && typeof window.supabase.from === 'function') {
                const { data: adminRow, error: verifyError } = await window.supabase
                    .from('admin')
                    .select('password')
                    .eq('email', userEmail)
                    .single();

                if (verifyError || !adminRow) {
                    errorMsg.textContent = "Error verifying current password.";
                    errorMsg.style.display = 'block';
                    return;
                }

                if (adminRow.password !== currentPassword.value) {
                    errorMsg.textContent = "Current password is incorrect.";
                    errorMsg.style.display = 'block';
                    return;
                }

                const { error: updateError } = await window.supabase
                    .from('admin')
                    .update({
                        password: newPassword.value,
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', userEmail);

                if (updateError) {
                    errorMsg.textContent = "Error updating password: " + updateError.message;
                    errorMsg.style.display = 'block';
                    return;
                }

                console.log('✓ Password updated in database');
            }

            successMsg.style.display = 'block';
            passwordForm.reset();
            showToast('Password updated successfully!', 'success');

            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 4000);

        } catch (error) {
            console.error('Error updating password:', error);
            errorMsg.textContent = "Error updating password. Please try again.";
            errorMsg.style.display = 'block';
        }
    });
}

// ─────────────────────────────────────────
// 4. THEME TOGGLE (Profile page version)
// ─────────────────────────────────────────

function setupProfileThemeToggle() {
    const profileToggleBtn = document.getElementById('profile-theme-toggle-btn');
    const profileThemeIcon = document.getElementById('profile-theme-icon');
    const profileThemeLabel = document.getElementById('profile-theme-label');
    const STORAGE_KEY = 'coincubby_theme';

    if (!profileToggleBtn) return;

    function updateProfileToggleUI(theme) {
        if (theme === 'dark') {
            profileToggleBtn.setAttribute('aria-pressed', 'true');
            if (profileThemeIcon) profileThemeIcon.textContent = '🌙';
            if (profileThemeLabel) profileThemeLabel.textContent = 'Dark';
        } else {
            profileToggleBtn.setAttribute('aria-pressed', 'false');
            if (profileThemeIcon) profileThemeIcon.textContent = '☀️';
            if (profileThemeLabel) profileThemeLabel.textContent = 'Light';
        }
    }

    // Set initial state
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateProfileToggleUI(currentTheme);

    profileToggleBtn.addEventListener('click', function () {
        const isDark = profileToggleBtn.getAttribute('aria-pressed') === 'true';
        const newTheme = isDark ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
        updateProfileToggleUI(newTheme);

        // Sync with sidebar toggle if it exists
        const sidebarToggleBtn = document.getElementById('theme-toggle-btn');
        if (sidebarToggleBtn) {
            const sidebarIcon = document.getElementById('theme-icon');
            const sidebarLabel = document.getElementById('theme-label');
            sidebarToggleBtn.setAttribute('aria-pressed', newTheme === 'dark' ? 'true' : 'false');
            if (sidebarIcon) sidebarIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
            if (sidebarLabel) sidebarLabel.textContent = newTheme === 'dark' ? 'Dark' : 'Light';
        }
    });
}

// ─────────────────────────────────────────
// 5. LANGUAGE SELECTOR
// ─────────────────────────────────────────

function setupLanguageSelector() {
    const languageSelect = document.getElementById('language-select');
    if (!languageSelect) return;

    if (typeof languageManager === 'undefined') {
        console.error('Language manager not loaded');
        return;
    }

    const currentLang = languageManager.getCurrentLanguage();
    languageSelect.value = currentLang;

    languageSelect.addEventListener('change', function (e) {
        const selectedLang = e.target.value;
        console.log('Language changed to:', selectedLang);
        languageManager.setLanguage(selectedLang);
    });

    window.addEventListener('languageChanged', function (e) {
        const newLang = e.detail.language;
        if (languageSelect.value !== newLang) {
            languageSelect.value = newLang;
        }
    });
}

// ─────────────────────────────────────────
// 6. TOAST NOTIFICATIONS
// ─────────────────────────────────────────

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        padding: 14px 22px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        color: white;
        z-index: 9999;
        animation: toastSlideIn 0.35s ease forwards;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        max-width: 380px;
    `;
    toast.style.background = type === 'success'
        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.35s ease forwards';
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}
