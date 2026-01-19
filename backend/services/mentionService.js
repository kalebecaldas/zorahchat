const { getDb } = require('../database');

/**
 * Mention Service
 * Handles parsing and storing message mentions
 */

class MentionService {
    /**
     * Parse @mentions from message content
     * Returns array of usernames mentioned
     */
    static parseMentions(content) {
        if (!content) return [];

        // Match @username pattern (alphanumeric + underscore)
        const mentionRegex = /@(\w+)/g;
        const matches = content.matchAll(mentionRegex);

        const usernames = [];
        for (const match of matches) {
            usernames.push(match[1]);
        }

        return [...new Set(usernames)]; // Remove duplicates
    }

    /**
     * Get user IDs from usernames in a workspace
     * Supports special mentions: @channel, @here
     */
    static async getUserIdsFromMentions(usernames, workspaceId, channelId = null) {
        if (!usernames || usernames.length === 0) return [];

        const db = getDb();
        const userIds = [];

        // Check for special mentions
        const hasChannel = usernames.includes('channel') || usernames.includes('here');

        if (hasChannel && channelId) {
            // Get all members of the channel
            const channelMembers = await db.all(`
                SELECT DISTINCT cm.user_id
                FROM channel_members cm
                WHERE cm.channel_id = ?
            `, [channelId]);

            const channelUserIds = channelMembers.map(m => m.user_id);

            if (usernames.includes('here')) {
                // @here means online users in channel (we'll use all members for now)
                // Could be enhanced to check socket connections
                userIds.push(...channelUserIds);
            } else if (usernames.includes('channel')) {
                // @channel means all members
                userIds.push(...channelUserIds);
            }
        }

        // Get regular user mentions (exclude special mentions)
        const regularUsernames = usernames.filter(u => u !== 'channel' && u !== 'here');

        if (regularUsernames.length > 0) {
            const placeholders = regularUsernames.map(() => '?').join(',');

            const query = `
                SELECT DISTINCT u.id, u.name as username
                FROM users u
                INNER JOIN workspace_users wu ON u.id = wu.user_id
                WHERE wu.workspace_id = ? AND u.name IN (${placeholders})
            `;

            const users = await db.all(query, [workspaceId, ...regularUsernames]);
            const regularUserIds = users.map(u => u.id);
            userIds.push(...regularUserIds);
        }

        // Remove duplicates
        return [...new Set(userIds)];
    }

    /**
     * Store mentions for a message
     */
    static async storeMentions(messageId, userIds) {
        if (!userIds || userIds.length === 0) return;

        const db = getDb();

        for (const userId of userIds) {
            try {
                await db.run(
                    'INSERT OR IGNORE INTO mentions (message_id, user_id) VALUES (?, ?)',
                    [messageId, userId]
                );
            } catch (error) {
                console.error('Error storing mention:', error);
            }
        }
    }

    /**
     * Get mentions for a message
     */
    static async getMessageMentions(messageId) {
        const db = getDb();

        const mentions = await db.all(`
            SELECT u.id, u.name as username, u.name, u.avatar_url
            FROM mentions m
            INNER JOIN users u ON m.user_id = u.id
            WHERE m.message_id = ?
        `, [messageId]);

        return mentions;
    }

    /**
     * Check if user is mentioned in message
     */
    static async isUserMentioned(messageId, userId) {
        const db = getDb();

        const result = await db.get(
            'SELECT COUNT(*) as count FROM mentions WHERE message_id = ? AND user_id = ?',
            [messageId, userId]
        );

        return result.count > 0;
    }

    /**
     * Get all messages where user is mentioned
     */
    static async getUserMentions(userId, limit = 50, offset = 0) {
        const db = getDb();

        const messages = await db.all(`
            SELECT m.*, u.name as username, u.name as user_name, u.avatar_url,
                   c.name as channel_name, c.id as channel_id
            FROM mentions men
            INNER JOIN messages m ON men.message_id = m.id
            INNER JOIN users u ON m.user_id = u.id
            LEFT JOIN channels c ON m.channel_id = c.id
            WHERE men.user_id = ?
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);

        return messages;
    }
}

module.exports = MentionService;
