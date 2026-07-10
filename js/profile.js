// ========================================
// PROFILE PAGE - JAVASCRIPT FUNCTIONALITY
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (typeof isUserAuthenticated !== 'undefined' && !isUserAuthenticated()) {
        console.log('User not authenticated, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }
    
    setupProfileForm();
    setupPasswordForm();
    setupProfileThemeToggle();
});

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

    // Load initial values from localStorage if they exist
    const savedName = localStorage.getItem('coincubby_admin_name');
    const savedEmail = localStorage.getItem('coincubby_admin_email');
    const savedAvatar = localStorage.getItem('coincubby_admin_avatar');

    if (savedName) {
        nameInput.value = savedName;
        mainName.textContent = savedName;
        sidebarName.textContent = savedName;
    }
    
    if (savedEmail) {
        emailInput.value = savedEmail;
        mainEmail.textContent = savedEmail;
    }
    
    if (savedAvatar) {
        setAvatarImage(savedAvatar);
    } else if (savedName) {
        setAvatarInitials(savedName);
    } else {
        setAvatarInitials(nameInput.value);
    }

    let isEditing = false;

    // Toggle edit mode
    editBtn.addEventListener('click', function(e) {
        e.preventDefault();
        isEditing = !isEditing;
        
        if (isEditing) {
            // Enable editing
            editBtn.textContent = 'Cancel';
            nameInput.removeAttribute('readonly');
            emailInput.removeAttribute('readonly');
            avatarUpload.removeAttribute('disabled');
            btnUploadAvatar.removeAttribute('disabled');
            saveBtn.style.display = 'block';
            nameInput.focus();
        } else {
            // Disable editing (cancel)
            editBtn.textContent = 'Edit';
            nameInput.setAttribute('readonly', 'readonly');
            emailInput.setAttribute('readonly', 'readonly');
            avatarUpload.setAttribute('disabled', 'disabled');
            btnUploadAvatar.setAttribute('disabled', 'disabled');
            saveBtn.style.display = 'none';
            
            // Revert changes
            nameInput.value = localStorage.getItem('coincubby_admin_name') || 'Admin User';
            emailInput.value = localStorage.getItem('coincubby_admin_email') || 'admin@coincubby.com';
            
            const avatar = localStorage.getItem('coincubby_admin_avatar');
            if (avatar) {
                setAvatarImage(avatar);
            } else {
                setAvatarInitials(nameInput.value);
            }
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

    // Save profile changes
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Save to localStorage (mocking DB save)
        localStorage.setItem('coincubby_admin_name', nameInput.value);
        localStorage.setItem('coincubby_admin_email', emailInput.value);
        
        // If image uploaded, it's already previewing, but we save it as a data URL for now
        // In a real app this would upload to storage and return a URL
        if (avatarPreview.style.backgroundImage) {
            const bgImage = avatarPreview.style.backgroundImage.slice(5, -2);
            localStorage.setItem('coincubby_admin_avatar', bgImage);
        } else {
            localStorage.removeItem('coincubby_admin_avatar');
            setAvatarInitials(nameInput.value);
        }

        // Update UI
        mainName.textContent = nameInput.value;
        sidebarName.textContent = nameInput.value;
        mainEmail.textContent = emailInput.value;

        // Exit edit mode
        isEditing = false;
        editBtn.textContent = 'Edit';
        nameInput.setAttribute('readonly', 'readonly');
        emailInput.setAttribute('readonly', 'readonly');
        avatarUpload.setAttribute('disabled', 'disabled');
        btnUploadAvatar.setAttribute('disabled', 'disabled');
        saveBtn.style.display = 'none';
        
        // Optional: show a toast or success indicator
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
}

function setupPasswordForm() {
    const passwordForm = document.getElementById('password-form');
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    const errorMsg = document.getElementById('password-error');
    const successMsg = document.getElementById('password-success');

    passwordForm.addEventListener('submit', function(e) {
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

        // Simulating password update success
        successMsg.style.display = 'block';
        passwordForm.reset();
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);
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
