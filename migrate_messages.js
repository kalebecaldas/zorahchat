const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'backend/database.sqlite');
const db = new sqlite3.Database(dbPath);

const migrate = () => {
    db.serialize(() => {
        // 1. Rename old table
        db.run("ALTER TABLE messages RENAME TO messages_old");

        // 2. Create new table with correct schema (channel_id nullable)
        db.run(`
            CREATE TABLE messages (
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
            )
        `);

        // 3. Copy data
        // Note: The columns must match. We map the old columns to the new ones.
        // Old schema had: id, channel_id, user_id, content, created_at, dm_id, attachment...
        db.run(`
            INSERT INTO messages (id, channel_id, dm_id, user_id, content, attachment_url, attachment_type, attachment_name, edited_at, deleted_at, created_at)
            SELECT id, channel_id, dm_id, user_id, content, attachment_url, attachment_type, attachment_name, edited_at, deleted_at, created_at
            FROM messages_old
        `);

        // 4. Drop old table
        db.run("DROP TABLE messages_old");

        console.log("Migration completed successfully.");
    });
};

migrate();
