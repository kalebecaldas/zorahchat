#!/bin/bash

# Script para gerar JWT Secret seguro para o Railway

echo "🔐 Gerando JWT Secret seguro..."
echo ""

# Gerar um secret aleatório de 64 bytes em base64
SECRET=$(openssl rand -base64 64 | tr -d '\n')

echo "Seu JWT_SECRET seguro:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANTE:"
echo "1. Copie este secret e guarde em local seguro"
echo "2. Use este valor na variável JWT_SECRET no Railway"
echo "3. NUNCA commit este valor no Git"
echo "4. Troque este secret em produção periodicamente"
echo ""
echo "Para copiar automaticamente (macOS):"
echo "echo '$SECRET' | pbcopy"
echo ""
