# ZORAH CHAT - Guia de Deploy no Railway

Este guia descreve como fazer o deploy do sistema ZORAH CHAT no Railway.

## 📋 Pré-requisitos

- Conta no [Railway](https://railway.app/)
- Repositório Git (GitHub, GitLab ou Bitbucket)
- Código do projeto commitado

## 🚀 Deploy do Backend

### 1. Criar Novo Projeto no Railway

1. Acesse [Railway](https://railway.app/) e faça login
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha o repositório do ZORAH CHAT
5. Selecione o diretório `backend` como root directory

### 2. Configurar Variáveis de Ambiente

No painel do Railway, vá em "Variables" e adicione:

```env
PORT=3001
JWT_SECRET=seu_secret_super_seguro_aqui_mude_isso
NODE_ENV=production
FRONTEND_URL=https://seu-frontend.railway.app
```

**IMPORTANTE:** 
- Gere um JWT_SECRET forte e único
- O FRONTEND_URL será preenchido após o deploy do frontend

### 3. Configurar Build e Start

O Railway detectará automaticamente os scripts do `package.json`:
- **Build Command:** (não necessário)
- **Start Command:** `npm start` (já configurado no package.json)

### 4. Deploy

1. Clique em "Deploy"
2. Aguarde o build e deploy
3. Anote a URL gerada (ex: `https://zorah-backend-production.up.railway.app`)

## 🎨 Deploy do Frontend

### 1. Criar Novo Serviço

1. No mesmo projeto do Railway, clique em "+ New Service"
2. Selecione "Deploy from GitHub repo"
3. Escolha o mesmo repositório
4. Selecione o diretório `frontend` como root directory

### 2. Configurar Variáveis de Ambiente

No painel do Railway, vá em "Variables" e adicione:

```env
VITE_API_URL=https://sua-url-backend.railway.app
VITE_WS_URL=https://sua-url-backend.railway.app
```

**Substitua** `sua-url-backend.railway.app` pela URL do backend que você anotou anteriormente.

### 3. Configurar Build e Start

Configure os comandos:
- **Build Command:** `npm run build`
- **Start Command:** `npm start`

### 4. Deploy

1. Clique em "Deploy"
2. Aguarde o build e deploy
3. Anote a URL gerada (ex: `https://zorah-frontend-production.up.railway.app`)

### 5. Atualizar Backend com URL do Frontend

1. Volte ao serviço do backend
2. Atualize a variável `FRONTEND_URL` com a URL do frontend
3. Faça redeploy do backend

## 🔧 Configurações Adicionais

### Domínio Customizado (Opcional)

1. No Railway, vá em "Settings" do serviço
2. Clique em "Domains"
3. Adicione seu domínio customizado
4. Configure os DNS conforme instruído

### Persistência de Dados

O sistema usa SQLite. Para produção, considere:
- Usar Railway Volumes para persistir o banco de dados
- Migrar para PostgreSQL (recomendado para produção)

#### Adicionar Volume para SQLite:

1. No serviço backend, vá em "Data"
2. Clique em "+ Volume"
3. Configure:
   - Mount Path: `/app/data`
   - Size: 1GB (ajuste conforme necessário)

4. Atualize o código para salvar o database.sqlite em `/app/data/`

### Logs e Monitoramento

- Acesse logs em tempo real na aba "Deployments" > "View Logs"
- Configure alertas em "Settings" > "Notifications"

## 📊 Healthcheck

O backend possui endpoint de healthcheck em `/health` que retorna:
```json
{
  "status": "ok",
  "timestamp": "2026-01-18T07:00:00.000Z",
  "uptime": 123.45
}
```

## 🔒 Segurança

### Checklist de Segurança:

- ✅ JWT_SECRET único e forte
- ✅ CORS configurado apenas para o frontend
- ✅ Variáveis de ambiente não commitadas (.env no .gitignore)
- ✅ HTTPS habilitado (Railway fornece automaticamente)
- ⚠️ Considere adicionar rate limiting
- ⚠️ Implemente validação de entrada em todas as rotas

## 🚨 Troubleshooting

### Backend não conecta ao Frontend

1. Verifique se `FRONTEND_URL` no backend está correta
2. Verifique se `VITE_API_URL` e `VITE_WS_URL` no frontend estão corretas
3. Confirme que CORS está configurado corretamente

### WebSocket não funciona

1. Certifique-se de usar `https://` nas URLs (não `http://`)
2. Verifique se o Railway permite WebSocket (sim, por padrão)
3. Confira os logs do backend para erros de conexão

### Build falha

1. Verifique os logs de build no Railway
2. Certifique-se de que todas as dependências estão no `package.json`
3. Execute `npm install` localmente para verificar problemas

## 📝 Comandos Úteis

### Testar localmente antes do deploy:

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run build
npm start
```

### Ver logs em produção:

Use a interface do Railway ou instale o CLI:

```bash
npm install -g @railway/cli
railway login
railway logs
```

## 🔄 Atualizar Aplicação

1. Faça commit das mudanças no Git
2. Push para o repositório
3. Railway fará deploy automaticamente (se configurado)
4. Ou clique em "Redeploy" manualmente no Railway

## 🎯 Próximos Passos

- [ ] Configurar domínio customizado
- [ ] Implementar backup automático do banco de dados
- [ ] Adicionar monitoramento de erro (ex: Sentry)
- [ ] Configurar CI/CD com testes automatizados
- [ ] Considerar migração para PostgreSQL

---

## 💡 Dicas

- Railway oferece $5/mês em créditos gratuitos
- Use o plano Hobby ($5/mês) para projetos pequenos
- Configure variáveis de ambiente antes do primeiro deploy
- Mantenha staging e production separados

## 📞 Suporte

- Documentação Railway: https://docs.railway.app/
- Discord Railway: https://discord.gg/railway
- Issues: Abra uma issue no repositório do projeto
