# Painel de Administração Master

## Acesso

O painel de administração é restrito ao usuário master do sistema.

**Credenciais Master**:
- Email: `kalebecaldas@iaamazonas.com.br`
- Senha: `mxskqgltne`

**URL**: `https://seu-dominio.railway.app/admin`

## Funcionalidades

### 📊 Dashboard
- Estatísticas em tempo real do sistema
- Total de usuários, workspaces, canais e mensagens
- Usuários online agora
- Mensagens enviadas (24h, 7 dias, total)

### 👥 Gerenciamento de Usuários
- Lista de todos os usuários do sistema
- Busca por nome ou email
- Banir/desbanir usuários
- Ver estatísticas de cada usuário:
  - Número de workspaces
  - Total de mensagens enviadas
  - Status atual (online/offline/away/busy)
  - Data de cadastro

### 🏢 Gerenciamento de Workspaces
- Lista de todos os workspaces
- Busca por nome, slug ou owner
- Ver detalhes:
  - Número de membros
  - Número de canais
  - Total de mensagens
  - Owner e data de criação
- Deletar workspaces (com confirmação e motivo)

### ⚙️ Sistema
- Informações do servidor:
  - Sistema operacional
  - Uptime
  - Memória usada
  - Versão do Node.js
  - Tipo de banco de dados (PostgreSQL/SQLite)
- Logs de auditoria:
  - Histórico de ações administrativas
  - Banimentos e desbanimentos
  - Deleções de workspaces

## Segurança

- Apenas o email master tem acesso
- Middleware `masterAuth` verifica cada requisição
- Todas as ações são registradas na tabela `admin_audit_log`
- Usuários não-master são redirecionados automaticamente

## Logs de Auditoria

Todas as ações administrativas são registradas:
- Banir/desbanir usuários
- Deletar workspaces
- Outras ações sensíveis

Formato do log:
```json
{
  "admin_user_id": 1,
  "action": "ban_user",
  "target_type": "user",
  "target_id": 5,
  "details": { "reason": "Violação de termos" },
  "created_at": "2026-01-27T..."
}
```

## Endpoints da API

Todos os endpoints requerem token JWT do usuário master.

**GET** `/api/admin/stats`
- Retorna estatísticas gerais do sistema

**GET** `/api/admin/users`
- Retorna lista de todos os usuários

**PUT** `/api/admin/users/:userId/ban`
- Body: `{ "banned": true/false, "reason": "..." }`
- Bane ou desbane um usuário

**GET** `/api/admin/workspaces`
- Retorna lista de todos os workspaces

**DELETE** `/api/admin/workspaces/:workspaceId`
- Body: `{ "reason": "..." }`
- Deleta um workspace

**GET** `/api/admin/system`
- Retorna informações do servidor

**GET** `/api/admin/audit-logs`
- Query: `?limit=50`
- Retorna logs de auditoria

## Notas Técnicas

1. O painel usa tema dark personalizado
2. Design responsivo (funciona em mobile)
3. Auto-refresh de estatísticas a cada 30 segundos
4. Confirmação antes de ações destrutivas (deletar, banir)
