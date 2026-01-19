# 🗂️ Scripts de Reset do Banco de Dados

Sistema completo para resetar o banco de dados do ZORAH CHAT via Railway.

## 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** | 🚀 Guia rápido - comece aqui! |
| **[RESET_DATABASE.md](RESET_DATABASE.md)** | 📖 Documentação completa |

## 🛠️ Scripts Disponíveis

### Scripts de Execução

| Script | Tamanho | Descrição | Quando Usar |
|--------|---------|-----------|-------------|
| **quick_reset.sh** | 1.7K | Reset rápido (PostgreSQL) | ⚡ Desenvolvimento rápido |
| **reset_railway_db.sh** | 4.5K | Reset completo com detecção de DB | 🏭 Produção/Staging |
| **reset_workspaces_only.sh** | 2.5K | Reset apenas workspaces | 👥 Manter usuários |
| **reset_database.sql** | 3.0K | SQL puro (manual) | 🔧 Execução customizada |

### Scripts de Teste

| Script | Tamanho | Descrição |
|--------|---------|-----------|
| **test_reset.sh** | 3.9K | Valida o reset do banco | ✅ Após qualquer reset |

## 🚀 Início Rápido

### 1. Instalar Railway CLI

```bash
npm install -g @railway/cli
# ou
brew install railway
```

### 2. Fazer Login

```bash
railway login
railway link
```

### 3. Executar Reset

```bash
# Opção 1: Reset rápido (recomendado para dev)
./quick_reset.sh

# Opção 2: Reset completo (recomendado para prod)
./reset_railway_db.sh

# Opção 3: Apenas workspaces
./reset_workspaces_only.sh
```

### 4. Testar

```bash
./test_reset.sh
```

## 📊 O que é Resetado?

### Reset Completo (`quick_reset.sh` ou `reset_railway_db.sh`)

```
✅ Users (usuários)
✅ Workspaces (espaços de trabalho)
✅ Channels (canais)
✅ Messages (mensagens)
✅ Direct Messages (DMs)
✅ Workspace Users (membros)
✅ Channel Members (membros de canais)
✅ Read Receipts (leituras)
✅ Reactions (reações)
✅ Notifications (notificações)
✅ Mentions (menções)
✅ Join Requests (solicitações)
```

### Reset Parcial (`reset_workspaces_only.sh`)

```
✅ Workspaces
✅ Channels
✅ Messages
✅ Direct Messages
✅ Workspace Users
✅ Channel Members
❌ Users (mantidos)
```

## 🎯 Resultado Após Reset

| Item | Valor |
|------|-------|
| **Usuário** | admin@iaam.com |
| **Senha** | admin123 |
| **Workspace** | IAAM (slug: `iaam`) |
| **Canais** | general, random |
| **Role** | admin |
| **Permissões** | read,write,delete,manage |

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!

## 🔍 Comparação de Scripts

### quick_reset.sh
- ✅ Mais rápido
- ✅ Um único comando
- ✅ Ideal para desenvolvimento
- ❌ Apenas PostgreSQL
- ❌ Menos robusto

### reset_railway_db.sh
- ✅ Detecta PostgreSQL/SQLite
- ✅ Mais robusto
- ✅ Melhor para produção
- ✅ Tratamento de erros
- ❌ Um pouco mais lento

### reset_workspaces_only.sh
- ✅ Mantém usuários
- ✅ Útil para testes
- ✅ Preserva logins
- ❌ Apenas PostgreSQL
- ❌ Mais específico

### reset_database.sql
- ✅ SQL puro
- ✅ Portável
- ✅ Customizável
- ❌ Execução manual
- ❌ Requer conhecimento SQL

## 🔐 Segurança

### ✅ Fazer

- Backup antes de resetar produção
- Alterar senha do admin após reset
- Usar em ambiente de desenvolvimento
- Testar após o reset

### ❌ Não Fazer

- Resetar produção sem backup
- Compartilhar scripts com senhas
- Executar sem confirmar ambiente
- Ignorar testes pós-reset

## 🐛 Troubleshooting

```bash
# Railway CLI não encontrado
npm install -g @railway/cli

# Não está logado
railway login

# Permissão negada
chmod +x *.sh

# Ver logs
railway logs

# Testar conexão
railway run psql $DATABASE_URL -c "SELECT 1;"
```

## 📖 Leia Mais

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Comandos rápidos e exemplos
- **[RESET_DATABASE.md](RESET_DATABASE.md)** - Documentação detalhada
- **[Railway Docs](https://docs.railway.app/)** - Documentação oficial do Railway

## 🆘 Suporte

1. Consulte `QUICK_REFERENCE.md` para comandos rápidos
2. Leia `RESET_DATABASE.md` para documentação completa
3. Execute `./test_reset.sh` para validar o estado do banco
4. Verifique os logs: `railway logs`

## 📝 Estrutura de Arquivos

```
ZORAH CHAT/
├── 📄 INDEX_RESET.md              (este arquivo)
├── 📚 QUICK_REFERENCE.md          (guia rápido)
├── 📖 RESET_DATABASE.md           (documentação completa)
├── 🔧 reset_database.sql          (SQL puro)
├── ⚡ quick_reset.sh              (reset rápido)
├── 🏭 reset_railway_db.sh         (reset robusto)
├── 👥 reset_workspaces_only.sh    (reset parcial)
└── ✅ test_reset.sh               (testes)
```

## 🎓 Workflow Recomendado

```bash
# 1. Backup (se necessário)
railway run pg_dump $DATABASE_URL > backup.sql

# 2. Reset
./quick_reset.sh

# 3. Testar
./test_reset.sh

# 4. Verificar na aplicação
# Login: admin@iaam.com / admin123

# 5. Configurar
# - Alterar senha
# - Criar usuários
# - Criar workspaces
```

---

**Criado para:** ZORAH CHAT  
**Versão:** 1.0  
**Data:** 2026-01-19  
**Autor:** Sistema de Reset Automatizado
