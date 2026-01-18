#!/bin/bash

echo "🚀 Configurando Railway CLI para Deploy do Backend"
echo ""

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "📦 Instalando Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔐 Fazendo login no Railway..."
railway login

echo "📍 Linkando ao projeto..."
echo "Quando solicitado, selecione:"
echo "  - Seu projeto (zorahchat)"
echo "  - Serviço: BACKEND CHAT"
echo ""

cd backend

echo "🔗 Executando link..."
railway link

echo "⚙️ Configurando variáveis de ambiente obrigatórias..."
echo ""
echo "Digite seu JWT_SECRET (ou rode ./generate_jwt_secret.sh):"
read -r JWT_SECRET

railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set NODE_ENV=production
railway variables set PORT=3001

echo ""
echo "✅ Variáveis configuradas!"
echo ""
echo "🚀 Fazendo deploy do backend..."
railway up

echo ""
echo "✅ Deploy concluído!"
echo "Ver logs: railway logs"
echo "Ver status: railway status"
