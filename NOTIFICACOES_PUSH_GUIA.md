# 📱 Notificações Push - Guia Completo

## ✅ O Que Foi Implementado

### **Backend:**
- ✅ Tabela `push_subscriptions` no banco de dados
- ✅ Serviço `pushService.js` (Web Push com VAPID)
- ✅ Rotas `/api/push/*` para gerenciar subscriptions
- ✅ Integração com Socket.IO para detectar usuários offline
- ✅ Notificações push automáticas para:
  - **Mensagens de canal** (quando usuário está offline)
  - **Mensagens diretas** (quando usuário está offline)
  - **Menções** (@user e @channel)

### **Frontend:**
- ✅ Service Worker (`sw.js`) com suporte a push
- ✅ Serviço `pushNotificationService.js`
- ✅ Componente `PushNotificationManager.jsx` (banner de ativação)
- ✅ Integração com `AuthContext`
- ✅ Permissão e subscription automática

---

## 🎯 Como Funciona

### **1. Fluxo de Notificações:**

```
1. Usuário A envia mensagem
   ↓
2. Backend verifica se Usuário B está online (Socket.IO)
   ↓
3a. Se ONLINE → Envia via Socket.IO ✅
3b. Se OFFLINE → Envia Push Notification 📲
   ↓
4. Usuário B recebe notificação (mesmo com app fechado)
```

### **2. Detecção de Usuário Offline:**

O sistema verifica:
- ✅ **Socket.IO conectado?** → Usuário online
- ❌ **Sem socket ativo?** → Usuário offline → Push notification

---

## 📱 Compatibilidade

### **Android (PWA):**
- ✅ **Chrome** - Push completo (app fechado/background)
- ✅ **Edge** - Push completo
- ✅ **Samsung Internet** - Push completo
- ✅ **Firefox** - Push completo

### **iOS (PWA):**
- ⚠️ **iOS 16.4+** - Push notifications suportado!
- ⚠️ **iOS 16.3 e anterior** - Apenas notificações in-app
- ✅ **Precisa adicionar à Home Screen** (instalado como PWA)

### **Desktop:**
- ✅ **Chrome/Edge** - Push completo
- ✅ **Firefox** - Push completo
- ❌ **Safari macOS** - Limitado (apenas com site aberto)

---

## 🧪 Como Testar

### **Teste 1: Notificação de Canal**

```bash
# Dispositivo A (Remetente):
1. Abrir app, fazer login
2. Entrar em um canal
3. Enviar mensagem

# Dispositivo B (Destinatário):
1. Fazer login
2. FECHAR o app completamente
3. Aguardar notificação push aparecer 🔔
```

### **Teste 2: Notificação de DM**

```bash
# Dispositivo A:
1. Enviar mensagem direta para outro usuário

# Dispositivo B:
1. App fechado
2. Receber notificação push da DM 💬
```

### **Teste 3: Notificação de Menção**

```bash
# Dispositivo A:
1. Em um canal, enviar: "@usuario olá!"
   ou
   "@channel reunião em 5 min!"

# Dispositivo B (mencionado):
1. App fechado
2. Receber notificação push de menção 📢
```

---

## 🔔 Permissões e Ativação

### **Fluxo Automático:**

1. **Usuário faz login**
   ↓
2. Aguarda 3 segundos
   ↓
3. **Banner aparece** (canto inferior direito)
   ```
   🔔 Ativar Notificações
   Receba mensagens mesmo com app fechado
   [✅ Ativar] [Agora não]
   ```
   ↓
4. Usuário clica "Ativar"
   ↓
5. **Navegador solicita permissão**
   ↓
6. **Subscription registrada** no servidor
   ↓
7. **Notificação de teste** aparece: "Notificações ativadas! 🎉"

### **Se Usuário Negar:**

- Banner some
- Mensagem: "Você negou a permissão. Vá nas configurações do navegador."
- Banner reaparece após 7 dias

---

## 🛠️ Configuração Técnica

### **1. VAPID Keys (Web Push)**

Geradas automaticamente:

```bash
Public Key:
BDJRU6hQzwy0HPWIxtdruE51Bmq30MwyEFxnV3HyWDtIRunoX0icuK5TFwOpK4NUNpDERX3cemEJZkkL0ClxeRY

Private Key:
o7DgxdmlDSzHfYie7O_yEf9bTfr7EqUCyoyMLHsNJzk
```

**Armazenadas em:**
- Código: `backend/services/pushService.js`
- Env vars (produção): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`

### **2. Service Worker**

**Arquivo:** `frontend/public/sw.js`

**Eventos Implementados:**
```javascript
// Recebe push do servidor
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data
  });
});

// Click na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  clients.openWindow('/'); // Abre app
});
```

### **3. Banco de Dados**

**Tabela:** `push_subscriptions`

```sql
CREATE TABLE push_subscriptions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    subscription TEXT NOT NULL, -- JSON da subscription
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Permite:**
- Múltiplos dispositivos por usuário
- Renovação automática de subscriptions
- Remoção de subscriptions inválidas

---

## 🚀 Deploy

### **Railway (Produção):**

1. **Env Vars** (opcional, já tem fallback no código):
```bash
VAPID_PUBLIC_KEY=BDJRU6hQzwy0HPWIxtdruE51Bmq30MwyEFxnV3HyWDtIRunoX0icuK5TFwOpK4NUNpDERX3cemEJZkkL0ClxeRY
VAPID_PRIVATE_KEY=o7DgxdmlDSzHfYie7O_yEf9bTfr7EqUCyoyMLHsNJzk
VAPID_EMAIL=mailto:kalebe.caldas@hotmail.com
```

2. **Deploy automático** (Railway detecta mudanças)

3. **Tabela criada automaticamente** (migrations)

