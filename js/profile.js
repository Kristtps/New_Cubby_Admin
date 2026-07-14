// ========================================
// PROFILE PAGE - JAVASCRIPT FUNCTIONALITY
// Connected to admin table in database
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (typeof isUserAuthenticated !== 'undefined' && !isUserAuthenticated()) {
        console.log('User not authenticated, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }
    
    await loadProfileFromDatabase();
    setupProfileForm();
    setupPasswordForm();
    setupProfileThemeToggle();
    setupLanguageSelector();
});

/**
 * Load profile data from admin table
 */
async function loadProfileFromDatabase() {
    try {
        // Get logged in user email from localStorage
        const auth = JSON.parse(localStorage.getItem('coincubby_auth') || '{}');
        const userEmail = auth.email;
        
        if (!userEmail) {
            console.warn('No user email found in auth');
            return;
        }
        
        // Check if Supabase is available
        if (typeof window.supabase === 'undefined' || !window.supabase) {
            console.warn('Supabase not initialized, using localStorage');
            return;
        }
        
        console.log('Loading profile from database for:', userEmail);
        
        // Fetch admin profile from database
        const { data, error } = await window.supabase
            .from('admin')
            .select('*')
            .eq('email', userEmail)
            .single();
        
        if (error) {
            console.error('Error loading profile:', error);
            return;
        }
        
        if (data) {
            console.log('✓ Profile loaded from database:', data);
            
            // Update UI with database data
            const nameInput = document.getElementById('profile-name');
            const emailInput = document.getElementById('profile-email');
            const mainName = document.getElementById('main-name');
            const sidebarName = document.getElementById('sidebar-name');
            const mainEmail = document.getElementById('main-email');
            
            if (data.full_name) {
                nameInput.value = data.full_name;
                mainName.textContent = data.full_name;
                sidebarName.textContent = data.full_name;
                setAvatarInitials(data.full_name);
            }
            
            if (data.email) {
                emailInput.value = data.email;
                mainEmail.textContent = data.email;
            }
            
            // Store in localStorage for quick access
            localStorage.setItem('coincubby_admin_name', data.full_name || userEmail.split('@')[0]);
            localStorage.setItem('coincubby_admin_email', data.email);
        }
    } catch (error) {
        console.error('Error in loadProfileFromDatabase:', error);
    }
}

function setupProfileForm() {
    const editBtn = document.getElementById('edit-profile-btn');
    const saveBtn = document.getElementById('save-profile-btn');
    const profileForm = document.getElementById('profile-form');
    
    // Inputs
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const avatarUpload = document.getElementById('avatar-upload');
    const btnUploadAvatar = document.getElementById('btn-upload-avatar');
    
    // Preview
    const avatarPreview = document.getElementById('avatar-preview');
    const mainAvatar = document.getElementById('main-avatar');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    
    const mainName = document.getElementById('main-name');
    const sidebarName = document.getElementById('sidebar-name');
    const mainEmail = document.getElementById('main-email');

    let isEditing = false;
    let originalName = nameInput.value;
    let originalEmail = emailInput.value;

    // Toggle edit mode
    editBtn.addEventListener('click', function(e) {
        e.preventDefault();
        isEditing = !isEditing;
        
        if (isEditing) {
            // Store original values
            originalName = nameInput.value;
            originalEmail = emailInput.value;
            
            // Enable editing
            editBtn.textContent = 'Cancel';
            nameInput.removeAttribute('readonly');
            // Email should stay readonly - can't change email
            avatarUpload.removeAttribute('disabled');
            btnUploadAvatar.removeAttribute('disabled');
            saveBtn.style.display = 'block';
            nameInput.focus();
        } else {
            // Disable editing (cancel)
            editBtn.textContent = 'Edit';
            nameInput.setAttribute('readonly', 'readonly');
            avatarUpload.setAttribute('disabled', 'disabled');
            btnUploadAvatar.setAttribute('disabled', 'disabled');
            saveBtn.style.display = 'none';
            
            // Revert changes
            nameInput.value = originalName;
            emailInput.value = originalEmail;
            setAvatarInitials(nameInput.value);
        }
    });

    // Avatar upload preview
    btnUploadAvatar.addEventListener('click', () => {
        avatarUpload.click();
    });

    avatarUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                setAvatarImage(e.target.result);
            }
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // Save profile changes to DATABASE
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const auth = JSON.parse(localStorage.getItem('coincubby_auth') || '{}');
        const userEmail = auth.email;
        
        if (!userEmail) {
            alert('Error: No user email found');
            return;
        }
        
        try {
            // Save to database
            if (typeof window.supabase !== 'undefined' && window.supabase) {
                console.log('Updating profile in database...');
                
                const { data, error } = await window.supabase
                    .from('admin')
                    .update({
                        full_name: nameInput.value,
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', userEmail)
                    .select();
                
                if (error) {
                    console.error('Error updating profile:', error);
                    alert('Error saving profile: ' + error.message);
                    return;
                }
                
                console.log('✓ Profile updated in database:', data);
            }
            
            // Update localStorage
            localStorage.setItem('coincubby_admin_name', nameInput.value);
            localStorage.setItem('coincubby_admin_email', emailInput.value);
            
            // Update UI
            mainName.textContent = nameInput.value;
            sidebarName.textContent = nameInput.value;
            mainEmail.textContent = emailInput.value;
            setAvatarInitials(nameInput.value);

            // Exit edit mode
            isEditing = false;
            editBtn.textContent = 'Edit';
            nameInput.setAttribute('readonly', 'readonly');
            avatarUpload.setAttribute('disabled', 'disabled');
            btnUploadAvatar.setAttribute('disabled', 'disabled');
            saveBtn.style.display = 'none';
            
            // Show success message
            showSuccessMessage('Profile updated successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Error saving profile. Please try again.');
        }
    });

    function setAvatarImage(url) {
        const bgUrl = `url("${url}")`;
        avatarPreview.style.backgroundImage = bgUrl;
        avatarPreview.textContent = '';
        
        mainAvatar.style.backgroundImage = bgUrl;
        mainAvatar.textContent = '';
        
        sidebarAvatar.style.backgroundImage = bgUrl;
        sidebarAvatar.textContent = '';
    }

    function setAvatarInitials(name) {
        const initial = name ? name.charAt(0).toUpperCase() : 'A';
        avatarPreview.style.backgroundImage = '';
        avatarPreview.textContent = initial;
        
        mainAvatar.style.backgroundImage = '';
        mainAvatar.textContent = initial;
        
        sidebarAvatar.style.backgroundImage = '';
        sidebarAvatar.textContent = initial;
    }
    
    // Make setAvatarInitials available globally for loadProfileFromDatabase
    window.setAvatarInitials = setAvatarInitials;
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

