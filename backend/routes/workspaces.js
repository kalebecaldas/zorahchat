const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Helper to generate slug
const generateSlug = (name) => {
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50) + '-' + Math.floor(Math.random() * 10000);
};

// Get user's workspaces
router.get('/', authMiddleware, async (req, res) => {
    const db = getDb();

    try {
        const workspaces = await db.all(`
            SELECT w.*, wu.role, wu.permissions
            FROM workspaces w
            JOIN workspace_users wu ON w.id = wu.workspace_id
            WHERE wu.user_id = ?
            ORDER BY w.created_at DESC
        `, req.userId);

        res.json(workspaces);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create workspace (any user can create)
router.post('/', authMiddleware, async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Workspace name is required' });
    }

    const db = getDb();

    try {
        const slug = generateSlug(name);

        const result = await db.run(
            'INSERT INTO workspaces (name, slug, description, owner_id) VALUES (?, ?, ?, ?)',
            [name, slug, description || null, req.userId]
        );

        const workspaceId = result.lastID;

        // Add creator as admin with full permissions
        await db.run(
            'INSERT INTO workspace_users (workspace_id, user_id, role, permissions) VALUES (?, ?, ?, ?)',
            [workspaceId, req.userId, 'admin', 'read,write,delete,manage']
        );

        // Create default channels
        await db.run('INSERT INTO channels (workspace_id, name, created_by) VALUES (?, ?, ?)', [workspaceId, 'general', req.userId]);
        await db.run('INSERT INTO channels (workspace_id, name, created_by) VALUES (?, ?, ?)', [workspaceId, 'random', req.userId]);

        const workspace = await db.get('SELECT * FROM workspaces WHERE id = ?', workspaceId);
        res.status(201).json(workspace);
    } catch (error) {
        console.error('Create Workspace Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update workspace (admin only)
router.put('/:workspaceId', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const { name, description, avatar_url } = req.body;
    const db = getDb();

    try {
        // Check if user is admin
        const membership = await db.get(
            'SELECT role FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, req.userId]
        );

        if (!membership || membership.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        await db.run(
            'UPDATE workspaces SET name = ?, description = ?, avatar_url = ? WHERE id = ?',
            [name, description, avatar_url, workspaceId]
        );

        const workspace = await db.get('SELECT * FROM workspaces WHERE id = ?', workspaceId);
        res.json(workspace);
    } catch (error) {
        console.error('Update Workspace Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get workspace members (admin only)
router.get('/:workspaceId/members', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const db = getDb();

    try {
        const membership = await db.get(
            'SELECT role FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, req.userId]
        );

        if (!membership || membership.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const members = await db.all(`
            SELECT u.id, u.name, u.email, u.avatar_url, wu.role, wu.permissions, wu.joined_at
            FROM users u
            JOIN workspace_users wu ON u.id = wu.user_id
            WHERE wu.workspace_id = ?
            ORDER BY wu.joined_at ASC
        `, workspaceId);

        res.json(members);
    } catch (error) {
        console.error('Get Members Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update member role/permissions (admin only)
router.put('/:workspaceId/members/:userId', authMiddleware, async (req, res) => {
    const { workspaceId, userId } = req.params;
    const { role, permissions } = req.body;
    const db = getDb();

    try {
        // Check if requester is admin
        const requesterMembership = await db.get(
            'SELECT role FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, req.userId]
        );

        if (!requesterMembership || requesterMembership.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Don't allow changing workspace owner
        const workspace = await db.get('SELECT owner_id FROM workspaces WHERE id = ?', workspaceId);
        if (workspace.owner_id == userId && role !== 'admin') {
            return res.status(400).json({ error: 'Cannot demote workspace owner' });
        }

        await db.run(
            'UPDATE workspace_users SET role = ?, permissions = ? WHERE workspace_id = ? AND user_id = ?',
            [role, permissions, workspaceId, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Update Member Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove member (admin only)
router.delete('/:workspaceId/members/:userId', authMiddleware, async (req, res) => {
    const { workspaceId, userId } = req.params;
    const db = getDb();

    try {
        const requesterMembership = await db.get(
            'SELECT role FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, req.userId]
        );

        if (!requesterMembership || requesterMembership.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Don't allow removing workspace owner
        const workspace = await db.get('SELECT owner_id FROM workspaces WHERE id = ?', workspaceId);
        if (workspace.owner_id == userId) {
            return res.status(400).json({ error: 'Cannot remove workspace owner' });
        }

        await db.run(
            'DELETE FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Remove Member Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Invite user to workspace (admin only)
router.post('/:workspaceId/invite', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const { email } = req.body;
    const db = getDb();

    try {
        const requesterMembership = await db.get(
            'SELECT role FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, req.userId]
        );

        if (!requesterMembership || requesterMembership.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const user = await db.get('SELECT id FROM users WHERE email = ?', email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already member
        const existing = await db.get(
            'SELECT * FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, user.id]
        );

        if (existing) {
            return res.status(400).json({ error: 'User is already a member' });
        }

        await db.run(
            'INSERT INTO workspace_users (workspace_id, user_id, role, permissions) VALUES (?, ?, ?, ?)',
            [workspaceId, user.id, 'member', 'read,write']
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Invite User Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Search workspaces (public search)
router.get('/search', authMiddleware, async (req, res) => {
    const { q } = req.query;
    const db = getDb();

    try {
        const workspaces = await db.all(`
            SELECT w.id, w.name, w.description, w.slug
            FROM workspaces w
            WHERE (w.name LIKE ? OR w.slug LIKE ?)
            AND w.id NOT IN (
                SELECT workspace_id FROM workspace_users WHERE user_id = ?
            )
            LIMIT 10
        `, [`%${q}%`, `%${q}%`, req.userId]);

        res.json(workspaces);
    } catch (error) {
        console.error('Search Workspaces Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Request to join workspace
router.post('/:workspaceId/join', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const db = getDb();

    try {
        // Check if already member
        const existing = await db.get(
            'SELECT * FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, req.userId]
        );

        if (existing) {
            return res.status(400).json({ error: 'You are already a member' });
        }

        // Check if already requested
        const existingRequest = await db.get(
            'SELECT * FROM workspace_join_requests WHERE workspace_id = ? AND user_id = ? AND status = ?',
            [workspaceId, req.userId, 'pending']
        );

        if (existingRequest) {
            return res.status(400).json({ error: 'You already have a pending request' });
        }

        await db.run(
            'INSERT OR REPLACE INTO workspace_join_requests (workspace_id, user_id, status) VALUES (?, ?, ?)',
            [workspaceId, req.userId, 'pending']
        );

        // Emit socket event to workspace admins
        const io = req.app.get('io');
        if (io) {
            io.to(`workspace-${workspaceId}`).emit('join-request-update', { workspaceId });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Join Request Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user's sent join requests
router.get('/my-requests', authMiddleware, async (req, res) => {
    const db = getDb();
    try {
        const requests = await db.all(`
            SELECT jr.*, w.name as workspace_name
            FROM workspace_join_requests jr
            JOIN workspaces w ON jr.workspace_id = w.id
            WHERE jr.user_id = ? AND jr.status = 'pending'
        `, req.userId);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get pending join requests (admin only)
router.get('/:workspaceId/pending-requests', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const db = getDb();

    try {
        const membership = await db.get(
            'SELECT role FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, req.userId]
        );

        if (!membership || membership.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const requests = await db.all(`
            SELECT jr.id, jr.created_at, u.id as user_id, u.name, u.email, u.avatar_url
            FROM workspace_join_requests jr
            JOIN users u ON jr.user_id = u.id
            WHERE jr.workspace_id = ? AND jr.status = 'pending'
            ORDER BY jr.created_at DESC
        `, workspaceId);

        res.json(requests);
    } catch (error) {
        console.error('Get Pending Requests Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Approve/reject join request (admin only)
router.post('/:workspaceId/pending-requests/:requestId/:action', authMiddleware, async (req, res) => {
    const { workspaceId, requestId, action } = req.params;
    const db = getDb();

    try {
        const membership = await db.get(
            'SELECT role FROM workspace_users WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, req.userId]
        );

        if (!membership || membership.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const request = await db.get(
            'SELECT * FROM workspace_join_requests WHERE id = ? AND workspace_id = ?',
            [requestId, workspaceId]
        );

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (action === 'approve') {
            await db.run(
                'INSERT INTO workspace_users (workspace_id, user_id, role, permissions) VALUES (?, ?, ?, ?)',
                [workspaceId, request.user_id, 'member', 'read,write']
            );
            await db.run(
                'UPDATE workspace_join_requests SET status = ? WHERE id = ?',
                ['approved', requestId]
            );
        } else if (action === 'reject') {
            await db.run(
                'UPDATE workspace_join_requests SET status = ? WHERE id = ?',
                ['rejected', requestId]
            );
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Handle Request Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