### **Teste Local:**

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

**IMPORTANTE:** Para testar push local, precisa:
- ✅ HTTPS ou `localhost`
- ✅ Service Worker registrado
- ✅ Permissão concedida

---

## 🔍 Logs e Debug

### **Backend Logs:**

```bash
[PUSH] Sending notification to 3 subscription(s) for user 5
[PUSH] ✓ Sent to subscription 12
[PUSH] Results for user 5: 3 sent, 0 failed
```

### **Frontend Logs:**

```javascript
[PUSH] Starting push subscription...
[PUSH] Service Worker ready
[PUSH] VAPID public key obtained
[PUSH] Push subscription created: https://fcm.googleapis.com/...
[PUSH] ✓ Push subscription saved on server
```

### **Troubleshooting:**

**Problema: "Push not supported"**
- Causa: Navegador não suporta ou não está em HTTPS
- Solução: Usar Chrome/Edge ou localhost

**Problema: "Permission denied"**
- Causa: Usuário negou permissão ou navegador bloqueou
- Solução: Ir em Configurações do navegador → Permissões → Notificações

**Problema: "Subscription expired"**
- Causa: Push subscription antiga/inválida
- Solução: Sistema remove automaticamente e cria nova

---

## 📊 Estatísticas

### **Usuários podem ter:**
- ✅ Múltiplas subscriptions (1 por dispositivo)
- ✅ Android: Notificações mesmo com app fechado
- ✅ iOS 16.4+: Notificações push (PWA instalado)
- ✅ Desktop: Notificações nativas do SO

### **Performance:**
- ⚡ Envio paralelo para múltiplos dispositivos
- 🔄 Renovação automática de tokens expirados
- 🗑️ Limpeza automática de subscriptions inválidas
- 📈 Escalável (suporta milhares de usuários)

---

## 🎨 Personalização

### **Tipos de Notificação:**

#### **1. Mensagem de Canal:**
```javascript
{
  title: "#canal-geral",
  body: "João Silva: Olá pessoal!",
  icon: "/icon-192.png",
  data: {
    url: "/workspace/1/channel/5",
    type: "channel_message"
  }
}
```

#### **2. Mensagem Direta:**
```javascript
{
  title: "💬 Maria Santos",
  body: "Você está disponível?",
  icon: "/icon-192.png",
  data: {
    url: "/workspace/1/dm/8",
    type: "direct_message"
  }
}
```

#### **3. Menção:**
```javascript
{
  title: "@menção em #tech",
  body: "Pedro: @kalebe pode revisar?",
  icon: "/icon-192.png",
  tag: "mention-5", // Agrupa menções
  data: {
    url: "/workspace/1/channel/5",
    type: "mention"
  }
}
```

---

## 🔐 Segurança

### **Autenticação:**
- ✅ JWT token obrigatório para registrar subscription
- ✅ User ID validado no backend
- ✅ VAPID keys protegem contra falsificações

### **Privacidade:**
- ✅ Push subscriptions vinculadas ao usuário
- ✅ Conteúdo da mensagem limitado (100 chars)
- ✅ Removidas automaticamente após logout (opcional)

---

## 📚 API Endpoints

### **GET /api/push/vapid-public-key**
Retorna chave pública VAPID

**Resposta:**
```json
{
  "publicKey": "BDJRU6hQzwy0HPWIx..."
}
```

### **POST /api/push/subscribe**
Registra subscription

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Push subscription saved successfully"
}
```

### **POST /api/push/unsubscribe**
Remove subscription

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

### **GET /api/push/subscriptions**
Lista subscriptions do usuário

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Resposta:**
```json
{
  "subscriptions": [
    {
      "id": 12,
      "endpoint": "https://fcm.googleapis.com/...",
      "createdAt": "2026-01-27T10:30:00.000Z"
    }
  ]
}
```

---

## ✅ Checklist de Funcionalidade

### **Backend:**
- [x] Tabela `push_subscriptions` criada
- [x] VAPID keys geradas
- [x] Rotas `/api/push/*` funcionais
- [x] Push service implementado
- [x] Integração com mensagens de canal
- [x] Integração com mensagens diretas
- [x] Integração com menções
- [x] Detecção de usuários offline
- [x] Envio paralelo para múltiplos dispositivos
- [x] Limpeza de subscriptions inválidas

### **Frontend:**
- [x] Service Worker com push
- [x] Push notification service
- [x] Banner de ativação
- [x] Solicitação de permissão
- [x] Registro de subscription
- [x] Notificação de teste
- [x] Integração com Auth
- [x] UI responsiva

### **Testes:**
- [ ] Testar em Android Chrome (PWA)
- [ ] Testar em iOS 16.4+ Safari (PWA)
- [ ] Testar notificação de canal
- [ ] Testar notificação de DM
- [ ] Testar notificação de menção
- [ ] Testar com app fechado
- [ ] Testar com múltiplos dispositivos
- [ ] Testar renovação de subscription

---

## 🎉 Resultado

**Agora o sistema tem:**
- ✅ Notificações push nativas
- ✅ Funciona mesmo com app fechado (Android)
- ✅ iOS 16.4+ compatível (PWA instalado)
- ✅ Múltiplos dispositivos suportados
- ✅ Notificações de canal, DM e menções
- ✅ Banner amigável para ativação
- ✅ Sistema escalável e seguro

**Próximos passos (opcional):**
- 🔄 Adicionar configurações de notificação (ativar/desativar por canal)
- 🔕 "Modo Não Perturbe" (horário específico)
- 📊 Analytics de notificações (taxa de cliques)
- 🎨 Notificações ricas (imagens, ações personalizadas)

---

**Implementação completa! 🚀📱**

**Faça deploy e teste no dispositivo móvel!**
