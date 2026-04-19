// ========================================
// RATES PAGE - JAVASCRIPT FUNCTIONALITY
// ========================================

// Set up event listeners on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (typeof isUserAuthenticated !== 'undefined' && !isUserAuthenticated()) {
        console.log('User not authenticated, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }
    
    initializeRatesPage();
});

/**
 * Initialize the rates page
 * Load rates from database or localStorage and set up event listeners
 */
async function initializeRatesPage() {
    // Try to load from database first
    if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected()) {
        try {
            console.log('Loading rates from Supabase...');
            if (typeof dbOps !== 'undefined' && dbOps.fetchRates) {
                const rates = await dbOps.fetchRates();
                if (rates) {
                    populateRatesFromDatabase(rates);
                    console.log('Rates loaded from database');
                } else {
                    console.log('No rates found in database, using localStorage');
                    loadSavedRates();
                }
            } else {
                loadSavedRates();
            }
        } catch (error) {
            console.error('Error loading rates from database:', error);
            console.log('Falling back to localStorage');
            loadSavedRates();
        }
    } else {
        console.log('Supabase not connected, using localStorage');
        loadSavedRates();
    }
    
    setupFormListeners();
    setupAutoSave();
}

/**
 * Populate rate fields from database data
 */
function populateRatesFromDatabase(rates) {
    try {
        if (rates.small) {
            document.getElementById('smallRate').value = rates.small.rate || 10;
            document.getElementById('smallMinimum').value = rates.small.minimum || 10;
        }
        
        if (rates.medium) {
            document.getElementById('mediumRate').value = rates.medium.rate || 20;
            document.getElementById('mediumMinimum').value = rates.medium.minimum || 20;
        }
        
        if (rates.large) {
            document.getElementById('largeRate').value = rates.large.rate || 35;
            document.getElementById('largeMinimum').value = rates.large.minimum || 35;
        }
    } catch (error) {
        console.error('Error populating rates from database:', error);
    }
}

/**
 * Load saved rates from localStorage
 */
function loadSavedRates() {
    try {
        const savedRates = localStorage.getItem('coincubby_rates');
        
        if (savedRates) {
            const rates = JSON.parse(savedRates);
            
            // Populate form fields with saved values
            if (rates.small) {
                document.getElementById('smallRate').value = rates.small.rate;
                document.getElementById('smallMinimum').value = rates.small.minimum;
            }
            
            if (rates.medium) {
                document.getElementById('mediumRate').value = rates.medium.rate;
                document.getElementById('mediumMinimum').value = rates.medium.minimum;
            }
            
            if (rates.large) {
                document.getElementById('largeRate').value = rates.large.rate;
                document.getElementById('largeMinimum').value = rates.large.minimum;
            }
            
            console.log('✓ Rates loaded from localStorage', rates);
        }
    } catch (error) {
        console.error('Error loading saved rates:', error);
    }
}

/**
 * Setup form submission
 */
function setupFormListeners() {
    const ratesForm = document.getElementById('ratesForm');
    
    if (ratesForm) {
        ratesForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveRates();
        });
    }
}

/**
 * Setup auto-save on input change
 */
function setupAutoSave() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            // Auto-save after 1 second of inactivity
            clearTimeout(window.autoSaveTimeout);
            window.autoSaveTimeout = setTimeout(() => {
                saveRates(true);
            }, 1000);
        });
    });
}

/**
 * Save rates to localStorage and backend
 */
function saveRates(isAutoSave = false) {
    try {
        // Get form values
        const rates = {
            small: {
                rate: parseFloat(document.getElementById('smallRate').value) || 0,
                minimum: parseFloat(document.getElementById('smallMinimum').value) || 0
            },
            medium: {
                rate: parseFloat(document.getElementById('mediumRate').value) || 0,
                minimum: parseFloat(document.getElementById('mediumMinimum').value) || 0
            },
            large: {
                rate: parseFloat(document.getElementById('largeRate').value) || 0,
                minimum: parseFloat(document.getElementById('largeMinimum').value) || 0
            },
            savedAt: new Date().toISOString()
        };

        // Validate rates
        if (!validateRates(rates)) {
            showErrorMessage('Please check your rate values. All rates must be greater than 0.');
            return;
        }

        // Save to localStorage
        localStorage.setItem('coincubby_rates', JSON.stringify(rates));

        // Try to save to backend if available
        saveRatesToBackend(rates);

        if (!isAutoSave) {
            showSuccessMessage('Rates saved successfully!');
            logRatesSaved(rates);
        }

    } catch (error) {
        console.error('Error saving rates:', error);
        showErrorMessage('Failed to save rates. Please try again.');
    }
}

