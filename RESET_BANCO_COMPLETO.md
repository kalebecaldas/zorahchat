# 🔄 Reset Completo do Banco de Dados

## ✅ Status: EXECUTADO COM SUCESSO

---

## 🎯 O Que Foi Feito

### **Reset Completo do Banco**
- ❌ **Deletados:** TODOS os usuários (exceto master)
- ❌ **Deletados:** TODOS os workspaces
- ❌ **Deletados:** TODOS os canais
- ❌ **Deletados:** TODAS as mensagens
- ❌ **Deletados:** TODAS as mensagens diretas
- ❌ **Deletados:** TODOS os membros e permissões
- ✅ **Criado:** Apenas o usuário master

---

## 🔐 Usuário Master (Único no Sistema)

| Campo | Valor |
|-------|-------|
| **Email** | `kalebe.caldas@hotmail.com` |
| **Senha** | `mxskqgltne` |
| **Nome** | Master Admin |
| **Status** | Online |
| **Tipo** | Master / Super Admin |

---

## 📊 Estado Atual do Banco

```
✅ users: 1 (apenas master)
✅ workspaces: 0
✅ channels: 0
✅ messages: 0
✅ direct_messages: 0
```

**Banco limpo e pronto para uso!** 🎉

---

## 🚀 Próximos Passos

### **1. Fazer Login como Master**
```
URL: http://localhost:5173/login
Email: kalebe.caldas@hotmail.com
Senha: mxskqgltne
```

### **2. Criar um Novo Workspace**
1. Após login, você será redirecionado para `/client`
2. Clique em "Criar Workspace"
3. Preencha:
   - **Nome:** Nome do seu workspace (ex: "Empresa", "Time", "Projeto")
   - **Descrição:** Descrição opcional
4. Clique em "Criar"

### **3. Sistema Criará Automaticamente**
- ✅ Canal `#general` (canal padrão)
- ✅ Canal `#random` (canal aleatório)
- ✅ Você será o dono (owner) do workspace
- ✅ Você será automaticamente membro com role `admin`

### **4. Convidar Novos Usuários**
**Opção A: Usuários se registram**
1. Compartilhe a URL de registro: `http://localhost:5173/register`
2. Usuários criam suas contas
3. Você convida eles para seu workspace via "Gerenciar Workspace"

**Opção B: Você cria via Admin Panel**
1. Acesse `/admin`
2. (Futuro) Criar usuários diretamente
3. Por enquanto, usuários devem se registrar normalmente

---

## 🔧 Scripts Criados

### **1. Reset Completo (Com confirmação)**
```bash
cd backend
node scripts/resetDatabase.js
```

**Características:**
- ⏰ Aguarda 3 segundos antes de executar
- 📝 Mostra mensagens detalhadas
- ⚠️ Avisos de confirmação
- 📊 Mostra status final do banco

### **2. Quick Reset (Sem confirmação)**
```bash
cd backend
node scripts/quickReset.js
```

**Características:**
- ⚡ Execução imediata
- 🚀 Mensagens mínimas
- ✅ Ideal para desenvolvimento

---

## 🗄️ Tabelas Limpas

As seguintes tabelas foram esvaziadas (na ordem correta para respeitar foreign keys):

1. `admin_audit_log` - Logs de auditoria
2. `mentions` - Menções (@user, @channel)
3. `notifications` - Notificações
4. `read_receipts` - Marcadores de leitura
5. `message_reactions` - Reações (emoji) nas mensagens
6. `message_attachments` - Anexos de mensagens
7. `messages` - Mensagens (canais + DMs)
8. `channel_members` - Membros dos canais
9. `channels` - Canais
10. `direct_messages` - Conversas diretas
11. `workspace_users` - Membros dos workspaces
12. `workspaces` - Workspaces
13. `users` - Usuários

**Importante:** A estrutura das tabelas foi mantida, apenas os dados foram deletados.

---

## 🔐 Segurança

### **Senha do Master**
```javascript
// Armazenada com bcryptjs (10 rounds)
const hashedPassword = await bcryptjs.hash('mxskqgltne', 10);
// Resultado no banco: $2a$10$...
```

### **Acesso ao Admin**
- ✅ Apenas `kalebe.caldas@hotmail.com` pode acessar `/admin`
- ✅ Verificação no backend (middleware)
- ✅ Verificação no frontend (MasterRoute)
- ✅ Redirect automático se não for master

