#!/bin/bash

# Script rápido para resetar via Railway (one-liner)
# Uso: ./quick_reset.sh

echo "🚨 RESET RÁPIDO - Todos os dados serão deletados!"
echo "Pressione Ctrl+C para cancelar ou Enter para continuar..."
read

echo "🚀 Executando reset..."

railway run bash -c 'psql $DATABASE_URL << EOF
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

ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS workspaces_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS channels_id_seq RESTART WITH 1;

INSERT INTO users (name, email, password, status) VALUES ('"'"'IAAM Admin'"'"', '"'"'admin@iaam.com'"'"', '"'"'\$2b\$10\$B7vA02cy0t2hMQmGpCh8EuE9HsCdVpje6qHj1wLmaocbZK9gfT6Ue'"'"', '"'"'online'"'"');
INSERT INTO workspaces (name, slug, owner_id) VALUES ('"'"'IAAM'"'"', '"'"'iaam'"'"', 1);
INSERT INTO workspace_users (workspace_id, user_id, role, permissions) VALUES (1, 1, '"'"'admin'"'"', '"'"'read,write,delete,manage'"'"');
INSERT INTO channels (workspace_id, name, created_by, is_default) VALUES (1, '"'"'general'"'"', 1, true), (1, '"'"'random'"'"', 1, false);
INSERT INTO channel_members (channel_id, user_id, added_by) VALUES (1, 1, 1), (2, 1, 1);

SELECT '"'"'✅ Reset concluído!'"'"' as status;
SELECT '"'"'Users'"'"' as tabela, COUNT(*) as total FROM users
UNION ALL SELECT '"'"'Workspaces'"'"', COUNT(*) FROM workspaces
UNION ALL SELECT '"'"'Channels'"'"', COUNT(*) FROM channels;
EOF
'

echo ""
echo "✅ Concluído!"
echo "Login: admin@iaam.com"
echo "Senha: admin123"
