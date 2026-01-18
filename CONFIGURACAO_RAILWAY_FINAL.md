# ✅ Checklist de Configuração Final - Railway

## 🎯 CORREÇÕES NECESSÁRIAS

### 1. ⚠️ CORRIGIR ROOT DIRECTORY (URGENTE!)

#### Backend:
1. Railway → Serviço Backend → **Settings**
2. Encontre **"Root Directory"**
3. **REMOVA** `/backend`
4. **Digite** `backend` (sem barra `/`)
5. Salve

#### Frontend:
1. Railway → Serviço Frontend → **Settings**
2. Encontre **"Root Directory"**
3. **REMOVA** `/frontend`
4. **Digite** `frontend` (sem barra `/`)
5. Salve

---

## 2. 🗑️ REMOVER VARIÁVEIS INCORRETAS DO BACKEND

No Railway → Backend → **Variables**:

**DELETAR estas variáveis:**
- ❌ `DATABASE_PUBLIC_URL` (não é usado)
- ❌ `FRONTEND_PORT` (não é necessário)

**MANTER apenas:**
```env
PORT=3001
JWT_SECRET=i8kA+Vd955MImoM7QJpAezUM4CMSSRLi/ppQ9hq4R0jeYouEgFwUA6mj/tiWnltDisdF+Fkkxi1u0h6CJFdyCA==
NODE_ENV=production
FRONTEND_URL=https://zorahchat-zorah-faturamento-iaam.up.railway.app
```

---

## 3. 💾 ADICIONAR VOLUME PARA BANCO DE DADOS

O sistema usa **SQLite** (não PostgreSQL). Precisa de Volume para persistir dados.

### No Railway - Serviço Backend:

1. Vá na aba **"Volumes"** ou **"Data"**
2. Clique **"+ New Volume"** ou **"Add Volume"**
3. Configure:
   - **Mount Path:** `/app/data`
   - **Size:** 1GB (ou mais se precisar)
4. Clique em **"Add"** ou **"Create"**

---

## 4. ✅ VERIFICAR VARIÁVEIS DO FRONTEND

No Railway → Frontend → **Variables**:

**Devem estar assim:**
```env
VITE_API_URL=https://backend-chat-zorah-faturamento-laam.up.railway.app
VITE_WS_URL=https://backend-chat-zorah-faturamento-laam.up.railway.app
```

✅ **Correto!** (sem `/api` no final)

---

## 5. 🔄 FAZER REDEPLOY

Após todas as correções acima:

### Backend:
1. Railway → Backend →  **Deployments**
2. Clique no menu **"..."** do último deploy
3. Clique **"Redeploy"**

### Frontend:
1. Railway → Frontend → **Deployments**
2. Clique no menu **"..."** do último deploy
3. Clique **"Redeploy"**

---

## 6. 📊 VERIFICAR LOGS

### Backend:
```
Railway → Backend → Deployments → View Logs
```

**Procure por:**
- ✅ `[DATABASE] Using database at: /app/data/database.sqlite`
- ✅ `Database initialized.`
- ✅ `Server running on...`

**Erros comuns:**
- ❌ `ENOENT: no such file or directory` → Volume não criado
- ❌ `Root directory not found` → Root directory com `/` (remova)

### Frontend:
```
Railway → Frontend → Deployments → View Logs
```

**Procure por:**
- ✅ Build completou sem erros
- ✅ Server iniciou

---

## 7. 🧪 TESTAR APLICAÇÃO

1. **Acesse a URL do frontend:**
   ```
   https://zorahchat-zorah-faturamento-iaam.up.railway.app
   ```

2. **Faça login com usuário padrão:**
   - Email: `admin@iaam.com`
   - Senha: `admin123`

3. **Verifique:**
   - ✅ Login funciona
   - ✅ Workspace "IAAM" aparece
   - ✅ Canais "general" e "random" aparecem
   - ✅ Consegue enviar mensagem
   - ✅ Status online/offline funciona

---

## 🚨 PROBLEMAS COMUNS

### "Cannot read properties of undefined"
**Causa:** Root directory com `/` no início  
**Solução:** Remove a barra, use apenas `backend` ou `frontend`

### "Database not found" ou "ENOENT"
**Causa:** Volume não criado  
**Solução:** Adicionar Volume em `/app/data`

### "CORS error"
**Causa:** FRONTEND_URL incorreta no backend  
**Solução:** Verificar se URL do frontend está correta

### "Failed to connect to WebSocket"
**Causa:** VITE_WS_URL incorreta  
**Solução:** Verificar variável no frontend

### "502 Bad Gateway" ou "Application failed to respond"
**Causa:** Aplicação crashando ao iniciar  
**Solução:** Ver logs do deployment

---

## ✅ RESUMO DAS CONFIGURAÇÕES CORRETAS

### **Backend:**
```
Root Directory:  backend  (SEM barra)
Start Command:   npm start
Port:            3001

Variáveis:
  PORT=3001
  JWT_SECRET=[seu_secret]
  NODE_ENV=production
  FRONTEND_URL=https://zorahchat-zorah-faturamento-iaam.up.railway.app

Volume:
  Mount Path: /app/data
  Size: 1GB
```

### **Frontend:**
```
Root Directory:  frontend  (SEM barra)
Build Command:   npm run build
Start Command:   npm start
Port:            4173

Variáveis:
  VITE_API_URL=https://backend-chat-zorah-faturamento-laam.up.railway.app
  VITE_WS_URL=https://backend-chat-zorah-faturamento-laam.up.railway.app
```

---

## 📝 ORDEM DE EXECUÇÃO

1. ✅ Corrigir Root Directory (backend e frontend)
2. ✅ Remover variáveis incorretas do backend
3. ✅ Adicionar Volume no backend
4. ✅ Commit e push do código atualizado (já feito)
5. ✅ Redeploy backend
6. ✅ Redeploy frontend
7. ✅ Verificar logs
8. ✅ Testar aplicação

---

## 🎉 QUANDO ESTIVER TUDO OK

Você verá:
- ✅ Backend rodando sem erros
- ✅ Frontend acessível
- ✅ Login funcionando
- ✅ Banco de dados criado e populado
- ✅ WebSocket conectado
- ✅ Mensagens sendo enviadas e recebidas

---

**Data:** 2026-01-18  
**Status:** Aguardando correções do usuário
