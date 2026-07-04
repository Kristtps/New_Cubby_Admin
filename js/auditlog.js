// ========================================
// AUDIT LOG PAGE - JAVASCRIPT FUNCTIONALITY
// ========================================

// Audit log entries (initially empty)
const auditLogEntries = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (typeof isUserAuthenticated !== 'undefined' && !isUserAuthenticated()) {
        console.log('User not authenticated, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }
    
    initializeAuditLog();
});

/**
 * Initialize audit log page
 */
async function initializeAuditLog() {
    await loadAuditLogEntries();
    displayAuditLog();
    initializeAuditLogSearch();
}

/**
 * Format timestamp to readable format with Philippine time (PHT/UTC+8)
 * Properly handles server timestamps in UTC and converts to Philippine timezone
 */
function formatTimestamp(timestamp) {
    let dateObj;
    
    // Handle different timestamp formats
    if (typeof timestamp === 'string') {
        // ISO string from database
        dateObj = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
        // Unix timestamp
        dateObj = new Date(timestamp);
    } else if (timestamp instanceof Date) {
        dateObj = timestamp;
    } else {
        dateObj = new Date();
    }

    // If the Date is invalid, return a fallback
    if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
    }
    
    // Create options for formatting in Philippine timezone
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila' // Philippine Standard Time (PHT, UTC+8)
    };
    
    // Format the date using Intl API with Manila timezone
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const formatted = formatter.format(dateObj);
    
    // Append timezone indicator
    return `${formatted} PHT`;
}

/**
 * Initialize audit log search functionality
 */
function initializeAuditLogSearch() {
    const searchInput = document.getElementById('auditlog-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            displayAuditLog();
        } else {
            searchAuditLog(searchTerm);
        }
    });
}

/**
 * Load audit log entries from database or localStorage
 */
async function loadAuditLogEntries() {
    try {
        // Try to load from Supabase first
        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected()) {
            if (typeof dbOps !== 'undefined' && dbOps.fetchAllAuditLogs) {
                try {
                    const entries = await dbOps.fetchAllAuditLogs();
                    if (entries && entries.length > 0) {
                        // Transform database entries to UI format
                        auditLogEntries.length = 0; // Clear existing entries
                        entries.forEach(entry => {
                            const details = entry.details || {};
                            auditLogEntries.push({
                                id: entry.log_id,
                                action: entry.action || 'Action',
                                badge: details.badge || '-',
                                badgeType: details.badgeType || 'secondary',
                                description: details.description || '',
                                user: entry.user_id || 'system',
                                timestamp: formatTimestamp(entry.timestamp),
                                icon: details.icon || 'info',
                                type: details.type || 'system'
                            });
                        });
                        console.log('✓ Audit log loaded from database:', auditLogEntries);
                        return;
                    }
                } catch (error) {
                    console.warn('Error loading from database:', error);
                }
            }
        }
        
        // Fall back to localStorage
        const savedEntries = localStorage.getItem('coincubby_audit_log');
        if (savedEntries) {
            const entries = JSON.parse(savedEntries);
            auditLogEntries.unshift(...entries);
            console.log('✓ Audit log entries loaded from localStorage', entries);
        }
    } catch (error) {
        console.warn('Using default audit log entries:', error);
    }
}

/**
 * Display audit log entries
 */
