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

    // Set up realtime listener for new notifications
    setupRealtimeListener();

    // Set up periodic checks (fallback)
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

// Existing functions ... (no change)

/**
 * Set up Supabase realtime subscription to listen for new notifications.
 * Increments badge count immediately when an unread notification is inserted.
 */
function setupRealtimeListener() {
    if (!window.supabase) {
        console.warn('Supabase not initialized, realtime listener not set');
        return;
    }
    const channel = window.supabase.channel('public:notifications');
    channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
            const newNotif = payload.new;
            if (newNotif && newNotif.is_read === false) {
                // Increment badge count
                const badge = document.getElementById('notificationBadge');
                if (!badge) return;
                let current = parseInt(badge.textContent) || 0;
                current += 1;
                badge.textContent = current > 99 ? '99+' : current;
                badge.style.display = 'flex';
            }
        })
                .subscribe();
        console.log('✅ Subscribed to real‑time notifications');
}

