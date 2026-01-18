# ✅ Checklist de Deploy - ZORAH CHAT no Railway

## 📦 Preparação Local

- [x] Arquivos de configuração criados
  - [x] `backend/.env.example`
  - [x] `frontend/.env.example`
  - [x] `backend/railway.json`
  - [x] `frontend/railway.json`
  - [x] `.gitignore` atualizado
  
- [x] Scripts de produção adicionados
  - [x] Backend: `npm start`
  - [x] Frontend: `npm run build` e `npm start`

- [x] Código atualizado
  - [x] Backend usa variáveis de ambiente
  - [x] CORS configurado dinamicamente
  - [x] Endpoint `/health` adicionado

## 🚀 Deploy no Railway

### Backend

- [ ] Criar conta no Railway (https://railway.app)
- [ ] Criar novo projeto
- [ ] Conectar repositório Git
- [ ] Selecionar diretório `backend`
- [ ] Configurar variáveis de ambiente:
  ```
  PORT=3001
  JWT_SECRET=[gerar_um_secret_forte]
  NODE_ENV=production
  FRONTEND_URL=[será_preenchido_depois]
  ```
- [ ] Deploy automático
- [ ] Anotar URL do backend: `_______________________________`

### Frontend

- [ ] Adicionar novo serviço ao projeto
- [ ] Conectar mesmo repositório
- [ ] Selecionar diretório `frontend`
- [ ] Configurar variáveis de ambiente:
  ```
  VITE_API_URL=[URL_DO_BACKEND]
  VITE_WS_URL=[URL_DO_BACKEND]
  ```
- [ ] Deploy automático
- [ ] Anotar URL do frontend: `_______________________________`

### Configuração Final

- [ ] Voltar ao backend no Railway
- [ ] Atualizar `FRONTEND_URL` com a URL do frontend
- [ ] Redeploy do backend
- [ ] Testar conexão entre frontend e backend

## 🧪 Testes Pós-Deploy

- [ ] Acessar URL do frontend
- [ ] Fazer login / criar conta
- [ ] Criar workspace
- [ ] Criar canal
- [ ] Enviar mensagem
- [ ] Testar WebSocket (status online/offline)
- [ ] Testar upload de arquivos
- [ ] Verificar mensagens diretas

## 🔧 Configurações Opcionais

- [ ] Adicionar domínio customizado
- [ ] Configurar volume para persistência (SQLite)
- [ ] Configurar alertas/notificações
- [ ] Adicionar monitoramento de erros (Sentry)
- [ ] Configurar backup automático

## 📊 Monitoring

- [ ] Verificar endpoint `/health` do backend
- [ ] Configurar healthcheck no Railway
- [ ] Monitorar logs de erro
- [ ] Verificar uso de recursos (CPU/RAM)

## 🔒 Segurança

- [ ] JWT_SECRET único e forte gerado
- [ ] Variáveis de ambiente não commitadas
- [ ] CORS restrito ao domínio do frontend
- [ ] HTTPS habilitado (automático no Railway)
- [ ] Considerar rate limiting
- [ ] Validação de entrada em todas as rotas

## 📝 Notas Importantes

- Railway oferece $5 em créditos gratuitos mensais
- Mantenha as URLs anotadas para referência
- Faça backup do banco de dados regularmente
- Considere migrar para PostgreSQL em produção
- Monitore os logs frequentemente

## 🆘 Troubleshooting

Se algo não funcionar:

1. Verifique os logs no Railway Dashboard
2. Confirme todas as variáveis de ambiente
3. Teste o endpoint `/health` do backend
4. Verifique se CORS está correto
5. Confirme que WebSocket está habilitado
6. Consulte `RAILWAY_DEPLOY.md` para detalhes

## ✅ Deploy Completo!

Quando todos os itens estiverem marcados, seu sistema estará rodando em produção no Railway! 🎉

---

**Última atualização:** 2026-01-18
