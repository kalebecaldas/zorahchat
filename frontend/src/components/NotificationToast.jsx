import { useState, useEffect } from 'react';
import './NotificationToast.css';

const NotificationToast = ({ notification, onClose, onNavigate }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation
        setTimeout(() => setIsVisible(true), 10);

        // Auto close after 5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for animation
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const handleClick = () => {
        if (notification.link && onNavigate) {
            // Navigate to the notification link using React Router
            onNavigate(notification.link);
        } else if (notification.link) {
            // Fallback to window.location if onNavigate is not provided
            window.location.href = notification.link;
        }
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'dm':
                return '💬';
            case 'mention':
                return '🔔';
            case 'channel_message':
                return '📢';
            case 'channel_invite':
                return '➕';
            default:
                return '🔔';
        }
    };

    return (
        <div
            className={`notification-toast ${isVisible ? 'visible' : ''}`}
            onClick={handleClick}
        >
            <div className="notification-icon">{getIcon()}</div>
            <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.content}</div>
            </div>
            <button
                className="notification-close"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                }}
            >
                ×
            </button>
        </div>
    );
};

export default NotificationToast;

