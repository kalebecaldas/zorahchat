/**
 * Script to reset the database and create only the master user
 * Run with: node scripts/resetDatabase.js
 * 
 * WARNING: This will DELETE ALL DATA!
 */

const bcryptjs = require('bcryptjs');
const { getDb, initializeDatabase } = require('../database');

const MASTER_EMAIL = 'kalebe.caldas@hotmail.com';
const MASTER_PASSWORD = 'mxskqgltne';
const MASTER_NAME = 'Master Admin';

async function resetDatabase() {
    try {
        console.log('🔄 Initializing database...');
        await initializeDatabase();
        const db = getDb();

        console.log('\n⚠️  WARNING: This will DELETE ALL DATA!');
        console.log('⏰ Starting in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('\n🗑️  Deleting all data...\n');

        // Delete all data in correct order (respecting foreign keys)
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
                const result = await db.run(`DELETE FROM ${table}`);
                console.log(`  ✅ Cleared ${table}`);
            } catch (error) {
                console.log(`  ⚠️  ${table} (table might not exist or already empty)`);
            }
        }

        console.log('\n🔐 Creating master user...');

        // Hash the password
        const hashedPassword = await bcryptjs.hash(MASTER_PASSWORD, 10);

        // Create master user
        const result = await db.run(
            'INSERT INTO users (name, email, password, status, avatar_url) VALUES (?, ?, ?, ?, ?)',
            [MASTER_NAME, MASTER_EMAIL, hashedPassword, 'online', null]
        );

        console.log('✅ Master user created successfully!');
        console.log('\n📝 Database Reset Complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n👤 Master User Created:');
        console.log('   ID:', result.lastID);
        console.log('   Name:', MASTER_NAME);
        console.log('   Email:', MASTER_EMAIL);
        console.log('   Password:', MASTER_PASSWORD);
        console.log('\n🔗 Access:');
        console.log('   Login: http://localhost:5173/login');
        console.log('   Admin Panel: http://localhost:5173/admin');
        console.log('\n📊 Database Status:');
        
        // Show counts
        for (const table of ['users', 'workspaces', 'channels', 'messages']) {
            try {
                const count = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`   ${table}: ${count.count}`);
            } catch (e) {
                // Ignore
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ Database is now clean and ready to use!');
        console.log('\n⚠️  IMPORTANT: ');
        console.log('   - All previous users have been deleted');
        console.log('   - All workspaces have been deleted');
        console.log('   - All messages have been deleted');
        console.log('   - Only the master user exists now');
        console.log('\n💡 Next steps:');
        console.log('   1. Login with master credentials');
        console.log('   2. Create a new workspace');
        console.log('   3. Invite users as needed');
        console.log('\n');

    } catch (error) {
        console.error('❌ Error resetting database:', error);
        throw error;
    }
}

// Confirmation prompt
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚠️  DATABASE RESET SCRIPT');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\nThis script will:');
console.log('  ❌ DELETE ALL users (except master)');
console.log('  ❌ DELETE ALL workspaces');
console.log('  ❌ DELETE ALL channels');
console.log('  ❌ DELETE ALL messages');
console.log('  ❌ DELETE ALL direct messages');
console.log('  ✅ CREATE master user: kalebe.caldas@hotmail.com');
console.log('\nThis action CANNOT be undone!');
console.log('\n');

// Run the script
resetDatabase()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
