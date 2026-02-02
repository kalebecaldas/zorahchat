const jwt = require('jsonwebtoken');
const { getDb } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';
const MASTER_EMAIL = 'kalebe.caldas@hotmail.com';

/**
 * Middleware to verify master/super admin access
 * Only allows access to the master user
 */
const masterAuth = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = getDb();
        
        const user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.userId]);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check if user is the master
        if (user.email !== MASTER_EMAIL) {
            return res.status(403).json({ error: 'Master access required. This action is restricted to system administrators.' });
        }

        req.userId = decoded.userId;
        req.masterUser = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = masterAuth;
