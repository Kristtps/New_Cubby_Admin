// ========================================
// RATES PAGE - JAVASCRIPT FUNCTIONALITY
// ========================================

const RATES_HISTORY_KEY = 'coincubby_rates_history';

// Track edit mode state
let isEditMode = false;

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
    setInputsDisabled(true); // Start with inputs disabled
    renderRatesHistory();
}

/**
 * Populate rate fields from database data
 */
function populateRatesFromDatabase(rates) {
    try {
        if (rates.small) {
            document.getElementById('smallRate').value = rates.small.rate || 10;
        }
        
        if (rates.medium) {
            document.getElementById('mediumRate').value = rates.medium.rate || 20;
        }
        
        if (rates.large) {
            document.getElementById('largeRate').value = rates.large.rate || 35;
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
            }
            
            if (rates.medium) {
                document.getElementById('mediumRate').value = rates.medium.rate;
            }
            
            if (rates.large) {
                document.getElementById('largeRate').value = rates.large.rate;
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
    const btnEditSave = document.getElementById('btnEditSave');
    const btnText = document.getElementById('btnText');
    
    if (btnEditSave) {
        btnEditSave.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (isEditMode) {
                // Currently in edit mode, so save the changes
                saveRates();
                setInputsDisabled(true);
                isEditMode = false;
                
                // Update button to show "Edit Rates"
                btnText.textContent = 'Edit Rates';
                btnEditSave.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span id="btnText">Edit Rates</span>
                `;
            } else {
                // Currently in view mode, so enable editing
                setInputsDisabled(false);
                isEditMode = true;
                
                // Update button to show "Save Changes"
                btnText.textContent = 'Save Changes';
                btnEditSave.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span id="btnText">Save Changes</span>
                `;
                
                // Focus on first input
                document.getElementById('smallRate')?.focus();
            }
        });
    }
}

/**
 * Enable or disable all rate input fields
 */
function setInputsDisabled(disabled) {
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.disabled = disabled;
    });
}

/**
 * Setup auto-save on input change (REMOVED - now manual only)
 */
function setupAutoSave() {
    // Removed auto-save functionality for better UX
    // Users now explicitly click Edit → Save
}

/**
 * Save rates to localStorage and backend
 */
