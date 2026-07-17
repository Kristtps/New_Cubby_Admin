/**
 * Notifications Page Module
 * Displays and manages all system notifications
 */

let allNotifications = [];

// Initialize notifications page
document.addEventListener('DOMContentLoaded', async function () {
    if (!document.getElementById('notifications-container')) return;

    // Wait for Supabase to initialize
    if (window.supabasePromise) {
        await window.supabasePromise;
    }

    await loadNotifications();

    // Auto-refresh notifications every 30 seconds
    setInterval(async function () {
        try {
            await loadNotifications();
            console.log('✓ Notifications auto-refreshed');
        } catch (err) {
            console.error('Notifications auto-refresh error:', err);
        }
    }, 30000);
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

        // Fetch notifications
        const { data, error } = await window.supabase
            .from('notifications')
            .select('*')
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
 * Render notifications
 */
function renderNotifications() {
    const container = document.getElementById('notifications-container');

    if (allNotifications.length === 0) {
        container.innerHTML = `
            <div class="empty-notifications">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <h3>No notifications yet</h3>
                <p>You'll see system notifications here when they arrive.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = allNotifications.map(notification => {
        const isUnread = !notification.is_read;
        const timeAgo = getTimeAgo(notification.created_at);
        const icon = getNotificationIcon(notification.type);
        const iconClass = getNotificationIconClass(notification.type);
        const priorityBadge = notification.priority !== 'normal'
            ? `<span class="notification-badge badge-${notification.priority}">${notification.priority}</span>`
            : '';

        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="markAsRead('${notification.notification_id}')">
                <div class="notification-content">
                    <div class="notification-icon ${iconClass}">
                        ${icon}
                    </div>
                    <div class="notification-details">
                        <div class="notification-header-row">
                            <div>
                                <div class="notification-title">${notification.title} ${priorityBadge}</div>
                                <div class="notification-message">${notification.message}</div>
                            </div>
                            <div class="notification-time">${timeAgo}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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

        renderNotifications();

    } catch (err) {
        console.error('Exception marking notification as read:', err);
    }
}

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

async function initNotifications() {
    if (window.supabasePromise) {
        await window.supabasePromise;
    }

    await checkUnreadNotifications();

    // Fallback polling in case realtime disconnects
    setInterval(checkUnreadNotifications, NOTIFICATION_CHECK_INTERVAL);

    subscribeToNotificationChanges();
}

function subscribeToNotificationChanges() {
    if (!window.supabase || typeof window.supabase.channel !== 'function') {
        return;
    }
    if (notificationChannel) return; // avoid duplicate subscriptions

    notificationChannel = window.supabase
        .channel('notifications-badge')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications' },
            () => {
                // Any insert/update (new notification, or marked read) re-syncs the count
                checkUnreadNotifications();
            }
        )
        .subscribe();
}

// Make functions globally accessible
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.clearAllRead = clearAllRead;