---

## 🧪 Como Testar o Reset

### **1. Verificar Banco Limpo**
```bash
# SQLite
sqlite3 backend/database.sqlite

# Ver usuários (deve ter apenas 1)
SELECT * FROM users;

# Ver workspaces (deve estar vazio)
SELECT * FROM workspaces;

# Ver mensagens (deve estar vazio)
SELECT * FROM messages;
```

### **2. Testar Login**
1. Acesse `http://localhost:5173/login`
2. Email: `kalebe.caldas@hotmail.com`
3. Senha: `mxskqgltne`
4. ✅ Deve logar com sucesso

### **3. Criar Workspace**
1. Após login, clique em "Criar Workspace"
2. Nome: "Teste"
3. ✅ Deve criar com sucesso
4. ✅ Deve criar canais #general e #random
5. ✅ Você deve ser o owner

### **4. Testar Admin**
1. Acesse `http://localhost:5173/admin`
2. ✅ Dashboard deve mostrar:
   - 1 usuário (você)
   - 1 workspace (se criou)
   - 2 canais (se criou workspace)
   - 0 mensagens

---

## 📝 Comandos Úteis

### **Reset Rápido**
```bash
cd backend
node scripts/quickReset.js
```

### **Verificar Usuários**
```bash
sqlite3 backend/database.sqlite
SELECT id, name, email FROM users;
```

### **Verificar Workspaces**
```bash
sqlite3 backend/database.sqlite
SELECT id, name, owner_id FROM workspaces;
```

### **Contar Tudo**
```bash
sqlite3 backend/database.sqlite << EOF
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'workspaces', COUNT(*) FROM workspaces
UNION ALL
SELECT 'channels', COUNT(*) FROM channels
UNION ALL
SELECT 'messages', COUNT(*) FROM messages;
EOF
```

---

## 🐛 Troubleshooting

### **Problema: Script falha com erro de FK**
**Solução:**
```bash
# Desabilitar FK temporariamente
sqlite3 backend/database.sqlite
PRAGMA foreign_keys = OFF;
-- executar deletes
PRAGMA foreign_keys = ON;
```

### **Problema: Banco travado**
**Solução:**
```bash
# Parar o backend
# Deletar o banco
rm backend/database.sqlite

# Re-criar
cd backend
node scripts/quickReset.js
```

### **Problema: Master não consegue logar**
**Solução:**
```bash
# Re-criar master
cd backend
node scripts/createMasterUser.js
```

---

## 📊 Comparação

### **Antes do Reset**
```
❌ users: 5+
❌ workspaces: 3+
❌ messages: 100+
❌ kalebe.caldas@hotmail.com era usuário comum
```

### **Depois do Reset**
```
✅ users: 1 (apenas master)
✅ workspaces: 0
✅ messages: 0
✅ kalebe.caldas@hotmail.com é MASTER ADMIN
```

---

## ⚠️ Avisos Importantes

### **1. Dados Permanentemente Perdidos**
- ❌ Todas as conversas antigas foram deletadas
- ❌ Todos os arquivos referenciados foram perdidos
- ❌ Todos os usuários antigos precisam se re-registrar
- ❌ Todos os workspaces precisam ser re-criados

### **2. Arquivos Físicos**
```bash
# Arquivos na pasta uploads/ ainda existem
# Mas as referências no banco foram deletadas
# Você pode limpar manualmente:
rm -rf backend/uploads/*
```

### **3. Railway/Produção**
```bash
# CUIDADO: Não execute o reset em produção sem backup!
# O reset é IRREVERSÍVEL

# Para produção, faça backup primeiro:
# 1. Exportar dados do PostgreSQL
# 2. Guardar backup seguro
# 3. Então executar reset se necessário
```

---

## 🎉 Resumo Final

✅ **Banco resetado com sucesso**  
✅ **1 usuário criado** (master)  
✅ **0 workspaces**  
✅ **0 mensagens**  
✅ **Sistema limpo e pronto para começar do zero**  

**Próximo passo:** Fazer login como master e criar seu primeiro workspace! 🚀

---

**Data:** 27 de Janeiro de 2026  
**Ação:** Reset Completo do Banco  
**Status:** ✅ Executado com Sucesso
