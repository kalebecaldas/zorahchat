# 🚨 Troubleshooting Railway - "Script start.sh not found"

## ❌ Problema

Ao fazer deploy no Railway, você vê o erro:
```
⚠ Script start.sh not found
✖ Railpack could not determine how to build the app.
```

## ✅ Soluções

### Solução 1: Configurar Root Directory Corretamente

O ZORAH CHAT tem duas aplicações separadas (backend e frontend). Você precisa configurar cada uma como um serviço separado.

#### Para o Backend:

1. No Railway, vá em **Settings** do serviço
2. Em **Root Directory**, configure: `backend`
3. Em **Start Command**, configure: `npm start`
4. Em **Build Command**, deixe vazio (não precisa)
5. Clique em **Redeploy**

#### Para o Frontend:

1. No Railway, vá em **Settings** do serviço
2. Em **Root Directory**, configure: `frontend`
3. Em **Build Command**, configure: `npm run build`
4. Em **Start Command**, configure: `npm start`
5. Clique em **Redeploy**

---

### Solução 2: Usar Nixpacks.toml

Os arquivos `nixpacks.toml` já foram criados em cada pasta. Certifique-se de que eles foram commitados:

```bash
git add backend/nixpacks.toml frontend/nixpacks.toml
git commit -m "Adicionar configuração Nixpacks para Railway"
git push
```

O Railway detectará automaticamente esses arquivos.

---

### Solução 3: Deploy Passo a Passo

#### 1️⃣ **Backend primeiro:**

```bash
# No Railway Dashboard:
1. New Project
2. Deploy from GitHub repo
3. Selecione seu repositório
4. Configure:
   - Root Directory: backend
   - Start Command: npm start
5. Adicione variáveis de ambiente:
   PORT=3001
   JWT_SECRET=[seu_secret_gerado]
   NODE_ENV=production
   FRONTEND_URL=[preencher_depois]
```

#### 2️⃣ **Aguarde o backend deployar**

- Verifique os logs
- Anote a URL gerada (ex: `https://zorah-backend-production.up.railway.app`)

#### 3️⃣ **Frontend depois:**

```bash
# No mesmo projeto Railway:
1. + New Service
2. GitHub Repo
3. Selecione o mesmo repositório
4. Configure:
   - Root Directory: frontend
   - Build Command: npm run build
   - Start Command: npm start
5. Adicione variáveis de ambiente:
   VITE_API_URL=https://[url-do-backend]
   VITE_WS_URL=https://[url-do-backend]
```

#### 4️⃣ **Volte ao Backend:**

- Atualize a variável `FRONTEND_URL` com a URL do frontend
- Redeploy

---

### Solução 4: Verificar package.json

Certifique-se de que os scripts estão corretos:

**Backend (`backend/package.json`):**
```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js"
  }
}
```

**Frontend (`frontend/package.json`):**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "vite preview --port $PORT --host 0.0.0.0"
  }
}
```

Se algo estiver diferente, corrija e faça commit:

```bash
git add backend/package.json frontend/package.json
git commit -m "Corrigir scripts de deploy"
git push
```

---

## 🔍 Checklist de Verificação

- [ ] Root Directory configurado (`backend` ou `frontend`)
- [ ] Script `start` existe no package.json
- [ ] Script `build` existe (só frontend)
- [ ] Variáveis de ambiente configuradas
- [ ] Arquivos commitados no Git
- [ ] Railway está apontando para o branch correto

---

## 📸 Configuração Correta no Railway

### Backend:
```
Root Directory:   backend
Build Command:    (vazio)
Start Command:    npm start
Install Command:  npm ci
```

### Frontend:
```
Root Directory:   frontend
Build Command:    npm run build
Start Command:    npm start
Install Command:  npm ci
```

---

## 🆘 Ainda com Problemas?

### Ver logs detalhados:

1. No Railway Dashboard, clique no deploy
2. Vá em "View Logs"
3. Procure por erros específicos

### Testar localmente primeiro:

```bash
# Backend
cd backend
npm install
npm start

# Frontend (outro terminal)
cd frontend
npm install
npm run build
npm start
```

Se funcionar localmente, o problema é na configuração do Railway.

---

## 💡 Dica Importante

O Railway precisa que você especifique qual pasta deployar porque você tem uma estrutura monorepo (backend e frontend separados).

**SEMPRE configure o "Root Directory"** antes de fazer deploy!

---

## 📝 Ordem Correta de Deploy

1. ✅ Commit tudo no Git e push
2. ✅ Railway: Deploy Backend (Root: `backend`)
3. ✅ Anotar URL do backend
4. ✅ Railway: Deploy Frontend (Root: `frontend`)
5. ✅ Configurar variáveis de ambiente com as URLs
6. ✅ Redeploy ambos

---

## ⚡ Solução Rápida

Se você já criou o serviço no Railway e está com erro:

1. Vá em **Settings** do serviço
2. **Root Directory** → `backend` (ou `frontend`) 
3. **Start Command** → `npm start`
4. **Redeploy**

Pronto! ✅

---

**Atualizado:** 2026-01-18
