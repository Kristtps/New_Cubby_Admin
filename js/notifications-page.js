/**
 * Notifications Page Module
 * Displays and manages all system notifications
 */

let allNotifications = [];
let currentFilter = 'all';
let searchQuery = '';
let selectedNotificationId = null;
const NOTIFICATION_CHECK_INTERVAL = 30000;

/**
 * Get count of unread notifications (standalone for this page)
 */
async function checkUnreadNotifications() {
    try {
        if (!window.supabase || typeof window.supabase.from !== 'function') return 0;
        const { count, error } = await window.supabase
            .from('notifications')
            .select('notification_id', { count: 'exact', head: true })
            .eq('is_read', false);
        if (error) { console.error('Error getting unread count:', error); return 0; }
        return count || 0;
    } catch (err) { console.error('Exception getting unread count:', err); return 0; }
}

// Initialize notifications page
document.addEventListener('DOMContentLoaded', async function () {
    if (!document.getElementById('notifications-container')) return;

    // Wait for Supabase to initialize
    if (window.supabasePromise) {
        await window.supabasePromise;
    }

    // Fire notification list + badge count in parallel
    Promise.allSettled([loadNotifications(), checkUnreadNotifications()]);

    // Set up realtime subscription for live updates
    subscribeToNotificationChanges();

    // Auto-refresh notifications every 30 seconds (fallback if realtime disconnects)
    setInterval(async function () {
        try {
            await loadNotifications();
        } catch (err) {
            console.error('Notifications auto-refresh error:', err);
        }
    }, NOTIFICATION_CHECK_INTERVAL);
});

/**
 * Load all notifications from database
 */
async function loadNotifications() {
    const container = document.getElementById('notifications-container');

    try {
        // Check if Supabase is connected
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #ef4444;">Database not connected</div>';
            return;
        }

        // Show loading state only if this is the first load (container still has the placeholder)
        if (allNotifications.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--color-text-muted);">Loading notifications...</div>';
        }

        // Fetch notifications — select only columns the UI renders
        const { data, error } = await window.supabase
            .from('notifications')
            .select('notification_id, title, message, type, is_read, created_at')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error loading notifications:', error);
            container.innerHTML = `<div style="text-align: center; padding: 3rem; color: #ef4444;">Error loading notifications: ${error.message}</div>`;
            return;
        }

        allNotifications = data || [];
        renderNotifications();

    } catch (err) {
        console.error('Exception loading notifications:', err);
        container.innerHTML = `<div style="text-align: center; padding: 3rem; color: #ef4444;">Error loading notifications</div>`;
    }
}

/**
 * Set the notification filter (all, unread, read)
 */
window.setNotificationFilter = function(filter, btnElement) {
    currentFilter = filter;
    
    // Update active tab styling
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (btnElement) btnElement.classList.add('active');
    
    renderNotifications();
};

/**
 * Search notifications
 */
window.onSearchNotifications = function(query) {
    searchQuery = query.toLowerCase().trim();
    renderNotifications();
};

/**
 * Format a Date object to e.g. "Today • 8:04 AM"
 */
function formatNotificationDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

    let timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    
    if (isToday) {
        return `Today • ${timeString}`;
    } else if (isYesterday) {
        return `Yesterday • ${timeString}`;
    } else {
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return `${dateStr} • ${timeString}`;
    }
}

/**
 * Determine the group a notification belongs to
 */
