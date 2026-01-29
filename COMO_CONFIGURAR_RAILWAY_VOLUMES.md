# 🚀 Como Configurar Railway Volumes (Passo a Passo Simples)

## Por que preciso disso?

Sem volumes, quando você faz um novo deploy no Railway, **todos os arquivos enviados somem**. Com volumes, os arquivos ficam salvos permanentemente.

## ⚙️ Configuração (3 Passos)

### Passo 1: Acessar seu Projeto

1. Entre no Railway: https://railway.app/dashboard
2. Clique no seu projeto **ZORAH CHAT**
3. Clique no serviço **backend**

### Passo 2: Criar o Volume

1. No menu lateral, clique em **Settings** (ícone de engrenagem ⚙️)
2. Role a página até encontrar a seção **"Volumes"**
3. Clique no botão **"+ New Volume"** ou **"Add Volume"**

### Passo 3: Configurar o Volume

Na tela que abrir, preencha:

```
Volume Name: uploads
Mount Path: /app/backend/uploads
```

**⚠️ IMPORTANTE**: O `Mount Path` deve ser **exatamente** `/app/backend/uploads`

Clique em **"Add"** ou **"Create"**

### Passo 4: Fazer Redeploy

1. Clique em **"Deployments"** no menu lateral
2. Clique em **"Redeploy"** no último deployment
3. Aguarde o deploy completar (1-2 minutos)

## ✅ Testar se Funcionou

1. **Envie uma imagem no chat**
2. **No Railway, faça outro "Redeploy"**
3. **Recarregue a página do chat**
4. **A imagem deve continuar visível!** ✅

Se a imagem sumiu, algo está errado. Verifique se o Mount Path está correto.

## 💰 Quanto Custa?

- **Primeiro 1GB**: GRÁTIS 🎉
- **Depois**: $0.25/GB por mês

**Exemplo**:
- 500 fotos = ~1GB = Grátis
- 5000 fotos = ~10GB = $2.50/mês

## 📊 Ver Quanto Você Está Usando

1. Railway → Settings → Volumes
2. Veja "Size: X MB" ou "X GB"

## 🎯 Pronto!

Agora seus arquivos ficam salvos permanentemente no Railway! 🚀

---

**Dúvidas?** Veja o arquivo `RAILWAY_VOLUMES_SETUP.md` para mais detalhes.
