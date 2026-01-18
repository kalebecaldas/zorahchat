const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const NotificationService = require('../services/notificationService');

// Middleware to verify user authentication
const authenticateUser = (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0, unread_only = 'false' } = req.query;

        const notifications = await NotificationService.getUserNotifications(
            userId,
            parseInt(limit),
            parseInt(offset),
            unread_only === 'true'
        );

        const unreadCount = await NotificationService.getUnreadCount(userId);

        res.json({
            notifications,
            unread_count: unreadCount,
            total: notifications.length
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await NotificationService.getUnreadCount(userId);

        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = parseInt(req.params.id);

        await NotificationService.markAsRead(notificationId, userId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;

        await NotificationService.markAllAsRead(userId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = parseInt(req.params.id);

        await NotificationService.delete(notificationId, userId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

module.exports = router;
