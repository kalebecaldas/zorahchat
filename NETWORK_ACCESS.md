# ZORAH CHAT - Acesso em Rede Local

## 🚀 Como Iniciar o Sistema

```bash
./start_system.sh
```

## 🌐 Acessar na Rede Local

### 1. Descobrir seu IP Local

**macOS:**
```bash
ipconfig getifaddr en0
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
```

**Windows:**
```bash
ipconfig
```
Procure por "IPv4 Address"

### 2. Acessar de Outros Dispositivos

Depois de iniciar o sistema, você verá algo como:

```
Access locally at: http://localhost:5173
Access from network at: http://192.168.1.100:5173
```

**No seu computador:**
- Acesse: `http://localhost:5173`

**Em outros dispositivos (celular, tablet, outro PC):**
- Conecte-se à mesma rede WiFi
- Acesse: `http://SEU_IP:5173`
- Exemplo: `http://192.168.1.100:5173`

### 3. Configurar Firewall (se necessário)

**macOS:**
- Vá em Preferências do Sistema → Segurança e Privacidade → Firewall
- Permita conexões para Node.js

**Windows:**
- Firewall do Windows → Permitir um aplicativo
- Adicione Node.js

**Linux:**
```bash
sudo ufw allow 3001
sudo ufw allow 5173
```

## 📱 Testar no Celular

1. Conecte seu celular na mesma rede WiFi
2. Abra o navegador
3. Digite: `http://SEU_IP:5173`
4. Faça login e use normalmente!

## ⚙️ Portas Usadas

- **Frontend**: 5173 (Vite)
- **Backend**: 3001 (Express + Socket.io)

## 🔧 Troubleshooting

**Não consegue acessar da rede?**
1. Verifique se está na mesma rede WiFi
2. Desative firewall temporariamente para testar
3. Verifique se o IP está correto
4. Tente reiniciar o sistema

**Erro de CORS?**
- O backend já está configurado para aceitar conexões de qualquer origem
- Verifique se as portas estão abertas

## 🎯 URLs de Exemplo

**Localhost (seu computador):**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

**Rede Local (outros dispositivos):**
- Frontend: `http://192.168.1.100:5173`
- Backend: `http://192.168.1.100:3001`

(Substitua `192.168.1.100` pelo seu IP real)
