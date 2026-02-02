# 🚂 Como Resetar o Banco de Dados no Railway

## ⚠️ AVISOS IMPORTANTES

### 🔴 **ATENÇÃO: AÇÃO IRREVERSÍVEL!**

- ❌ Todos os dados serão **PERMANENTEMENTE DELETADOS**
- ❌ Usuários precisarão se re-registrar
- ❌ Workspaces serão perdidos
- ❌ Mensagens não poderão ser recuperadas

### 🛡️ **Antes de Começar**

1. ✅ **Faça backup se necessário** (Railway faz backups automáticos)
2. ✅ **Avise os usuários** que o sistema ficará offline
3. ✅ **Escolha um horário de baixo uso**
4. ✅ **Tenha certeza absoluta** do que está fazendo

---

## 🎯 Métodos Disponíveis

### **Método 1: Via Railway CLI (Recomendado)** ⭐

#### **Passo 1: Instalar Railway CLI**

```bash
# macOS/Linux
brew install railway

# Windows (via npm)
npm install -g @railway/cli

# Ou via script direto
sh -c "$(curl -sSL https://raw.githubusercontent.com/railwayapp/cli/master/install.sh)"
```

#### **Passo 2: Fazer Login**

```bash
railway login
```

Seu navegador abrirá para autenticação.

#### **Passo 3: Linkar ao Projeto**

```bash
cd "/Users/kalebecaldas/Downloads/ZORAH CHAT/backend"
railway link
```

Selecione seu projeto (Zorah Chat).

#### **Passo 4: Executar Reset**

```bash
railway run node scripts/resetRailway.js
```

O script irá:
1. ⏰ Aguardar 5 segundos
2. 🗑️ Deletar todos os dados
3. 🔐 Criar o usuário master
4. ✅ Confirmar sucesso

---

### **Método 2: Via SQL Direto (Avançado)**

#### **Passo 1: Conectar ao PostgreSQL**

```bash
# Obter DATABASE_URL
railway variables

# Conectar
psql [URL_DO_BANCO]
```

#### **Passo 2: Executar SQLs**

```sql
-- Deletar tudo (ordem importa!)
TRUNCATE TABLE admin_audit_log CASCADE;
TRUNCATE TABLE mentions CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE read_receipts CASCADE;
TRUNCATE TABLE message_reactions CASCADE;
TRUNCATE TABLE message_attachments CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE channel_members CASCADE;
TRUNCATE TABLE channels CASCADE;
TRUNCATE TABLE direct_messages CASCADE;
TRUNCATE TABLE workspace_users CASCADE;
TRUNCATE TABLE workspaces CASCADE;
TRUNCATE TABLE users CASCADE;

-- Verificar
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM workspaces;
SELECT COUNT(*) FROM messages;
```

#### **Passo 3: Criar Master User**

**IMPORTANTE:** Você precisa gerar o hash da senha primeiro!

```javascript
// Local, no Node.js:
const bcrypt = require('bcryptjs');
bcrypt.hash('mxskqgltne', 10).then(hash => console.log(hash));
// Copie o resultado (ex: $2a$10$abc123...)
```

Então no PostgreSQL:

```sql
INSERT INTO users (name, email, password, status) 
VALUES ('Master Admin', 'kalebe.caldas@hotmail.com', '[HASH_AQUI]', 'online');

-- Verificar
SELECT id, name, email FROM users;
```

---

### **Método 3: Via Endpoint Temporário (Perigoso!)**

#### **Passo 1: Criar Endpoint de Reset**

Adicione em `backend/routes/admin.js`:

```javascript
// REMOVER APÓS USO!
router.post('/secret-reset-database-danger', async (req, res) => {
    const { confirmPassword } = req.body;
    
    if (confirmPassword !== 'CONFIRMO_RESET_TOTAL') {
        return res.status(403).json({ error: 'Senha de confirmação incorreta' });
    }
    
    try {
        // Executar script de reset
        const { execSync } = require('child_process');
        execSync('node scripts/resetRailway.js', { cwd: __dirname });
        
        res.json({ message: 'Banco resetado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

#### **Passo 2: Fazer Request**

```bash
curl -X POST https://sua-app.railway.app/api/admin/secret-reset-database-danger \
  -H "Content-Type: application/json" \
  -d '{"confirmPassword": "CONFIRMO_RESET_TOTAL"}'
```

#### **Passo 3: REMOVER O ENDPOINT!**

⚠️ **NUNCA deixe este endpoint em produção!**

---

## 📝 Script Criado: `resetRailway.js`

### **Características:**

✅ Detecta automaticamente PostgreSQL vs SQLite  
✅ Aguarda 5 segundos antes de executar  
✅ Usa `TRUNCATE` para PostgreSQL (mais eficiente)  
✅ Usa `DELETE` para SQLite  
✅ Cria usuário master automaticamente  
✅ Mostra progresso detalhado  

### **Como Funciona:**

```javascript
// 1. Detecta tipo de banco
const isPostgres = process.env.DATABASE_URL?.includes('postgres');

