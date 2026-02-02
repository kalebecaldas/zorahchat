# 🔐 Guia do Usuário Master

## 📋 Informações do Usuário Master

**Email:** `kalebe.caldas@hotmail.com`  
**Senha:** `mxskqgltne`  
**Acesso:** Painel Admin Completo

---

## 🎯 Poderes do Master

O usuário master tem **controle total** sobre o sistema:

### ✅ **Gerenciamento de Usuários**
- Ver todos os usuários cadastrados
- Banir/desbanir usuários
- Ver estatísticas de atividade
- Forçar desconexão de usuários banidos
- Ver workspaces e mensagens por usuário

### ✅ **Gerenciamento de Workspaces**
- Ver todos os workspaces criados
- Deletar workspaces (com cascade)
- Ver membros, canais e mensagens por workspace
- Ver informações do dono de cada workspace

### ✅ **Dashboard e Estatísticas**
- Total de usuários cadastrados
- Total de workspaces criados
- Total de mensagens enviadas
- Mensagens nas últimas 24h
- Mensagens nos últimos 7 dias
- Usuários online em tempo real
- Total de canais criados

### ✅ **Informações do Sistema**
- Informações do servidor (CPU, memória, uptime)
- Informações do banco de dados (tipo, tamanho)
- Versão do Node.js
- Variáveis de ambiente

### ✅ **Auditoria**
- Log de todas as ações administrativas
- Histórico de bans/unbans
- Histórico de deleções de workspaces
- Quem executou cada ação e quando

---

## 🚀 Como Criar/Atualizar o Usuário Master

### **Opção 1: Via Script (Recomendado)**

```bash
cd backend
node scripts/createMasterUser.js
```

Isso irá:
- ✅ Criar o usuário se não existir
- ✅ Atualizar a senha se já existir
- ✅ Fazer hash seguro da senha com bcrypt

### **Opção 2: Manualmente via Registro**

1. Acesse `http://seu-dominio.com/register`
2. Registre com:
   - **Nome:** Master Admin
   - **Email:** kalebe.caldas@hotmail.com
   - **Senha:** mxskqgltne
3. Faça login normalmente

---

## 🔑 Acessando o Painel Admin

### **Local**
```
http://localhost:5173/admin
```

### **Produção (Railway)**
```
https://seu-dominio.railway.app/admin
```

### **Proteção**
- ✅ Rota protegida por autenticação
- ✅ Apenas o email `kalebe.caldas@hotmail.com` pode acessar
- ✅ Middleware `masterAuth` no backend
- ✅ Componente `MasterRoute` no frontend
- ✅ Redirecionamento automático se não for master

---

## 📊 Recursos do Painel Admin

### **1. Dashboard**
- Cards com estatísticas principais
- Gráficos de atividade (futuro)
- Usuários online em tempo real
- Atualização automática a cada 30s

### **2. Usuários**
- Lista completa de usuários
- Busca por nome/email
- Botão "Banir" / "Desbanir"
- Ver workspaces e mensagens de cada usuário
- Forçar desconexão de usuários banidos

### **3. Workspaces**
- Lista completa de workspaces
- Ver dono, membros, canais
- Botão "Deletar" (com confirmação)
- Cascade delete (remove tudo relacionado)

### **4. Sistema**
- Informações do servidor
- Informações do banco de dados
- Logs de auditoria (últimas 50 ações)

---

## 🔐 Segurança

### **Backend**
```javascript
// middleware/masterAuth.js
const MASTER_EMAIL = 'kalebe.caldas@hotmail.com';

if (user.email !== MASTER_EMAIL) {
    return res.status(403).json({ 
        error: 'Master access required' 
    });
}
```

### **Frontend**
```javascript
// App.jsx - MasterRoute
if (user.email !== 'kalebe.caldas@hotmail.com') {
    return <Navigate to="/client" />;
}
```

### **Proteções Ativas**
- ✅ JWT obrigatório
- ✅ Verificação de email exato
- ✅ Middleware em todas as rotas `/api/admin/*`
- ✅ Redirect automático no frontend
- ✅ Senha com bcrypt (10 rounds)

---

## 📝 Rotas da API Admin

Todas as rotas exigem autenticação master:

```
GET    /api/admin/stats              - Estatísticas gerais
GET    /api/admin/users              - Lista de usuários
PUT    /api/admin/users/:id/ban      - Banir/desbanir usuário
GET    /api/admin/workspaces         - Lista de workspaces
DELETE /api/admin/workspaces/:id     - Deletar workspace
GET    /api/admin/system             - Informações do sistema
GET    /api/admin/audit-logs         - Logs de auditoria
```

---

## 🛠️ Ações Administrativas

### **Banir Usuário**
```javascript
PUT /api/admin/users/123/ban
{
    "banned": true,
    "reason": "Violação de termos"
}
```

**Efeitos:**
- ✅ Atualiza campo `banned = true` no banco
- ✅ Desconecta todos os sockets do usuário
- ✅ Registra ação no audit log
- ✅ Usuário não consegue mais fazer login

### **Deletar Workspace**
```javascript
DELETE /api/admin/workspaces/456
{
    "reason": "Workspace inativo"
}
```

**Efeitos (Cascade):**
- ✅ Deleta o workspace
- ✅ Deleta todos os canais
- ✅ Deleta todas as mensagens
- ✅ Deleta todas as DMs
- ✅ Remove todos os membros
- ✅ Registra ação no audit log

---

## 📈 Banco de Dados

### **Tabela: admin_audit_log**
```sql
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id)
);
```

**Ações Registradas:**
- `ban_user` / `unban_user`
- `delete_workspace`
- Futuro: `delete_user`, `reset_password`, etc.

---

## ⚡ Comandos Úteis

### **Criar/Atualizar Master**
```bash
node backend/scripts/createMasterUser.js
```

### **Verificar Master no Banco**
```bash
# SQLite
sqlite3 backend/database.sqlite
SELECT * FROM users WHERE email = 'kalebe.caldas@hotmail.com';

# PostgreSQL
psql $DATABASE_URL
SELECT * FROM users WHERE email = 'kalebe.caldas@hotmail.com';
```

### **Ver Audit Logs**
```bash
sqlite3 backend/database.sqlite
SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 10;
```

---

## 🚨 Troubleshooting

### **Não consigo acessar /admin**
1. Verifique se está logado
2. Verifique se o email é exatamente `kalebe.caldas@hotmail.com`
3. Limpe localStorage e faça login novamente
4. Verifique console do browser (F12)

### **Senha não funciona**
```bash
# Re-criar usuário master
node backend/scripts/createMasterUser.js
```

### **Erro "Master access required"**
- Email do usuário logado não é o master
- Token JWT inválido ou expirado
- Middleware não está funcionando

### **Workspaces não aparecem**
- Verifique conexão com banco
- Verifique se há workspaces criados
- Verifique logs do backend

---

## 📞 Suporte

**Email Master:** kalebe.caldas@hotmail.com  
**Senha Master:** mxskqgltne

**⚠️ NUNCA compartilhe essas credenciais!**

---

**Última atualização:** 27 de Janeiro de 2026  
**Versão:** 1.0
