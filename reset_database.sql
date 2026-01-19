-- Script para resetar tabelas de users e workspaces
-- Execute via SSH no Railway: psql $DATABASE_URL < reset_database.sql
-- Ou para SQLite: sqlite3 database.sqlite < reset_database.sql

-- ATENÇÃO: Este script vai DELETAR TODOS OS DADOS!

-- 1. Deletar dados relacionados (ordem importa por causa das foreign keys)
DELETE FROM mentions;
DELETE FROM notifications;
DELETE FROM channel_members;
DELETE FROM workspace_join_requests;
DELETE FROM read_receipts;
DELETE FROM message_reactions;
DELETE FROM messages;
DELETE FROM direct_messages;
DELETE FROM channels;
DELETE FROM workspace_users;
DELETE FROM workspaces;
DELETE FROM users;

-- 2. Resetar sequences (apenas para PostgreSQL)
-- Para SQLite, o AUTOINCREMENT reseta automaticamente quando a tabela está vazia
-- Descomente as linhas abaixo se estiver usando PostgreSQL:
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;
-- ALTER SEQUENCE workspaces_id_seq RESTART WITH 1;
-- ALTER SEQUENCE channels_id_seq RESTART WITH 1;
-- ALTER SEQUENCE messages_id_seq RESTART WITH 1;
-- ALTER SEQUENCE direct_messages_id_seq RESTART WITH 1;
-- ALTER SEQUENCE workspace_users_id_seq RESTART WITH 1;
-- ALTER SEQUENCE channel_members_id_seq RESTART WITH 1;
-- ALTER SEQUENCE read_receipts_id_seq RESTART WITH 1;
-- ALTER SEQUENCE message_reactions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
-- ALTER SEQUENCE mentions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE workspace_join_requests_id_seq RESTART WITH 1;

-- 3. Recriar usuário admin (senha: admin123)
-- Hash bcrypt da senha 'admin123'
INSERT INTO users (name, email, password, status, created_at) 
VALUES (
    'IAAM Admin', 
    'admin@iaam.com', 
    '$2b$10$B7vA02cy0t2hMQmGpCh8EuE9HsCdVpje6qHj1wLmaocbZK9gfT6Ue',
    'online',
    CURRENT_TIMESTAMP
);

-- 4. Recriar workspace IAAM
INSERT INTO workspaces (name, slug, description, owner_id, created_at)
VALUES (
    'IAAM',
    'iaam',
    'Workspace padrão do sistema',
    1,
    CURRENT_TIMESTAMP
);

-- 5. Adicionar admin ao workspace
INSERT INTO workspace_users (workspace_id, user_id, role, permissions, joined_at)
VALUES (
    1,
    1,
    'admin',
    'read,write,delete,manage',
    CURRENT_TIMESTAMP
);

-- 6. Criar canais padrão
INSERT INTO channels (workspace_id, name, description, type, created_by, is_default, is_private, created_at)
VALUES 
    (1, 'general', 'Canal geral para discussões', 'public', 1, true, false, CURRENT_TIMESTAMP),
    (1, 'random', 'Canal para conversas aleatórias', 'public', 1, false, false, CURRENT_TIMESTAMP);

-- 7. Adicionar admin aos canais
INSERT INTO channel_members (channel_id, user_id, added_by, added_at)
VALUES 
    (1, 1, 1, CURRENT_TIMESTAMP),
    (2, 1, 1, CURRENT_TIMESTAMP);

-- Verificar resultado
SELECT 'Users:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Workspaces:', COUNT(*) FROM workspaces
UNION ALL
SELECT 'Channels:', COUNT(*) FROM channels
UNION ALL
SELECT 'Workspace Users:', COUNT(*) FROM workspace_users
UNION ALL
SELECT 'Channel Members:', COUNT(*) FROM channel_members;
