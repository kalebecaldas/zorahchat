# 🚨 CORREÇÃO URGENTE - Variáveis de Ambiente Railway

## Problema Identificado

O WebSocket está tentando conectar em `https://zorahchat.up.railway.app:3001` (porta 3001), mas no Railway cada serviço tem seu próprio domínio **SEM PORTA**.

O backend está em: `https://backend-chat-zorah-faturamento-iaam.up.railway.app`
O frontend está em: `https://zorahchat.up.railway.app`

## ✅ SOLUÇÃO IMEDIATA

### 1️⃣ Configure as Variáveis no Railway - Frontend

1. Acesse o [Railway Dashboard](https://railway.app)
2. Selecione o projeto **Zorah Chat**
3. Clique no serviço **Frontend** (zorahchat)
4. Vá em **Variables**
5. **ADICIONE ou EDITE** estas variáveis:

```env
VITE_API_URL=https://backend-chat-zorah-faturamento-iaam.up.railway.app
VITE_WS_URL=https://backend-chat-zorah-faturamento-iaam.up.railway.app
```

⚠️ **IMPORTANTE**: 
- **NÃO** coloque porta (`:3001`)
- Use o domínio completo do backend
- Ambas variáveis devem apontar para o **BACKEND**

### 2️⃣ Configure as Variáveis no Railway - Backend

1. Clique no serviço **Backend** (backend-chat-zorah-faturamento-iaam)
2. Vá em **Variables**
3. **VERIFIQUE** que estas variáveis existem:

```env
PORT=3001
JWT_SECRET=(use um valor FORTE - já deve estar configurado)
NODE_ENV=production
FRONTEND_URL=https://zorahchat.up.railway.app
```

### 3️⃣ Redeploy

Após configurar as variáveis:

1. **Frontend**: Clique em "Redeploy" (ou espere o deploy automático do GitHub)
2. **Backend**: Clique em "Redeploy" (ou espere o deploy automático)

## 🔍 Como Validar

Após o redeploy:

1. Abra `https://zorahchat.up.railway.app`
2. Abra o **Console do Navegador** (F12 → Console)
3. Faça login com `admin@iaam.com` / `admin123`
4. Procure por estas mensagens:

```
[SOCKET CONTEXT] Socket URL resolution: { envWsUrl: "https://backend-chat-zorah-faturamento-iaam.up.railway.app", ... }
[SOCKET CONTEXT] Connecting to: https://backend-chat-zorah-faturamento-iaam.up.railway.app
[SOCKET CONTEXT] Socket connected successfully
```

✅ **SUCESSO**: Se ver "Socket connected successfully"
❌ **ERRO**: Se ver "WebSocket is closed" ou porta `:3001`

## 🐛 Troubleshooting

### Problema: Ainda mostra porta :3001

**Causa**: As variáveis de ambiente não foram salvas ou o build não usou elas.

**Solução**:
1. Verifique se salvou as variáveis no Railway (deve aparecer na aba Variables)
2. Force um novo build:
   - Vá em Settings → "Redeploy from latest" 
   - OU faça um commit vazio: `git commit --allow-empty -m "trigger rebuild" && git push`

### Problema: "Authentication error" no console

**Causa**: Token JWT expirou ou está inválido.

**Solução**:
1. Faça logout
2. Limpe o localStorage (Console: `localStorage.clear()`)
3. Faça login novamente

### Problema: Lista de membros vazia

**Causa**: Banco de dados resetado ou usuários com status offline.

**Solução**:
1. O sistema já foi corrigido para mostrar TODOS os usuários (online e offline)
2. Aguarde o redeploy do backend (commit `80657ed`)
3. A lista ao clicar no `+` em "Mensagens Diretas" deve mostrar todos os membros

## 📸 Checklist Final

- [ ] Variáveis VITE_API_URL e VITE_WS_URL configuradas no frontend
- [ ] Frontend redeployado
- [ ] Backend redeployado
- [ ] Console mostra "Socket connected successfully"
- [ ] Status do usuário aparece correto (não fica fixo em "offline")
- [ ] Lista de membros aparece ao clicar em `+` nas DMs

---

**Última atualização**: 18/01/2026 18:16
**Commits aplicados**: 
- `7036ee7` - Reset status on startup
- `80657ed` - Return user status in auth routes
- `50e5146` - Sync user status in Sidebar
- `e7cfa69` - Fix WebSocket URL for production
