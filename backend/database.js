const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

// Use /app/data em produção (Railway), __dirname em desenvolvimento
const dataDir = process.env.NODE_ENV === 'production' ? '/app/data' : __dirname;

// Criar diretório se não existir
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
console.log(`[DATABASE] Using database at: ${dbPath}`);

let db;

async function initializeDatabase() {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec('PRAGMA foreign_keys = ON;');

    // Users Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            avatar_url TEXT,
            status TEXT DEFAULT 'online',
            status_message TEXT,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Workspaces Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS workspaces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            avatar_url TEXT,
            owner_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        );
    `);

    // Add columns if they don't exist
    try { await db.run('ALTER TABLE users ADD COLUMN status TEXT DEFAULT "online"'); } catch (e) { }
    try { await db.run('ALTER TABLE users ADD COLUMN status_message TEXT'); } catch (e) { }
    try { await db.run('ALTER TABLE users ADD COLUMN last_seen DATETIME DEFAULT CURRENT_TIMESTAMP'); } catch (e) { }
    try { await db.run('ALTER TABLE workspaces ADD COLUMN description TEXT'); } catch (e) { }
    try { await db.run('ALTER TABLE workspaces ADD COLUMN avatar_url TEXT'); } catch (e) { }
    try { await db.run('ALTER TABLE workspaces ADD COLUMN owner_id INTEGER'); } catch (e) { }

    // Workspace Users
    await db.exec(`
        CREATE TABLE IF NOT EXISTS workspace_users (
            workspace_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            role TEXT DEFAULT 'member',
            permissions TEXT DEFAULT 'read,write',
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (workspace_id, user_id),
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    try { await db.run('ALTER TABLE workspace_users ADD COLUMN permissions TEXT DEFAULT "read,write"'); } catch (e) { }

    // Channels Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            type TEXT DEFAULT 'public',
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        );
    `);

    try { await db.run('ALTER TABLE channels ADD COLUMN description TEXT'); } catch (e) { }
    try { await db.run('ALTER TABLE channels ADD COLUMN created_by INTEGER'); } catch (e) { }

    // Direct Messages Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS direct_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id INTEGER NOT NULL,
            user1_id INTEGER NOT NULL,
            user2_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
            FOREIGN KEY (user1_id) REFERENCES users(id),
            FOREIGN KEY (user2_id) REFERENCES users(id),
            UNIQUE(workspace_id, user1_id, user2_id)
        );
    `);

    // Messages Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id INTEGER,
            dm_id INTEGER,
            user_id INTEGER NOT NULL,
            content TEXT,
            attachment_url TEXT,
            attachment_type TEXT,
            attachment_name TEXT,
            edited_at DATETIME,
            deleted_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (channel_id) REFERENCES channels(id),
            FOREIGN KEY (dm_id) REFERENCES direct_messages(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    try { await db.run('ALTER TABLE messages ADD COLUMN dm_id INTEGER'); } catch (e) { }
    try { await db.run('ALTER TABLE messages ADD COLUMN attachment_url TEXT'); } catch (e) { }
    try { await db.run('ALTER TABLE messages ADD COLUMN attachment_type TEXT'); } catch (e) { }
    try { await db.run('ALTER TABLE messages ADD COLUMN attachment_name TEXT'); } catch (e) { }
    try { await db.run('ALTER TABLE messages ADD COLUMN edited_at DATETIME'); } catch (e) { }
    try { await db.run('ALTER TABLE messages ADD COLUMN deleted_at DATETIME'); } catch (e) { }

    // Message Reactions (NEW)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS message_reactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            emoji TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(message_id, user_id, emoji)
        );
    `);

    // Read Receipts (NEW)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS read_receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            channel_id INTEGER,
            dm_id INTEGER,
            last_read_message_id INTEGER,
            last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (channel_id) REFERENCES channels(id),
            FOREIGN KEY (dm_id) REFERENCES direct_messages(id),
            UNIQUE(user_id, channel_id, dm_id)
        );
    `);

    // Workspace Join Requests (NEW)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS workspace_join_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(workspace_id, user_id)
        );
    `);

    // ============================================
    // ADVANCED CHANNEL SYSTEM TABLES
    // ============================================

    // Channel Members Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS channel_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            added_by INTEGER NOT NULL,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (added_by) REFERENCES users(id),
            UNIQUE(channel_id, user_id)
        );
    `);

    await db.exec(`CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON channel_members(channel_id);`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_channel_members_user ON channel_members(user_id);`);

    // Notifications Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('dm', 'mention', 'channel_invite', 'system')),
            title TEXT NOT NULL,
            content TEXT,
            link TEXT,
            read BOOLEAN DEFAULT 0,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    await db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);`);

    // Mentions Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS mentions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(message_id, user_id)
        );
    `);

    await db.exec(`CREATE INDEX IF NOT EXISTS idx_mentions_message ON mentions(message_id);`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_mentions_user ON mentions(user_id);`);

    // Add new columns to existing tables
    try { await db.run('ALTER TABLE channels ADD COLUMN is_default BOOLEAN DEFAULT 0'); } catch (e) { }
    try { await db.run('ALTER TABLE channels ADD COLUMN is_private BOOLEAN DEFAULT 0'); } catch (e) { }
    try { await db.run('ALTER TABLE messages ADD COLUMN has_mentions BOOLEAN DEFAULT 0'); } catch (e) { }
    try { await db.run('ALTER TABLE messages ADD COLUMN file_size INTEGER'); } catch (e) { }
    try { await db.run('ALTER TABLE messages ADD COLUMN file_dimensions TEXT'); } catch (e) { }

    console.log('Database initialized.');
    await seedDatabase();
}

