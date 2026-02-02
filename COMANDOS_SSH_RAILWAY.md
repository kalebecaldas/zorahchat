# 🚂 Comandos para Atualizar Master User via Railway SSH

## 🎯 Objetivo

Atualizar o usuário master no PostgreSQL do Railway via SSH.

---

## 📋 Comandos Passo a Passo

### **1. Conectar via SSH ao Backend**

```bash
cd "/Users/kalebecaldas/Downloads/ZORAH CHAT/backend"
railway ssh
```

Você vai entrar no container do backend no Railway.

---

### **2. Executar o Script**

Dentro do SSH, execute:

```bash
node scripts/createMasterUser.js
```

**Aguarde ~2 segundos**

---

### **3. Verificar Resultado**

Deve aparecer:

```
[DATABASE] Using PostgreSQL (Detected DATABASE_URL)
🔐 Creating/updating master user...
📧 Email: kalebe.caldas@hotmail.com
✅ Master user updated successfully!
👤 User ID: X

📝 Login credentials:
   Email: kalebe.caldas@hotmail.com
   Password: mxskqgltne
```

---

### **4. Sair do SSH**

```bash
exit
```

---

### **5. Testar Login**

Acesse a URL do frontend:
```
https://[seu-frontend].railway.app/login
```

**Credenciais:**
- Email: `kalebe.caldas@hotmail.com`
- Senha: `mxskqgltne`

---

## 🔧 Comandos Completos (Copy-Paste)

### **Método 1: Via railway run (MAIS FÁCIL)** ⭐

```bash
cd "/Users/kalebecaldas/Downloads/ZORAH CHAT/backend"
railway run node scripts/createMasterUser.js
```

### **Método 2: Via SSH**

```bash
# 1. Conectar ao backend
cd "/Users/kalebecaldas/Downloads/ZORAH CHAT/backend"
railway ssh

# 2. Dentro do SSH, executar:
node scripts/createMasterUser.js

# 3. Sair
exit
```

---

## ⚠️ Se Dar Erro

### **Erro: "Cannot find module"**

O script pode não estar na build. Nesse caso, use um comando inline:

```bash
railway ssh

# Dentro do SSH:
node -e "
const bcryptjs = require('bcryptjs');
const { getDb, initializeDatabase } = require('./database');

async function updateMaster() {
  await initializeDatabase();
  const db = getDb();
  const hash = await bcryptjs.hash('mxskqgltne', 10);
  
  const existing = await db.get('SELECT id FROM users WHERE email = \$1', ['kalebe.caldas@hotmail.com']);
  
  if (existing) {
    await db.run('UPDATE users SET name = \$1, password = \$2, status = \$3 WHERE email = \$4', 
      ['Master Admin', hash, 'online', 'kalebe.caldas@hotmail.com']);
    console.log('✅ Master updated');
  } else {
    await db.run('INSERT INTO users (name, email, password, status) VALUES (\$1, \$2, \$3, \$4)',
      ['Master Admin', 'kalebe.caldas@hotmail.com', hash, 'online']);
    console.log('✅ Master created');
  }
  
  process.exit(0);
}

updateMaster();
"
```

---

## 🔍 Verificar Banco Direto (PostgreSQL)

Se quiser verificar diretamente no PostgreSQL:

```bash
# Conectar ao PostgreSQL
railway connect postgres

# Dentro do psql:
SELECT id, name, email FROM users WHERE email = 'kalebe.caldas@hotmail.com';

# Sair
\q
```

---

## ✅ Checklist

- [ ] Conectar via `railway ssh`
- [ ] Executar `node scripts/createMasterUser.js`
- [ ] Ver mensagem de sucesso
- [ ] Sair com `exit`
- [ ] Testar login no frontend
- [ ] ✅ Deve funcionar!

---

## 💡 Dica

Se estiver com pressa e quiser fazer tudo em um comando:

```bash
cd backend
railway run node scripts/createMasterUser.js
```

Este comando executa o script diretamente no Railway sem precisar entrar no SSH!

---

**Pronto! Execute e teste!** 🚀
