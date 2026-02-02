# 📱 Guia: React Native + Expo (Futuro)

## 🎯 Objetivo

Criar app mobile nativo para iOS e Android usando React Native e Expo.

**Status:** 🔄 Planejamento (Implementar após PWA estar funcionando)

---

## 🚀 Por Que Expo?

### **Vantagens:**

✅ **Sem configuração complexa** - Não precisa Xcode/Android Studio  
✅ **Expo Go** - Testar no celular real instantaneamente  
✅ **Hot Reload** - Ver mudanças em tempo real  
✅ **EAS Build** - Gerar builds na nuvem  
✅ **APIs prontas** - Câmera, notificações, etc.  
✅ **Over-the-air updates** - Atualizar sem resubmeter na loja  

### **O Que Você Pode Fazer SEM Licenças:**

✅ **Desenvolvimento** - 100% grátis  
✅ **Expo Go** - Testar em iPhone e Android  
✅ **EAS Build Android** - Gerar APK (distribui manual)  
✅ **TestFlight iOS** - 100 testadores (sem publicar na loja)  

### **O Que Precisa de Licença:**

❌ **App Store** - Publicar no iOS ($99/ano)  
❌ **Play Store** - Publicar no Android ($25 uma vez)  

**Mas você pode distribuir APK manualmente no Android!**

---

## 📦 Setup Inicial

### **1. Instalar Expo CLI**

```bash
npm install -g expo-cli
# ou
yarn global add expo-cli
```

### **2. Criar Projeto**

```bash
# Na raiz do projeto
cd "/Users/kalebecaldas/Downloads/ZORAH CHAT"

npx create-expo-app zorah-chat-mobile --template blank

cd zorah-chat-mobile
```

### **3. Instalar Dependências**

```bash
# Navegação
npx expo install @react-navigation/native
npx expo install @react-navigation/native-stack
npx expo install @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# Socket.IO
npm install socket.io-client

# Storage
npx expo install @react-native-async-storage/async-storage

# Imagens
npx expo install expo-image-picker

# Notificações
npx expo install expo-notifications

# Câmera
npx expo install expo-camera

# Document Picker
npx expo install expo-document-picker

# Fonts (opcional)
npx expo install expo-font

# Status Bar
npx expo install expo-status-bar
```

---

## 🏗️ Estrutura do Projeto

```
zorah-chat-mobile/
├── App.js                    # Entry point
├── app.json                  # Configuração Expo
├── package.json
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── WorkspacesScreen.js
│   │   ├── ChatScreen.js
│   │   ├── ChannelListScreen.js
│   │   ├── DMListScreen.js
│   │   ├── ProfileScreen.js
│   │   └── SettingsScreen.js
│   ├── components/
│   │   ├── Message.js
│   │   ├── MessageInput.js
│   │   ├── ChannelItem.js
│   │   ├── UserAvatar.js
│   │   └── LoadingSpinner.js
│   ├── contexts/
│   │   ├── AuthContext.js
│   │   └── SocketContext.js
│   ├── services/
│   │   ├── api.js           # API calls
│   │   └── socket.js        # Socket.IO
│   ├── navigation/
│   │   ├── AppNavigator.js
│   │   └── AuthNavigator.js
│   ├── constants/
│   │   ├── Colors.js
│   │   └── Config.js
│   └── utils/
│       ├── storage.js       # AsyncStorage helper
│       └── formatters.js
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
└── eas.json                 # EAS Build config
```

---

## 🎨 Screens Principais

### **1. LoginScreen**
```javascript
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    await login(email, password);
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ZORAH CHAT</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### **2. ChatScreen**
```javascript
import { useState, useEffect } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useSocket } from '../contexts/SocketContext';
import Message from '../components/Message';
import MessageInput from '../components/MessageInput';

