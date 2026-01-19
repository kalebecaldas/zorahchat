# 🚀 Guia Rápido - Reset de Banco de Dados

## Qual script usar?

```
┌─────────────────────────────────────────────────────────────┐
│  PRECISA RESETAR O QUÊ?                                     │
└─────────────────────────────────────────────────────────────┘

  🔴 TUDO (users + workspaces)
     → ./quick_reset.sh              [MAIS RÁPIDO]
     → ./reset_railway_db.sh         [MAIS ROBUSTO]
     → reset_database.sql            [MANUAL]

  🟡 APENAS WORKSPACES (mantém users)
     → ./reset_workspaces_only.sh

  🟢 CUSTOMIZADO
     → Edite reset_database.sql
```

## Comandos Rápidos

### 1️⃣ Reset Completo (Desenvolvimento)
```bash
./quick_reset.sh
```
**Resultado:** Tudo zerado + admin@iaam.com criado

### 2️⃣ Reset Apenas Workspaces
```bash
./reset_workspaces_only.sh
```
**Resultado:** Workspaces zerados + usuários mantidos

### 3️⃣ Reset Completo (Produção)
```bash
./reset_railway_db.sh
```
**Resultado:** Reset com detecção automática de DB

## Pré-requisitos

```bash
# Instalar Railway CLI (escolha um)
npm install -g @railway/cli
brew install railway

# Login e link
railway login
railway link
```

## Após o Reset

| Item | Valor |
|------|-------|
| Email | admin@iaam.com |
| Senha | admin123 |
| Workspace | IAAM |
| Canais | general, random |

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!

## Troubleshooting

```bash
# Erro: Railway CLI not found
npm install -g @railway/cli

# Erro: Not logged in
railway login

# Erro: Permission denied
chmod +x *.sh

# Ver logs do Railway
railway logs

# Testar conexão com DB
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

## Estrutura do Banco

```
users
  ├── workspaces (owner_id)
  │   ├── workspace_users
  │   ├── channels
  │   │   ├── channel_members
  │   │   └── messages
  │   └── direct_messages
  │       └── messages
  └── notifications
```

## Ordem de Deleção (Foreign Keys)

```
1. mentions
2. notifications
3. channel_members
4. workspace_join_requests
5. read_receipts
6. message_reactions
7. messages
8. direct_messages
9. channels
10. workspace_users
11. workspaces
12. users
```

## Scripts Disponíveis

| Script | Tamanho | Uso |
|--------|---------|-----|
| `quick_reset.sh` | 1.7K | Reset rápido (dev) |
| `reset_railway_db.sh` | 4.5K | Reset robusto (prod) |
| `reset_workspaces_only.sh` | 2.5K | Mantém usuários |
| `reset_database.sql` | 3.0K | SQL puro |

## Exemplos de Uso

### Desenvolvimento Local
```bash
# Reset rápido durante desenvolvimento
./quick_reset.sh
```

### Staging/Produção
```bash
# Backup primeiro
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Reset
./reset_railway_db.sh

# Verificar
railway run psql $DATABASE_URL -c "\dt"
```

### Limpar Workspaces de Teste
```bash
# Mantém usuários reais, limpa workspaces
./reset_workspaces_only.sh
```

## Verificação Pós-Reset

```bash
# Contar registros
railway run psql $DATABASE_URL << EOF
SELECT 'Users' as tabela, COUNT(*) FROM users
UNION ALL SELECT 'Workspaces', COUNT(*) FROM workspaces
UNION ALL SELECT 'Channels', COUNT(*) FROM channels;
EOF

# Testar login
curl -X POST https://seu-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@iaam.com","password":"admin123"}'
```

## Segurança

✅ **Fazer:**
- Backup antes de resetar produção
- Alterar senha do admin após reset
- Usar em ambiente de desenvolvimento

❌ **Não fazer:**
- Resetar produção sem backup
- Compartilhar scripts com senhas hardcoded
- Executar sem confirmar o ambiente

## Suporte

📚 Documentação completa: `RESET_DATABASE.md`
🐛 Problemas? Verifique os logs: `railway logs`
💬 Dúvidas? Consulte a documentação do Railway