function saveRates() {
    try {
        // Get form values
        const rates = {
            small: {
                rate: parseFloat(document.getElementById('smallRate').value) || 0,
                minimum: parseFloat(document.getElementById('smallRate').value) || 0
            },
            medium: {
                rate: parseFloat(document.getElementById('mediumRate').value) || 0,
                minimum: parseFloat(document.getElementById('mediumRate').value) || 0
            },
            large: {
                rate: parseFloat(document.getElementById('largeRate').value) || 0,
                minimum: parseFloat(document.getElementById('largeRate').value) || 0
            },
            savedAt: new Date().toISOString()
        };

        // Validate rates
        if (!validateRates(rates)) {
            showErrorMessage('Please check your rate values. All rates must be greater than 0.');
            return;
        }

        // Capture previous rates before overwriting
        const previousRates = getCurrentRates();

        // Save to localStorage
        localStorage.setItem('coincubby_rates', JSON.stringify(rates));

        // Try to save to backend if available
        saveRatesToBackend(rates);

        showSuccessMessage('Rates saved successfully!');
        logRatesSaved(rates);
        addToRatesHistory(rates, previousRates);
        renderRatesHistory();

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
    if (isNaN(small.rate) || isNaN(medium.rate) || isNaN(large.rate)) {
        return false;
    }

    // Check if rates are positive
    if (small.rate < 0 || medium.rate < 0 || large.rate < 0) {
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
            'Rate per hour': `₱${rates.small.rate.toFixed(2)}`
        },
        'Medium Locker': {
            'Rate per hour': `₱${rates.medium.rate.toFixed(2)}`
        },
        'Large Locker': {
            'Rate per hour': `₱${rates.large.rate.toFixed(2)}`
        },
        'Saved at': new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(new Date(rates.savedAt))
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
        document.getElementById('mediumRate').value = 20;
        document.getElementById('largeRate').value = 35;
        
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

// ========================================
// RATE CHANGE HISTORY
// ========================================

/**
 * Add a history entry whenever rates are manually saved.
 * @param {object} newRates  - the just-saved rates object
 * @param {object|null} oldRates - the previous rates (null if first save)
 */
function addToRatesHistory(newRates, oldRates) {
    try {
        const history = getRatesHistory();

        // Resolve admin name from localStorage auth
        let adminName = 'Admin';
        try {
            const auth = JSON.parse(localStorage.getItem('coincubby_auth') || '{}');
            if (auth.name) adminName = auth.name;
            else if (auth.email) adminName = auth.email.split('@')[0];
        } catch (_) {}

        const entry = {
            id: Date.now(),
            savedAt: new Date().toISOString(),
            changedBy: adminName,
            rates: {
                small:  newRates.small.rate,
                medium: newRates.medium.rate,
                large:  newRates.large.rate
            },
            previous: oldRates ? {
                small:  oldRates.small  ? oldRates.small.rate  : null,
                medium: oldRates.medium ? oldRates.medium.rate : null,
                large:  oldRates.large  ? oldRates.large.rate  : null
            } : null
        };

        // Prepend (newest first) and cap at 100 entries
        history.unshift(entry);
        if (history.length > 100) history.length = 100;

        localStorage.setItem(RATES_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error('Error saving rates history:', error);
    }
}

/**
 * Retrieve history array from localStorage.
 */
function getRatesHistory() {
    try {
        const raw = localStorage.getItem(RATES_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (_) {
        return [];
    }
}

/**
 * Render the history table in the DOM.
 */
function renderRatesHistory() {
    const tbody    = document.getElementById('ratesHistoryBody');
    const empty    = document.getElementById('ratesHistoryEmpty');
    const table    = document.getElementById('ratesHistoryTable');
    const countEl  = document.getElementById('historyCount');

    if (!tbody) return;

    const history = getRatesHistory();

    // Update count badge
    if (countEl) {
        countEl.textContent = history.length === 1 ? '1 record' : `${history.length} records`;
    }

    if (history.length === 0) {
        table.style.display  = 'none';
        empty.style.display  = 'flex';
        return;
    }

    table.style.display = '';
    empty.style.display = 'none';

    const fmt = new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        year:   'numeric',
        month:  'short',
        day:    '2-digit',
        hour:   '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    tbody.innerHTML = history.map((entry, idx) => {
        const dt   = fmt.formatToParts(new Date(entry.savedAt));
        const part = (t) => dt.find(p => p.type === t)?.value ?? '';
        const dateStr = `${part('month')} ${part('day')}, ${part('year')}`;
        const timeStr = `${part('hour')}:${part('minute')}:${part('second')} ${part('dayPeriod')}`;

        const initials = entry.changedBy.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

        const badge = (size, newVal, prev) => {
            if (prev === null || prev === undefined) {
                return `<span class="change-badge unchanged">${size}: ₱${parseFloat(newVal).toFixed(2)}</span>`;
            }
            const diff = newVal - prev;
            if (diff > 0) {
                return `<span class="change-badge increased">↑ ${size} +₱${diff.toFixed(2)}</span>`;
            } else if (diff < 0) {
                return `<span class="change-badge decreased">↓ ${size} -₱${Math.abs(diff).toFixed(2)}</span>`;
            }
            return `<span class="change-badge unchanged">${size}: no change</span>`;
        };

        const prev = entry.previous || {};
        const changeBadges = [
            badge('Small',  entry.rates.small,  prev.small),
            badge('Medium', entry.rates.medium, prev.medium),
            badge('Large',  entry.rates.large,  prev.large)
        ].join('');

        return `
        <tr>
            <td><span class="history-index">${idx + 1}</span></td>
            <td>
                <div class="history-datetime">
                    <span class="history-date">${dateStr}</span>
                    <span class="history-time">${timeStr}</span>
                </div>
            </td>
            <td>
                <div class="history-admin">
                    <div class="history-admin-avatar">${initials}</div>
                    <span class="history-admin-name">${escapeHtml(entry.changedBy)}</span>
                </div>
            </td>
            <td><span class="history-rate">₱${parseFloat(entry.rates.small).toFixed(2)}</span></td>
            <td><span class="history-rate">₱${parseFloat(entry.rates.medium).toFixed(2)}</span></td>
            <td><span class="history-rate">₱${parseFloat(entry.rates.large).toFixed(2)}</span></td>
            <td><div class="history-changes">${changeBadges}</div></td>
        </tr>`;
    }).join('');
}

/**
 * Clear all rate change history.
 */
function clearRatesHistory() {
    if (!confirm('Are you sure you want to clear the entire rate change history? This cannot be undone.')) return;
    localStorage.removeItem(RATES_HISTORY_KEY);
    renderRatesHistory();
}

/**
 * Minimal XSS escape for user-controlled strings rendered as HTML.
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
