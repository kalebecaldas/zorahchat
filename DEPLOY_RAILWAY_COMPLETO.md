# 🚂 Deploy Completo no Railway

## 📊 Estado Atual

```
✅ Backend: Pronto para deploy
✅ Frontend: Pronto para deploy (com PWA!)
✅ Railway CLI: Instalado e configurado
✅ Projeto: Linkado (respectful-enthusiasm)
```

---

## 🎯 Estrutura de Deploy

### **Dois Serviços no Railway:**

1. **BACKEND CHAT** (Node.js + Express + Socket.IO)
   - API REST
   - WebSockets
   - PostgreSQL
   - Uploads

2. **FRONTEND CHAT** (React + Vite)
   - PWA
   - Interface web
   - Instalável como app

---

## 🚀 Passo a Passo

### **1. Deploy do Backend**

```bash
cd "/Users/kalebecaldas/Downloads/ZORAH CHAT/backend"
```

#### **Verificar variáveis de ambiente:**

```bash
railway variables
```

**Necessário:**
- ✅ `DATABASE_URL` - PostgreSQL (Railway provisiona automaticamente)
- ✅ `PORT` - 3001 (ou Railway define)
- ✅ `JWT_SECRET` - Seu secret key
- ✅ `NODE_ENV` - production

**Adicionar se não existir:**

```bash
railway variables set JWT_SECRET=sua_chave_super_secreta_aqui
railway variables set NODE_ENV=production
```

#### **Deploy:**

```bash
railway up
```

**Aguardar:** ~2-3 minutos

**Verificar:**

```bash
railway logs
# Deve mostrar: "Server running on port..."
```

**Pegar URL do backend:**

```bash
railway open
# Copie a URL (ex: https://backend-chat-xyz.up.railway.app)
```

---

### **2. Deploy do Frontend**

```bash
cd "/Users/kalebecaldas/Downloads/ZORAH CHAT/frontend"
```

#### **Configurar variáveis de ambiente:**

**IMPORTANTE:** Substitua pela URL real do backend!

```bash
# Exemplo (substitua pela sua URL)
railway variables set VITE_API_URL=https://backend-chat-zorah-faturamento-iaam.up.railway.app
railway variables set VITE_WS_URL=https://backend-chat-zorah-faturamento-iaam.up.railway.app
```

#### **Verificar package.json:**

Certifique-se de ter o script `start`:

```json
{
  "scripts": {
    "start": "vite preview --port ${PORT:-4173} --host 0.0.0.0"
  }
}
```

#### **Deploy:**

```bash
railway up
```

**Aguardar:** ~3-5 minutos (build + deploy)

**Verificar:**

```bash
railway logs
# Deve mostrar: "Local: http://..."
```

**Pegar URL do frontend:**

```bash
railway open
# Copie a URL (ex: https://frontend-chat-xyz.up.railway.app)
```

---

### **3. Testar o Sistema**

#### **Backend:**

```bash
# Testar API
curl https://[backend-url].railway.app/api/health

# Deve retornar: {"status":"ok"}
```

#### **Frontend:**

1. Abra a URL do frontend no navegador
2. ✅ Tela de login deve carregar
3. ✅ Fazer login
4. ✅ Criar/entrar em workspace
5. ✅ Enviar mensagens
6. ✅ Receber mensagens em tempo real

---

## 📱 Testar PWA (Mobile)

### **No Celular (Android):**

1. Abra a URL do frontend no Chrome
2. Aguarde 5 segundos
3. Banner "Instalar ZORAH CHAT" aparecerá
4. Clique em "Instalar App"
5. ✅ App instalado!

### **No Celular (iOS):**

1. Abra a URL do frontend no Safari
2. Toque em "Compartilhar" (□↑)
3. "Adicionar à Tela de Início"
4. Toque em "Adicionar"
5. ✅ App instalado!

---

## 🔧 Configuração Railway (Interface Web)

### **Backend Service:**

**General:**
- Name: BACKEND CHAT
- Environment: Zorah Faturamento IAAM

**Settings:**
- Root Directory: `/backend`
- Start Command: `npm start`
- Watch Paths: `backend/**`

**Variables:**
```
DATABASE_URL: (auto-provisionado pelo Railway)
PORT: (auto-provisionado pelo Railway)
JWT_SECRET: sua_chave_secreta
NODE_ENV: production
```

**Deployment:**
- ✅ Auto-deploy: On (cada push no git)
- ✅ Build: On
- ✅ Deploy: On

---

### **Frontend Service:**

**General:**
- Name: FRONTEND CHAT
- Environment: Zorah Faturamento IAAM

**Settings:**
- Root Directory: `/frontend`
- Build Command: `npm run build`
- Start Command: `npm run start`
- Watch Paths: `frontend/**`

**Variables:**
```
VITE_API_URL: https://[backend-url].railway.app
VITE_WS_URL: https://[backend-url].railway.app
```

**Deployment:**
- ✅ Auto-deploy: On
- ✅ Build: On
- ✅ Deploy: On

---

## 🗄️ PostgreSQL (Banco de Dados)

### **Status:**

```bash
railway connect postgres
```

Conecta diretamente ao PostgreSQL.

### **Verificar Tabelas:**

```sql
\dt  -- Listar tabelas

SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM workspaces;
SELECT COUNT(*) FROM messages;

\q  -- Sair
```

### **Backup (Recomendado):**

```bash
# Railway faz backup automático
# Mas você pode fazer manual:

railway run -- pg_dump $DATABASE_URL > backup.sql
```

