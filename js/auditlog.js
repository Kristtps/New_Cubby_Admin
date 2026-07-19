// ========================================
// AUDIT LOG PAGE - JAVASCRIPT FUNCTIONALITY
// ========================================

// Audit log entries (initially empty)
const auditLogEntries = [];

// Current filter states
let auditCategoryFilter = 'all';
let auditDateFilter = 'all';
let auditSearchQuery = '';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function () {
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
    initializeAuditAutoRefresh();
    initializeAuditInfiniteScroll();
}

/**
 * Format timestamp to readable format with Manila/Singapore timezone (UTC+8)
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';

    const formatted = formatForDisplay(timestamp, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    return formatted;
}

/**
 * Get time-only string for card display (e.g., "11:49 PM")
 */
function getTimeString(timestamp) {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
        return '';
    }
}

/**
 * Get full date string for card display (e.g., "Jul 18, 2026")
 */
function getDateString(timestamp) {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return '';
    }
}

/**
 * Group audit log entry by date (Today, Yesterday, This Week, Older)
 */
function getAuditGroup(timestamp) {
    if (!timestamp) return 'Older';
    const date = new Date(timestamp);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = Math.abs(today - entryDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return 'This Week';
    return 'Older';
}

/**
 * Initialize audit log search functionality
 */
function initializeAuditLogSearch() {
    const searchInput = document.getElementById('auditlog-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        auditSearchQuery = e.target.value.toLowerCase().trim();
        displayAuditLog();
    });
}

/**
 * Set category filter
 */
window.setAuditCategoryFilter = function (category, btnElement) {
    auditCategoryFilter = category;

    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (btnElement) btnElement.classList.add('active');

    displayAuditLog();
};

/**
 * Set date filter
 */
window.setAuditDateFilter = function (range) {
    auditDateFilter = range;
    displayAuditLog();
};

/**
 * Load audit log entries from database or localStorage
 */
async function loadAuditLogEntries() {
    try {
        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected()) {
            if (typeof dbOps !== 'undefined' && dbOps.fetchAllAuditLogs) {
                try {
                    const entries = await dbOps.fetchAllAuditLogs();
                    if (entries && entries.length > 0) {
                        auditLogEntries.length = 0;
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
                                rawTimestamp: entry.timestamp,
                                icon: details.icon || 'info',
                                type: details.type || 'system'
                            });
                        });
                        console.log('✓ Audit log loaded from database:', auditLogEntries.length);
                        return;
                    }
                } catch (error) {
                    console.warn('Error loading from database:', error);
                }
            }
        }

        const savedEntries = localStorage.getItem('coincubby_audit_log');
        if (savedEntries) {
            const entries = JSON.parse(savedEntries);
            auditLogEntries.length = 0;
            auditLogEntries.push(...entries);
            console.log('✓ Audit log entries loaded from localStorage', entries.length);
        }
    } catch (error) {
        console.warn('Using default audit log entries:', error);
    }
}

/**
 * Get filtered entries based on current search, category, and date filters
 */