/**
 * Validate rates data
 */
function validateRates(rates) {
    const { small, medium, large } = rates;

    // Check if all values are valid numbers
    if (isNaN(small.rate) || isNaN(small.minimum) ||
        isNaN(medium.rate) || isNaN(medium.minimum) ||
        isNaN(large.rate) || isNaN(large.minimum)) {
        return false;
    }

    // Check if rates are positive
    if (small.rate < 0 || small.minimum < 0 ||
        medium.rate < 0 || medium.minimum < 0 ||
        large.rate < 0 || large.minimum < 0) {
        return false;
    }

    return true;
}

/**
 * Send rates to backend API or Supabase
 */
async function saveRatesToBackend(rates) {
    try {
        // Try Supabase first if available
        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected()) {
            if (typeof dbOps !== 'undefined' && dbOps.updateRates) {
                await dbOps.updateRates(rates);
                console.log('✓ Rates updated in Supabase:', rates);
                return rates;
            }
        }
        
        // Check if API endpoints are available (fallback)
        if (typeof updateRates !== 'undefined') {
            const response = await updateRates(rates);
            console.log('✓ Rates updated in backend:', response);
            return response;
        }
    } catch (error) {
        console.warn('Backend API not available. Rates saved locally only.', error);
    }
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    removeExistingMessages();
    
    const messageEl = document.createElement('div');
    messageEl.className = 'success-message show';
    messageEl.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${message}</span>
    `;
    
    const form = document.getElementById('ratesForm');
    form.parentElement.insertBefore(messageEl, form);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        messageEl.remove();
    }, 4000);
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    removeExistingMessages();
    
    const messageEl = document.createElement('div');
    messageEl.className = 'error-message show';
    messageEl.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${message}</span>
    `;
    
    const form = document.getElementById('ratesForm');
    form.parentElement.insertBefore(messageEl, form);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        messageEl.remove();
    }, 5000);
}

/**
 * Remove existing messages
 */
function removeExistingMessages() {
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
}

/**
 * Log rates saved for debugging
 */
function logRatesSaved(rates) {
    const table = {
        'Small Locker': {
            'Rate per hour': `₱${rates.small.rate.toFixed(2)}`,
            'Minimum charge': `₱${rates.small.minimum.toFixed(2)}`
        },
        'Medium Locker': {
            'Rate per hour': `₱${rates.medium.rate.toFixed(2)}`,
            'Minimum charge': `₱${rates.medium.minimum.toFixed(2)}`
        },
        'Large Locker': {
            'Rate per hour': `₱${rates.large.rate.toFixed(2)}`,
            'Minimum charge': `₱${rates.large.minimum.toFixed(2)}`
        },
        'Saved at': new Date(rates.savedAt).toLocaleString()
    };
    
    console.table(table);
}

/**
 * Export current rates
 */
function exportRates() {
    try {
        const savedRates = localStorage.getItem('coincubby_rates');
        if (savedRates) {
            const rates = JSON.parse(savedRates);
            const dataStr = JSON.stringify(rates, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rates_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            console.log('✓ Rates exported successfully');
        }
    } catch (error) {
        console.error('Error exporting rates:', error);
    }
}

/**
 * Reset rates to defaults
 */
function resetRatesToDefault() {
    if (confirm('Are you sure you want to reset all rates to defaults?')) {
        document.getElementById('smallRate').value = 10;
        document.getElementById('smallMinimum').value = 10;
        
        document.getElementById('mediumRate').value = 20;
        document.getElementById('mediumMinimum').value = 20;
        
        document.getElementById('largeRate').value = 35;
        document.getElementById('largeMinimum').value = 35;
        
        saveRates();
        console.log('✓ Rates reset to defaults');
    }
}

/**
 * Get current rates
 */
function getCurrentRates() {
    try {
        const savedRates = localStorage.getItem('coincubby_rates');
        return savedRates ? JSON.parse(savedRates) : null;
    } catch (error) {
        console.error('Error getting current rates:', error);
        return null;
    }
}

/**
 * Format rate for display
 */
function formatRate(rate) {
    return `₱${parseFloat(rate).toFixed(2)}`;
}
