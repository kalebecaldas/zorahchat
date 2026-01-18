# 💬 ZORAH CHAT

Sistema de chat em tempo real com suporte a workspaces, canais, mensagens diretas e upload de arquivos.

## 🚀 Tecnologias

### Backend
- **Node.js** + **Express**
- **Socket.IO** para comunicação em tempo real
- **SQLite** para banco de dados
- **JWT** para autenticação
- **Multer** para upload de arquivos

### Frontend
- **React** + **Vite**
- **React Router** para navegação
- **Socket.IO Client** para WebSocket
- **CSS moderno** com design responsivo

## 📋 Funcionalidades

✅ Autenticação de usuários (login/cadastro)  
✅ Criação e gerenciamento de workspaces  
✅ Canais públicos e privados  
✅ Mensagens diretas (DM)  
✅ Status online/offline em tempo real  
✅ Indicador de digitação  
✅ Upload e compartilhamento de arquivos  
✅ Notificações de mensagens não lidas  
✅ Interface responsiva e moderna  

## 🏃 Rodando Localmente

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Instalação Rápida

```bash
# Clonar o repositório
git clone <seu-repositorio>
cd "ZORAH CHAT"

# Dar permissão de execução ao script
chmod +x start_system.sh

# Iniciar o sistema (backend + frontend)
./start_system.sh
```

O sistema estará disponível em:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001

### Instalação Manual

#### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 🌐 Deploy para Produção (Railway)

### Verificação Pré-Deploy

Execute o script de verificação:

```bash
./check_deploy.sh
```

### Guias de Deploy

📘 **[RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)** - Guia completo passo a passo  
📋 **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)** - Checklist interativo  

### Resumo Rápido

1. **Criar projeto no Railway** → https://railway.app
2. **Deploy Backend:**
   - Conectar repositório Git
   - Selecionar pasta `backend`
   - Configurar variáveis de ambiente (ver `.env.example`)
   - Deploy automático
3. **Deploy Frontend:**
   - Adicionar novo serviço
   - Selecionar pasta `frontend`
   - Configurar variáveis de ambiente com URL do backend
   - Deploy automático
4. **Atualizar Backend** com URL do frontend

## 📁 Estrutura do Projeto

```
ZORAH CHAT/
├── backend/
│   ├── routes/          # Rotas da API
│   ├── middleware/      # Middlewares de autenticação
│   ├── services/        # Lógica de negócio
│   ├── uploads/         # Arquivos enviados
│   ├── database.js      # Configuração do banco
│   ├── index.js         # Servidor principal
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── context/     # Context API (Auth, Socket)
│   │   ├── pages/       # Páginas da aplicação
│   │   └── App.jsx
│   ├── public/
│   └── package.json
├── RAILWAY_DEPLOY.md    # Guia de deploy
├── DEPLOY_CHECKLIST.md  # Checklist de deploy
├── check_deploy.sh      # Script de verificação
└── start_system.sh      # Script de inicialização local
```

## 🔧 Configuração

### Variáveis de Ambiente

#### Backend (.env)

```env
PORT=3001
JWT_SECRET=seu_secret_super_seguro
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter usuário atual

### Workspaces
- `GET /api/workspaces` - Listar workspaces
- `POST /api/workspaces` - Criar workspace
- `GET /api/workspaces/:id` - Detalhes do workspace

### Canais
- `GET /api/channels/:workspaceId` - Listar canais
- `POST /api/channels` - Criar canal
- `DELETE /api/channels/:id` - Deletar canal

### Mensagens
- `GET /api/messages/:channelId` - Obter mensagens do canal
- `POST /api/messages` - Enviar mensagem

### WebSocket Events

#### Client → Server
- `join-workspace` - Entrar em workspace
- `join-channel` - Entrar em canal
- `join-dm` - Entrar em DM
- `typing` - Indicador de digitação

#### Server → Client
- `new-message` - Nova mensagem recebida
- `user-status-change` - Mudança de status de usuário
- `user-typing` - Usuário digitando

## 🧪 Healthcheck

O backend possui endpoint de healthcheck para monitoramento:

```bash
GET /health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2026-01-18T07:00:00.000Z",
  "uptime": 123.45
}
```

## 🐛 Troubleshooting

### Problema: WebSocket não conecta

**Solução:** Verifique se as URLs em `VITE_WS_URL` estão corretas e se o backend está rodando.

### Problema: CORS Error

**Solução:** Confirme que `FRONTEND_URL` no backend está configurada corretamente.

### Problema: Upload de arquivo falha

**Solução:** Verifique se a pasta `backend/uploads/` existe e tem permissões de escrita.

## 🔒 Segurança

- ✅ Autenticação JWT
- ✅ CORS configurado
- ✅ Validação de entrada
- ✅ Sanitização de dados
- ⚠️ Considere adicionar rate limiting em produção
- ⚠️ Use HTTPS em produção

## 📊 Performance

- WebSocket para comunicação em tempo real (baixa latência)
- Paginação de mensagens
- Lazy loading de canais
- Otimização de queries no SQLite

## 🗺️ Roadmap

- [ ] Suporte a threads em mensagens
- [ ] Reações com emojis
- [ ] Busca global de mensagens
- [ ] Integração com bots
- [ ] Dark mode
- [ ] Notificações push
- [ ] Videochamadas
- [ ] Compartilhamento de tela

## 📝 Licença

Este projeto está sob licença MIT.

## 👥 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📞 Suporte

Para dúvidas e suporte:
- Abra uma issue no repositório
- Consulte a documentação em `/docs`

---

**Desenvolvido com ❤️ para comunicação em tempo real**
