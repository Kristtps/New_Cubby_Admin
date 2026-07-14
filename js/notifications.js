/**
 * Notification System
 * Checks for new notifications and updates notification badge
 */

const NOTIFICATION_CHECK_INTERVAL = 30000; // Check every 30 seconds

/**
 * Initialize notification system
 */
async function initNotifications() {
    // Wait for Supabase to initialize
    if (window.supabasePromise) {
        await window.supabasePromise;
    }

    // Check for unread notifications
    await checkUnreadNotifications();

    // Set up periodic checks
    setInterval(checkUnreadNotifications, NOTIFICATION_CHECK_INTERVAL);
}

/**
 * Check for unread notifications
 */
async function checkUnreadNotifications() {
    try {
        // Check if Supabase is connected
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            return;
        }

        // Get unread notification count
        const { data, error } = await window.supabase
            .from('notifications')
            .select('notification_id', { count: 'exact', head: false })
            .eq('is_read', false);

        if (error) {
            console.error('Error checking unread notifications:', error);
            return;
        }

        const unreadCount = data ? data.length : 0;

        // Update notification badge
        updateNotificationBadge(unreadCount);

    } catch (err) {
        console.error('Exception checking unread notifications:', err);
    }
}

/**
 * Update the notification badge
 */
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Get count of unread notifications
 */
async function getUnreadNotificationCount() {
    try {
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            return 0;
        }

        const { data, error } = await window.supabase
            .from('notifications')
            .select('notification_id', { count: 'exact', head: false })
            .eq('is_read', false);

        if (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }

        return data ? data.length : 0;
    } catch (err) {
        console.error('Exception getting unread count:', err);
        return 0;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if notification bell exists on page
    if (document.getElementById('notificationBell')) {
        initNotifications();
    }
});

// Export functions for use in other modules
window.notificationSystem = {
    getUnreadCount: getUnreadNotificationCount,
    checkUnread: checkUnreadNotifications,
    updateBadge: updateNotificationBadge
};
