# 📦 Configuração de Railway Volumes para Arquivos

## O Que São Volumes?

Railway Volumes são **discos persistentes** que mantêm os arquivos mesmo quando:
- ✅ Servidor reinicia
- ✅ Novo deploy é feito
- ✅ Container é recriado

## 🚀 Configuração (Passo a Passo)

### 1. Acessar o Projeto no Railway

1. Acesse: https://railway.app/dashboard
2. Selecione seu projeto (ZORAH CHAT)
3. Clique no serviço **backend**

### 2. Criar o Volume

1. No painel do serviço, vá em **Settings** (⚙️)
2. Role até a seção **"Volumes"**
3. Clique em **"+ New Volume"**

### 3. Configurar o Volume

Preencha os campos:

```
Volume Name: uploads-storage
Mount Path: /app/backend/uploads
```

**Explicação**:
- `Volume Name`: Nome identificador (pode ser qualquer nome)
- `Mount Path`: **IMPORTANTE** - deve ser exatamente `/app/backend/uploads`
  - É onde o código salva os arquivos
  - Railway vai montar o volume persistente nesse caminho

### 4. Salvar e Fazer Deploy

1. Clique em **"Add Volume"**
2. Railway vai criar o volume
3. Clique em **"Deploy"** para reiniciar com o volume montado

## 📊 Detalhes Técnicos

### Estrutura de Diretórios

```
railway-project/
├── backend/
│   ├── uploads/           ← Volume montado aqui
│   │   ├── 1234-abc.jpg  ← Arquivos persistem
│   │   ├── 5678-def.png
│   │   └── 9012-ghi.pdf
│   ├── index.js
│   └── routes/
│       └── upload.js      ← Salva em ./uploads
```

### Como Funciona

```javascript
// backend/routes/upload.js
const uploadsDir = path.join(__dirname, '../uploads');
// → Resolve para: /app/backend/uploads

// Railway monta o volume em: /app/backend/uploads
// Então os arquivos vão para o volume persistente!
```

## ✅ Verificar se Está Funcionando

### Teste 1: Upload de Arquivo
1. Envie uma imagem no chat
2. Imagem deve aparecer normalmente

### Teste 2: Persistência (CRUCIAL)
1. No Railway, clique em **"Redeploy"** do backend
2. Aguarde o deploy completar
3. Atualize a página do chat
4. **As imagens antigas devem continuar visíveis!** ✅

### Teste 3: Verificar Volume no Railway

1. No Railway, vá em **Settings** do backend
2. Role até **Volumes**
3. Você deve ver:
   ```
   uploads-storage
   Mounted at: /app/backend/uploads
   Size: X MB
   ```

## 📈 Limites e Custos

### Railway Volume Pricing

| Uso | Custo |
|-----|-------|
| Primeiros **1 GB** | **GRÁTIS** |
| Acima de 1GB | **$0.25/GB/mês** |

**Exemplo de Uso**:
```
100 fotos (2MB cada) = 200MB = Grátis
1000 fotos (2MB cada) = 2GB = $0.25/mês
5000 fotos (2MB cada) = 10GB = $2.50/mês
```

### Monitorar Uso

No Railway Dashboard:
1. Acesse **Settings** → **Volumes**
2. Veja o tamanho atual: "Size: X MB"

## 🔧 Configuração Avançada (Opcional)

### Limitar Tamanho de Upload

Se quiser economizar espaço, limite o tamanho dos arquivos:

```javascript
// backend/routes/upload.js
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB (em vez de 50MB)
    }
});
```

### Limpeza Automática de Arquivos Antigos

Script para deletar arquivos com mais de 90 dias:

```javascript
// backend/scripts/cleanup-old-files.js
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');
const MAX_AGE_DAYS = 90;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function cleanupOldFiles() {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) return console.error('Error reading uploads:', err);

        const now = Date.now();
        
        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                
                const age = now - stats.mtimeMs;
                if (age > MAX_AGE_MS) {
                    fs.unlink(filePath, (err) => {
                        if (!err) console.log(`Deleted old file: ${file}`);
                    });
                }
            });
        });
    });
}

// Rodar diariamente
setInterval(cleanupOldFiles, 24 * 60 * 60 * 1000);
```

## 🆚 Comparação com Cloudinary

| Recurso | Railway Volumes | Cloudinary |
|---------|----------------|------------|
| **Setup** | ✅ Muito fácil (1 clique) | ⚠️ Requer cadastro e config |
| **Custo (1GB)** | ✅ Grátis | ✅ Grátis (25GB) |
| **Custo (10GB)** | $2.50/mês | ✅ Grátis |
| **CDN Global** | ❌ Não | ✅ Sim |
| **Performance** | ⚠️ Boa (single region) | ✅ Excelente (CDN) |
| **Backup** | ⚠️ Manual | ✅ Automático |
| **Escalabilidade** | ⚠️ Vertical only | ✅ Infinita |
| **Transformações** | ❌ Não | ✅ Resize, crop, etc |

## ❓ Troubleshooting

### Problema: Arquivos Ainda Somem

**Causa**: Volume não foi montado corretamente

**Solução**:
1. Verifique o **Mount Path**: deve ser exatamente `/app/backend/uploads`
2. Faça **Redeploy** após criar o volume
3. Verifique logs: `railway logs`

### Problema: Erro "No Space Left"

**Causa**: Volume cheio

**Solução**:
1. Verifique tamanho em **Settings** → **Volumes**
2. Delete arquivos antigos manualmente
3. Implemente limpeza automática (script acima)

### Problema: Performance Lenta

**Causa**: Arquivos muito grandes ou muitas requisições

**Solução**:
1. Reduza tamanho máximo de upload (10MB em vez de 50MB)
2. Compacte imagens antes de enviar
3. Considere migrar para Cloudinary se tiver muitos usuários

## 🎯 Próximos Passos

Após configurar o volume:

1. ✅ **Teste a persistência** (redeploy e verificar)
2. ✅ **Monitore o uso** (Settings → Volumes)
3. ⚠️ **Configure backup** (Railway faz backup, mas verifique)
4. 💡 **Considere migrar para Cloudinary** se o projeto crescer

## 📞 Suporte

Se tiver problemas:
- Railway Docs: https://docs.railway.app/reference/volumes
- Railway Discord: https://discord.gg/railway
- Ou abra issue no projeto
