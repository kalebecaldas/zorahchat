/**
 * Quick Reset - No confirmation needed
 * Run with: node scripts/quickReset.js
 */

const bcryptjs = require('bcryptjs');
const { getDb, initializeDatabase } = require('../database');

const MASTER_EMAIL = 'kalebe.caldas@hotmail.com';
const MASTER_PASSWORD = 'mxskqgltne';
const MASTER_NAME = 'Master Admin';

async function quickReset() {
    try {
        console.log('🔄 Initializing database...');
        await initializeDatabase();
        const db = getDb();

        console.log('🗑️  Deleting all data...');

        // Delete all data
        const tables = [
            'admin_audit_log',
            'mentions',
            'notifications', 
            'read_receipts',
            'message_reactions',
            'message_attachments',
            'messages',
            'channel_members',
            'channels',
            'direct_messages',
            'workspace_users',
            'workspaces',
            'users'
        ];

        for (const table of tables) {
            try {
                await db.run(`DELETE FROM ${table}`);
            } catch (error) {
                // Ignore errors
            }
        }

        console.log('🔐 Creating master user...');
        const hashedPassword = await bcryptjs.hash(MASTER_PASSWORD, 10);

        // Check if master already exists
        const existingMaster = await db.get('SELECT id FROM users WHERE email = ?', [MASTER_EMAIL]);
        
        if (existingMaster) {
            // Update existing master
            await db.run(
                'UPDATE users SET name = ?, password = ?, status = ? WHERE email = ?',
                [MASTER_NAME, hashedPassword, 'online', MASTER_EMAIL]
            );
            console.log('✅ Master user updated!');
        } else {
            // Create new master
            await db.run(
                'INSERT INTO users (name, email, password, status) VALUES (?, ?, ?, ?)',
                [MASTER_NAME, MASTER_EMAIL, hashedPassword, 'online']
            );
            console.log('✅ Master user created!');
        }

        console.log('\n📝 Login: kalebe.caldas@hotmail.com / mxskqgltne');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

quickReset()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