async function seedDatabase() {
    const iaam = await db.get('SELECT * FROM workspaces WHERE slug = ?', 'iaam');

    if (!iaam) {
        console.log('Seeding IAAM workspace...');
        let adminUser = await db.get('SELECT * FROM users WHERE email = ?', 'admin@iaam.com');
        if (!adminUser) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const result = await db.run(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                ['IAAM Admin', 'admin@iaam.com', hashedPassword]
            );
            adminUser = { id: result.lastID };
        }

        const wsResult = await db.run(
            'INSERT INTO workspaces (name, slug, owner_id) VALUES (?, ?, ?)',
            ['IAAM', 'iaam', adminUser.id]
        );
        const workspace = await db.get('SELECT id FROM workspaces WHERE slug = ?', 'iaam');

        await db.run(
            'INSERT INTO workspace_users (workspace_id, user_id, role, permissions) VALUES (?, ?, ?, ?)',
            [workspace.id, adminUser.id, 'admin', 'read,write,delete,manage']
        );

        // Create channels - mark general as default
        const generalResult = await db.run('INSERT INTO channels (workspace_id, name, created_by, is_default) VALUES (?, ?, ?, ?)', [workspace.id, 'general', adminUser.id, 1]);
        await db.run('INSERT INTO channels (workspace_id, name, created_by) VALUES (?, ?, ?)', [workspace.id, 'random', adminUser.id]);

        // Add admin to general channel
        await db.run('INSERT INTO channel_members (channel_id, user_id, added_by) VALUES (?, ?, ?)', [generalResult.lastID, adminUser.id, adminUser.id]);
    }

    // Migrate existing workspace members to channel_members if not already done
    const existingMembers = await db.get('SELECT COUNT(*) as count FROM channel_members');
    if (existingMembers.count === 0 || existingMembers.count < 2) {
        console.log('Migrating existing workspace members to channels...');
        await db.exec(`
            INSERT OR IGNORE INTO channel_members (channel_id, user_id, added_by, added_at)
            SELECT 
                c.id as channel_id,
                wu.user_id,
                wu.user_id as added_by,
                wu.joined_at as added_at
            FROM workspace_users wu
            CROSS JOIN channels c
            WHERE c.workspace_id = wu.workspace_id
        `);
        console.log('Migration complete.');
    }
}

function getDb() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase first.');
    }
    return db;
}

module.exports = {
    initializeDatabase,
    getDb
};
