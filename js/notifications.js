/**
 * Notification System
 * Checks for new notifications, updates notification badge,
 * and manages the floating dropdown & native device popups.
 */

const NOTIFICATION_CHECK_INTERVAL = 30000; // Check every 30 seconds
let dropdownNotifications = [];

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

    // Set up dropdown toggle and action listeners
    setupDropdownListeners();

    // Request permission for device/desktop notifications
    requestDeviceNotificationPermission();
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

        // If the dropdown is currently visible, refresh its content too
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && dropdown.style.display === 'flex') {
            await loadDropdownNotifications();
        }

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

/**
 * Set up Supabase realtime subscription to listen for new notifications.
 * Increments badge count and triggers device popup notification immediately.
 */
function setupRealtimeListener() {
    if (!window.supabase) {
        console.warn('Supabase not initialized, realtime listener not set');
        return;
    }
    const channel = window.supabase.channel('public:notifications');
    channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, async (payload) => {
            const newNotif = payload.new;
            if (newNotif && newNotif.is_read === false) {
                // Increment badge count
                const badge = document.getElementById('notificationBadge');
                if (badge) {
                    let current = parseInt(badge.textContent) || 0;
                    current += 1;
                    badge.textContent = current > 99 ? '99+' : current;
                    badge.style.display = 'flex';
                }

                // If dropdown is open, reload it
                const dropdown = document.getElementById('notificationDropdown');
                if (dropdown && dropdown.style.display === 'flex') {
                    await loadDropdownNotifications();
                }

                // Trigger desktop/phone system notification popup
                showDeviceNotification(newNotif.title, newNotif.message);
            }
        })
        .subscribe();
    console.log('✅ Subscribed to real‑time notifications');
}

/**
 * Request permission for device/desktop notifications
 */
function requestDeviceNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Device notification permission status:', permission);
            });
        }
    }
}

/**
 * Show a device/desktop notification in the system notification panel/bar
 */
function showDeviceNotification(title, message) {
    if (!('Notification' in window)) {
        return;
    }

    if (Notification.permission === 'granted') {
        const options = {
            body: message,
            icon: '../assets/logo.png',
            badge: '../assets/logo.png',
            vibrate: [200, 100, 200], // Vibration pattern for supported mobile devices
            tag: 'coincubby-notification',
            renotify: true
        };

        try {
            const notification = new Notification(title, options);
            
            notification.onclick = function(event) {
                event.preventDefault();
                window.focus();
                notification.close();
                
                // Focus the notification dropdown in UI
                const dropdown = document.getElementById('notificationDropdown');
                if (dropdown) {
                    dropdown.style.display = 'flex';
                    loadDropdownNotifications();
                }
            };
        } catch (err) {
            console.error('Failed to create device notification:', err);
        }
    }
}

/**
 * Set up click listeners for the notification bell dropdown
 */
function setupDropdownListeners() {
    const bell = document.getElementById('notificationBell');
    const dropdown = document.getElementById('notificationDropdown');
    const markAllBtn = document.getElementById('dropdownMarkAll');

    if (bell && dropdown) {
        // Toggle dropdown on click
        bell.addEventListener('click', async function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isOpen = dropdown.style.display === 'flex';
            if (isOpen) {
                dropdown.style.display = 'none';
            } else {
                dropdown.style.display = 'flex';
                await loadDropdownNotifications();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!bell.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    if (markAllBtn) {
        markAllBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            e.stopPropagation();
            await markAllDropdownNotificationsAsRead();
        });
    }
}

/**
 * Load the 5 most recent notifications for the dropdown
 */
async function loadDropdownNotifications() {
    const listContainer = document.getElementById('dropdownNotificationsList');
    if (!listContainer) return;

    try {
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            listContainer.innerHTML = '<div class="dropdown-empty"><p>Database not connected</p></div>';
            return;
        }

        const { data, error } = await window.supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error loading dropdown notifications:', error);
            listContainer.innerHTML = `<div class="dropdown-empty"><p>Error loading notifications</p></div>`;
            return;
        }

        dropdownNotifications = data || [];
        renderDropdownNotifications();

    } catch (err) {
        console.error('Exception loading dropdown notifications:', err);
        listContainer.innerHTML = '<div class="dropdown-empty"><p>Error loading notifications</p></div>';
    }
}

/**
 * Render notifications in the dropdown list
 */
function renderDropdownNotifications() {
    const listContainer = document.getElementById('dropdownNotificationsList');
    if (!listContainer) return;

    if (dropdownNotifications.length === 0) {
        listContainer.innerHTML = `
            <div class="dropdown-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <p>All caught up!</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = dropdownNotifications.map(notification => {
        const isUnread = !notification.is_read;
        const timeAgo = getTimeAgoStr(notification.created_at);
        const icon = getNotificationIconSvg(notification.type);
        const iconClass = getNotificationIconClassStr(notification.type);
        const priorityBadge = notification.priority !== 'normal'
            ? `<span class="notification-badge badge-${notification.priority}">${notification.priority}</span>`
            : '';

        return `
            <div class="dropdown-item ${isUnread ? 'unread' : ''}" onclick="markDropdownAsRead('${notification.notification_id}', event)">
                <div class="dropdown-item-icon ${iconClass}">
                    ${icon}
                </div>
                <div class="dropdown-item-content">
                    <div class="dropdown-item-title">${notification.title}</div>
                    <div class="dropdown-item-msg">${notification.message}</div>
                    <div class="dropdown-item-meta">
                        ${priorityBadge}
                        <span class="dropdown-item-time">${timeAgo}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Mark a single notification as read and refresh the dropdown
 */
async function markDropdownAsRead(notificationId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

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
            console.error('Error marking dropdown notification as read:', error);
            return;
        }

        // Update local array state
        const notif = dropdownNotifications.find(n => n.notification_id === notificationId);
        if (notif) {
            notif.is_read = true;
            notif.read_at = new Date().toISOString();
        }

        // Render immediately
        renderDropdownNotifications();

        // Refresh badge count
        await checkUnreadNotifications();

    } catch (err) {
        console.error('Exception marking dropdown notification as read:', err);
    }
}

/**
 * Mark all loaded/unread notifications as read from the dropdown
 */
async function markAllDropdownNotificationsAsRead() {
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

        // Update all locally loaded items
        dropdownNotifications.forEach(n => {
            if (!n.is_read) {
                n.is_read = true;
                n.read_at = new Date().toISOString();
            }
        });

        renderDropdownNotifications();
        await checkUnreadNotifications();

    } catch (err) {
        console.error('Exception marking all as read:', err);
    }
}

/**
 * Helper to get SVG icon based on notification type
 */
function getNotificationIconSvg(type) {
    const icons = {
        'new_rental': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="11" width="18" height="11"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>',
        'rental_completed': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        'new_feedback': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
        'new_customer': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
        'locker_maintenance': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>'
    };
    return icons[type] || icons['new_rental'];
}

/**
 * Helper to get CSS class for icon container based on type
 */
function getNotificationIconClassStr(type) {
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
 * Get simple time ago string
 */
function getTimeAgoStr(timestamp) {
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    // Only initialize if notification bell exists on page
    if (document.getElementById('notificationBell')) {
        initNotifications();
    }
});

