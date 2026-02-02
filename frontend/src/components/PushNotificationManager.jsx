import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  isPushSupported,
  hasNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getActiveSubscription,
  showTestNotification
} from '../services/pushNotificationService';

export default function PushNotificationManager() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = isPushSupported();
      setIsSupported(supported);

      if (supported) {
        const permission = hasNotificationPermission();
        setHasPermission(permission);

        const subscription = await getActiveSubscription();
        setIsSubscribed(!!subscription);

        // Mostrar banner apenas se:
        // - Suporta push
        // - Está logado
        // - NÃO tem permissão ainda
        // - NÃO está subscrito
        if (user && !permission && !subscription) {
          // Aguardar 3 segundos antes de mostrar o banner (para não ser intrusivo)
          setTimeout(() => {
            setShowBanner(true);
          }, 3000);
        }
      }
    };

    checkSupport();
  }, [user]);

  const handleEnablePush = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const result = await subscribeToPushNotifications(token);

      if (result.success) {
        setIsSubscribed(true);
        setHasPermission(true);
        setShowBanner(false);

        // Mostrar notificação de teste
        await showTestNotification();

        console.log('[PUSH] ✓ Push notifications enabled successfully');
      } else {
        console.error('[PUSH] Failed to enable push:', result.error);
        
        if (result.error === 'permission_denied') {
          alert('Você negou a permissão para notificações. Para ativar, vá nas configurações do navegador.');
        } else if (result.error === 'not_supported') {
          alert('Seu navegador não suporta notificações push.');
        } else {
          alert('Erro ao ativar notificações. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('[PUSH] Error enabling push:', error);
      alert('Erro ao ativar notificações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Salvar no localStorage para não mostrar novamente por 7 dias
    localStorage.setItem('push_banner_dismissed', Date.now().toString());
  };

  // Não mostrar se não está logado
  if (!user) return null;

  // Não mostrar se não suporta
  if (!isSupported) return null;

  // Não mostrar se já está subscrito
  if (isSubscribed) return null;

  // Não mostrar se foi dispensado recentemente
  const dismissedAt = localStorage.getItem('push_banner_dismissed');
  if (dismissedAt) {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    if (parseInt(dismissedAt) > sevenDaysAgo) {
      return null;
    }
  }

  // Não mostrar o banner ainda
  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      maxWidth: '380px',
      zIndex: 9999,
      animation: 'slideInUp 0.4s ease-out',
      backdropFilter: 'blur(10px)'
    }}>
      <style>
        {`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <div style={{ fontSize: '28px', flexShrink: 0 }}>🔔</div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: '0 0 6px 0',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Ativar Notificações
          </h3>
          
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            opacity: 0.95,
            lineHeight: '1.4'
          }}>
            Receba notificações de mensagens mesmo quando o app estiver fechado.
          </p>

          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleEnablePush}
              disabled={isLoading}
              style={{
                background: 'white',
                color: '#667eea',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? '⏳ Ativando...' : '✅ Ativar'}
            </button>

            <button
              onClick={handleDismiss}
              disabled={isLoading}
              style={{
                background: 'transparent',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              Agora não
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          disabled={isLoading}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 0.8,
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          title="Fechar"
        >
          ×
        </button>
      </div>
    </div>
  );
}
