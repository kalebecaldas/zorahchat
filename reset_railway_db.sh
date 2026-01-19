#!/bin/bash

# Script para resetar o banco de dados via SSH no Railway
# Uso: ./reset_railway_db.sh

set -e  # Sair em caso de erro

echo "🚨 ATENÇÃO: Este script vai DELETAR TODOS OS DADOS do banco!"
echo "Pressione Ctrl+C para cancelar ou Enter para continuar..."
read

echo "📡 Conectando ao Railway..."

# Verifica se o Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado!"
    echo "Instale com: npm install -g @railway/cli"
    echo "Ou use: brew install railway"
    exit 1
fi

# Verifica se está logado no Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Você não está logado no Railway!"
    echo "Execute: railway login"
    exit 1
fi

echo "🔍 Detectando tipo de banco de dados..."

# Pega a DATABASE_URL do Railway
DATABASE_URL=$(railway variables get DATABASE_URL 2>/dev/null || echo "")

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não encontrada!"
    echo "Certifique-se de que o projeto Railway está selecionado."
    exit 1
fi

# Detecta se é PostgreSQL ou SQLite
if [[ $DATABASE_URL == postgres* ]]; then
    echo "✅ PostgreSQL detectado"
    DB_TYPE="postgres"
else
    echo "✅ SQLite detectado"
    DB_TYPE="sqlite"
fi

# Cria versão do script SQL apropriada
if [ "$DB_TYPE" = "postgres" ]; then
    echo "📝 Preparando script para PostgreSQL..."
    
    # Cria versão PostgreSQL do script
    cat > /tmp/reset_db_railway.sql << 'EOF'
-- Reset completo do banco de dados PostgreSQL

-- Deletar dados (ordem importa por foreign keys)
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

-- Resetar sequences
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS workspaces_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS channels_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS messages_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS direct_messages_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS message_reactions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS mentions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS workspace_join_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS read_receipts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS channel_members_id_seq RESTART WITH 1;

-- Recriar admin (senha: admin123)
INSERT INTO users (name, email, password, status, created_at) 
VALUES (
    'IAAM Admin', 
    'admin@iaam.com', 
    '$2b$10$B7vA02cy0t2hMQmGpCh8EuE9HsCdVpje6qHj1wLmaocbZK9gfT6Ue',
    'online',
    CURRENT_TIMESTAMP
);

-- Recriar workspace IAAM
INSERT INTO workspaces (name, slug, description, owner_id, created_at)
VALUES (
    'IAAM',
    'iaam',
    'Workspace padrão do sistema',
    1,
    CURRENT_TIMESTAMP
);

-- Adicionar admin ao workspace
INSERT INTO workspace_users (workspace_id, user_id, role, permissions, joined_at)
VALUES (
    1,
    1,
    'admin',
    'read,write,delete,manage',
    CURRENT_TIMESTAMP
);

-- Criar canais padrão
INSERT INTO channels (workspace_id, name, description, type, created_by, is_default, is_private, created_at)
VALUES 
    (1, 'general', 'Canal geral', 'public', 1, true, false, CURRENT_TIMESTAMP),
    (1, 'random', 'Canal aleatório', 'public', 1, false, false, CURRENT_TIMESTAMP);

-- Adicionar admin aos canais
INSERT INTO channel_members (channel_id, user_id, added_by, added_at)
VALUES 
    (1, 1, 1, CURRENT_TIMESTAMP),
    (2, 1, 1, CURRENT_TIMESTAMP);

-- Verificar
SELECT 'Users' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'Workspaces', COUNT(*) FROM workspaces
UNION ALL
SELECT 'Channels', COUNT(*) FROM channels;
EOF

    echo "🚀 Executando reset no PostgreSQL..."
    railway run psql $DATABASE_URL < /tmp/reset_db_railway.sql
    
else
    echo "📝 Preparando script para SQLite..."
    
    # Para SQLite, usa o script original
    echo "🚀 Executando reset no SQLite..."
    railway run sqlite3 /app/data/database.sqlite < reset_database.sql
fi

echo ""
echo "✅ Reset concluído com sucesso!"
echo ""
echo "📊 Dados criados:"
echo "  - Usuário: admin@iaam.com"
echo "  - Senha: admin123"
echo "  - Workspace: IAAM (slug: iaam)"
echo "  - Canais: general, random"
echo ""
echo "🔐 IMPORTANTE: Altere a senha do admin após o primeiro login!"

# Limpar arquivo temporário
rm -f /tmp/reset_db_railway.sql
