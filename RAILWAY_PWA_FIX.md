# 🔧 Railway PWA - Diagnóstico e Soluções

## 🐛 Problema Atual

**Erro no Console:**
```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "text/html"
```

**Causa:**
- O Vite Preview está servindo os arquivos, mas pode haver problemas com:
  - MIME types no Caddy (usado pelo Nixpacks)
  - Roteamento de SPA (retorna HTML para JS)
  - Cache do Railway

---

## ✅ O Que Foi Feito

### **1. Vite Config Melhorado:**
```javascript
build: {
  outDir: 'dist',
  assetsDir: 'assets',
  sourcemap: false,
  rollupOptions: {
    output: {
      manualChunks: undefined
    }
  }
},
publicDir: 'public'
```

### **2. Build Local Testado:**
```bash
✓ built in 789ms

dist/
  ├── assets/
  │   ├── index-C6g-KTxN.js
  │   └── index-Cn5OeQPi.css
  ├── sw.js
  ├── manifest.json
  ├── icon-192.png
  ├── icon-512.png
  └── index.html
```

**✅ Build está gerando tudo corretamente!**

---

## 🚀 Soluções Alternativas

### **Solução 1: Usar `serve` ao invés de `vite preview`**

**Por quê:**
- `vite preview` é para testes locais
- `serve` é mais adequado para produção
- Melhor controle sobre MIME types e roteamento

**Como implementar:**

1. **Instalar `serve`:**
```bash
cd frontend
npm install --save serve
```

2. **Atualizar `package.json`:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "serve -s dist -l ${PORT:-4173}",
    "preview": "vite preview"
  }
}
```

3. **Commit e Push:**
```bash
git add .
git commit -m "chore: use serve instead of vite preview for production"
git push origin main
```

---

### **Solução 2: Configurar Caddy Corretamente**

Se o Railway continuar usando Caddy, criar `.caddyfile`:

**Criar:** `frontend/.caddyfile`
```caddyfile
:${PORT} {
  root * dist
  encode gzip
  
  # Servir arquivos estáticos
  file_server
  
  # SPA routing - retornar index.html para rotas não encontradas
  try_files {path} {path}/ /index.html
  
  # Headers de segurança
  header {
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    X-XSS-Protection "1; mode=block"
  }
  
  # MIME types corretos
  @js {
    path *.js
  }
  header @js Content-Type "application/javascript"
  
  @css {
    path *.css
  }
  header @css Content-Type "text/css"
  
  @json {
    path *.json
  }
  header @json Content-Type "application/json"
}
```

---

### **Solução 3: Usar Nginx (mais robusto)**

**Criar:** `frontend/nginx.conf`
```nginx
server {
  listen ${PORT};
  root /app/dist;
  index index.html;

  # Gzip
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

  # Cache para assets
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Cache para ícones e manifest
  location ~* \.(png|jpg|jpeg|gif|ico|svg|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Service Worker - sem cache
  location = /sw.js {
    expires off;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }

  # Manifest
  location = /manifest.json {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
  }

  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
  }

  # MIME types
  types {
    text/html html htm;
    text/css css;
    application/javascript js mjs;
    application/json json;
    image/png png;
    image/jpeg jpg jpeg;
    image/svg+xml svg;
  }
}
```

**Dockerfile para Nginx:**
```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE ${PORT:-4173}
CMD sed -i "s/\${PORT}/${PORT}/g" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
```

---

## 🔍 Como Verificar se Funcionou

### **1. Verificar Deploy:**
```bash
# Logs do Railway devem mostrar:
✓ built in XXXms
Server running on port XXXX
```

### **2. Testar no Navegador:**

**Console deve mostrar:**
```
[SW] Service Worker loaded
[PWA] Service Worker registered: https://zorahchat.up.railway.app/
```

**NÃO deve mostrar:**
```
❌ Failed to load module script
❌ MIME type of "text/html"
```

### **3. Verificar MIME Types:**

**Abrir DevTools → Network:**
- `index-*.js` → `Content-Type: application/javascript` ✅
- `index-*.css` → `Content-Type: text/css` ✅
- `sw.js` → `Content-Type: application/javascript` ✅
- `manifest.json` → `Content-Type: application/json` ✅

### **4. Testar PWA:**

**Chrome DevTools → Application:**
- ✅ Service Worker registrado
- ✅ Manifest válido
- ✅ Ícones carregados
- ✅ "Install App" disponível

---

## 📊 Qual Solução Usar?

| Solução | Facilidade | Performance | Recomendação |
|---------|-----------|-------------|--------------|
| **Vite Preview** | ⭐⭐⭐ | ⭐⭐ | Dev/Staging |
| **Serve** | ⭐⭐⭐ | ⭐⭐⭐ | ✅ **Produção Simples** |
| **Caddy Config** | ⭐⭐ | ⭐⭐⭐ | Produção |
| **Nginx** | ⭐ | ⭐⭐⭐⭐⭐ | Produção Escalável |

**Recomendação Atual:** Usar **`serve`** (Solução 1)

---

## 🚀 Implementação Rápida (Solução 1)

```bash
# 1. Instalar serve
cd frontend
npm install --save serve

# 2. Atualizar package.json
# Mudar "start": "serve -s dist -l ${PORT:-4173}"

# 3. Commit e push
cd ..
git add .
git commit -m "chore: use serve for production instead of vite preview"
git push origin main

# 4. Aguardar Railway rebuild
```

---

## 🔧 Debug no Railway

### **Se o problema persistir:**

**1. Verificar logs:**
```bash
railway logs
```

**2. Verificar variáveis de ambiente:**
```bash
PORT=4173
NODE_ENV=production
VITE_API_URL=https://backend-url.railway.app
```

**3. Testar build manualmente:**
```bash
railway shell
cd frontend
npm run build
ls -la dist/
```

**4. Verificar se arquivos estão no lugar:**
```bash
railway shell
ls -la /app/dist/
cat /app/dist/index.html
```

---

## 📝 Checklist

### **Build:**
- [ ] `npm run build` funciona localmente
- [ ] `dist/` contém todos os arquivos
- [ ] `dist/index.html` aponta para `/assets/index-*.js`
- [ ] `dist/sw.js` existe

### **Deploy:**
- [ ] Railway detecta mudanças
- [ ] Build passa sem erros
- [ ] Logs mostram "Server running"
- [ ] URL abre sem erros 404

### **PWA:**
- [ ] Console sem erros de MIME type
- [ ] Service Worker registra
- [ ] Manifest carrega
- [ ] App instalável

---

## 🎯 Próximos Passos

1. **Aguardar deploy atual** (~5 min)
2. **Verificar logs e console**
3. **Se erro persistir** → Implementar Solução 1 (serve)
4. **Testar instalação** no celular
5. **Ativar push notifications**

---

**Status:** Deploy em andamento... 🚀
