# ⚠️ Problema de Armazenamento de Arquivos no Railway

## Problema

No Railway, o sistema de arquivos é **efêmero**. Isso significa que:
- Arquivos enviados são salvos em `backend/uploads/`
- Quando o servidor reinicia (deploy, crash, ou escala), **todos os arquivos são perdidos**
- As mensagens ainda existem no banco de dados com as URLs, mas os arquivos físicos não existem mais

## Manifestação do Bug

**Sintomas**:
1. ✅ Upload funciona normalmente
2. ✅ Imagem aparece imediatamente após envio
3. ❌ Após reiniciar o servidor ou atualizar a página, a imagem não carrega
4. ❌ Erro 404 ao tentar acessar `/uploads/filename.png`

**Exemplo**:
```
Mensagem enviada: "Olha essa imagem!"
URL: /uploads/1234567890-abc.png
Status: ✅ Funciona

[Servidor reinicia]

URL: /uploads/1234567890-abc.png
Status: ❌ 404 Not Found
```

## Soluções

### Solução 1: Railway Volumes (Recomendado para MVP)

Railway oferece volumes persistentes que sobrevivem a reinicializações.

**Configuração**:
```yaml
# railway.json
{
  "deploy": {
    "volumes": [
      {
        "name": "uploads-volume",
        "mountPath": "/app/backend/uploads"
      }
    ]
  }
}
```

**Prós**:
- Simples de configurar
- Sem mudanças no código
- Custo relativamente baixo

**Contras**:
- Volume está atrelado a uma região específica
- Não escala horizontalmente (múltiplas instâncias)
- Backup manual necessário

### Solução 2: S3/Cloudinary (Recomendado para Produção)

Usar um serviço de armazenamento de objetos externo.

**AWS S3**:
```bash
npm install aws-sdk multer-s3
```

**Cloudinary** (mais fácil para imagens):
```bash
npm install cloudinary multer-storage-cloudinary
```

**Exemplo com Cloudinary**:
```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'zorah-chat',
    allowed_formats: ['jpg', 'png', 'gif', 'mp4', 'pdf'],
    resource_type: 'auto'
  }
});

const upload = multer({ storage });
```

**Prós**:
- Escalável horizontalmente
- CDN automático (carregamento rápido global)
- Backup automático
- Transformação de imagens (resize, crop)

**Contras**:
- Requer mudanças no código
- Custo adicional (Cloudinary tem free tier generoso)
- Dependência externa

### Solução 3: Base64 no Banco de Dados (NÃO recomendado)

Armazenar arquivos como base64 diretamente no PostgreSQL.

**Prós**:
- Simples
- Sem dependências externas

**Contras**:
- ❌ Aumenta drasticamente o tamanho do banco
- ❌ Performance ruim para arquivos grandes
- ❌ Custo alto de banco de dados
- ❌ Dificulta backup/restauração

## Implementação Recomendada (Cloudinary)

### 1. Criar conta no Cloudinary
- Acesse: https://cloudinary.com/
- Free tier: 25 GB de armazenamento, 25 GB de largura de banda/mês

### 2. Instalar dependências
```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

### 3. Atualizar `backend/routes/upload.js`
```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'zorah-chat',
    allowed_formats: ['jpg', 'png', 'gif', 'mp4', 'pdf', 'doc', 'docx'],
    resource_type: 'auto'
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Cloudinary retorna a URL completa
    const fileUrl = req.file.path;
    const fileType = req.file.mimetype.split('/')[0];

    res.json({
      url: fileUrl, // URL completa do Cloudinary
      type: fileType,
      name: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### 4. Adicionar variáveis de ambiente no Railway
```env
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
```

### 5. Atualizar frontend (se necessário)
O frontend já está preparado para URLs completas:
```javascript
const fullUrl = msg.attachment_url.startsWith('http') 
  ? msg.attachment_url // URL completa (Cloudinary)
  : `${apiUrl}${msg.attachment_url}`; // URL relativa (local)
```

## Status Atual

- ⚠️ Sistema usa armazenamento local (`backend/uploads/`)
- ⚠️ Arquivos são perdidos em reinicializações no Railway
- ⚠️ Frontend mostra mensagem de erro quando imagem não está disponível
- ✅ Frontend trata erro 404 de imagens gracefully

## Próximos Passos

1. **Curto prazo**: Implementar Cloudinary
2. **Alternativa**: Configurar Railway Volume
3. **Documentação**: Avisar usuários sobre limitação atual
