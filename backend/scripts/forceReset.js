/**
 * Force Reset - Aggressive database reset
 * Run with: node scripts/forceReset.js
 */

const bcryptjs = require('bcryptjs');
const { getDb, initializeDatabase } = require('../database');

const MASTER_EMAIL = 'kalebe.caldas@hotmail.com';
const MASTER_PASSWORD = 'mxskqgltne';
const MASTER_NAME = 'Master Admin';

async function forceReset() {
    try {
        console.log('🔄 Initializing database...');
        await initializeDatabase();
        const db = getDb();

        console.log('🗑️  Force deleting all data...');

        // Disable foreign keys temporarily
        await db.run('PRAGMA foreign_keys = OFF');

        // Delete all data - order doesn't matter with FK off
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
                console.log(`  ✓ ${table}`);
            } catch (error) {
                console.log(`  • ${table} (skipped)`);
            }
        }

        // Re-enable foreign keys
        await db.run('PRAGMA foreign_keys = ON');

        console.log('🔐 Creating master user...');
        const hashedPassword = await bcryptjs.hash(MASTER_PASSWORD, 10);

        const result = await db.run(
            'INSERT INTO users (name, email, password, status) VALUES (?, ?, ?, ?)',
            [MASTER_NAME, MASTER_EMAIL, hashedPassword, 'online']
        );

        console.log('✅ Done!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 Database Status:');
        console.log('   Users: 1 (master)');
        console.log('   Workspaces: 0');
        console.log('   Messages: 0');
        console.log('\n📝 Login Credentials:');
        console.log('   Email: kalebe.caldas@hotmail.com');
        console.log('   Password: mxskqgltne');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

forceReset()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
