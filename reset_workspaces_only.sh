#!/bin/bash

# Script para resetar APENAS workspaces (mantém usuários)
# Uso: ./reset_workspaces_only.sh

echo "🔄 RESET DE WORKSPACES - Usuários serão mantidos"
echo "Pressione Ctrl+C para cancelar ou Enter para continuar..."
read

echo "🚀 Executando reset de workspaces..."

railway run bash -c 'psql $DATABASE_URL << EOF
-- Deletar apenas dados relacionados a workspaces
DELETE FROM mentions;
DELETE FROM notifications WHERE type IN ('"'"'channel_invite'"'"', '"'"'mention'"'"');
DELETE FROM channel_members;
DELETE FROM workspace_join_requests;
DELETE FROM read_receipts;
DELETE FROM message_reactions;
DELETE FROM messages;
DELETE FROM direct_messages;
DELETE FROM channels;
DELETE FROM workspace_users;
DELETE FROM workspaces;

-- Resetar sequences de workspaces
ALTER SEQUENCE IF EXISTS workspaces_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS channels_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS messages_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS direct_messages_id_seq RESTART WITH 1;

-- Pegar o ID do usuário admin
DO \$\$
DECLARE
    admin_id INTEGER;
BEGIN
    SELECT id INTO admin_id FROM users WHERE email = '"'"'admin@iaam.com'"'"' LIMIT 1;
    
    IF admin_id IS NULL THEN
        -- Se não existe admin, pegar o primeiro usuário
        SELECT id INTO admin_id FROM users ORDER BY id LIMIT 1;
    END IF;
    
    IF admin_id IS NOT NULL THEN
        -- Recriar workspace IAAM
        INSERT INTO workspaces (name, slug, owner_id) VALUES ('"'"'IAAM'"'"', '"'"'iaam'"'"', admin_id);
        
        -- Adicionar admin ao workspace
        INSERT INTO workspace_users (workspace_id, user_id, role, permissions) 
        VALUES (1, admin_id, '"'"'admin'"'"', '"'"'read,write,delete,manage'"'"');
        
        -- Criar canais
        INSERT INTO channels (workspace_id, name, created_by, is_default) 
        VALUES (1, '"'"'general'"'"', admin_id, true), (1, '"'"'random'"'"', admin_id, false);
        
        -- Adicionar admin aos canais
        INSERT INTO channel_members (channel_id, user_id, added_by) 
        VALUES (1, admin_id, admin_id), (2, admin_id, admin_id);
    END IF;
END \$\$;

SELECT '"'"'✅ Reset de workspaces concluído!'"'"' as status;
SELECT '"'"'Users (mantidos)'"'"' as tabela, COUNT(*) as total FROM users
UNION ALL SELECT '"'"'Workspaces (resetados)'"'"', COUNT(*) FROM workspaces
UNION ALL SELECT '"'"'Channels (resetados)'"'"', COUNT(*) FROM channels;
EOF
'

echo ""
echo "✅ Workspaces resetados com sucesso!"
echo "👥 Usuários foram mantidos"
echo "🏢 Workspace IAAM recriado"
