#!/bin/bash

# Script de setup - Configura tudo automaticamente
# Uso: ./setup_reset_tools.sh

echo "🔧 Configurando ferramentas de reset do banco de dados..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Verificar Railway CLI
echo "1️⃣ Verificando Railway CLI..."
if command -v railway &> /dev/null; then
    echo -e "   ${GREEN}✓ Railway CLI já instalado${NC}"
else
    echo -e "   ${YELLOW}⚠ Railway CLI não encontrado${NC}"
    echo "   Instalando via npm..."
    npm install -g @railway/cli
    if [ $? -eq 0 ]; then
        echo -e "   ${GREEN}✓ Railway CLI instalado com sucesso${NC}"
    else
        echo "   ❌ Falha ao instalar. Tente manualmente:"
        echo "      npm install -g @railway/cli"
        echo "      ou"
        echo "      brew install railway"
        exit 1
    fi
fi

echo ""

# 2. Tornar scripts executáveis
echo "2️⃣ Tornando scripts executáveis..."
chmod +x quick_reset.sh
chmod +x reset_railway_db.sh
chmod +x reset_workspaces_only.sh
chmod +x test_reset.sh
echo -e "   ${GREEN}✓ Permissões configuradas${NC}"

echo ""

# 3. Verificar login no Railway
echo "3️⃣ Verificando login no Railway..."
if railway whoami &> /dev/null; then
    USER=$(railway whoami)
    echo -e "   ${GREEN}✓ Logado como: $USER${NC}"
else
    echo -e "   ${YELLOW}⚠ Não está logado no Railway${NC}"
    echo "   Execute: railway login"
    echo ""
    read -p "   Deseja fazer login agora? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        railway login
    fi
fi

echo ""

# 4. Verificar projeto linkado
echo "4️⃣ Verificando projeto Railway..."
if railway status &> /dev/null; then
    echo -e "   ${GREEN}✓ Projeto linkado${NC}"
    railway status
else
    echo -e "   ${YELLOW}⚠ Nenhum projeto linkado${NC}"
    echo "   Execute: railway link"
    echo ""
    read -p "   Deseja linkar um projeto agora? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        railway link
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Setup concluído!${NC}"
echo ""
echo "📚 Próximos passos:"
echo ""
echo "  1. Leia a documentação:"
echo "     cat INDEX_RESET.md"
echo ""
echo "  2. Execute um reset:"
echo "     ./quick_reset.sh"
echo ""
echo "  3. Teste o resultado:"
echo "     ./test_reset.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