export default function ChatScreen({ route }) {
  const { channelId } = route.params;
  const [messages, setMessages] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    // Carregar mensagens
    fetchMessages();
    
    // Escutar novas mensagens
    socket.on('new-message', handleNewMessage);
    
    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [channelId]);

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        renderItem={({ item }) => <Message message={item} />}
        keyExtractor={(item) => item.id.toString()}
        inverted
      />
      
      <MessageInput channelId={channelId} />
    </KeyboardAvoidingView>
  );
}
```

---

## 🔌 Configuração

### **app.json**
```json
{
  "expo": {
    "name": "ZORAH CHAT",
    "slug": "zorah-chat",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a2e"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.zorahchat"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a2e"
      },
      "package": "com.yourcompany.zorahchat"
    },
    "extra": {
      "apiUrl": "https://backend-chat-xyz.railway.app",
      "wsUrl": "https://backend-chat-xyz.railway.app"
    }
  }
}
```

### **Config.js**
```javascript
import Constants from 'expo-constants';

export default {
  API_URL: Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001',
  WS_URL: Constants.expoConfig?.extra?.wsUrl || 'http://localhost:3001',
};
```

---

## 🧪 Testar no Celular

### **1. Instalar Expo Go**

**iOS:**
- App Store → Buscar "Expo Go"
- Instalar

**Android:**
- Play Store → Buscar "Expo Go"
- Instalar

### **2. Iniciar Dev Server**

```bash
cd zorah-chat-mobile
npx expo start
```

### **3. Escanear QR Code**

**iOS:**
- Abrir Câmera
- Apontar para o QR code
- Tocar na notificação

**Android:**
- Abrir Expo Go
- Tocar "Scan QR Code"
- Escanear

**Pronto!** App abre no celular!

---

## 🏗️ Build (Gerar APK/IPA)

### **1. Criar Conta Expo**

```bash
npx expo login
```

### **2. Configurar EAS**

```bash
npm install -g eas-cli
eas login
eas build:configure
```

### **3. Gerar Build Android (APK)**

```bash
eas build --platform android --profile preview
```

**Aguardar:** ~10-15 minutos

**Download:** Link aparecerá no terminal

**Distribuir:** Compartilhar APK via WhatsApp, Drive, etc.

### **4. Gerar Build iOS (TestFlight)**

```bash
eas build --platform ios --profile preview
```

**Nota:** Precisa de conta Apple Developer ($99/ano) para TestFlight.

**SEM LICENÇA:**
- Pode testar no Expo Go (grátis)
- Pode gerar build local (com Mac + Xcode)

---

## 📊 Comparação: Web (PWA) vs Mobile (Expo)

| Recurso | PWA | React Native |
|---------|-----|--------------|
| **Instalação** | Via browser | Via APK ou loja |
| **UX** | 80% nativa | 100% nativa |
| **Performance** | Boa | Excelente |
| **Gestos nativos** | Limitado | Completo |
| **Câmera** | Limitado | Completo |
| **Notificações** | Web push | Push nativo |
| **Offline** | Cache | Full offline |
| **Tempo de dev** | 1-2 horas | 1-2 semanas |
| **Manutenção** | Baixa | Média |
| **Custo** | $0 | $0 - $124 |

---

## 💡 Recomendação

### **Começar com PWA** ✅
- Rápido (1-2 horas)
- Funcional
- Zero custo
- Testa a aceitação dos usuários

### **Evoluir para React Native** 🚀
- Se usuários gostarem
- Se precisar de recursos nativos
- Se tiver budget
- Se tiver tempo para manter

---

## 📝 Roadmap

### **Fase 1: PWA** ✅
- [x] Manifest
- [x] Service Worker
- [x] Instalação
- [x] Deploy Railway

### **Fase 2: React Native** 🔄
- [ ] Setup projeto Expo
- [ ] Implementar telas principais
- [ ] Conectar com backend
- [ ] Testar no Expo Go
- [ ] Gerar build Android
- [ ] Distribuir APK

### **Fase 3: Publicação** 🎯
- [ ] Conta Google Play ($25)
- [ ] Conta Apple Developer ($99)
- [ ] Submit para lojas
- [ ] Marketing

---

## 🎉 Conclusão

**Agora:**
- ✅ Use o PWA (já funciona!)
- ✅ Teste no celular
- ✅ Veja a aceitação

**Depois:**
- 🔄 Considere React Native
- 🔄 Se precisar de recursos nativos
- 🔄 Se tiver budget e tempo

**O PWA já resolve 90% dos casos!** 🚀

---

**Quando estiver pronto para implementar React Native, siga este guia!**
