# 🔄 Reset de Banco de Dados - Railway

Scripts para resetar as tabelas de **users** e **workspaces** no banco de dados do Railway.

## ⚠️ ATENÇÃO

**Estes scripts vão DELETAR TODOS OS DADOS do banco de dados!** Use apenas em ambiente de desenvolvimento ou quando realmente necessário.

## 📋 O que será resetado

- ✅ **Users** (usuários e logins)
- ✅ **Workspaces** (espaços de trabalho)
- ✅ **Channels** (canais)
- ✅ **Messages** (mensagens)
- ✅ **Direct Messages** (mensagens diretas)
- ✅ **Workspace Users** (membros dos workspaces)
- ✅ **Channel Members** (membros dos canais)
- ✅ **Read Receipts** (marcações de leitura)
- ✅ **Reactions** (reações)
- ✅ **Notifications** (notificações)
- ✅ **Mentions** (menções)
- ✅ **Join Requests** (solicitações de entrada)

## 🚀 Métodos de Execução

### Método 1: Reset Rápido (Mais Fácil) ⚡

```bash
# Reset completo com um comando
./quick_reset.sh
```

**Vantagens:**
- ✅ Não precisa de arquivos SQL separados
- ✅ Execução em um único comando
- ✅ Ideal para desenvolvimento rápido

### Método 2: Script Automatizado (Recomendado para Produção)

```bash
# Execute o script shell completo
./reset_railway_db.sh
```

Este script:
- ✅ Detecta automaticamente se é PostgreSQL ou SQLite
- ✅ Pede confirmação antes de executar
- ✅ Usa o Railway CLI para executar remotamente
- ✅ Mostra o resultado da operação

### Método 3: Reset Apenas Workspaces (Mantém Usuários) 👥

```bash
# Reseta workspaces mas mantém os usuários
./reset_workspaces_only.sh
```

**Útil quando:**
- ✅ Você quer limpar os workspaces
- ✅ Mas manter os usuários cadastrados
- ✅ Preservar logins existentes

**Pré-requisitos para todos os métodos:**
```bash
# Instalar Railway CLI
npm install -g @railway/cli
# ou
brew install railway

# Fazer login
railway login

# Selecionar o projeto
railway link
```

### Método 4: SSH Direto no Railway

```bash
# 1. Conectar via SSH
railway shell

# 2. Se PostgreSQL:
psql $DATABASE_URL < /app/reset_database.sql

# 3. Se SQLite:
sqlite3 /app/data/database.sqlite < /app/reset_database.sql
```

### Método 3: Via Railway Dashboard

1. Acesse o Railway Dashboard
2. Vá em **Database** → **Query**
3. Cole o conteúdo de `reset_database.sql`
4. Execute a query

### Método 4: Localmente (Desenvolvimento)

```bash
# Se estiver usando SQLite local
sqlite3 backend/database.sqlite < reset_database.sql

# Se estiver usando PostgreSQL local
psql seu_database < reset_database.sql
```

## 📊 Dados Criados Após Reset

Após o reset, o banco terá:

| Item | Valor |
|------|-------|
| **Usuário Admin** | admin@iaam.com |
| **Senha** | admin123 |
| **Workspace** | IAAM (slug: `iaam`) |
| **Canais** | `general`, `random` |
| **Role do Admin** | admin |
| **Permissões** | read,write,delete,manage |

## 🔐 Segurança

### ⚠️ Importante: Alterar Hash da Senha

O script usa um hash de exemplo. Para gerar um hash válido da senha `admin123`:

```javascript
// Execute no Node.js
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('admin123', 10);
console.log(hash);
```

Depois, substitua o hash no arquivo `reset_database.sql` na linha:

```sql
'$2a$10$rOZxHQFQxKxH0Q0Q0Q0Q0uK1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K',
```

### 🔒 Após o Reset

1. **Altere a senha do admin imediatamente**
2. **Crie novos usuários conforme necessário**
3. **Configure os workspaces apropriados**

## 🐛 Troubleshooting

### Erro: "Railway CLI not found"
```bash
npm install -g @railway/cli
```

### Erro: "Not logged in"
```bash
railway login
```

### Erro: "DATABASE_URL not found"
```bash
# Certifique-se de estar no projeto correto
railway link
```

### Erro: "Permission denied"
```bash
chmod +x reset_railway_db.sh
```

## 📝 Arquivos

- `reset_database.sql` - Script SQL puro (funciona em PostgreSQL e SQLite)
- `reset_railway_db.sh` - Script shell automatizado para Railway (detecta DB)
- `quick_reset.sh` - Script one-liner para reset rápido (PostgreSQL)
- `reset_workspaces_only.sh` - Reset apenas workspaces, mantém usuários
- `RESET_DATABASE.md` - Esta documentação

## 🔄 Workflow Recomendado

1. **Backup** (se necessário):
   ```bash
   railway run pg_dump $DATABASE_URL > backup.sql
   ```

2. **Reset**:
   ```bash
   ./reset_railway_db.sh
   ```

3. **Verificar**:
   - Acesse a aplicação
   - Faça login com `admin@iaam.com` / `admin123`
   - Verifique se o workspace IAAM está disponível

4. **Configurar**:
   - Altere a senha do admin
   - Crie usuários e workspaces necessários

## 💡 Dicas

- Use este script em **desenvolvimento** para resetar rapidamente
- Em **produção**, considere fazer backup antes
- O script é **idempotente** - pode ser executado múltiplas vezes
- Para resetar apenas alguns dados, edite o SQL conforme necessário

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do Railway: `railway logs`
2. Confirme que o DATABASE_URL está correto
3. Verifique se as tabelas existem: `railway run psql $DATABASE_URL -c "\dt"`