function getFilteredEntries() {
    return auditLogEntries.filter(entry => {
        // Category filter
        if (auditCategoryFilter !== 'all') {
            const entryType = (entry.type || '').toLowerCase();
            const entryBadge = (entry.badge || '').toLowerCase();
            if (entryType !== auditCategoryFilter && entryBadge !== auditCategoryFilter) {
                return false;
            }
        }

        // Date filter
        if (auditDateFilter !== 'all') {
            const ts = entry.rawTimestamp || entry.timestamp;
            const group = getAuditGroup(ts);
            if (auditDateFilter === 'today' && group !== 'Today') return false;
            if (auditDateFilter === 'week' && group !== 'Today' && group !== 'Yesterday' && group !== 'This Week') return false;
            if (auditDateFilter === 'month') {
                const date = new Date(ts);
                const now = new Date();
                if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return false;
            }
        }

        // Search filter
        if (auditSearchQuery) {
            const term = auditSearchQuery;
            const action = (entry.action || '').toLowerCase();
            const description = (entry.description || '').toLowerCase();
            const user = (entry.user || '').toLowerCase();
            const badge = (entry.badge || '').toLowerCase();
            const type = (entry.type || '').toLowerCase();
            if (!action.includes(term) && !description.includes(term) && !user.includes(term) && !badge.includes(term) && !type.includes(term)) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Map icon type to CSS class
 */
function getIconClass(iconType) {
    const map = {
        success: 'icon-success',
        warning: 'icon-warning',
        error: 'icon-error',
        info: 'icon-info'
    };
    return map[iconType] || 'icon-default';
}

/**
 * Display audit log entries as grouped cards
 */
function displayAuditLog() {
    const auditLogList = document.getElementById('auditLogList');
    if (!auditLogList) {
        console.error('Audit log list container not found');
        return;
    }

    const filtered = getFilteredEntries();

    if (filtered.length === 0) {
        auditLogList.innerHTML = `
            <div class="auditlog-empty">
                <div class="auditlog-empty-icon">📋</div>
                <div class="auditlog-empty-title">No audit entries</div>
                <div class="auditlog-empty-message">No actions match your current filters.</div>
            </div>
        `;
        return;
    }

    // Group entries
    const groups = {
        'Today': [],
        'Yesterday': [],
        'This Week': [],
        'Older': []
    };

    filtered.forEach(entry => {
        const ts = entry.rawTimestamp || entry.timestamp;
        const group = getAuditGroup(ts);
        groups[group].push(entry);
    });

    // Render
    let html = '';
    ['Today', 'Yesterday', 'This Week', 'Older'].forEach(groupName => {
        const items = groups[groupName];
        if (items.length === 0) return;

        html += `<div class="auditlog-group-header">${groupName}</div>`;

        items.forEach(entry => {
            const ts = entry.rawTimestamp || entry.timestamp;
            const timeStr = getTimeString(ts);
            const dateStr = getDateString(ts);
            const iconClass = getIconClass(entry.icon);

            html += `
                <div class="auditlog-card">
                    <div class="auditlog-card-icon ${iconClass}">
                        ${getIconSVG(entry.icon)}
                    </div>
                    <div class="auditlog-card-body">
                        <div class="auditlog-card-top-row">
                            <div class="auditlog-card-title-area">
                                <span class="auditlog-card-title">${entry.action}</span>
                                <span class="auditlog-card-badge badge-${entry.badgeType || 'secondary'}">${entry.badge}</span>
                            </div>
                            <div class="auditlog-card-time">
                                <div>${timeStr}</div>
                                <div class="auditlog-card-time-full">${dateStr}</div>
                            </div>
                        </div>
                        <p class="auditlog-card-desc">${entry.description}</p>
                        <div class="auditlog-card-meta">
                            <span class="auditlog-card-user">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                ${entry.user}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
    });

    auditLogList.innerHTML = html;
    console.log(`✓ Displayed ${filtered.length} audit entries`);
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
        const timestamp = convertToSGT(new Date()).toISOString();

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
            timestamp: timestamp
        };

        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected()) {
            if (typeof dbOps !== 'undefined' && dbOps.createAuditLog) {
                await dbOps.createAuditLog(dbEntry);
            }
        }

        const uiEntry = {
            id: Date.now(),
            timestamp: formatTimestamp(new Date()),
            rawTimestamp: new Date().toISOString(),
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
 * Search audit log entries (legacy compatibility)
 */
function searchAuditLog(searchTerm) {
    auditSearchQuery = searchTerm.toLowerCase();
    displayAuditLog();
}

/**
 * Filter audit log by type (legacy compatibility)
 */
function filterAuditLogByType(type) {
    auditCategoryFilter = type;
    displayAuditLog();
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

let autoRefreshAuditInterval = null;

/**
 * Initialize auto-refresh for real-time audit log updates (every 15 seconds)
 */
function initializeAuditAutoRefresh() {
    autoRefreshAuditInterval = setInterval(async function () {
        try {
            await loadAuditLogEntries();
            displayAuditLog();
            console.log('✓ Audit log auto-refreshed');
        } catch (error) {
            console.error('Audit log auto-refresh error:', error);
        }
    }, 15000);
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

    container.addEventListener('scroll', function () {
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
            // Future: load more entries if pagination is needed
        }
    });
}
