#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   ZORAH CHAT - Verificação de Deploy para Railway${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"

# Check if required files exist
echo -e "${YELLOW}[1/6] Verificando arquivos necessários...${NC}"

files_ok=true

check_file() {
    if [ -f "$1" ]; then
        echo -e "  ${GREEN}✓${NC} $1"
    else
        echo -e "  ${RED}✗${NC} $1 ${RED}(FALTANDO)${NC}"
        files_ok=false
    fi
}

check_file "backend/package.json"
check_file "backend/index.js"
check_file "backend/.env.example"
check_file "backend/railway.json"
check_file "frontend/package.json"
check_file "frontend/railway.json"
check_file "frontend/.env.example"
check_file ".gitignore"
check_file "RAILWAY_DEPLOY.md"

# Check if .env files are ignored
echo -e "\n${YELLOW}[2/6] Verificando .gitignore...${NC}"
if grep -q ".env" .gitignore && grep -q "node_modules" .gitignore; then
    echo -e "  ${GREEN}✓${NC} .gitignore configurado corretamente"
else
    echo -e "  ${RED}✗${NC} .gitignore pode estar incompleto"
fi

# Check package.json scripts
echo -e "\n${YELLOW}[3/6] Verificando scripts de deploy...${NC}"

if grep -q '"start"' backend/package.json; then
    echo -e "  ${GREEN}✓${NC} Backend tem script 'start'"
else
    echo -e "  ${RED}✗${NC} Backend NÃO tem script 'start'"
    files_ok=false
fi

if grep -q '"build"' frontend/package.json && grep -q '"start"' frontend/package.json; then
    echo -e "  ${GREEN}✓${NC} Frontend tem scripts 'build' e 'start'"
else
    echo -e "  ${RED}✗${NC} Frontend falta scripts necessários"
    files_ok=false
fi

# Check dependencies
echo -e "\n${YELLOW}[4/6] Verificando dependências...${NC}"

if [ -f "backend/package.json" ]; then
    if grep -q '"dotenv"' backend/package.json; then
        echo -e "  ${GREEN}✓${NC} Backend tem dotenv instalado"
    else
        echo -e "  ${RED}✗${NC} Backend NÃO tem dotenv"
        files_ok=false
    fi
fi

# Check if node_modules are ignored
echo -e "\n${YELLOW}[5/6] Verificando node_modules...${NC}"
if [ -d "backend/node_modules" ] || [ -d "frontend/node_modules" ]; then
    echo -e "  ${YELLOW}⚠${NC} node_modules encontrado (certifique-se que está no .gitignore)"
else
    echo -e "  ${GREEN}✓${NC} node_modules não rastreado"
fi

# Check environment variables template
echo -e "\n${YELLOW}[6/6] Verificando templates de variáveis de ambiente...${NC}"

if [ -f "backend/.env.example" ]; then
    if grep -q "JWT_SECRET" backend/.env.example && grep -q "FRONTEND_URL" backend/.env.example; then
        echo -e "  ${GREEN}✓${NC} Backend .env.example completo"
    else
        echo -e "  ${RED}✗${NC} Backend .env.example incompleto"
        files_ok=false
    fi
fi

if [ -f "frontend/.env.example" ]; then
    if grep -q "VITE_API_URL" frontend/.env.example; then
        echo -e "  ${GREEN}✓${NC} Frontend .env.example completo"
    else
        echo -e "  ${RED}✗${NC} Frontend .env.example incompleto"
        files_ok=false
    fi
fi

# Final summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
if [ "$files_ok" = true ]; then
    echo -e "${GREEN}✓ Sistema pronto para deploy no Railway!${NC}\n"
    echo -e "${BLUE}Próximos passos:${NC}"
    echo "1. Faça commit de todos os arquivos"
    echo "2. Push para o repositório Git"
    echo "3. Siga as instruções em RAILWAY_DEPLOY.md"
    echo -e "\n${YELLOW}Comandos úteis:${NC}"
    echo "  git add ."
    echo "  git commit -m \"Preparar sistema para deploy no Railway\""
    echo "  git push origin main"
else
    echo -e "${RED}✗ Alguns arquivos ou configurações estão faltando${NC}"
    echo "Por favor, corrija os itens marcados acima"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"
