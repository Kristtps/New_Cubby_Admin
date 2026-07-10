/**
 * Theme Management System
 * Handles dark mode toggle with localStorage persistence
 * Works across all admin pages
 */

class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'coincubby_theme';
        this.LIGHT_THEME = 'light';
        this.DARK_THEME = 'dark';
        this.init();
    }

    /**
     * Initialize theme manager
     * 1. Check localStorage for saved preference
     * 2. Check system preference if no saved preference
     * 3. Apply the theme
     * 4. Set up event listeners
     */
    init() {
        // Get saved theme or determine based on system preference
        const savedTheme = this.getSavedTheme();
        const preferredTheme = savedTheme || this.getSystemPreference();
        
        // Apply the theme
        this.setTheme(preferredTheme);
        
        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Get the saved theme from localStorage
     * @returns {string|null} Saved theme or null if not found
     */
    getSavedTheme() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved === this.LIGHT_THEME || saved === this.DARK_THEME) {
                return saved;
            }
        } catch (e) {
            console.warn('localStorage access denied:', e);
        }
        return null;
    }

    /**
     * Get the system preference for theme
     * Checks if user prefers dark mode via media query
     * @returns {string} 'dark' or 'light'
     */
    getSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return this.DARK_THEME;
        }
        return this.LIGHT_THEME;
    }

    /**
     * Set the theme and update UI
     * @param {string} theme - 'light' or 'dark'
     */
    setTheme(theme) {
        if (theme !== this.LIGHT_THEME && theme !== this.DARK_THEME) {
            console.warn('Invalid theme:', theme);
            return;
        }

        // Update HTML element data-theme attribute
        const htmlElement = document.documentElement;
        htmlElement.setAttribute('data-theme', theme);

        // Update toggle button state
        this.updateToggleUI(theme);

        // Save to localStorage
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (e) {
            console.warn('Failed to save theme to localStorage:', e);
        }

        // Dispatch custom event for other scripts to listen to
        window.dispatchEvent(new CustomEvent('themechange', { 
            detail: { theme: theme }
        }));
    }

    /**
     * Toggle between light and dark theme
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || this.LIGHT_THEME;
        const newTheme = currentTheme === this.LIGHT_THEME ? this.DARK_THEME : this.LIGHT_THEME;
        this.setTheme(newTheme);
    }

    /**
     * Update the toggle button and label UI
     * @param {string} theme - Current theme
     */
    updateToggleUI(theme) {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        const themeIcon = document.getElementById('theme-icon');
        const themeLabel = document.getElementById('theme-label');

        if (toggleBtn) {
            toggleBtn.setAttribute('aria-pressed', theme === this.DARK_THEME ? 'true' : 'false');
        }

        if (themeIcon) {
            // Show moon for light mode (indicating dark mode is available)
            // Show sun for dark mode (indicating light mode is available)
            themeIcon.textContent = theme === this.LIGHT_THEME ? '🌙' : '☀️';
        }

        if (themeLabel) {
            themeLabel.textContent = theme === this.LIGHT_THEME ? 'Dark' : 'Light';
        }
    }

    /**
     * Set up event listeners for theme toggle
     */
    setupEventListeners() {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
            
            // Keyboard accessibility
            toggleBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
        }

        // Listen for system theme preference changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only auto-switch if user hasn't set a preference
                if (!this.getSavedTheme()) {
                    const newTheme = e.matches ? this.DARK_THEME : this.LIGHT_THEME;
                    this.setTheme(newTheme);
                }
            });
        }
    }

    /**
     * Get current theme
     * @returns {string} Current theme ('light' or 'dark')
     */
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || this.LIGHT_THEME;
    }
}

// Create a static method for synchronous theme initialization (before DOM renders)
ThemeManager.initializeSync = function() {
    const STORAGE_KEY = 'coincubby_theme';
    const DARK_THEME = 'dark';
    
    try {
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        const theme = (savedTheme === DARK_THEME || savedTheme === 'light') 
            ? savedTheme 
            : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : 'light');
        document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
        // Fallback to light theme if localStorage fails
        document.documentElement.setAttribute('data-theme', 'light');
    }
};

// Initialize theme manager when DOM is ready (for event listeners)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    // DOM is already loaded
    window.themeManager = new ThemeManager();
}
