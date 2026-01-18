const express = require('express');
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get workspace members
router.get('/:workspaceId/members', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const db = getDb();

    try {
        // Verify user is member
        const membership = await db.get(
            'SELECT * FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, req.userId]
        );

        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this workspace' });
        }

        const members = await db.all(`
            SELECT u.id, u.name, u.email, u.avatar_url, u.status, u.status_message, wu.role
            FROM users u
            JOIN workspace_users wu ON u.id = wu.user_id
            WHERE wu.workspace_id = ?
            ORDER BY u.name ASC
        `, workspaceId);

        res.json(members);
    } catch (error) {
        console.error('Get Members Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update user status
router.put('/status', authMiddleware, async (req, res) => {
    const { status, status_message } = req.body;
    const db = getDb();

    const validStatuses = ['online', 'away', 'busy', 'offline'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        await db.run(
            'UPDATE users SET status = ?, status_message = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
            [status || 'online', status_message || null, req.userId]
        );

        const user = await db.get('SELECT id, name, email, avatar_url, status, status_message FROM users WHERE id = ?', req.userId);
        res.json(user);
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
