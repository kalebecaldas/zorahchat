# Armazenamento de Arquivos no PostgreSQL (NÃO RECOMENDADO)

## ⚠️ ADVERTÊNCIA

Esta solução funciona mas **NÃO é recomendada** para produção por:
- 📈 Aumenta drasticamente o tamanho do banco (custo)
- 🐌 Performance ruim para arquivos grandes
- 💾 Backups ficam gigantes e lentos
- 🚫 Sem CDN (carregamento lento para usuários globais)
- ❌ Dificulta migração futura

**Use apenas para testes ou se absolutamente necessário.**

## Implementação (Base64 no PostgreSQL)

### 1. Alterar Tabela de Mensagens

```sql
-- Adicionar coluna para armazenar arquivo em base64
ALTER TABLE messages ADD COLUMN attachment_data TEXT;
ALTER TABLE messages ADD COLUMN attachment_mimetype TEXT;
```

### 2. Modificar Upload Route

```javascript
// backend/routes/upload.js
const express = require('express');
const multer = require('multer');
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Armazenar em memória (não em disco)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // LIMITE: 10MB (era 50MB)
        // ⚠️ Arquivos grandes vão explodir o banco
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mp3|wav|pdf|doc|docx|txt|zip/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Converter para base64
        const base64Data = req.file.buffer.toString('base64');
        const fileType = req.file.mimetype.split('/')[0];
        
        // Criar data URI
        const dataUri = `data:${req.file.mimetype};base64,${base64Data}`;

        res.json({
            url: dataUri, // Data URI completo
            type: fileType,
            name: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

### 3. Frontend (Já Funciona)

O frontend já suporta data URIs:

```javascript
// ChatWindow.jsx - renderAttachment()
const fullUrl = msg.attachment_url.startsWith('http') 
    ? msg.attachment_url 
    : msg.attachment_url.startsWith('data:')
        ? msg.attachment_url  // Data URI (base64)
        : `${apiUrl}${msg.attachment_url}`; // Path relativo

<img src={fullUrl} alt={msg.attachment_name} />
```

### 4. Salvar no Banco (Opcional - para busca futura)

Se quiser salvar no banco para consultar depois:

```javascript
// backend/routes/messages.js
router.post('/', authMiddleware, async (req, res) => {
    const { channelId, content, attachment_url, attachment_type, attachment_name } = req.body;
    const db = getDb();

    // Se é data URI, salvar no banco
    let attachmentData = null;
    let attachmentMimetype = null;
    
    if (attachment_url && attachment_url.startsWith('data:')) {
        const matches = attachment_url.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            attachmentMimetype = matches[1];
            attachmentData = matches[2]; // Base64 puro (sem prefixo)
        }
    }

    const result = await db.run(`
        INSERT INTO messages (
            channel_id, user_id, content, 
            attachment_url, attachment_type, attachment_name,
            attachment_data, attachment_mimetype
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        channelId, req.userId, content, 
        attachment_url, attachment_type, attachment_name,
        attachmentData, attachmentMimetype
    ]);

    // ... resto do código
});
```

## 📊 Impacto no Tamanho do Banco

| Cenário | Tamanho sem Arquivos | Tamanho com Arquivos | Custo Railway/mês |
|---------|---------------------|---------------------|-------------------|
| 100 mensagens texto | 50 KB | 50 KB | $0 (free tier) |
| + 50 fotos (2MB cada) | 50 KB | **100 MB** | $5-10 |
| + 1000 fotos (2MB cada) | 50 KB | **2 GB** | $30-50 |
| + vídeos (10MB cada) | 50 KB | **10+ GB** | $150+ |

## ⚡ Impacto na Performance

```javascript
// Sem arquivos no banco
SELECT * FROM messages WHERE channel_id = 1;
// 100 mensagens = 50KB de dados = 10ms

// Com arquivos no banco
SELECT * FROM messages WHERE channel_id = 1;
// 100 mensagens + imagens = 200MB de dados = 5000ms (5 segundos!)
```

## 🔄 Migração Futura (Se Mudar de Ideia)

Script para migrar base64 do PostgreSQL para Cloudinary:

```javascript
// migrate-to-cloudinary.js
const { getDb } = require('./database');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function migrateFiles() {
    const db = getDb();
    const messages = await db.all(`
        SELECT id, attachment_data, attachment_mimetype, attachment_name
        FROM messages 
        WHERE attachment_data IS NOT NULL
    `);

    for (const msg of messages) {
        try {
            // Upload base64 para Cloudinary
            const result = await cloudinary.uploader.upload(
                `data:${msg.attachment_mimetype};base64,${msg.attachment_data}`,
                { folder: 'zorah-chat' }
            );

            // Atualizar mensagem com URL do Cloudinary
            await db.run(`
                UPDATE messages 
                SET attachment_url = ?, 
                    attachment_data = NULL  -- Limpar base64
                WHERE id = ?
            `, [result.secure_url, msg.id]);

            console.log(`Migrated message ${msg.id}: ${msg.attachment_name}`);
        } catch (error) {
            console.error(`Failed to migrate message ${msg.id}:`, error);
        }
    }
}

migrateFiles();
```

## 🎯 Recomendação Final

**Para Produção**: Use Cloudinary ou S3
- ✅ Free tier generoso
- ✅ CDN global
- ✅ Performance excelente
- ✅ Escalável
- ✅ Backup automático

**Para Testes Locais**: Use filesystem local
- ✅ Simples
- ✅ Sem custos
- ✅ Rápido para desenvolvimento

**PostgreSQL**: Apenas se:
- ⚠️ Arquivos MUITO pequenos (< 100KB)
- ⚠️ Poucos arquivos (< 100 total)
- ⚠️ Não pretende escalar
- ⚠️ Orçamento limitado mas aceita performance ruim