### **Reset do Banco:**

```bash
cd backend
railway run node scripts/resetRailway.js
```

---

## 📊 Monitoramento

### **Logs em Tempo Real:**

```bash
# Backend
cd backend
railway logs --tail

# Frontend
cd frontend
railway logs --tail
```

### **Métricas:**

No dashboard do Railway:
- CPU usage
- Memory usage
- Network usage
- Deploy status

### **Alertas:**

Configurar no Railway:
- Notificar se serviço cair
- Notificar se deploy falhar

---

## 🐛 Troubleshooting

### **Problema: Backend não conecta ao banco**

**Verificar:**

```bash
railway variables | grep DATABASE_URL
```

**Solução:**
- Provisionar PostgreSQL no Railway
- Aguardar DATABASE_URL ser criado
- Re-deploy

### **Problema: Frontend não conecta ao backend**

**Verificar:**

```bash
# No console do navegador
console.log(import.meta.env.VITE_API_URL)
console.log(import.meta.env.VITE_WS_URL)
```

**Solução:**
```bash
# Atualizar variáveis
railway variables set VITE_API_URL=https://...
railway variables set VITE_WS_URL=https://...

# Re-deploy
railway up
```

### **Problema: CORS error**

**Verificar backend `server.js`:**

```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://frontend-chat-xyz.up.railway.app',  // Adicione sua URL
  ],
  credentials: true
}));
```

**Re-deploy:**
```bash
railway up
```

### **Problema: Socket.IO não conecta**

**Verificar:**
- URL correta (https://)
- CORS configurado
- Variável VITE_WS_URL correta

**Testar:**
```javascript
// No console do navegador
const socket = io('https://backend-url.railway.app');
socket.on('connect', () => console.log('Connected!'));
```

### **Problema: Build falha**

**Verificar logs:**
```bash
railway logs
```

**Causas comuns:**
- Dependências faltando
- Erro de sintaxe
- Variáveis de ambiente faltando

**Solução:**
```bash
# Instalar dependências
railway run npm install

# Re-deploy
railway up
```

---

## 📈 Performance

### **Otimizações:**

#### **Backend:**
- ✅ Compressão HTTP (gzip)
- ✅ Rate limiting
- ✅ PostgreSQL indexes
- ✅ Connection pooling

#### **Frontend:**
- ✅ Vite build otimizado
- ✅ Code splitting
- ✅ Tree shaking
- ✅ PWA caching

#### **CDN (Opcional):**
- Cloudflare (grátis)
- Vercel Edge
- Netlify

---

## 💰 Custos Railway

### **Free Tier:**
- $5 crédito mensal
- Suficiente para:
  - 1 backend pequeno
  - 1 frontend pequeno
  - 1 PostgreSQL pequeno

### **Pro Plan:**
- $20/mês
- Mais recursos
- Mais serviços
- Mais uptime

### **Dicas para economizar:**
- Usar apenas em produção
- Parar serviços não usados
- Limitar logs
- Usar cache agressivo

---

## 🔐 Segurança

### **Checklist:**

- [ ] ✅ HTTPS ativado (Railway faz automaticamente)
- [ ] ✅ JWT_SECRET forte
- [ ] ✅ CORS restrito
- [ ] ✅ Rate limiting ativo
- [ ] ✅ Senha do master forte
- [ ] ✅ Logs não expõem senhas
- [ ] ✅ Variables de ambiente protegidas
- [ ] ⚠️ Implementar autenticação 2FA (futuro)

---

## 🚀 CI/CD (Auto-deploy)

### **Via Git:**

Se conectar repositório Git ao Railway:

```bash
# 1. Criar repo no GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/zorah-chat
git push -u origin main

# 2. Conectar no Railway
# Dashboard → Connect Repo → Autorizar GitHub → Selecionar repo

# 3. Cada push faz deploy automático!
git push origin main  # Auto-deploy!
```

### **Via Railway CLI:**

```bash
# Deploy manual
railway up

# Deploy com watch (re-deploy ao salvar)
railway up --watch
```

---

## 📝 Comandos Úteis

### **Status:**
```bash
railway status
```

### **Variáveis:**
```bash
railway variables
railway variables set KEY=VALUE
railway variables unset KEY
```

### **Logs:**
```bash
railway logs
railway logs --tail
railway logs --filter error
```

### **Shell:**
```bash
railway run bash
railway run node
```

### **Banco:**
```bash
railway connect postgres
```

### **Deploy:**
```bash
railway up
railway up --detach
```

### **URLs:**
```bash
railway open
```

---

## 🎉 Resultado Final

Após o deploy completo, você terá:

✅ **Backend rodando** em `https://backend-xyz.railway.app`  
✅ **Frontend rodando** em `https://frontend-xyz.railway.app`  
✅ **PostgreSQL** funcionando  
✅ **Socket.IO** real-time  
✅ **PWA instalável** no celular  
✅ **SSL/HTTPS** automático  
✅ **Auto-deploy** (se conectar Git)  

**Sistema 100% funcional e acessível de qualquer lugar!** 🌍

---

## 📚 Próximos Passos

1. ✅ Deploy backend e frontend
2. ✅ Testar em diferentes dispositivos
3. ✅ Instalar PWA no celular
4. ⏳ Configurar domínio customizado (opcional)
5. ⏳ Implementar React Native (opcional)
6. ⏳ Publicar nas lojas (opcional)

---

**Tudo pronto! Apenas execute os comandos acima e seu sistema estará online!** 🚀
