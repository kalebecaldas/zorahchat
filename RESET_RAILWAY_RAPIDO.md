# 🚂 Reset Railway - Guia Rápido

## 🎯 Comando Único

```bash
cd backend
railway run node scripts/resetRailway.js
```

---

## ⚡ Passo a Passo Ultra Rápido

### 1️⃣ **Instalar Railway CLI** (se ainda não tem)

```bash
# macOS/Linux
brew install railway

# Ou via npm
npm install -g @railway/cli
```

### 2️⃣ **Login no Railway**

```bash
railway login
```

### 3️⃣ **Linkar Projeto**

```bash
cd "/Users/kalebecaldas/Downloads/ZORAH CHAT/backend"
railway link
```

Selecione seu projeto quando perguntado.

### 4️⃣ **Executar Reset**

```bash
railway run node scripts/resetRailway.js
```

**Aguarde ~20 segundos**

### 5️⃣ **Verificar**

```bash
# Login na app
# https://sua-app.railway.app/login
# Email: kalebe.caldas@hotmail.com
# Senha: mxskqgltne
```

---

## ✅ O Que Acontece

1. ⏰ Script aguarda 5 segundos
2. 🗑️ Deleta TODOS os dados do PostgreSQL
3. 🔐 Cria usuário master
4. ✅ Confirma sucesso

**Resultado:**
- ✅ 1 usuário (master)
- ✅ 0 workspaces
- ✅ 0 mensagens

---

## ⚠️ AVISOS

- ❌ **IRREVERSÍVEL!** Todos os dados serão perdidos
- ⏰ Escolha horário de baixo uso
- 👥 Avise os usuários antes

---

## 🆘 Problemas?

### Railway CLI não instalado?

```bash
# Instalar via npm
npm install -g @railway/cli

# Verificar
railway --version
```

### Não linkado ao projeto?

```bash
cd backend
railway link
# Escolha seu projeto Zorah Chat
```

### Erro ao executar?

```bash
# Ver logs
railway logs

# Reconectar
railway link --force
```

---

## 📝 Depois do Reset

1. ✅ Login: `kalebe.caldas@hotmail.com` / `mxskqgltne`
2. ✅ Criar workspace
3. ✅ Convidar usuários

---

## 🚀 Comando Final

```bash
cd backend && railway run node scripts/resetRailway.js
```

**Pronto! 🎉**