// 2. Para PostgreSQL
await db.run(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);

// 3. Para SQLite
await db.run(`DELETE FROM ${table}`);

// 4. Cria master
const hash = await bcryptjs.hash('mxskqgltne', 10);
await db.run('INSERT INTO users (name, email, password, status) VALUES (...)');
```

---

## 🧪 Teste Local Primeiro!

**SEMPRE teste localmente antes de executar no Railway!**

```bash
# 1. Usar banco local SQLite
cd backend
node scripts/resetRailway.js

# 2. Verificar resultado
sqlite3 database.sqlite "SELECT * FROM users;"

# 3. Se funcionou, executar no Railway
railway run node scripts/resetRailway.js
```

---

## 📊 Após o Reset

### **1. Verificar Status**

```bash
# Via Railway CLI
railway run node -e "
const { getDb, initializeDatabase } = require('./database');
initializeDatabase().then(async () => {
    const db = getDb();
    const users = await db.get('SELECT COUNT(*) as count FROM users');
    const workspaces = await db.get('SELECT COUNT(*) as count FROM workspaces');
    console.log('Users:', users.count);
    console.log('Workspaces:', workspaces.count);
});
"
```

### **2. Testar Login**

```
URL: https://sua-app.railway.app/login
Email: kalebe.caldas@hotmail.com
Senha: mxskqgltne
```

### **3. Criar Primeiro Workspace**

1. Login como master
2. Criar workspace
3. Convidar usuários

---

## 🔧 Troubleshooting

### **Erro: "Cannot find module"**

```bash
# Instalar dependências no Railway
railway run npm install
```

### **Erro: "Database connection failed"**

```bash
# Verificar DATABASE_URL
railway variables

# Testar conexão
railway run node -e "console.log(process.env.DATABASE_URL)"
```

### **Erro: "Foreign key constraint"**

```bash
# Usar ordem correta das tabelas
# O script resetRailway.js já faz isso automaticamente
```

### **Script não deleta tudo**

```bash
# Executar SQL direto
railway connect postgres

# Então:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;

# Re-criar tabelas
railway run node scripts/init_postgres.js
```

---

## 🚀 Comandos Rápidos

### **Reset Via CLI**

```bash
cd backend
railway run node scripts/resetRailway.js
```

### **Verificar Banco**

```bash
railway connect postgres
\dt  # Listar tabelas
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM workspaces;
\q   # Sair
```

### **Ver Logs**

```bash
railway logs
```

### **Re-deploy**

```bash
railway up
```

---

## ⏱️ Timeline Esperada

| Etapa | Tempo | Status |
|-------|-------|--------|
| Conexão ao banco | ~2s | 🔄 |
| Aguardar confirmação | 5s | ⏰ |
| Deletar tabelas | ~10s | 🗑️ |
| Criar master | ~1s | 🔐 |
| **Total** | **~18s** | ✅ |

---

## 📋 Checklist Final

Antes de executar:

- [ ] ✅ Backups verificados
- [ ] ✅ Usuários avisados
- [ ] ✅ Horário de baixo uso escolhido
- [ ] ✅ Testado localmente
- [ ] ✅ Railway CLI instalado e logado
- [ ] ✅ Projeto linkado corretamente
- [ ] ✅ Credenciais master anotadas

Durante execução:

- [ ] ✅ Script rodando sem erros
- [ ] ✅ Tabelas deletadas com sucesso
- [ ] ✅ Master user criado
- [ ] ✅ Confirmação de sucesso

Após execução:

- [ ] ✅ Login como master funcionando
- [ ] ✅ Admin panel acessível
- [ ] ✅ Criar workspace funcionando
- [ ] ✅ Sistema operacional

---

## 🆘 Suporte

### **Em Caso de Problemas:**

1. **Verifique os logs:**
   ```bash
   railway logs --tail 100
   ```

2. **Conecte ao banco:**
   ```bash
   railway connect postgres
   ```

3. **Re-execute o script:**
   ```bash
   railway run node scripts/resetRailway.js
   ```

4. **Último recurso - Novo banco:**
   - No Railway dashboard: Provisionar novo PostgreSQL
   - Atualizar DATABASE_URL
   - Executar init_postgres.js
   - Executar resetRailway.js

---

## 📚 Arquivos Relacionados

- ✅ `backend/scripts/resetRailway.js` - Script principal
- ✅ `backend/scripts/forceReset.js` - Reset local
- ✅ `backend/scripts/createMasterUser.js` - Criar master
- ✅ `backend/database.js` - Lógica do banco
- ✅ `RESET_BANCO_COMPLETO.md` - Doc completa

---

## 🎯 Resumo do Comando

```bash
# Um único comando para resetar tudo no Railway:
cd backend && railway run node scripts/resetRailway.js
```

**Isso é tudo que você precisa!** 🚀

---

**⚠️ LEMBRE-SE: Esta ação é IRREVERSÍVEL!**

**Tenha certeza absoluta antes de executar em produção!**
