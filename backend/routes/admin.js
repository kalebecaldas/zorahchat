const express = require('express');
const { getDb } = require('../database');
const masterAuth = require('../middleware/masterAuth');
const os = require('os');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// All routes require master auth
router.use(masterAuth);

// Get system statistics
router.get('/stats', async (req, res) => {
    const db = getDb();

    try {
        const stats = {};

        // Total users
        const usersCount = await db.get('SELECT COUNT(*) as count FROM users');
        stats.totalUsers = parseInt(usersCount.count);

        // Total workspaces
        const workspacesCount = await db.get('SELECT COUNT(*) as count FROM workspaces');
        stats.totalWorkspaces = parseInt(workspacesCount.count);

        // Total messages
        const messagesCount = await db.get('SELECT COUNT(*) as count FROM messages WHERE deleted_at IS NULL');
        stats.totalMessages = parseInt(messagesCount.count);

        // Messages last 24h
        const messages24h = await db.get(`
            SELECT COUNT(*) as count FROM messages 
            WHERE deleted_at IS NULL 
            AND created_at > datetime('now', '-1 day')
        `);
        stats.messages24h = parseInt(messages24h.count);

        // Messages last 7 days
        const messages7d = await db.get(`
            SELECT COUNT(*) as count FROM messages 
            WHERE deleted_at IS NULL 
            AND created_at > datetime('now', '-7 days')
        `);
        stats.messages7d = parseInt(messages7d.count);

        // Online users (from socket connections)
        const io = req.app.get('io');
        if (io) {
            const sockets = await io.fetchSockets();
            const uniqueUserIds = [...new Set(sockets.map(s => s.userId))];
            stats.onlineUsers = uniqueUserIds.length;
            stats.onlineUserIds = uniqueUserIds;
        } else {
            stats.onlineUsers = 0;
            stats.onlineUserIds = [];
        }

        // Total channels
        const channelsCount = await db.get('SELECT COUNT(*) as count FROM channels');
        stats.totalChannels = parseInt(channelsCount.count);

        res.json(stats);
    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all users
router.get('/users', async (req, res) => {
    const db = getDb();

    try {
        const users = await db.all(`
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.status, 
                u.avatar_url,
                u.created_at,
                u.last_seen,
                (SELECT COUNT(*) FROM workspace_users wu WHERE wu.user_id = u.id) as workspace_count,
                (SELECT COUNT(*) FROM messages m WHERE m.user_id = u.id AND m.deleted_at IS NULL) as message_count
            FROM users u
            ORDER BY u.created_at DESC
        `);

        res.json(users);
    } catch (error) {
        console.error('Admin Get Users Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all workspaces with details
router.get('/workspaces', async (req, res) => {
    const db = getDb();

    try {
        const workspaces = await db.all(`
            SELECT 
                w.id,
                w.name,
                w.slug,
                w.description,
                w.owner_id,
                w.created_at,
                u.name as owner_name,
                u.email as owner_email,
                (SELECT COUNT(*) FROM workspace_users wu WHERE wu.workspace_id = w.id) as member_count,
                (SELECT COUNT(*) FROM channels c WHERE c.workspace_id = w.id) as channel_count,
                (SELECT COUNT(*) FROM messages m 
                 INNER JOIN channels c ON m.channel_id = c.id 
                 WHERE c.workspace_id = w.id AND m.deleted_at IS NULL) as message_count
            FROM workspaces w
            LEFT JOIN users u ON w.owner_id = u.id
            ORDER BY w.created_at DESC
        `);

        res.json(workspaces);
    } catch (error) {
        console.error('Admin Get Workspaces Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete workspace (with cascade)
router.delete('/workspaces/:workspaceId', async (req, res) => {
    const { workspaceId } = req.params;
    const db = getDb();

    try {
        // Log the action
        await logAuditAction(req.userId, 'delete_workspace', 'workspace', workspaceId, { 
            reason: req.body.reason || 'No reason provided'
        });

        // Delete workspace (cascade will handle related data)
        await db.run('DELETE FROM workspaces WHERE id = ?', [workspaceId]);

        res.json({ success: true, message: 'Workspace deleted successfully' });
    } catch (error) {
        console.error('Admin Delete Workspace Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ban/unban user
router.put('/users/:userId/ban', async (req, res) => {
    const { userId } = req.params;
    const { banned, reason } = req.body;
    const db = getDb();

    try {
        // Add banned column if doesn't exist
        try {
            await db.run('ALTER TABLE users ADD COLUMN banned BOOLEAN DEFAULT false');
        } catch (e) {
            // Column might already exist
        }

        await db.run('UPDATE users SET banned = ? WHERE id = ?', [banned ? 1 : 0, userId]);

        // Log the action
        await logAuditAction(req.userId, banned ? 'ban_user' : 'unban_user', 'user', userId, { reason });

        // If banning, disconnect all sockets
        if (banned) {
            const io = req.app.get('io');
            if (io) {
                const sockets = await io.fetchSockets();
                sockets.forEach(s => {
                    if (s.userId === parseInt(userId)) {
                        s.disconnect(true);
                    }
                });
            }
        }

        const user = await db.get('SELECT id, name, email, banned FROM users WHERE id = ?', [userId]);
        res.json(user);
    } catch (error) {
        console.error('Admin Ban User Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get system information
router.get('/system', async (req, res) => {
    const db = getDb();

    try {
        const info = {
            server: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                uptime: Math.floor(process.uptime()),
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem()
                },
                cpus: os.cpus().length
            },
            database: {
                type: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite',
                url: process.env.DATABASE_URL ? '***HIDDEN***' : undefined
            },
            environment: {
                nodeEnv: process.env.NODE_ENV,
                port: process.env.PORT || 3001
            }
        };

        // Get database size (if SQLite)
        if (!process.env.DATABASE_URL) {
            try {
                const dbPath = path.join(__dirname, '../database.sqlite');
                if (fs.existsSync(dbPath)) {
                    const stats = fs.statSync(dbPath);
                    info.database.size = stats.size;
                }
            } catch (e) {
                // Ignore
            }
        }

        res.json(info);
    } catch (error) {
        console.error('Admin System Info Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get recent audit logs
router.get('/audit-logs', async (req, res) => {
    const db = getDb();
    const limit = parseInt(req.query.limit) || 50;

    try {
        const logs = await db.all(`
            SELECT 
                a.*,
                u.name as admin_name,
                u.email as admin_email
            FROM admin_audit_log a
            LEFT JOIN users u ON a.admin_user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT ?
        `, [limit]);

        res.json(logs);
    } catch (error) {
        // Table might not exist yet
        res.json([]);
    }
});

// Helper function to log audit actions
async function logAuditAction(adminUserId, action, targetType, targetId, details = {}) {
    const db = getDb();
    
    try {
        await db.run(`
            INSERT INTO admin_audit_log (admin_user_id, action, target_type, target_id, details)
            VALUES (?, ?, ?, ?, ?)
        `, [adminUserId, action, targetType, targetId, JSON.stringify(details)]);
    } catch (error) {
        // Table might not exist yet, log but don't fail
        console.error('Audit log error:', error.message);
    }
}

module.exports = router;
