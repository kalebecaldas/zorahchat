/**
 * Script to create or update the master admin user
 * Run with: node scripts/createMasterUser.js
 */

const bcryptjs = require('bcryptjs');
const { getDb, initializeDatabase } = require('../database');

const MASTER_EMAIL = 'kalebe.caldas@hotmail.com';
const MASTER_PASSWORD = 'mxskqgltne';
const MASTER_NAME = 'Master Admin';

async function createMasterUser() {
    // Initialize database first
    await initializeDatabase();
    const db = getDb();

    try {
        console.log('🔐 Creating/updating master user...');
        console.log('📧 Email:', MASTER_EMAIL);

        // Detect database type
        const isPostgres = !!process.env.DATABASE_URL;
        console.log('📦 Database:', isPostgres ? 'PostgreSQL' : 'SQLite');

        // Check if user already exists
        const existingUser = isPostgres
            ? await db.get('SELECT * FROM users WHERE email = $1', [MASTER_EMAIL])
            : await db.get('SELECT * FROM users WHERE email = ?', [MASTER_EMAIL]);

        // Hash the password
        const hashedPassword = await bcryptjs.hash(MASTER_PASSWORD, 10);

        if (existingUser) {
            // Update existing user
            if (isPostgres) {
                await db.run(
                    'UPDATE users SET name = $1, password = $2, status = $3 WHERE email = $4',
                    [MASTER_NAME, hashedPassword, 'online', MASTER_EMAIL]
                );
            } else {
                await db.run(
                    'UPDATE users SET name = ?, password = ?, status = ? WHERE email = ?',
                    [MASTER_NAME, hashedPassword, 'online', MASTER_EMAIL]
                );
            }
            console.log('✅ Master user updated successfully!');
            console.log('👤 User ID:', existingUser.id);
        } else {
            // Create new user
            if (isPostgres) {
                const result = await db.get(
                    'INSERT INTO users (name, email, password, status) VALUES ($1, $2, $3, $4) RETURNING id',
                    [MASTER_NAME, MASTER_EMAIL, hashedPassword, 'online']
                );
                console.log('✅ Master user created successfully!');
                console.log('👤 User ID:', result.id);
            } else {
                const result = await db.run(
                    'INSERT INTO users (name, email, password, status) VALUES (?, ?, ?, ?)',
                    [MASTER_NAME, MASTER_EMAIL, hashedPassword, 'online']
                );
                console.log('✅ Master user created successfully!');
                console.log('👤 User ID:', result.lastID);
            }
        }

        console.log('\n📝 Login credentials:');
        console.log('   Email:', MASTER_EMAIL);
        console.log('   Password:', MASTER_PASSWORD);
        console.log('\n🔗 Login URL:', isPostgres ? 'https://[your-app].railway.app/login' : 'http://localhost:5173/login');
        console.log('\n⚠️  IMPORTANT: Keep these credentials safe!');

    } catch (error) {
        console.error('❌ Error creating master user:', error);
        throw error;
    }
}

// Run the script
createMasterUser()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
