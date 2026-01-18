import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationToast from './NotificationToast';
import './NotificationToast.css';

const NotificationContainer = ({ socket, currentChannelId, currentDmId }) => {
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();

    // Request browser notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('[NOTIFICATION] Browser permission:', permission);
            });
        }
    }, []);

    useEffect(() => {
        if (!socket) return;

        // Show browser notification helper
        const showBrowserNotification = (notification) => {
            if (!('Notification' in window)) {
                console.log('[NOTIFICATION] Browser notifications not supported');
                return;
            }

            if (Notification.permission === 'granted') {
                const title = notification.title || 'Nova notificação';
                const body = notification.content || '';
                const icon = '/favicon.ico'; // You can customize this

                try {
                    const browserNotification = new Notification(title, {
                        body: body,
                        icon: icon,
                        badge: '/favicon.ico',
                        tag: notification.id?.toString(), // Prevent duplicate notifications
                        requireInteraction: false,
                        silent: false
                    });

                    // Handle click on browser notification
                    browserNotification.onclick = () => {
                        window.focus();
                        if (notification.link) {
                            navigate(notification.link);
                        }
                        browserNotification.close();
                    };

                    // Auto close after 5 seconds
                    setTimeout(() => {
                        browserNotification.close();
                    }, 5000);
                } catch (err) {
                    console.error('[NOTIFICATION] Error creating browser notification:', err);
                }
            } else if (Notification.permission === 'default') {
                // Request permission again
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        showBrowserNotification(notification);
                    }
                });
            }
        };

        const handleNewNotification = (notification) => {
            console.log('[NOTIFICATION] New notification received:', {
                type: notification.type,
                title: notification.title,
                metadata: notification.metadata,
                currentChannelId,
                currentDmId
            });

            // Check if user is viewing the channel/DM
            // Convert both to strings and numbers for comparison to handle type mismatches
            const notificationChannelId = notification.metadata?.channel_id;
            const notificationDmId = notification.metadata?.dm_id;
            const notificationChannelIdStr = notificationChannelId?.toString();
            const notificationDmIdStr = notificationDmId?.toString();
            const currentChannelIdStr = currentChannelId?.toString();
            const currentDmIdStr = currentDmId?.toString();
            
            const isViewingChannel = 
                notification.type === 'channel_message' && 
                currentChannelIdStr &&
                (notificationChannelIdStr === currentChannelIdStr || 
                 Number(notificationChannelId) === Number(currentChannelId));
            
            const isViewingDM = 
                notification.type === 'dm' && 
                currentDmIdStr &&
                (notificationDmIdStr === currentDmIdStr || 
                 Number(notificationDmId) === Number(currentDmId));
            
            const isViewingMention = 
                notification.type === 'mention' && 
                currentChannelIdStr &&
                (notificationChannelIdStr === currentChannelIdStr || 
                 Number(notificationChannelId) === Number(currentChannelId));

            const isViewing = isViewingChannel || isViewingDM || isViewingMention;

            console.log('[NOTIFICATION] Viewing check:', {
                isViewing,
                isViewingChannel,
                isViewingDM,
                isViewingMention,
                notificationChannelId: notification.metadata?.channel_id,
                notificationDmId: notification.metadata?.dm_id,
                currentChannelId,
                currentDmId
            });

            // Only show notification if user is NOT viewing the channel/DM
            if (!isViewing) {
                console.log('[NOTIFICATION] ✓ Showing notification toast');
                // Show toast notification
                setNotifications(prev => [...prev, { ...notification, id: Date.now() + Math.random() }]);
                
                // Show browser notification (if page is hidden or user is in another tab)
                if (document.hidden || !document.hasFocus()) {
                    console.log('[NOTIFICATION] Page is hidden, showing browser notification');
                    showBrowserNotification(notification);
                } else {
                    // Also show browser notification if user is on the page but might miss the toast
                    // Only for mentions and DMs to avoid too many notifications
                    if (notification.type === 'mention' || notification.type === 'dm') {
                        showBrowserNotification(notification);
                    }
                }
            } else {
                console.log('[NOTIFICATION] ✗ Skipping notification - user is viewing this channel/DM');
            }
        };

        socket.on('new-notification', handleNewNotification);

        return () => {
            socket.off('new-notification', handleNewNotification);
        };
    }, [socket, currentChannelId, currentDmId, navigate]);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="notification-container">
            {notifications.map(notification => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onClose={() => removeNotification(notification.id)}
                    onNavigate={navigate}
                />
            ))}
        </div>
    );
};

export default NotificationContainer;