function displayAuditLog(entries = auditLogEntries) {
    const auditLogList = document.getElementById('auditLogList');
    
    if (!auditLogList) {
        console.error('Audit log list container not found');
        return;
    }

    if (entries.length === 0) {
        auditLogList.innerHTML = `
            <div class="auditlog-empty">
                <div class="auditlog-empty-icon">📋</div>
                <div class="auditlog-empty-title">No audit entries</div>
                <div class="auditlog-empty-message">No actions have been logged yet</div>
            </div>
        `;
        return;
    }

    auditLogList.innerHTML = entries.map(entry => `
        <div class="auditlog-entry">
            <div class="auditlog-icon ${entry.icon}">
                ${getIconSVG(entry.icon)}
            </div>
            <div class="auditlog-content">
                <div class="auditlog-header">
                    <span class="auditlog-action">${entry.action}</span>
                    <span class="auditlog-badge badge-${entry.badgeType || 'secondary'}">${entry.badge}</span>
                </div>
                <p class="auditlog-description">${entry.description}</p>
                <div class="auditlog-meta">
                    <span class="auditlog-user">${entry.user}</span>
                    <span class="auditlog-timestamp">${entry.timestamp}</span>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Get icon SVG based on type
 */
function getIconSVG(iconType) {
    const icons = {
        info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
        warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05l-8.47-14.14a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
    };
    
    return icons[iconType] || icons.info;
}

/**
 * Add new audit log entry and persist to database
 */
async function addAuditLogEntry(entry) {
    try {
        const dbEntry = {
            action: entry.action,
            user_id: entry.user_id || null,
            details: {
                description: entry.description,
                badge: entry.badge,
                badgeType: entry.badgeType,
                icon: entry.icon,
                type: entry.type
            },
            timestamp: new Date().toISOString()
        };

        // Persist to Supabase if connected
        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected()) {
            if (typeof dbOps !== 'undefined' && dbOps.createAuditLog) {
                await dbOps.createAuditLog(dbEntry);
            }
        }

        const uiEntry = {
            id: Date.now(),
            timestamp: formatTimestamp(new Date()),
            ...entry
        };

        auditLogEntries.unshift(uiEntry);
        saveToLocalStorage();
        displayAuditLog();
        
        console.log('✓ Audit log entry added:', uiEntry);
        return uiEntry;
    } catch (error) {
        console.error('Error adding audit log entry:', error);
    }
}

/**
 * Save audit log to localStorage
 */
function saveToLocalStorage() {
    try {
        localStorage.setItem('coincubby_audit_log', JSON.stringify(auditLogEntries));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

/**
 * Filter audit log by type
 */
function filterAuditLogByType(type) {
    const filtered = type === 'all' 
        ? auditLogEntries 
        : auditLogEntries.filter(entry => entry.type === type);
    
    displayAuditLog(filtered);
}

/**
 * Search audit log entries
 */
function searchAuditLog(searchTerm) {
    const term = searchTerm.toLowerCase();
    const filtered = auditLogEntries.filter(entry => 
        (entry.action && entry.action.toLowerCase().includes(term)) ||
        (entry.description && entry.description.toLowerCase().includes(term)) ||
        (entry.user && entry.user.toLowerCase().includes(term)) ||
        (entry.badge && entry.badge.toLowerCase().includes(term))
    );
    
    displayAuditLog(filtered);
}

/**
 * Clear all audit log entries
 */
function clearAuditLog() {
    if (confirm('Are you sure you want to clear all audit log entries? This cannot be undone.')) {
        auditLogEntries.length = 0;
        localStorage.removeItem('coincubby_audit_log');
        displayAuditLog();
        console.log('✓ Audit log cleared');
    }
}

/**
 * Export audit log as CSV
 */
function exportAuditLogAsCSV() {
    try {
        const headers = ['ID', 'Action', 'Badge', 'Description', 'User', 'Timestamp', 'Type'];
        const rows = auditLogEntries.map(entry => [
            entry.id,
            entry.action,
            entry.badge,
            entry.description,
            entry.user,
            entry.timestamp,
            entry.type
        ]);

        const csv = [headers, ...rows].map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting audit log:', error);
    }
}

/**
 * Export audit log as JSON
 */
function exportAuditLogAsJSON() {
    try {
        const dataStr = JSON.stringify(auditLogEntries, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_log_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting audit log:', error);
    }
}

/**
 * Get audit log statistics
 */
function getAuditLogStatistics() {
    const stats = {
        totalEntries: auditLogEntries.length,
        byType: {},
        byAction: {},
        byUser: {}
    };

    auditLogEntries.forEach(entry => {
        stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
        stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;
        stats.byUser[entry.user] = (stats.byUser[entry.user] || 0) + 1;
    });

    return stats;
}

/**
 * Log rental event
 */
function logRentalEvent(lockerId, duration, amount, customer) {
    addAuditLogEntry({
        action: 'rental created',
        badge: lockerId,
        badgeType: 'warning',
        description: `Rented for ${duration}h. ₱${amount} via wallet`,
        user: customer,
        icon: 'info',
        type: 'rental'
    });
}

/**
 * Log system event
 */
function logSystemEvent(deviceId, description) {
    addAuditLogEntry({
        action: 'system initialized',
        badge: deviceId,
        badgeType: 'secondary',
        description: description,
        user: 'system',
        icon: 'info',
        type: 'system'
    });
}

/**
 * Log maintenance event
 */
function logMaintenanceEvent(lockerId, description, user = 'admin@coincubby.com') {
    addAuditLogEntry({
        action: 'maintenance mode',
        badge: lockerId,
        badgeType: 'warning',
        description: description,
        user: user,
        icon: 'warning',
        type: 'maintenance'
    });
}

/**
 * Log cash collection event
 */
function logCashCollectionEvent(amount, deviceId, user = 'admin@coincubby.com') {
    addAuditLogEntry({
        action: 'cash collected',
        badge: deviceId,
        badgeType: 'secondary',
        description: `Collected ₱${amount.toFixed(2)} in coins and bills`,
        user: user,
        icon: 'success',
        type: 'transaction'
    });
}

/**
 * Get recent entries (last n entries)
 */
function getRecentEntries(count = 10) {
    return auditLogEntries.slice(0, count);
}

// Expose functions globally
window.addAuditLogEntry = addAuditLogEntry;
window.filterAuditLogByType = filterAuditLogByType;
window.searchAuditLog = searchAuditLog;
window.clearAuditLog = clearAuditLog;
window.exportAuditLogAsCSV = exportAuditLogAsCSV;
window.exportAuditLogAsJSON = exportAuditLogAsJSON;
window.getAuditLogStatistics = getAuditLogStatistics;
window.logRentalEvent = logRentalEvent;
window.logSystemEvent = logSystemEvent;
window.logMaintenanceEvent = logMaintenanceEvent;
window.logCashCollectionEvent = logCashCollectionEvent;


// ==================== AJAX FUNCTIONALITY ====================

/**
 * Store current state for AJAX operations
 */
let autoRefreshAuditInterval = null;
let allAuditLogsData = [];
let displayedAuditCount = 0;
const AUDIT_ITEMS_PER_LOAD = 30;
let isLoadingMoreAudit = false;

/**
 * Initialize auto-refresh for real-time audit log updates (every 15 seconds)
 */
function initializeAuditAutoRefresh() {
    autoRefreshAuditInterval = setInterval(async function() {
        try {
            await loadAuditLogEntries();
            console.log('✓ Audit log auto-refreshed');
        } catch (error) {
            console.error('Audit log auto-refresh error:', error);
        }
    }, 15000); // 15 seconds
}

/**
 * Stop audit log auto-refresh
 */
function stopAuditAutoRefresh() {
    if (autoRefreshAuditInterval) {
        clearInterval(autoRefreshAuditInterval);
        autoRefreshAuditInterval = null;
    }
}

/**
 * Initialize infinite scroll for audit log
 */
function initializeAuditInfiniteScroll() {
    const container = document.querySelector('.auditlog-container');
    if (!container) return;

    container.addEventListener('scroll', function() {
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
            loadMoreAuditLogs();
        }
    });
}

/**
 * Load more audit log entries
 */
function loadMoreAuditLogs() {
    if (isLoadingMoreAudit) return;
    
    isLoadingMoreAudit = true;
    const auditLogList = document.getElementById('auditLogList');
    
    if (!auditLogList) return;

    const currentCount = auditLogList.querySelectorAll('.auditlog-entry').length;

    // If we've already loaded all entries, don't load more
    if (currentCount >= auditLogEntries.length) {
        isLoadingMoreAudit = false;
        return;
    }

    // Simulate loading delay for better UX
    setTimeout(() => {
        const nextBatch = auditLogEntries.slice(currentCount, currentCount + AUDIT_ITEMS_PER_LOAD);
        const nextBatchHTML = nextBatch.map(entry => `
            <div class="auditlog-entry">
                <div class="auditlog-icon ${entry.icon}">
                    ${getIconSVG(entry.icon)}
                </div>
                <div class="auditlog-content">
                    <div class="auditlog-header">
                        <span class="auditlog-action">${entry.action}</span>
                        <span class="auditlog-badge badge-${entry.badgeType || 'secondary'}">${entry.badge}</span>
                    </div>
                    <p class="auditlog-description">${entry.description}</p>
                    <div class="auditlog-meta">
                        <span class="auditlog-user">${entry.user}</span>
                        <span class="auditlog-timestamp">${entry.timestamp}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        auditLogList.innerHTML += nextBatchHTML;
        isLoadingMoreAudit = false;
        console.log(`✓ Loaded ${nextBatch.length} more audit entries`);
    }, 300);
}

