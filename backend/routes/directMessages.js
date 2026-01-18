const express = require('express');
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

const router = express.Router();

// Get or create DM conversation
router.post('/create', authMiddleware, async (req, res) => {
    const { workspaceId, userId } = req.body;
    const db = getDb();

    try {
        // Check if DM already exists (either direction)
        let dm = await db.get(`
            SELECT * FROM direct_messages 
            WHERE workspace_id = ? AND (
                (user1_id = ? AND user2_id = ?) OR 
                (user1_id = ? AND user2_id = ?)
            )
        `, [workspaceId, req.userId, userId, userId, req.userId]);

        if (!dm) {
            // Create new DM
            const result = await db.run(
                'INSERT INTO direct_messages (workspace_id, user1_id, user2_id) VALUES (?, ?, ?)',
                [workspaceId, Math.min(req.userId, userId), Math.max(req.userId, userId)]
            );
            dm = await db.get('SELECT * FROM direct_messages WHERE id = ?', result.lastID);
        }

        // Get other user info
        const otherUserId = dm.user1_id === req.userId ? dm.user2_id : dm.user1_id;
        const otherUser = await db.get('SELECT id, name, avatar_url, status FROM users WHERE id = ?', otherUserId);

        res.json({ ...dm, otherUser });
    } catch (error) {
        console.error('Create DM Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all DMs for a workspace
router.get('/:workspaceId', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const db = getDb();

    try {
        const dms = await db.all(`
            SELECT dm.*, 
                   CASE 
                       WHEN dm.user1_id = ? THEN u2.id
                       ELSE u1.id
                   END as other_user_id,
                   CASE 
                       WHEN dm.user1_id = ? THEN u2.name
                       ELSE u1.name
                   END as other_user_name,
                   CASE 
                       WHEN dm.user1_id = ? THEN u2.avatar_url
                       ELSE u1.avatar_url
                   END as other_user_avatar,
                   CASE 
                       WHEN dm.user1_id = ? THEN u2.status
                       ELSE u1.status
                   END as other_user_status
            FROM direct_messages dm
            JOIN users u1 ON dm.user1_id = u1.id
            JOIN users u2 ON dm.user2_id = u2.id
            WHERE dm.workspace_id = ? AND (dm.user1_id = ? OR dm.user2_id = ?)
        `, [req.userId, req.userId, req.userId, req.userId, workspaceId, req.userId, req.userId]);

        res.json(dms);
    } catch (error) {
        console.error('Get DMs Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get DM messages
router.get('/:dmId/messages', authMiddleware, async (req, res) => {
    const { dmId } = req.params;
    const db = getDb();

    try {
        // Verify user is part of this DM
        const dm = await db.get(
            'SELECT * FROM direct_messages WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
            [dmId, req.userId, req.userId]
        );

        if (!dm) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const messages = await db.all(`
            SELECT m.*, u.name as user_name, u.username, u.avatar_url 
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.dm_id = ?
            ORDER BY m.created_at ASC
        `, dmId);

        // Update read receipt for DM when fetching messages
        if (messages.length > 0) {
            // Delete existing to avoid NULL constraint issues
            await db.run(`
                DELETE FROM read_receipts 
                WHERE user_id = ? AND dm_id = ? AND channel_id IS NULL
            `, [req.userId, dmId]);
            
            // Insert new receipt
            await db.run(`
                INSERT INTO read_receipts (user_id, channel_id, dm_id, last_read_message_id, last_read_at)
                VALUES (?, NULL, ?, ?, CURRENT_TIMESTAMP)
            `, [req.userId, dmId, messages[messages.length - 1].id]);
        }

        res.json(messages);
    } catch (error) {
        console.error('Get DM Messages Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send DM message
router.post('/:dmId/messages', authMiddleware, async (req, res) => {
    const { dmId } = req.params;
    const { content, attachment_url, attachment_type, attachment_name } = req.body;
    const db = getDb();

    try {
        // Verify user is part of this DM
        const dm = await db.get(
            'SELECT * FROM direct_messages WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
            [dmId, req.userId, req.userId]
        );

        if (!dm) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await db.run(
            'INSERT INTO messages (dm_id, user_id, content, attachment_url, attachment_type, attachment_name) VALUES (?, ?, ?, ?, ?, ?)',
            [dmId, req.userId, content, attachment_url, attachment_type, attachment_name]
        );

        const message = await db.get(`
            SELECT m.*, u.name as user_name, u.username, u.avatar_url 
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
        `, result.lastID);

        // Determine recipient (the other user in the DM)
        const recipientId = dm.user1_id === req.userId ? dm.user2_id : dm.user1_id;

        // Create DM notification for recipient
        const notification = await NotificationService.notifyDM(
            recipientId,
            req.userId,
            message.user_name,
            content ? content.substring(0, 100) : '📎 Arquivo enviado',
            dmId,
            message.id,
            dm.workspace_id
        );

        // Emit via Socket.io - SIMPLIFIED: Send directly to both users
        const io = req.app.get('io');
        if (io) {
            const allSockets = await io.fetchSockets();
            
            // Find sockets for both users
            const senderSocket = allSockets.find(s => s.userId === req.userId);
            const recipientSocket = allSockets.find(s => s.userId === recipientId);
            
            // Get detailed info about all connected sockets
            const connectedUsersInfo = allSockets.map(s => ({
                userId: s.userId,
                socketId: s.id,
                rooms: Array.from(s.rooms || [])
            }));
            
            console.log(`[DM] Broadcasting new-message to dm-${dmId}:`, {
                messageId: message.id,
                content: message.content?.substring(0, 50),
                senderId: message.user_id,
                recipientId: recipientId,
                senderConnected: !!senderSocket,
                recipientConnected: !!recipientSocket,
                allConnectedUsers: allSockets.map(s => s.userId),
                detailedConnections: connectedUsersInfo
            });
            
            if (!recipientSocket) {
                console.warn(`[DM] WARNING: Recipient ${recipientId} is NOT connected! Message will not be delivered in real-time.`);
                console.warn(`[DM] Available user IDs:`, allSockets.map(s => s.userId));
            }

            // Send directly to sender
            if (senderSocket) {
                senderSocket.emit('new-message', message);
            }
            
            // Send directly to recipient
            if (recipientSocket) {
                recipientSocket.emit('new-message', message);
                recipientSocket.emit('new-notification', notification);
            }

            // Also emit to rooms as backup
            io.to(`dm-${dmId}`).emit('new-message', message);
            io.to(`user-${recipientId}`).emit('new-notification', notification);
        }

        res.status(201).json(message);
    } catch (error) {
        console.error('Send DM Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mark DM as read
router.post('/:dmId/read', authMiddleware, async (req, res) => {
    const { dmId } = req.params;
    const db = getDb();

    try {
        // Verify user is part of this DM
        const dm = await db.get(
            'SELECT * FROM direct_messages WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
            [dmId, req.userId, req.userId]
        );

        if (!dm) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get the last message ID in this DM
        const lastMessage = await db.get(
            'SELECT id FROM messages WHERE dm_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1',
            [dmId]
        );

        // Update read receipt
        console.log('[MARK READ DM] Updating read receipt:', {
            userId: req.userId,
            dmId: dmId,
            lastMessageId: lastMessage?.id || null
        });
        
        // First, delete any existing receipt for this user+dm to avoid NULL issues
        await db.run(`
            DELETE FROM read_receipts 
            WHERE user_id = ? AND dm_id = ? AND channel_id IS NULL
        `, [req.userId, dmId]);
        
        // Then insert new receipt
        await db.run(`
            INSERT INTO read_receipts (user_id, channel_id, dm_id, last_read_message_id, last_read_at)
            VALUES (?, NULL, ?, ?, CURRENT_TIMESTAMP)
        `, [req.userId, dmId, lastMessage?.id || null]);
        
        // Verify it was saved
        const saved = await db.get(`
            SELECT * FROM read_receipts 
            WHERE user_id = ? AND dm_id = ?
        `, [req.userId, dmId]);
        console.log('[MARK READ DM] Saved read receipt:', saved);

        res.json({ success: true, dmId, lastReadMessageId: lastMessage?.id || null });
    } catch (error) {
        console.error('Mark DM read error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
