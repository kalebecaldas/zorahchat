# 🔧 Railway - Configuração de Variáveis de Ambiente

## ⚠️ IMPORTANTE: Configurar BACKEND_URL

O frontend precisa saber onde está o backend!

---

## 📝 Passo a Passo

### **1. Abrir Railway Dashboard**
```
https://railway.app/
```

### **2. Selecionar o Projeto Frontend**
- Clicar no serviço do **frontend** (zorahchat)

### **3. Ir em Variables**
- Aba "Variables" ou "Settings" → "Variables"

### **4. Adicionar Variável:**

**Nome:** `BACKEND_URL`

**Valor:** URL do backend (exemplo):
```
https://backend-chat-zorah-faturamento-iaam.up.railway.app
```

**Como pegar a URL do backend:**
1. Voltar ao dashboard
2. Clicar no serviço do **backend**
3. Copiar a URL pública (ex: `https://backend-....railway.app`)
4. Colar no BACKEND_URL do frontend

---

## ✅ Configuração Completa

**Frontend deve ter:**
```bash
BACKEND_URL=https://backend-chat-zorah-faturamento-iaam.up.railway.app
PORT=4173
```

**Backend deve ter:**
```bash
DATABASE_URL=(já configurado)
JWT_SECRET=(já configurado)
FRONTEND_URL=https://zorahchat.up.railway.app
VAPID_PUBLIC_KEY=(já configurado)
VAPID_PRIVATE_KEY=(já configurado)
```

---

## 🔄 Como Funciona

### **Com BACKEND_URL configurado:**

```
Frontend Caddy → Proxy → Backend
/api/* → BACKEND_URL/api/*
/uploads/* → BACKEND_URL/uploads/*
/socket.io/* → BACKEND_URL/socket.io/*
```

### **Sem BACKEND_URL (fallback):**

```
Frontend Caddy → localhost:3001 (não funciona no Railway!)
```

---

## 🚀 Após Configurar

1. **Salvar variável** no Railway
2. **Aguardar redeploy** automático (~2-3 min)
3. **Testar:**
   - Abrir app
   - Fazer login
   - Deve funcionar! ✅

---

## 🧪 Verificar se Funcionou

### **Console (F12):**
```javascript
// ✅ Deve fazer requisição para backend:
POST https://backend-....railway.app/api/auth/login

// ❌ NÃO deve retornar HTML:
Uncaught SyntaxError: Unexpected token '<'
```

### **Network Tab:**
```
✅ /api/auth/login → 200 OK (JSON response)
✅ /socket.io/?EIO=4 → 101 Switching Protocols
```

---

## 💡 Alternativa: Adicionar via CLI

**Se tiver Railway CLI instalado:**

```bash
# Selecionar projeto frontend
railway link

# Adicionar variável
railway variables --set BACKEND_URL=https://backend-chat-zorah-faturamento-iaam.up.railway.app

# Redeploy
railway up
```

---

## 🔍 Troubleshooting

### **Problema: "Cannot read properties of undefined"**
```
✅ Solução: Adicionar BACKEND_URL
```

### **Problema: "Network Error" ou "Failed to fetch"**
```
✅ Verificar:
1. Backend está rodando?
2. BACKEND_URL está correto?
3. CORS configurado no backend?
```

### **Problema: "401 Unauthorized"**
```
✅ Verificar:
1. JWT_SECRET igual no backend?
2. Token sendo enviado corretamente?
```

---

## 📊 Status Esperado

**Após configurar e deploy:**

| Componente | Status | URL |
|------------|--------|-----|
| Backend | ✅ Rodando | `https://backend-....railway.app` |
| Frontend | ✅ Rodando | `https://zorahchat.up.railway.app` |
| API Proxy | ✅ Funcionando | `/api/*` → Backend |
| Socket.IO | ✅ Conectado | `/socket.io/*` → Backend |
| Login | ✅ Funciona | JSON response OK |

---

## ✅ Checklist

- [ ] Abrir Railway Dashboard
- [ ] Selecionar serviço frontend
- [ ] Ir em Variables
- [ ] Adicionar `BACKEND_URL`
- [ ] Valor = URL do backend
- [ ] Salvar
- [ ] Aguardar redeploy (~2-3 min)
- [ ] Testar login
- [ ] ✅ Login funciona!

---

**Configure agora e o sistema vai funcionar completamente!** 🚀