/**
 * Store all audit logs for lazy loading
 */
function storeAllAuditLogsData() {
    allAuditLogsData = [...auditLogEntries];
}

/**
 * Update displayAuditLog to support lazy loading
 */
const originalDisplayAuditLog = displayAuditLog;
function displayAuditLog(entries = auditLogEntries) {
    const auditLogList = document.getElementById('auditLogList');
    
    if (!auditLogList) {
        console.error('Audit log list container not found');
        return;
    }

    if (entries.length === 0) {
        auditLogList.innerHTML = `
            <div class="auditlog-empty">
                <div class="auditlog-empty-icon">📋</div>
                <div class="auditlog-empty-title">No audit entries</div>
                <div class="auditlog-empty-message">No actions have been logged yet</div>
            </div>
        `;
        return;
    }

    storeAllAuditLogsData();

    // Initially load only first AUDIT_ITEMS_PER_LOAD items
    const initialBatch = entries.slice(0, AUDIT_ITEMS_PER_LOAD);
    
    auditLogList.innerHTML = initialBatch.map(entry => `
        <div class="auditlog-entry">
            <div class="auditlog-icon ${entry.icon}">
                ${getIconSVG(entry.icon)}
            </div>
            <div class="auditlog-content">
                <div class="auditlog-header">
                    <span class="auditlog-action">${entry.action}</span>
                    <span class="auditlog-badge badge-${entry.badgeType || 'secondary'}">${entry.badge}</span>
                </div>
                <p class="auditlog-description">${entry.description}</p>
                <div class="auditlog-meta">
                    <span class="auditlog-user">${entry.user}</span>
                    <span class="auditlog-timestamp">${entry.timestamp}</span>
                </div>
            </div>
        </div>
    `).join('');

    console.log(`✓ Displayed ${initialBatch.length} audit entries (${entries.length} total)`);
}

/**
 * Enhanced initialize audit log with AJAX features
 */
const originalInitializeAuditLog = initializeAuditLog;
async function initializeAuditLog() {
    await loadAuditLogEntries();
    displayAuditLog();
    initializeAuditLogSearch();
    
    // Initialize AJAX features
    initializeAuditAutoRefresh();
    initializeAuditInfiniteScroll();
}
