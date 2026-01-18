# ⚡ Comandos Rápidos - ZORAH CHAT

## 🔍 Verificação

```bash
# Verificar se está tudo pronto para deploy
./check_deploy.sh
```

## 🔐 Segurança

```bash
# Gerar JWT Secret seguro
./generate_jwt_secret.sh

# Gerar secret e copiar para clipboard (macOS)
./generate_jwt_secret.sh && openssl rand -base64 64 | tr -d '\n' | pbcopy
```

## 🚀 Desenvolvimento Local

```bash
# Iniciar sistema completo (backend + frontend)
./start_system.sh

# Ou manualmente:

# Backend
cd backend && npm install && npm run dev

# Frontend (em outro terminal)
cd frontend && npm install && npm run dev
```

## 📦 Git - Preparar para Deploy

```bash
# Ver status
git status

# Adicionar todos os arquivos
git add .

# Commit
git commit -m "Preparar sistema para deploy no Railway"

# Criar branch main (se necessário)
git branch -M main

# Adicionar remote (substitua pela sua URL)
git remote add origin https://github.com/seu-usuario/zorah-chat.git

# Push
git push -u origin main
```

## 🌐 Railway CLI (Opcional)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Linkar projeto
railway link

# Ver logs em tempo real
railway logs

# Adicionar variável de ambiente
railway variables set JWT_SECRET=seu_secret_aqui

# Ver variáveis configuradas
railway variables

# Abrir no navegador
railway open
```

## 🧪 Testes Pós-Deploy

```bash
# Testar healthcheck do backend
curl https://seu-backend.railway.app/health

# Testar API com formatação
curl -s https://seu-backend.railway.app/health | python3 -m json.tool

# Testar autenticação (registrar usuário)
curl -X POST https://seu-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"123456"}'

# Testar login
curl -X POST https://seu-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

## 🔧 Manutenção

```bash
# Ver estrutura do projeto
tree -L 2 -I 'node_modules'

# Limpar node_modules
rm -rf backend/node_modules frontend/node_modules

# Reinstalar dependências
cd backend && npm install
cd ../frontend && npm install

# Atualizar dependências (cuidado!)
cd backend && npm update
cd ../frontend && npm update

# Ver tamanho do projeto
du -sh .
du -sh backend/ frontend/

# Encontrar arquivos grandes
find . -type f -size +1M -not -path "*/node_modules/*"
```

## 📊 Logs e Debug

```bash
# Ver logs do backend localmente
tail -f backend/logs/*.log

# Monitorar conexões em tempo real
watch -n 2 'curl -s http://localhost:3001/health'

# Ver processos Node rodando
ps aux | grep node

# Matar todos os processos Node (cuidado!)
pkill -f node
```

## 🗄️ Banco de Dados

```bash
# Backup do banco SQLite
cp backend/database.sqlite backend/database.backup.$(date +%Y%m%d_%H%M%S).sqlite

# Ver tamanho do banco
ls -lh backend/database.sqlite

# Acessar banco SQLite (para debug)
sqlite3 backend/database.sqlite

# Comandos úteis no SQLite:
# .tables - listar tabelas
# .schema users - ver estrutura da tabela users
# SELECT COUNT(*) FROM messages; - contar mensagens
# .quit - sair
```

## 🧹 Limpeza

```bash
# Remover arquivos temporários
find . -name ".DS_Store" -delete
find . -name "*.log" -delete

# Limpar uploads (cuidado!)
rm -rf backend/uploads/*
touch backend/uploads/.gitkeep

# Limpar banco de dados (MUITO CUIDADO!)
rm backend/database.sqlite
# O banco será recriado automaticamente na próxima execução
```

## 📚 Documentação

```bash
# Abrir documentação principal
open README.md

# Abrir guia de deploy
open RAILWAY_DEPLOY.md

# Abrir checklist
open DEPLOY_CHECKLIST.md

# Ver resumo
cat PREPARACAO_COMPLETA.md
```

## 🚨 Troubleshooting Rápido

```bash
# Porta 3001 já em uso?
lsof -ti:3001 | xargs kill -9

# Porta 5173 já em uso?
lsof -ti:5173 | xargs kill -9

# Verificar se backend está respondendo
curl http://localhost:3001/health

# Verificar se frontend está rodando
curl http://localhost:5173

# Reinstalar tudo do zero
rm -rf backend/node_modules frontend/node_modules
cd backend && npm install
cd ../frontend && npm install
./start_system.sh
```

## 🎨 Produtividade

```bash
# Criar alias úteis (adicione ao ~/.zshrc ou ~/.bashrc)
alias zorah-start="cd /Users/kalebecaldas/Downloads/ZORAH\ CHAT && ./start_system.sh"
alias zorah-check="cd /Users/kalebecaldas/Downloads/ZORAH\ CHAT && ./check_deploy.sh"
alias zorah-deploy="cd /Users/kalebecaldas/Downloads/ZORAH\ CHAT && git add . && git commit -m 'Update' && git push"

# Recarregar aliases
source ~/.zshrc  # ou source ~/.bashrc
```

## 📦 Variáveis de Ambiente

```bash
# Backend - criar .env a partir do exemplo
cd backend
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Frontend - criar .env a partir do exemplo
cd frontend
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

## 🔄 Atualização Rápida

```bash
# Puxar últimas mudanças
git pull origin main

# Reinstalar dependências se package.json mudou
cd backend && npm install
cd ../frontend && npm install

# Restart
./start_system.sh
```

---

**💡 Dica:** Salve este arquivo nos favoritos para referência rápida!
