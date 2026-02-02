#!/bin/bash
# Script de verificação do build para Railway

echo "=== VERIFICAÇÃO DO BUILD ==="
echo ""

# #region agent log - H2: Verificar se build rodou
echo "[H2] PWD atual: $(pwd)"
echo "[H2] Conteúdo do diretório atual:"
ls -la
echo ""

echo "[H2] Verificando se dist/ existe:"
if [ -d "dist" ]; then
  echo "✓ dist/ encontrado"
  echo "[H2] Conteúdo de dist/:"
  ls -la dist/
  echo ""
  
  echo "[H2] Conteúdo de dist/assets/:"
  if [ -d "dist/assets" ]; then
    ls -la dist/assets/
  else
    echo "✗ dist/assets/ NÃO encontrado!"
  fi
else
  echo "✗ dist/ NÃO encontrado!"
fi
echo ""

# #region agent log - H3: Verificar index.html
echo "[H3] Verificando index.html:"
if [ -f "dist/index.html" ]; then
  echo "✓ dist/index.html encontrado"
  echo "[H3] Primeiras linhas do index.html:"
  head -30 dist/index.html
else
  echo "✗ dist/index.html NÃO encontrado!"
fi
echo ""

# #region agent log - H5: Verificar Caddyfile
echo "[H1/H5] Verificando Caddyfile:"
if [ -f "Caddyfile" ]; then
  echo "✓ Caddyfile encontrado"
  echo "[H1] Conteúdo do Caddyfile:"
  cat Caddyfile
else
  echo "✗ Caddyfile NÃO encontrado!"
fi
echo ""

echo "=== FIM DA VERIFICAÇÃO ==="
