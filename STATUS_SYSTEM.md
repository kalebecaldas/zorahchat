# Sistema de Status de Disponibilidade

## Visão Geral
O sistema de status permite que usuários indiquem sua disponibilidade no chat. O status é preservado entre refreshes da página e reconexões.

## Status Disponíveis

### Status Manuais (Escolha do Usuário)
Os usuários podem escolher entre os seguintes status:

1. **🟢 Online** - Disponível e ativo
2. **🌙 Away** - Ausente/Afastado
3. **⛔ Busy** - Ocupado/Não perturbe

### Status Automático
- **⚪ Offline** - Definido automaticamente quando o usuário se desconecta (fecha a aba, perde conexão, etc.)

## Comportamento

### Mudança de Status
- Quando o usuário muda seu status (Online → Away, por exemplo), essa mudança é:
  - Salva no banco de dados
  - Atualizada no contexto de autenticação (AuthContext)
  - Propagada via Socket.IO para todos os usuários conectados
  - **Preservada mesmo após refresh da página**

### Reconexão/Refresh
- Quando um usuário reconecta (refresh, nova aba, etc.):
  - Se o status era **Away** ou **Busy**: o status é **preservado**
  - Se o status era **Offline**: o usuário é automaticamente definido como **Online**
  - A lógica está no backend (`index.js`, linha ~116)

### Desconexão
- Quando um usuário fecha a aba ou perde conexão:
  - Se o status era **Online**: muda automaticamente para **Offline**
  - Se o status era **Away** ou **Busy**: o status é **preservado** (não muda para offline)
  - Isso permite que pessoas saibam que você está "away" mesmo desconectado

## Implementação Técnica

### Frontend
**Arquivo**: `frontend/src/components/Sidebar.jsx`
- Menu de seleção de status mostra apenas: Online, Away, Busy
- Função `handleStatusChange`: atualiza status no backend e contexto
- Socket listener `user-status-change`: recebe atualizações de outros usuários

**Arquivo**: `frontend/src/context/AuthContext.jsx`
- Função `updateUser`: permite atualizar o estado do usuário globalmente
- O status do usuário é recuperado na autenticação inicial

### Backend

**Arquivo**: `backend/routes/users.js`
- Rota `PUT /api/users/status`: permite atualizar status
- Validação: aceita apenas 'online', 'away', 'busy'

**Arquivo**: `backend/index.js`
- **Socket Connect** (linha ~109-138):
  - Verifica status atual do usuário
  - Se offline → muda para online
  - Se away/busy → preserva e apenas atualiza `last_seen`
  - Emite evento `user-status-change` para todos os clientes

- **Socket Disconnect** (linha ~199-235):
  - Verifica se usuário tem outras conexões ativas
  - Se não tem mais conexões:
    - Se status era 'online' → muda para 'offline'
    - Se status era 'away'/'busy' → preserva o status
  - Atualiza `last_seen`

## Banco de Dados
**Tabela**: `users`
- Coluna `status`: VARCHAR - valores possíveis: 'online', 'away', 'busy', 'offline'
- Coluna `last_seen`: TIMESTAMP - última vez que o usuário estava conectado
- Coluna `status_message`: VARCHAR - (futuro) mensagem personalizada de status

## Fluxo de Dados

### Mudança Manual de Status
```
1. Usuário clica no menu de status
2. Sidebar.handleStatusChange() → PUT /api/users/status
3. Backend atualiza no banco de dados
4. Backend retorna usuário atualizado
5. Frontend atualiza AuthContext.user.status
6. Frontend atualiza estado local userStatus
7. Socket.IO emite 'user-status-change' para todos
8. Todos os clientes recebem e atualizam a UI
```

### Refresh da Página
```
1. Página recarrega
2. AuthContext.useEffect → GET /api/auth/me
3. Retorna dados do usuário incluindo status atual
4. Socket conecta automaticamente
5. Backend verifica status:
   - Se offline → muda para online
   - Se away/busy → preserva
6. Emite 'user-status-change' para todos
7. UI exibe o status correto
```

### Desconexão
```
1. Socket desconecta (aba fechada, conexão perdida)
2. Backend detecta disconnect event
3. Verifica se há outras conexões ativas do usuário
4. Se não há:
   - Status online → muda para offline
   - Status away/busy → preserva
5. Emite 'user-status-change' para todos
6. Outros usuários veem a mudança de status
```

## Decisões de Design

### Por que "Offline" não é selecionável?
- **Offline** significa "não conectado ao sistema"
- Se o usuário está usando o app, ele está conectado, logo não está offline
- Para indicar indisponibilidade, deve usar "Away" ou "Busy"
- Isso evita confusão entre "offline intencional" vs "offline por desconexão"

### Por que preservar Away/Busy na desconexão?
- Permite que outros saibam que você está intencionalmente indisponível
- Diferencia desconexão intencional (busy/away) de desconexão acidental (offline)
- Melhora a comunicação entre membros da equipe

### Por que atualizar AuthContext?
- Centraliza o estado do usuário
- Garante consistência entre componentes
- Permite que o status sobreviva a navegação entre páginas
- O contexto persiste enquanto a aba está aberta

## Possíveis Melhorias Futuras
1. Adicionar `status_message` personalizável ("Em reunião", "Voltarei às 14h", etc.)
2. Mostrar tempo desde o `last_seen` ("visto há 5 minutos")
3. Auto-away após X minutos de inatividade
4. Notificações quando usuários importantes ficam online
5. Lista de "quem está online agora" filtrada por workspace
