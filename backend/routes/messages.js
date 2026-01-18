const express = require('express');
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');
const MentionService = require('../services/mentionService');
const NotificationService = require('../services/notificationService');

const router = express.Router();

// Helper to check permissions
async function hasPermission(db, workspaceId, userId, permission) {
    const membership = await db.get(
        'SELECT role, permissions FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
        [workspaceId, userId]
    );

    if (!membership) return false;
    if (membership.role === 'admin') return true;

    if (!membership.permissions) return false;
    const perms = membership.permissions.split(',').map(p => p.trim().toLowerCase());
    return perms.includes(permission.toLowerCase());
}

// Get messages for a channel
router.get('/:channelId', authMiddleware, async (req, res) => {
    const { channelId } = req.params;
    const db = getDb();

    try {
        const channel = await db.get('SELECT workspace_id FROM channels WHERE id = ?', channelId);
        if (!channel) return res.status(404).json({ error: 'Channel not found' });

        const membership = await db.get(
            'SELECT * FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [channel.workspace_id, req.userId]
        );

        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this workspace' });
        }

        const messages = await db.all(`
            SELECT m.*, u.name as user_name, u.avatar_url 
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.channel_id = ? AND m.deleted_at IS NULL
            ORDER BY m.created_at ASC
        `, channelId);

        // Get reactions for each message
        for (let msg of messages) {
            const reactions = await db.all(`
                SELECT emoji, COUNT(*) as count, GROUP_CONCAT(user_id) as user_ids
                FROM message_reactions
                WHERE message_id = ?
                GROUP BY emoji
            `, msg.id);
            msg.reactions = reactions.map(r => ({
                emoji: r.emoji,
                count: r.count,
                users: r.user_ids.split(',').map(Number),
                hasReacted: r.user_ids.split(',').includes(req.userId.toString())
            }));
        }

        // Update read receipt when fetching messages
        if (messages.length > 0) {
            // Delete existing to avoid NULL constraint issues
            await db.run(`
                DELETE FROM read_receipts 
                WHERE user_id = ? AND channel_id = ? AND dm_id IS NULL
            `, [req.userId, channelId]);
            
            // Insert new receipt
            await db.run(`
                INSERT INTO read_receipts (user_id, channel_id, dm_id, last_read_message_id, last_read_at)
                VALUES (?, ?, NULL, ?, CURRENT_TIMESTAMP)
            `, [req.userId, channelId, messages[messages.length - 1].id]);
        }

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send message
router.post('/', authMiddleware, async (req, res) => {
    const { channelId, content, attachment_url, attachment_type, attachment_name } = req.body;

    if (!channelId || (!content && !attachment_url)) {
        return res.status(400).json({ error: 'Channel ID and content or attachment required' });
    }

    const db = getDb();

    try {
        const channel = await db.get('SELECT workspace_id FROM channels WHERE id = ?', channelId);
        if (!channel) return res.status(404).json({ error: 'Channel not found' });

        const canWrite = await hasPermission(db, channel.workspace_id, req.userId, 'write');
        if (!canWrite) {
            return res.status(403).json({ error: 'No permission to write messages' });
        }

        const result = await db.run(
            'INSERT INTO messages (channel_id, user_id, content, attachment_url, attachment_type, attachment_name) VALUES (?, ?, ?, ?, ?, ?)',
            [channelId, req.userId, content, attachment_url, attachment_type, attachment_name]
        );

        const message = await db.get(`
            SELECT m.*, u.name as user_name, u.username, u.avatar_url 
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
        `, result.lastID);

        message.reactions = [];

        // Parse and store mentions
        if (content) {
            const mentionedUsernames = MentionService.parseMentions(content);
            if (mentionedUsernames.length > 0) {
                // Get user IDs (including @channel and @here special mentions)
                const mentionedUserIds = await MentionService.getUserIdsFromMentions(
                    mentionedUsernames, 
                    channel.workspace_id,
                    channelId
                );

                if (mentionedUserIds.length > 0) {
                    // Store mentions
                    await MentionService.storeMentions(message.id, mentionedUserIds);

                    // Update message to mark it has mentions
                    await db.run('UPDATE messages SET has_mentions = 1 WHERE id = ?', [message.id]);
                    message.has_mentions = true;

                    // Get channel name for notification
                    const channelInfo = await db.get('SELECT name FROM channels WHERE id = ?', [channelId]);

                    // Get all workspace members for @channel/@here notifications
                    const workspaceMembers = await db.all(
                        'SELECT user_id FROM workspace_users WHERE workspace_id = ?',
                        [channel.workspace_id]
                    );
                    const workspaceMemberIds = workspaceMembers.map(m => m.user_id);

                    // Create notifications for mentioned users
                    const io = req.app.get('io');
                    for (const userId of mentionedUserIds) {
                        // Don't notify if user mentioned themselves
                        if (userId !== req.userId) {
                            const notification = await NotificationService.notifyMention(
                                userId,
                                message.user_name,
                                content.substring(0, 100),
                                channelId,
                                channelInfo.name,
                                message.id,
                                channel.workspace_id
                            );

                            // Emit real-time notification
                            io.to(`user-${userId}`).emit('new-notification', notification);
                        }
                    }
                    
                    // Log special mentions
                    const hasChannelMention = mentionedUsernames.includes('channel') || mentionedUsernames.includes('here');
                    if (hasChannelMention) {
                        console.log(`[MENTIONS] Special mention detected: ${mentionedUsernames.filter(u => u === 'channel' || u === 'here').join(', ')}`);
                        console.log(`[MENTIONS] Notifying ${mentionedUserIds.length} channel members`);
                    }
                }
            }
        }

        // Emit via Socket.io - SIMPLIFIED: Send directly to all workspace members
        const io = req.app.get('io');
        if (io) {
            // Get all connected sockets
            const allSockets = await io.fetchSockets();
            
            // Get all members of the workspace from database
            const workspaceMembers = await db.all(
                'SELECT user_id FROM workspace_users WHERE workspace_id = ?',
                [channel.workspace_id]
            );
            const workspaceMemberIds = workspaceMembers.map(m => m.user_id);
            
            // Find all connected sockets for workspace members
            const workspaceSockets = allSockets.filter(s => workspaceMemberIds.includes(s.userId));
            const recipientUserIds = workspaceSockets.map(s => s.userId);
            
            // Get detailed info about all connected sockets
            const connectedUsersInfo = allSockets.map(s => ({
                userId: s.userId,
                socketId: s.id,
                rooms: Array.from(s.rooms || [])
            }));
            
            const missingMembers = workspaceMemberIds.filter(id => !recipientUserIds.includes(id));
            console.log(`[MESSAGES] Broadcasting new-message for channel-${channelId}:`, {
                messageId: message.id,
                content: message.content?.substring(0, 50),
                senderId: message.user_id,
                workspaceId: channel.workspace_id,
                channelId: channelId,
                allWorkspaceMembers: workspaceMemberIds,
                connectedWorkspaceMembers: recipientUserIds,
                missingWorkspaceMembers: missingMembers,
                totalConnected: allSockets.length,
                detailedConnections: connectedUsersInfo
            });
            
            if (missingMembers.length > 0) {
                console.error(`[MESSAGES] CRITICAL: Missing ${missingMembers.length} workspace member(s) from socket connection:`, missingMembers);
                console.error(`[MESSAGES] These users will NOT receive real-time messages! They need to connect their socket.`);
            }
            
            if (recipientUserIds.length < workspaceMemberIds.length) {
                const missing = workspaceMemberIds.filter(id => !recipientUserIds.includes(id));
                console.warn(`[MESSAGES] WARNING: Some workspace members are NOT connected:`, missing);
                console.warn(`[MESSAGES] They will NOT receive messages in real-time!`);
            }
            
            // Create notifications for all workspace members (except sender)
            const channelInfo = await db.get('SELECT name FROM channels WHERE id = ?', [channelId]);
            const recipients = workspaceMemberIds.filter(id => id !== req.userId);
            
            // Create and send notifications for all recipients
            const notifications = [];
            for (const recipientId of recipients) {
                try {
                    const notification = await NotificationService.notifyChannel(
                        recipientId,
                        req.userId,
                        message.user_name,
                        content ? content.substring(0, 100) : '📎 Arquivo enviado',
                        channelId,
                        channelInfo.name,
                        message.id,
                        channel.workspace_id
                    );
                    notifications.push({ userId: recipientId, notification });
                    console.log(`[MESSAGES] Created notification for user ${recipientId}:`, {
                        type: notification.type,
                        title: notification.title,
                        metadata: notification.metadata,
                        channel_id: notification.metadata?.channel_id
                    });
                } catch (err) {
                    console.error(`[MESSAGES] Failed to create notification for user ${recipientId}:`, err);
                }
            }
            
            // Send directly to each workspace member's socket (most reliable method)
            console.log(`[MESSAGES] Sending to ${workspaceSockets.length} connected workspace members:`, 
                workspaceSockets.map(s => ({ userId: s.userId, socketId: s.id }))
            );
            console.log(`[MESSAGES] Notifications created:`, notifications.map(n => ({ userId: n.userId, type: n.notification.type })));
            
            let sentCount = 0;
            let notificationCount = 0;
            for (const socket of workspaceSockets) {
                try {
                    socket.emit('new-message', message);
                    
                    // Send notification if user is not the sender
                    if (socket.userId !== req.userId) {
                        const notification = notifications.find(n => n.userId === socket.userId);
                        if (notification) {
                            console.log(`[MESSAGES] Sending notification to user ${socket.userId}:`, {
                                type: notification.notification.type,
                                title: notification.notification.title,
                                metadata: notification.notification.metadata,
                                hasMetadata: !!notification.notification.metadata,
                                channel_id: notification.notification.metadata?.channel_id
                            });
                            socket.emit('new-notification', notification.notification);
                            notificationCount++;
                            console.log(`[MESSAGES] ✓ Sent notification to user ${socket.userId} (${notification.notification.type})`);
                        } else {
                            console.warn(`[MESSAGES] ⚠ No notification found for user ${socket.userId}`);
                        }
                    }
                    
                    sentCount++;
                    console.log(`[MESSAGES] ✓ Sent message to user ${socket.userId} (socket ${socket.id})`);
                } catch (err) {
                    console.error(`[MESSAGES] ✗ Failed to send to user ${socket.userId}:`, err.message);
                }
            }
            
            console.log(`[MESSAGES] Direct send complete: ${sentCount}/${workspaceSockets.length} messages, ${notificationCount}/${notifications.length} notifications`);
            
            // Also emit to rooms as backup (in case someone joins between message send and room join)
            io.to(`channel-${channelId}`).emit('new-message', message);
            io.to(`workspace-${channel.workspace_id}`).emit('new-message', message);
            
            // Emit notifications to rooms as well (for users that might not be directly connected yet)
            for (const { userId, notification } of notifications) {
                io.to(`user-${userId}`).emit('new-notification', notification);
                console.log(`[MESSAGES] ✓ Emitted notification to room user-${userId}`);
            }
            
            console.log(`[MESSAGES] Also emitted to channel-${channelId} and workspace-${channel.workspace_id} rooms`);
        }

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add reaction to message
router.post('/:messageId/reactions', authMiddleware, async (req, res) => {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const db = getDb();

    try {
        const message = await db.get('SELECT * FROM messages WHERE id = ?', messageId);
        if (!message) return res.status(404).json({ error: 'Message not found' });

        // Check if already reacted with this emoji
        const existing = await db.get(
            'SELECT * FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
            [messageId, req.userId, emoji]
        );

        if (existing) {
            // Remove reaction
            await db.run(
                'DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
                [messageId, req.userId, emoji]
            );
        } else {
            // Add reaction
            await db.run(
                'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
                [messageId, req.userId, emoji]
            );
        }

        // Get updated reactions
        const reactions = await db.all(`
            SELECT emoji, COUNT(*) as count, GROUP_CONCAT(user_id) as user_ids
            FROM message_reactions
            WHERE message_id = ?
            GROUP BY emoji
        `, messageId);

        const formattedReactions = reactions.map(r => ({
            emoji: r.emoji,
            count: r.count,
            users: r.user_ids.split(',').map(Number),
            hasReacted: r.user_ids.split(',').includes(req.userId.toString())
        }));

        // Emit via Socket.io
        const io = req.app.get('io');
        const channelId = message.channel_id;
        io.to(`channel-${channelId}`).emit('reaction-update', {
            messageId,
            reactions: formattedReactions
        });

        res.json({ reactions: formattedReactions });
    } catch (error) {
        console.error('Add Reaction Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get unread count for channels
router.get('/unread/:workspaceId', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const db = getDb();

    try {
        // Debug: Check all read_receipts for this user
        const allReceipts = await db.all(`
            SELECT * FROM read_receipts WHERE user_id = ?
        `, [req.userId]);
        console.log('[UNREAD] All read_receipts for user:', req.userId, allReceipts);

        const channels = await db.all(`
            SELECT c.id, c.name,
                   (SELECT COUNT(*) FROM messages m 
                    WHERE m.channel_id = c.id 
                    AND m.created_at > COALESCE(
                        (SELECT last_read_at FROM read_receipts 
                         WHERE user_id = ? AND channel_id = c.id AND (dm_id IS NULL OR dm_id = '')), 
                        '1970-01-01 00:00:00'
                    )
                    AND m.deleted_at IS NULL
                   ) as unread_count,
                   (SELECT last_read_at FROM read_receipts 
                    WHERE user_id = ? AND channel_id = c.id AND (dm_id IS NULL OR dm_id = '')) as last_read_at
            FROM channels c
            WHERE c.workspace_id = ?
        `, [req.userId, req.userId, workspaceId]);
        
        console.log('[UNREAD] Channel unread counts:', channels.map(c => ({
            id: c.id,
            name: c.name,
            unread_count: c.unread_count,
            last_read_at: c.last_read_at
        })));

        // Get DM unread counts
        const dms = await db.all(`
            SELECT dm.id, 
                   (SELECT COUNT(*) FROM messages m 
                    WHERE m.dm_id = dm.id 
                    AND m.created_at > COALESCE(
                        (SELECT last_read_at FROM read_receipts 
                         WHERE user_id = ? AND dm_id = dm.id AND (channel_id IS NULL OR channel_id = '')), 
                        '1970-01-01 00:00:00'
                    )
                    AND m.user_id != ?
                    AND m.deleted_at IS NULL
                   ) as unread_count,
                   (SELECT last_read_at FROM read_receipts 
                    WHERE user_id = ? AND dm_id = dm.id AND (channel_id IS NULL OR channel_id = '')) as last_read_at
            FROM direct_messages dm
            WHERE dm.workspace_id = ?
              AND (dm.user1_id = ? OR dm.user2_id = ?)
        `, [req.userId, req.userId, req.userId, workspaceId, req.userId, req.userId]);
        
        console.log('[UNREAD] DM unread counts:', dms.map(dm => ({
            id: dm.id,
            unread_count: dm.unread_count,
            last_read_at: dm.last_read_at
        })));

        // Format DM results with dm- prefix
        const dmCounts = dms.map(dm => ({
            id: `dm-${dm.id}`,
            unread_count: dm.unread_count
        }));

        res.json([...channels, ...dmCounts]);
    } catch (error) {
        console.error('Get Unread Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mark channel as read
router.post('/channels/:channelId/read', authMiddleware, async (req, res) => {
    const { channelId } = req.params;
    const db = getDb();

    try {
        // Verify user has access to this channel
        const channel = await db.get('SELECT workspace_id FROM channels WHERE id = ?', channelId);
        if (!channel) return res.status(404).json({ error: 'Channel not found' });

        const membership = await db.get(
            'SELECT * FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [channel.workspace_id, req.userId]
        );

        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this workspace' });
        }

        // Get the last message ID in this channel
        const lastMessage = await db.get(
            'SELECT id FROM messages WHERE channel_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1',
            [channelId]
        );

        // Update read receipt
        console.log('[MARK READ] Updating read receipt:', {
            userId: req.userId,
            channelId: channelId,
            lastMessageId: lastMessage?.id || null
        });
        
        // First, delete any existing receipt for this user+channel to avoid NULL issues
        await db.run(`
            DELETE FROM read_receipts 
            WHERE user_id = ? AND channel_id = ? AND dm_id IS NULL
        `, [req.userId, channelId]);
        
        // Then insert new receipt
        await db.run(`
            INSERT INTO read_receipts (user_id, channel_id, dm_id, last_read_message_id, last_read_at)
            VALUES (?, ?, NULL, ?, CURRENT_TIMESTAMP)
        `, [req.userId, channelId, lastMessage?.id || null]);
        
        // Verify it was saved
        const saved = await db.get(`
            SELECT * FROM read_receipts 
            WHERE user_id = ? AND channel_id = ?
        `, [req.userId, channelId]);
        console.log('[MARK READ] Saved read receipt:', saved);

        res.json({ success: true, channelId, lastReadMessageId: lastMessage?.id || null });
    } catch (error) {
        console.error('Mark channel read error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Edit message
router.put('/:messageId', authMiddleware, async (req, res) => {
    const { messageId } = req.params;
    const { content } = req.body;
    const db = getDb();

    try {
        const message = await db.get('SELECT * FROM messages WHERE id = ?', messageId);
        if (!message) return res.status(404).json({ error: 'Message not found' });

        if (message.user_id !== req.userId) {
            const channel = await db.get('SELECT workspace_id FROM channels WHERE id = ?', message.channel_id);
            const membership = await db.get(
                'SELECT role FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
                [channel.workspace_id, req.userId]
            );

            if (!membership || membership.role !== 'admin') {
                return res.status(403).json({ error: 'Only message owner or admin can edit' });
            }
        }

        await db.run(
            'UPDATE messages SET content = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?',
            [content, messageId]
        );

        const updated = await db.get(`
            SELECT m.*, u.name as user_name, u.avatar_url 
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
        `, messageId);

        // Emit via Socket.io
        const io = req.app.get('io');
        io.to(`channel-${message.channel_id}`).emit('message-edited', updated);

        res.json(updated);
    } catch (error) {
        console.error('Edit Message Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete message
router.delete('/:messageId', authMiddleware, async (req, res) => {
    const { messageId } = req.params;
    const db = getDb();

    try {
        const message = await db.get('SELECT * FROM messages WHERE id = ?', messageId);
        if (!message) return res.status(404).json({ error: 'Message not found' });

        if (message.user_id !== req.userId) {
            const channel = await db.get('SELECT workspace_id FROM channels WHERE id = ?', message.channel_id);
            const canDelete = await hasPermission(db, channel.workspace_id, req.userId, 'delete');

            if (!canDelete) {
                return res.status(403).json({ error: 'Only message owner or admin can delete' });
            }
        }

        await db.run('UPDATE messages SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [messageId]);

        // Emit via Socket.io
        const io = req.app.get('io');
        io.to(`channel-${message.channel_id}`).emit('message-deleted', { messageId });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete Message Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
