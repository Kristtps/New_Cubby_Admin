// ========================================
// AUDIT LOG PAGE - JAVASCRIPT FUNCTIONALITY
// ========================================

// Sample audit log entries
const auditLogEntries = [
    {
        id: 1,
        action: 'rental created',
        badge: 'S1',
        badgeType: 'warning',
        description: 'Rented for 1h. ₱10 via wallet',
        user: 'smthbalon@gmail.com',
        timestamp: 'Apr 17, 2026, 5:43 AM',
        icon: 'info',
        type: 'rental'
    },
    {
        id: 2,
        action: 'system initialized',
        badge: 'DEV-01',
        badgeType: 'secondary',
        description: 'Device DEV-01 powered on and connected',
        user: 'system',
        timestamp: 'Apr 17, 2026, 12:55 AM',
        icon: 'info',
        type: 'system'
    },
    {
        id: 3,
        action: 'locker added',
        badge: 'L1',
        badgeType: 'primary',
        description: 'New large locker configured',
        user: 'admin@coincubby.com',
        timestamp: 'Apr 17, 2026, 12:55 AM',
        icon: 'info',
        type: 'locker'
    },
    {
        id: 4,
        action: 'maintenance mode',
        badge: 'L2',
        badgeType: 'warning',
        description: 'Locker put in maintenance',
        user: 'admin@coincubby.com',
        timestamp: 'Apr 17, 2026, 12:55 AM',
        icon: 'warning',
        type: 'maintenance'
    },
    {
        id: 5,
        action: 'cash collected',
        badge: 'DEV-01',
        badgeType: 'secondary',
        description: 'Collected ₱2,450 in coins and bills',
        user: 'admin@coincubby.com',
        timestamp: 'Apr 17, 2026, 12:55 AM',
        icon: 'success',
        type: 'transaction'
    }
];

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
                            auditLogEntries.push({
                                id: entry.id,
                                action: entry.action,
                                badge: entry.entity_id || '-',
                                description: entry.details ? entry.details.description || '' : '',
                                user: entry.user_id || 'system',
                                timestamp: new Date(entry.created_at).toLocaleString(),
                                icon: 'info',
                                type: entry.entity_type || 'system'
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
                    <span class="auditlog-badge badge-${entry.badgeType}">${entry.badge}</span>
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
 * Add new audit log entry
 */
function addAuditLogEntry(entry) {
    try {
        const newEntry = {
            id: auditLogEntries.length + 1,
            timestamp: new Date().toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }),
            ...entry
        };

        auditLogEntries.unshift(newEntry);
        saveToLocalStorage();
        displayAuditLog();
        
        console.log('✓ Audit log entry added:', newEntry);
        return newEntry;
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
        console.log('✓ Audit log saved to localStorage');
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
    console.log(`✓ Filtered audit log by type: ${type}`);
}

/**
 * Search audit log entries
 */
function searchAuditLog(searchTerm) {
    const term = searchTerm.toLowerCase();
    const filtered = auditLogEntries.filter(entry => 
        entry.action.toLowerCase().includes(term) ||
        entry.description.toLowerCase().includes(term) ||
        entry.user.toLowerCase().includes(term) ||
        entry.badge.toLowerCase().includes(term)
    );
    
    displayAuditLog(filtered);
    console.log(`✓ Audit log search: "${searchTerm}" - found ${filtered.length} entries`);
}

/**
 * Get entries by action type
 */
function getEntriesByAction(action) {
    return auditLogEntries.filter(entry => entry.action === action);
}

/**
 * Get entries by user
 */
function getEntriesByUser(user) {
    return auditLogEntries.filter(entry => entry.user === user);
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

        console.log('✓ Audit log exported as CSV');
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

        console.log('✓ Audit log exported as JSON');
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
        // Count by type
        stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;

        // Count by action
        stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;

        // Count by user
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
