const { getDb } = require('../database');

/**
 * Notification Service
 * Handles creation and management of user notifications
 */

class NotificationService {
    /**
     * Create a new notification
     * @param {number} userId - User to notify
     * @param {string} type - Notification type: 'dm', 'mention', 'channel_invite', 'system'
     * @param {string} title - Notification title
     * @param {string} content - Notification content
     * @param {string} link - Deep link to the relevant content
     * @param {object} metadata - Additional metadata (JSON)
     */
    static async create(userId, type, title, content, link = null, metadata = {}) {
        const db = getDb();

        const result = await db.run(
            `INSERT INTO notifications (user_id, type, title, content, link, metadata) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, type, title, content, link, JSON.stringify(metadata)]
        );

        return {
            id: result.lastID,
            user_id: userId,
            type,
            title,
            content,
            link,
            metadata,
            read: false,
            created_at: new Date().toISOString()
        };
    }

    /**
     * Create DM notification
     */
    static async notifyDM(recipientId, senderId, senderName, messagePreview, dmId, messageId, workspaceId) {
        return await this.create(
            recipientId,
            'dm',
            `Nova mensagem de ${senderName}`,
            messagePreview,
            `/client/${workspaceId}/dm/${dmId}`,
            { sender_id: senderId, dm_id: dmId, message_id: messageId, workspace_id: workspaceId }
        );
    }

    /**
     * Create channel message notification
     */
    static async notifyChannel(recipientId, senderId, senderName, messagePreview, channelId, channelName, messageId, workspaceId) {
        return await this.create(
            recipientId,
            'channel_message',
            `${senderName} em #${channelName}`,
            messagePreview,
            `/client/${workspaceId}/${channelId}`,
            { sender_id: senderId, channel_id: channelId, message_id: messageId, channel_name: channelName, workspace_id: workspaceId }
        );
    }

    /**
     * Create mention notification
     */
    static async notifyMention(mentionedUserId, mentionerName, messagePreview, channelId, channelName, messageId, workspaceId) {
        return await this.create(
            mentionedUserId,
            'mention',
            `${mentionerName} mencionou você em #${channelName}`,
            messagePreview,
            `/client/${workspaceId}/${channelId}`,
            { channel_id: channelId, message_id: messageId, channel_name: channelName, workspace_id: workspaceId }
        );
    }

    /**
     * Create channel invite notification
     */
    static async notifyChannelInvite(userId, inviterId, inviterName, channelId, channelName) {
        return await this.create(
            userId,
            'channel_invite',
            `${inviterName} adicionou você ao canal #${channelName}`,
            `Você agora tem acesso ao canal #${channelName}`,
            `/channel/${channelId}`,
            { inviter_id: inviterId, channel_id: channelId, channel_name: channelName }
        );
    }

    /**
     * Get user notifications
     */
    static async getUserNotifications(userId, limit = 50, offset = 0, unreadOnly = false) {
        const db = getDb();

        let query = `
            SELECT * FROM notifications 
            WHERE user_id = ?
        `;

        if (unreadOnly) {
            query += ` AND read = 0`;
        }

        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

        const notifications = await db.all(query, [userId, limit, offset]);

        // Parse metadata JSON
        return notifications.map(n => ({
            ...n,
            metadata: n.metadata ? JSON.parse(n.metadata) : {}
        }));
    }

    /**
     * Get unread count
     */
    static async getUnreadCount(userId) {
        const db = getDb();
        const result = await db.get(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0',
            [userId]
        );
        return result.count;
    }

    /**
     * Mark notification as read
     */
    static async markAsRead(notificationId, userId) {
        const db = getDb();
        await db.run(
            'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
    }

    /**
     * Mark all notifications as read
     */
    static async markAllAsRead(userId) {
        const db = getDb();
        await db.run(
            'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0',
            [userId]
        );
    }

    /**
     * Delete notification
     */
    static async delete(notificationId, userId) {
        const db = getDb();
        await db.run(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
    }
}

module.exports = NotificationService;
