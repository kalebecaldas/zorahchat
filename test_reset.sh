#!/bin/bash

# Script de teste para verificar o banco após reset
# Uso: ./test_reset.sh

echo "🧪 Testando estado do banco de dados..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar
test_query() {
    local description=$1
    local query=$2
    local expected=$3
    
    echo -n "  Testing: $description... "
    
    result=$(railway run psql $DATABASE_URL -t -c "$query" 2>/dev/null | tr -d ' ')
    
    if [ "$result" == "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (expected: $expected, got: $result)"
        return 1
    fi
}

# Verificar se Railway CLI está disponível
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI não encontrado!${NC}"
    exit 1
fi

echo "📊 Contagem de Registros:"
echo ""

# Testes básicos
test_query "1 usuário criado" "SELECT COUNT(*) FROM users;" "1"
test_query "1 workspace criado" "SELECT COUNT(*) FROM workspaces;" "1"
test_query "2 canais criados" "SELECT COUNT(*) FROM channels;" "2"
test_query "1 workspace_user" "SELECT COUNT(*) FROM workspace_users;" "1"
test_query "2 channel_members" "SELECT COUNT(*) FROM channel_members;" "2"

echo ""
echo "👤 Verificando Usuário Admin:"
echo ""

test_query "Email correto" "SELECT email FROM users WHERE id=1;" "admin@iaam.com"
test_query "Nome correto" "SELECT name FROM users WHERE id=1;" "IAAMAdmin"
test_query "Status online" "SELECT status FROM users WHERE id=1;" "online"

echo ""
echo "🏢 Verificando Workspace:"
echo ""

test_query "Nome IAAM" "SELECT name FROM workspaces WHERE id=1;" "IAAM"
test_query "Slug iaam" "SELECT slug FROM workspaces WHERE id=1;" "iaam"
test_query "Owner correto" "SELECT owner_id FROM workspaces WHERE id=1;" "1"

echo ""
echo "📢 Verificando Canais:"
echo ""

test_query "Canal general existe" "SELECT COUNT(*) FROM channels WHERE name='general';" "1"
test_query "Canal random existe" "SELECT COUNT(*) FROM channels WHERE name='random';" "1"
test_query "General é default" "SELECT is_default FROM channels WHERE name='general';" "t"

echo ""
echo "🔐 Verificando Permissões:"
echo ""

test_query "Role admin" "SELECT role FROM workspace_users WHERE user_id=1;" "admin"
test_query "Tem permissões" "SELECT permissions FROM workspace_users WHERE user_id=1;" "read,write,delete,manage"

echo ""
echo "🧹 Verificando Limpeza:"
echo ""

test_query "Sem mensagens antigas" "SELECT COUNT(*) FROM messages;" "0"
test_query "Sem DMs antigas" "SELECT COUNT(*) FROM direct_messages;" "0"
test_query "Sem notificações antigas" "SELECT COUNT(*) FROM notifications;" "0"
test_query "Sem reações antigas" "SELECT COUNT(*) FROM message_reactions;" "0"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Resumo final
echo "📋 Resumo do Banco:"
railway run psql $DATABASE_URL << 'EOF'
SELECT 
    'Users' as "Tabela",
    COUNT(*) as "Total",
    '👤' as "Icon"
FROM users
UNION ALL
SELECT 'Workspaces', COUNT(*), '🏢' FROM workspaces
UNION ALL
SELECT 'Channels', COUNT(*), '📢' FROM channels
UNION ALL
SELECT 'Messages', COUNT(*), '💬' FROM messages
UNION ALL
SELECT 'Workspace Users', COUNT(*), '👥' FROM workspace_users
UNION ALL
SELECT 'Channel Members', COUNT(*), '🔗' FROM channel_members;
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Teste de login (opcional)
echo "🔐 Credenciais de Login:"
echo ""
echo "  Email: admin@iaam.com"
echo "  Senha: admin123"
echo ""

# Verificar hash da senha
echo "🔑 Verificando hash da senha:"
railway run psql $DATABASE_URL -c "SELECT LEFT(password, 20) || '...' as password_hash FROM users WHERE id=1;"

echo ""
echo -e "${GREEN}✅ Testes concluídos!${NC}"
