ALTER TABLE messages RENAME TO messages_old;
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
);
INSERT INTO messages (id, channel_id, dm_id, user_id, content, attachment_url, attachment_type, attachment_name, edited_at, deleted_at, created_at)
SELECT id, channel_id, dm_id, user_id, content, attachment_url, attachment_type, attachment_name, edited_at, deleted_at, created_at
FROM messages_old;
DROP TABLE messages_old;
