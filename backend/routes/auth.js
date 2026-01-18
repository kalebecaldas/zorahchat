const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';

// Simple user registration
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDb();

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        const userId = result.lastID;
        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({
            user: { id: userId, name, email, status: 'online' },
            token
        });

    } catch (error) {
        console.error('Register Error:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    const db = getDb();

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url, status: user.status, status_message: user.status_message },
            token
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = getDb();
        const user = await db.get('SELECT id, name, email, avatar_url, status, status_message FROM users WHERE id = ?', decoded.userId);

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (error) {
        console.error('Me Route Error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Update Profile
router.put('/profile', authMiddleware, async (req, res) => {
    const { name, avatar_url } = req.body;
    const db = getDb();

    try {
        await db.run(
            'UPDATE users SET name = ?, avatar_url = ? WHERE id = ?',
            [name, avatar_url, req.userId]
        );

        const user = await db.get('SELECT id, name, email, avatar_url, status, status_message FROM users WHERE id = ?', req.userId);
        res.json(user);
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Change Password
router.put('/password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const db = getDb();

    try {
        const user = await db.get('SELECT * FROM users WHERE id = ?', req.userId);
        const validPassword = await bcrypt.compare(currentPassword, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.userId]);

        res.json({ success: true });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
