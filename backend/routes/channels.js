const express = require('express');
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get specific channel info (optimized for quick lookups)
router.get('/:workspaceId/channel/:channelId', authMiddleware, async (req, res) => {
    const { workspaceId, channelId } = req.params;
    const db = getDb();

    try {
        // Verify user is member of workspace
        const membership = await db.get(
            'SELECT * FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, req.userId]
        );

        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this workspace' });
        }

        // Get channel info
        const channel = await db.get(`
            SELECT c.*, COUNT(cm.user_id) as member_count
            FROM channels c
            LEFT JOIN channel_members cm ON c.id = cm.channel_id
            WHERE c.id = ? AND c.workspace_id = ?
              AND (c.is_private = false OR EXISTS (
                  SELECT 1 FROM channel_members cm2 
                  WHERE cm2.channel_id = c.id AND cm2.user_id = ?
              ))
            GROUP BY c.id
        `, [channelId, workspaceId, req.userId]);

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found or access denied' });
        }

        res.json(channel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get channels for a workspace
router.get('/:workspaceId', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const db = getDb();

    try {
        // Verify user is member of workspace
        const membership = await db.get(
            'SELECT * FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, req.userId]
        );

        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this workspace' });
        }

        // Only return channels where user is a member
        const channels = await db.all(`
            SELECT c.*, COUNT(cm.user_id) as member_count
            FROM channels c
            LEFT JOIN channel_members cm ON c.id = cm.channel_id
            WHERE c.workspace_id = ? 
              AND (c.is_private = false OR EXISTS (
                  SELECT 1 FROM channel_members cm2 
                  WHERE cm2.channel_id = c.id AND cm2.user_id = ?
              ))
            GROUP BY c.id
            ORDER BY c.is_default DESC, c.created_at ASC
        `, [workspaceId, req.userId]);

        res.json(channels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create channel (Admin/Moderator only)
router.post('/', authMiddleware, async (req, res) => {
    const { workspaceId, name, type, description, is_private } = req.body;

    if (!workspaceId || !name) {
        return res.status(400).json({ error: 'Workspace ID and name are required' });
    }

    const db = getDb();

    try {
        // Verify user is member of workspace
        const membership = await db.get(
            'SELECT * FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, req.userId]
        );

        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this workspace' });
        }

        // Check if user has permission to create channels (admin or moderator)
        if (membership.role !== 'admin' && membership.role !== 'moderator') {
            return res.status(403).json({ error: 'Only admins and moderators can create channels' });
        }

        const result = await db.run(
            'INSERT INTO channels (workspace_id, name, type, description, is_private, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [workspaceId, name, type || 'public', description || null, !!is_private, req.userId]
        );

        const channel = await db.get('SELECT * FROM channels WHERE id = ?', [result.lastID]);

        // Auto-add creator to channel
        await db.run(
            'INSERT INTO channel_members (channel_id, user_id, added_by) VALUES (?, ?, ?)',
            [channel.id, req.userId, req.userId]
        );

        res.status(201).json(channel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get channel members
router.get('/:channelId/members', authMiddleware, async (req, res) => {
    const { channelId } = req.params;
    const db = getDb();

    try {
        // Verify user is member of channel
        const isMember = await db.get(
            'SELECT * FROM channel_members WHERE channel_id = ? AND user_id = ?',
            [channelId, req.userId]
        );

        if (!isMember) {
            return res.status(403).json({ error: 'Not a member of this channel' });
        }

        const members = await db.all(`
            SELECT u.id, u.name, u.email, u.avatar_url, cm.added_at, cm.added_by
            FROM channel_members cm
            INNER JOIN users u ON cm.user_id = u.id
            WHERE cm.channel_id = ?
            ORDER BY cm.added_at ASC
        `, [channelId]);

        res.json(members);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add members to channel (Admin/Moderator only)
router.post('/:channelId/members', authMiddleware, async (req, res) => {
    const { channelId } = req.params;
    const { userIds } = req.body; // Array of user IDs

    if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ error: 'userIds array is required' });
    }

    const db = getDb();

    try {
        // Get channel and verify permissions
        const channel = await db.get('SELECT * FROM channels WHERE id = ?', [channelId]);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const membership = await db.get(
            'SELECT * FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [channel.workspace_id, req.userId]
        );

        if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
            return res.status(403).json({ error: 'Only admins and moderators can add members' });
        }

        // Add each user to channel
        const added = [];
        for (const userId of userIds) {
            try {
                await db.run(
                    'INSERT OR IGNORE INTO channel_members (channel_id, user_id, added_by) VALUES (?, ?, ?)',
                    [channelId, userId, req.userId]
                );
                added.push(userId);
            } catch (error) {
                console.error(`Failed to add user ${userId}:`, error);
            }
        }

        res.json({ success: true, added_count: added.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove member from channel (Admin/Moderator only)
router.delete('/:channelId/members/:userId', authMiddleware, async (req, res) => {
    const { channelId, userId } = req.params;
    const db = getDb();

    try {
        // Get channel and verify permissions
        const channel = await db.get('SELECT * FROM channels WHERE id = ?', [channelId]);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const membership = await db.get(
            'SELECT * FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [channel.workspace_id, req.userId]
        );

        if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
            return res.status(403).json({ error: 'Only admins and moderators can remove members' });
        }

        await db.run(
            'DELETE FROM channel_members WHERE channel_id = ? AND user_id = ?',
            [channelId, userId]
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update channel settings (Admin/Moderator only)
router.put('/:channelId/settings', authMiddleware, async (req, res) => {
    const { channelId } = req.params;
    const { name, description, is_private, is_default } = req.body;
    const db = getDb();

    try {
        // Get channel and verify permissions
        const channel = await db.get('SELECT * FROM channels WHERE id = ?', [channelId]);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const membership = await db.get(
            'SELECT * FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [channel.workspace_id, req.userId]
        );

        if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
            return res.status(403).json({ error: 'Only admins and moderators can update channel settings' });
        }

        // If setting as default, unset other defaults
        if (is_default) {
            await db.run(
                'UPDATE channels SET is_default = 0 WHERE workspace_id = ? AND id != ?',
                [channel.workspace_id, channelId]
            );
        }

        await db.run(
            `UPDATE channels 
             SET name = COALESCE(?, name),
                 description = COALESCE(?, description),
                 is_private = COALESCE(?, is_private),
                 is_default = COALESCE(?, is_default)
             WHERE id = ?`,
            [name, description, is_private !== undefined ? !!is_private : null,
                is_default !== undefined ? !!is_default : null, channelId]
        );

        const updatedChannel = await db.get('SELECT * FROM channels WHERE id = ?', [channelId]);
        res.json(updatedChannel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