function getNotificationGroup(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    
    // Reset time for accurate day difference
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = Math.abs(today - notifDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return 'This Week';
    return 'Older';
}

/**
 * Fix UTC time in notification message text to Philippine Time (UTC+8).
 * Detects pattern like "before 08:32 AM" and converts to PHT.
 */
function fixNotificationTimezone(message) {
    if (!message) return message;
    return message.replace(/before\s+(\d{1,2}):(\d{2})\s*(AM|PM)/gi, function (match, h, m, ampm) {
        let hour = parseInt(h, 10);
        const upper = ampm.toUpperCase();
        if (upper === 'PM' && hour !== 12) hour += 12;
        if (upper === 'AM' && hour === 12) hour = 0;
        hour = (hour + 8) % 24; // Convert UTC → PHT (+8)
        const newAmpm = hour >= 12 ? 'PM' : 'AM';
        const newHour = hour % 12 || 12;
        return `before ${newHour}:${m} ${newAmpm}`;
    });
}

/**
 * Render notifications
 */
function renderNotifications() {
    const container = document.getElementById('notifications-container');
    if (!container) return;

    // 1. Filter notifications
    let filtered = allNotifications.filter(notification => {
        // Filter by Read/Unread status
        if (currentFilter === 'unread' && notification.is_read) return false;
        if (currentFilter === 'read' && !notification.is_read) return false;
        
        // Filter by Search query
        if (searchQuery) {
            const title = (notification.title || '').toLowerCase();
            const message = (notification.message || '').toLowerCase();
            if (!title.includes(searchQuery) && !message.includes(searchQuery)) {
                return false;
            }
        }
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-notifications">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <h3>No notifications found</h3>
                <p>Try adjusting your search or filters.</p>
            </div>
        `;
        return;
    }

    // 2. Group notifications
    const groups = {
        'Today': [],
        'Yesterday': [],
        'This Week': [],
        'Older': []
    };

    filtered.forEach(notification => {
        const group = getNotificationGroup(notification.created_at);
        groups[group].push(notification);
    });

    // 3. Render HTML
    let htmlContent = '';
    
    ['Today', 'Yesterday', 'This Week', 'Older'].forEach(groupName => {
        const groupItems = groups[groupName];
        if (groupItems.length === 0) return;
        
        htmlContent += `<h3 class="group-header">${groupName}</h3>`;
        
        htmlContent += groupItems.map(notification => {
            const isUnread = !notification.is_read;
            const timeAgo = getTimeAgo(notification.created_at);
            const formattedDate = formatNotificationDate(notification.created_at);
            const icon = getNotificationIcon(notification.type);
            const iconClass = getNotificationIconClass(notification.type);
            
            return `
                <div id="notif-${notification.notification_id}" class="notification-item ${isUnread ? 'unread' : ''}" onclick="onNotificationClick('${notification.notification_id}')">
                    <div class="notification-content">
                        <div class="notification-icon ${iconClass}">
                            ${icon}
                        </div>
                        <div class="notification-details">
                            <div class="notification-header-row">
                                <div class="notification-title">${notification.title || 'Notification'}</div>
                                <div class="notification-meta">
                                    <span class="relative-time">${timeAgo}</span>
                                    ${isUnread ? '<div class="unread-dot"></div>' : ''}
                                </div>
                            </div>
                            <div class="notification-message">${fixNotificationTimezone(notification.message || '')}</div>
                            <div class="notification-datetime">${formattedDate}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    });

    container.innerHTML = htmlContent + `
        <button class="load-more-btn">Load More</button>
    `;

    // Highlight specific notification if present in URL
    const urlParams = new URLSearchParams(window.location.search);
    const highlightId = urlParams.get('highlight_id');
    
    if (highlightId) {
        setTimeout(() => {
            const notifElement = document.getElementById(`notif-${highlightId}`);
            if (notifElement) {
                notifElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                notifElement.classList.add('highlight-pulse');
                
                if (notifElement.classList.contains('unread')) {
                    markAsRead(highlightId);
                }
                
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }, 100);
    }

    // Re-apply active-detail class for selected notification
    if (selectedNotificationId) {
        const activeEl = document.getElementById('notif-' + selectedNotificationId);
        if (activeEl) activeEl.classList.add('active-detail');
    }
}

/**
 * Get notification icon based on type
 */
function getNotificationIcon(type) {
    const icons = {
        'new_rental': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="11" width="18" height="11"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>',
        'rental_completed': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        'new_feedback': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
        'new_customer': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
        'locker_maintenance': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>'
    };
    return icons[type] || icons['new_rental'];
}

/**
 * Get notification icon class based on type
 */
function getNotificationIconClass(type) {
    const classes = {
        'new_rental': 'icon-rental',
        'rental_completed': 'icon-rental',
        'new_feedback': 'icon-feedback',
        'new_customer': 'icon-customer',
        'locker_maintenance': 'icon-maintenance'
    };
    return classes[type] || 'icon-rental';
}

/**
 * Get time ago string
 */
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Mark a notification as read
 */
async function markAsRead(notificationId) {
    try {
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            return;
        }

        const { error } = await window.supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('notification_id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error);
            return;
        }

        // Update local state
        const notification = allNotifications.find(n => n.notification_id === notificationId);
        if (notification) {
            notification.is_read = true;
            notification.read_at = new Date().toISOString();
        }

        // Populate detail panel
        showNotificationDetail(notification || allNotifications.find(n => n.notification_id === notificationId));

        renderNotifications();

    } catch (err) {
        console.error('Exception marking notification as read:', err);
    }
}

/**
 * Show notification detail in right drawer
 */
function showNotificationDetail(notification) {
    if (!notification) return;

    const pane = document.getElementById('notification-detail-pane');
    const overlay = document.getElementById('detail-overlay');
    const content = document.getElementById('detail-content');
    const iconEl = document.getElementById('detail-icon');
    const titleEl = document.getElementById('detail-title');
    const typeBadge = document.getElementById('detail-type-badge');
    const dateEl = document.getElementById('detail-date');
    const messageEl = document.getElementById('detail-message');

    if (!pane || !content) return;

    const iconClass = getNotificationIconClass(notification.type);
    iconEl.className = 'detail-icon notification-icon ' + iconClass;
    iconEl.innerHTML = getNotificationIcon(notification.type);
    titleEl.textContent = notification.title || 'Notification';
    typeBadge.textContent = (notification.type || 'info').replace('_', ' ');
    typeBadge.className = 'detail-type-badge notification-icon ' + iconClass;
    dateEl.textContent = formatNotificationDate(notification.created_at);
    messageEl.textContent = fixNotificationTimezone(notification.message || '');

    pane.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Highlight active item
    document.querySelectorAll('.notification-item').forEach(el => el.classList.remove('active-detail'));
    const notifEl = document.getElementById('notif-' + notification.notification_id);
    if (notifEl) notifEl.classList.add('active-detail');
}

/**
 * Close detail drawer
 */
function closeDetailPane() {
    const pane = document.getElementById('notification-detail-pane');
    const overlay = document.getElementById('detail-overlay');

    if (pane) pane.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';

    document.querySelectorAll('.notification-item').forEach(el => el.classList.remove('active-detail'));
    selectedNotificationId = null;
}

window.closeDetailPane = closeDetailPane;
window.showNotificationDetail = showNotificationDetail;

/**
 * Mark all notifications as read
 */
async function markAllAsRead() {
    try {
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            return;
        }

        const { error } = await window.supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all as read:', error);
            return;
        }

        // Update local state
        allNotifications.forEach(n => {
            if (!n.is_read) {
                n.is_read = true;
                n.read_at = new Date().toISOString();
            }
        });

        renderNotifications();
        alert('All notifications marked as read');

    } catch (err) {
        console.error('Exception marking all as read:', err);
    }
}