async function setupPasswordForm() {
    const passwordForm = document.getElementById('password-form');
    const currentPassword = document.getElementById('current-password');
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    const errorMsg = document.getElementById('password-error');
    const successMsg = document.getElementById('password-success');

    passwordForm.addEventListener('submit', async function(e) {
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
        
        // Get user email
        const auth = JSON.parse(localStorage.getItem('coincubby_auth') || '{}');
        const userEmail = auth.email;
        
        if (!userEmail) {
            errorMsg.textContent = "Error: No user email found";
            errorMsg.style.display = 'block';
            return;
        }
        
        try {
            // Verify current password
            if (typeof window.supabase !== 'undefined' && window.supabase) {
                const { data: adminData, error: verifyError } = await window.supabase
                    .from('admin')
                    .select('password')
                    .eq('email', userEmail)
                    .single();
                
                if (verifyError || !adminData) {
                    errorMsg.textContent = "Error verifying current password";
                    errorMsg.style.display = 'block';
                    return;
                }
                
                if (adminData.password !== currentPassword.value) {
                    errorMsg.textContent = "Current password is incorrect";
                    errorMsg.style.display = 'block';
                    return;
                }
                
                // Update password in database
                const { error: updateError } = await window.supabase
                    .from('admin')
                    .update({ password: newPassword.value })
                    .eq('email', userEmail);
                
                if (updateError) {
                    errorMsg.textContent = "Error updating password: " + updateError.message;
                    errorMsg.style.display = 'block';
                    return;
                }
                
                console.log('✓ Password updated in database');
            }
            
            // Success
            successMsg.style.display = 'block';
            passwordForm.reset();
            
            // Hide success message after 3 seconds
            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 3000);
        } catch (error) {
            console.error('Error updating password:', error);
            errorMsg.textContent = "Error updating password. Please try again.";
            errorMsg.style.display = 'block';
        }
    });
}

function setupProfileThemeToggle() {
    // Link the profile page toggle to the global theme.js functionality
    const profileToggleBtn = document.getElementById('profile-theme-toggle-btn');
    const profileThemeIcon = document.getElementById('profile-theme-icon');
    const profileThemeLabel = document.getElementById('profile-theme-label');
    const STORAGE_KEY = 'coincubby_theme';

    if (!profileToggleBtn) return;

    // Helper to update the UI of the profile toggle to match current theme
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

    profileToggleBtn.addEventListener('click', function() {
        const isDark = profileToggleBtn.getAttribute('aria-pressed') === 'true';
        const newTheme = isDark ? 'light' : 'dark';
        
        // Update DOM
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
        
        // Update Profile Toggle UI
        updateProfileToggleUI(newTheme);
        
        // Sync with Sidebar Toggle if it exists (via global event or just direct selection)
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


function setupLanguageSelector() {
    const languageSelect = document.getElementById('language-select');
    
    if (!languageSelect) {
        console.log('Language selector not found');
        return;
    }
    
    // Check if languageManager exists (from language.js)
    if (typeof languageManager === 'undefined') {
        console.error('Language manager not loaded');
        return;
    }
    
    // Set initial value
    const currentLang = languageManager.getCurrentLanguage();
    languageSelect.value = currentLang;
    
    // Handle language change
    languageSelect.addEventListener('change', function(e) {
        const selectedLang = e.target.value;
        console.log('Language changed to:', selectedLang);
        languageManager.setLanguage(selectedLang);
    });
    
    // Listen for language changes from other pages
    window.addEventListener('languageChanged', function(e) {
        const newLang = e.detail.language;
        if (languageSelect.value !== newLang) {
            languageSelect.value = newLang;
        }
    });
}
