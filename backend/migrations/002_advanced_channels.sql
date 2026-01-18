-- Migration: Advanced Channel & Notification System
-- Created: 2026-01-15

-- ============================================
-- 1. CREATE NEW TABLES
-- ============================================

-- Channel Members Table
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

CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX idx_channel_members_user ON channel_members(user_id);

-- Notifications Table
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

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

-- Mentions Table
CREATE TABLE IF NOT EXISTS mentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(message_id, user_id)
);

CREATE INDEX idx_mentions_message ON mentions(message_id);
CREATE INDEX idx_mentions_user ON mentions(user_id);

-- ============================================
-- 2. ALTER EXISTING TABLES
-- ============================================

-- Add columns to channels table
ALTER TABLE channels ADD COLUMN is_default BOOLEAN DEFAULT 0;
ALTER TABLE channels ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE channels ADD COLUMN description TEXT;
ALTER TABLE channels ADD COLUMN is_private BOOLEAN DEFAULT 0;

-- Add columns to messages table
ALTER TABLE messages ADD COLUMN has_mentions BOOLEAN DEFAULT 0;
ALTER TABLE messages ADD COLUMN file_size INTEGER;
ALTER TABLE messages ADD COLUMN file_dimensions TEXT;

-- ============================================
-- 3. MIGRATE EXISTING DATA
-- ============================================

-- Set first channel in each workspace as default
UPDATE channels 
SET is_default = 1 
WHERE id IN (
    SELECT MIN(id) 
    FROM channels 
    GROUP BY workspace_id
);

-- Migrate all existing workspace members to their workspace channels
-- This ensures backward compatibility
INSERT INTO channel_members (channel_id, user_id, added_by, added_at)
SELECT 
    c.id as channel_id,
    wu.user_id,
    wu.user_id as added_by,
    wu.joined_at as added_at
FROM workspace_users wu
CROSS JOIN channels c
WHERE c.workspace_id = wu.workspace_id
ON CONFLICT(channel_id, user_id) DO NOTHING;

-- ============================================
-- 4. CREATE VIEWS FOR CONVENIENCE
-- ============================================

-- View: Channel with member count
CREATE VIEW IF NOT EXISTS channel_stats AS
SELECT 
    c.*,
    COUNT(DISTINCT cm.user_id) as member_count,
    u.username as created_by_username
FROM channels c
LEFT JOIN channel_members cm ON c.id = cm.channel_id
LEFT JOIN users u ON c.created_by = u.id
GROUP BY c.id;

-- View: Unread notifications per user
CREATE VIEW IF NOT EXISTS unread_notification_counts AS
SELECT 
    user_id,
    COUNT(*) as unread_count
FROM notifications
WHERE read = 0
GROUP BY user_id;
