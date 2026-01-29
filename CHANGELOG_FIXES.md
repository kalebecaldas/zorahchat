# Changelog - Correções e Melhorias

## Versão: 2026-01-27

### Correções de Bugs

#### 1. URLs de Arquivos (Railway)
**Problema**: Arquivos não abriam no Railway devido a URL hardcoded `hostname:3001`

**Solução**:
- Alterado para usar `VITE_API_URL` do environment
- Fallback inteligente: `import.meta.env.VITE_API_URL || window.location.protocol + hostname:3001`
- Arquivos afetados:
  - `frontend/src/components/FileModal.jsx`
  - `frontend/src/components/ChatWindow.jsx`

**Configuração necessária no Railway**:
```env
VITE_API_URL=https://seu-backend.railway.app
```

#### 2. Status Offline ao Trocar Workspace
**Problema**: Status do usuário mudava para offline ao navegar entre workspaces

**Solução**:
- Adicionado persistência de status no `localStorage`
- AuthContext restaura status salvo ao carregar
- `handleStatusChange` agora salva em localStorage
- Logs adicionados para rastreamento
- Arquivos alterados:
  - `frontend/src/context/AuthContext.jsx` - restaura status do localStorage
  - `frontend/src/components/Sidebar.jsx` - salva status no localStorage

#### 3. Bugs de Carregamento da Página
**Problema**: Página de chat tinha bugs ao carregar

**Solução**:
- Adicionado estado de loading com spinner
- Melhor tratamento de erros no fetch de canais
- Loading state persiste até navegação completar
- Arquivo alterado:
  - `frontend/src/pages/Chat.jsx` - adicionado loading state e UI

#### 4. Contador de Mensagens Próprias
**Problema**: Contador aparecia para mensagens enviadas pelo próprio usuário

**Solução**:
- Query de contadores exclui mensagens do próprio usuário (`m.user_id != ?`)
- Comparação por ID de mensagem em vez de timestamp
- Read receipt atualizado ao enviar
- Sidebar ignora atualização se mensagem própria
- Arquivos alterados:
  - `backend/routes/messages.js` - query e lógica de read_receipt
  - `frontend/src/components/Sidebar.jsx` - lógica de new-message
  - `frontend/src/components/ChatWindow.jsx` - markAsRead ao enviar

### Novas Funcionalidades

#### Painel de Administração Master
Acesso exclusivo para: `kalebecaldas@iaamazonas.com.br`

**Componentes Backend**:
- `backend/middleware/masterAuth.js` - middleware de autenticação master
- `backend/routes/admin.js` - endpoints de admin
- `backend/database.js` - tabela `admin_audit_log`

**Componentes Frontend**:
- `frontend/src/pages/Admin.jsx` - página principal
- `frontend/src/components/admin/AdminDashboard.jsx` - dashboard
- `frontend/src/components/admin/AdminUsers.jsx` - gerenciamento de usuários
- `frontend/src/components/admin/AdminWorkspaces.jsx` - gerenciamento de workspaces
- `frontend/src/components/admin/AdminSystem.jsx` - info do sistema
- `frontend/src/styles/Admin.css` - estilos do painel

**Funcionalidades**:
- Dashboard com estatísticas em tempo real
- Gerenciamento completo de usuários (banir/desbanir)
- Gerenciamento de workspaces (deletar, ver detalhes)
- Informações do sistema (servidor, memória, uptime)
- Logs de auditoria de ações administrativas

**Rotas**:
- `/admin` - painel principal (protegido)

**Endpoints API**:
- `GET /api/admin/stats` - estatísticas
- `GET /api/admin/users` - todos usuários
- `PUT /api/admin/users/:userId/ban` - banir usuário
- `GET /api/admin/workspaces` - todos workspaces
- `DELETE /api/admin/workspaces/:id` - deletar workspace
- `GET /api/admin/system` - info do servidor
- `GET /api/admin/audit-logs` - logs de auditoria

### Melhorias Técnicas

1. **Suporte aprimorado para PostgreSQL**:
   - Sistema já suportava via adapter
   - Queries compatíveis com ambos (SQLite e PostgreSQL)

2. **Logs de auditoria**:
   - Tabela `admin_audit_log` criada
   - Registra todas as ações administrativas
   - Permite rastreabilidade completa

3. **Segurança**:
   - Middleware dedicado para verificar acesso master
   - Validação de email antes de permitir ações
   - Redirecionamento automático se não for master

## Como Testar

### Localmente
```bash
# Backend
cd backend
npm install
node index.js

# Frontend
cd frontend
npm install
npm run dev

# Acessar admin
http://localhost:5173/admin
```

### No Railway
1. Deploy e configure variáveis de ambiente
2. Acesse `https://seu-dominio.railway.app/admin`
3. Login com credenciais master
4. Verifique todas as funcionalidades

## Variáveis de Ambiente Necessárias

**Backend** (`.env` no Railway):
```env
DATABASE_URL=postgresql://...
JWT_SECRET=seu_secret_aqui
FRONTEND_URL=https://seu-frontend.railway.app
```

**Frontend** (`.env` no Railway):
```env
VITE_API_URL=https://seu-backend.railway.app
VITE_WS_URL=wss://seu-backend.railway.app
```

## Próximos Passos Recomendados

1. **Storage de Arquivos**: Integrar com S3/Cloudinary para persistência no Railway
2. **Melhorias no Admin**:
   - Gráficos de uso ao longo do tempo
   - Exportar dados em CSV
   - Reset de senha de usuários
   - Transferir ownership de workspaces
3. **Monitoramento**: Adicionar métricas e alertas
