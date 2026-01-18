# 🔌 Configuração de Portas no Railway - ZORAH CHAT

## ❓ Railway perguntando qual porta usar?

Quando o Railway pergunta "Choose a port to expose", use:

---

## ✅ **BACKEND - Porta 3001**

### No Railway Dashboard:

1. **Vá em Settings do serviço Backend**
2. **Na seção "Networking" ou "Domains"**
3. Quando aparecer "Port" ou "Expose Port":
   ```
   Port: 3001
   ```

### OU configure via variáveis de ambiente:

```env
PORT=3001
```

---

## ✅ **FRONTEND - Porta 4173**

### No Railway Dashboard:

1. **Vá em Settings do serviço Frontend**
2. **Na seção "Networking" ou "Domains"**
3. Quando aparecer "Port" ou "Expose Port":
   ```
   Port: 4173
   ```

*Nota: 4173 é a porta padrão do `vite preview`*

---

## 📋 **Variáveis de Ambiente Completas:**

### **BACKEND:**
```env
PORT=3001
JWT_SECRET=seu_secret_super_seguro
NODE_ENV=production
FRONTEND_URL=https://seu-frontend.railway.app
```

### **FRONTEND:**
```env
VITE_API_URL=https://seu-backend.railway.app
VITE_WS_URL=https://seu-backend.railway.app
```

*(Não precisa PORT no frontend, mas se o Railway pedir, use 4173)*

---

## 🎯 **Passo a Passo com Portas:**

### **1. Deploy Backend:**

1. Root Directory: `backend`
2. Variáveis de ambiente:
   ```
   PORT=3001
   JWT_SECRET=[gerado pelo script]
   NODE_ENV=production
   FRONTEND_URL=[preencher depois]
   ```
3. Start Command: `npm start`
4. **Quando gerar domínio:** Port = `3001`

### **2. Deploy Frontend:**

1. Root Directory: `frontend`
2. Build Command: `npm run build`
3. Start Command: `npm start`
4. Variáveis de ambiente:
   ```
   VITE_API_URL=https://[backend-url]
   VITE_WS_URL=https://[backend-url]
   ```
5. **Quando gerar domínio:** Port = `4173` (ou deixe Railway detectar)

---

## 🔍 **Como saber qual porta escolher?**

### Backend:
Olhe no código `backend/index.js`:
```javascript
const PORT = process.env.PORT || 3001;
```
**Resposta: 3001**

### Frontend:
Olhe no `frontend/package.json`:
```json
"start": "vite preview --port $PORT --host 0.0.0.0"
```
A porta padrão do `vite preview` é **4173**

---

## 🌐 **Gerando Domínio Público:**

### **Backend:**

1. No Railway, vá na aba **"Settings"**
2. Seção **"Domains"** ou **"Networking"**
3. Clique em **"Generate Domain"** ou **"Add Domain"**
4. Se perguntar a porta: **3001**
5. Railway gerará: `https://zorah-backend-production.up.railway.app`

### **Frontend:**

1. No Railway, vá na aba **"Settings"**
2. Seção **"Domains"** ou **"Networking"**
3. Clique em **"Generate Domain"** ou **"Add Domain"**
4. Se perguntar a porta: **4173** (ou detectar automaticamente)
5. Railway gerará: `https://zorah-frontend-production.up.railway.app`

---

## ⚙️ **Alternativa: Usar Porta Dinâmica**

Se preferir deixar o Railway escolher automaticamente, você pode:

### Backend - Remover porta fixa:
```javascript
// Aceita qualquer porta que o Railway definir
const PORT = process.env.PORT || 3001;
```
*(Já está assim, mas não adicione PORT nas variáveis)*

Porém, para **gerar domínio**, você ainda precisa dizer qual porta está escutando.

---

## 🚨 **Problemas Comuns:**

### "Can't generate domain - no port exposed"

**Solução:**
1. Certifique-se que o serviço está **rodando** (deploy com sucesso)
2. Verifique os logs se o servidor iniciou
3. Confirme que a aplicação está escutando na porta correta
4. Adicione `PORT=3001` (backend) nas variáveis de ambiente

### "Multiple ports detected"

**Solução:**
- Escolha a porta principal: **3001** (backend) ou **4173** (frontend)

---

## 📊 **Resumo Visual:**

```
┌─────────────────────────────────────┐
│ BACKEND                             │
├─────────────────────────────────────┤
│ Root Directory: backend             │
│ Port: 3001                          │
│ Start Command: npm start            │
│ Domain: auto-gerado pelo Railway    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ FRONTEND                            │
├─────────────────────────────────────┤
│ Root Directory: frontend            │
│ Port: 4173                          │
│ Build: npm run build                │
│ Start: npm start                    │
│ Domain: auto-gerado pelo Railway    │
└─────────────────────────────────────┘
```

---

## ✅ **Checklist de Portas:**

- [ ] Backend variável `PORT=3001` configurada
- [ ] Backend rodando com sucesso (ver logs)
- [ ] Gerar domínio backend com porta **3001**
- [ ] Frontend build completou
- [ ] Frontend rodando com sucesso
- [ ] Gerar domínio frontend com porta **4173**
- [ ] Testar URLs geradas

---

## 💡 **Dica Final:**

**Se o Railway pergunta qual porta, é porque seu app está rodando!** 🎉

Isso é um bom sinal. Apenas escolha:
- **Backend:** `3001`
- **Frontend:** `4173`

E o domínio será gerado automaticamente!

---

**Última atualização:** 2026-01-18