/**
 * Clear all read notifications
 */
async function clearAllRead() {
    if (!confirm('Are you sure you want to delete all read notifications? This cannot be undone.')) {
        return;
    }

    try {
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            return;
        }

        const { error } = await window.supabase
            .from('notifications')
            .delete()
            .eq('is_read', true);

        if (error) {
            console.error('Error clearing read notifications:', error);
            return;
        }

        // Update local state
        allNotifications = allNotifications.filter(n => !n.is_read);

        renderNotifications();
        alert('Read notifications cleared');

    } catch (err) {
        console.error('Exception clearing read notifications:', err);
    }
}
let notificationChannel = null;

function subscribeToNotificationChanges() {
    if (!window.supabase || typeof window.supabase.channel !== 'function') {
        return;
    }
    if (notificationChannel) return; // avoid duplicate subscriptions

    notificationChannel = window.supabase
        .channel('notifications-page')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications' },
            () => {
                // Any insert/update (new notification, or marked read) re-syncs data
                loadNotifications();
                checkUnreadNotifications();
            }
        )
        .subscribe();
}

// Make functions globally accessible
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.clearAllRead = clearAllRead;

/**
 * Handle notification click: show detail + mark as read
 */
async function onNotificationClick(notificationId) {
    const notification = allNotifications.find(n => n.notification_id === notificationId);
    if (!notification) return;

    selectedNotificationId = notificationId;
    showNotificationDetail(notification);

    if (!notification.is_read) {
        await markAsRead(notificationId);
    }
}

window.onNotificationClick = onNotificationClick;
