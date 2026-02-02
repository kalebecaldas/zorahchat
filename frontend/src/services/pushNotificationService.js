// Push Notification Service - Frontend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Verifica se o navegador suporta notificações push
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Verifica se o usuário já concedeu permissão para notificações
 */
export function hasNotificationPermission() {
  return Notification.permission === 'granted';
}

/**
 * Solicita permissão para notificações
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[PUSH] Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('[PUSH] Notification permission denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Obtém a chave pública VAPID do servidor
 */
async function getVapidPublicKey() {
  try {
    const response = await fetch(`${API_URL}/api/push/vapid-public-key`);
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('[PUSH] Failed to get VAPID key:', error);
    throw error;
  }
}

/**
 * Converte chave VAPID de base64 para Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registra subscription de push notification
 */
export async function subscribeToPushNotifications(token) {
  try {
    console.log('[PUSH] Starting push subscription...');

    // 1. Verificar suporte
    if (!isPushSupported()) {
      console.log('[PUSH] Push notifications not supported');
      return { success: false, error: 'not_supported' };
    }

    // 2. Solicitar permissão
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('[PUSH] Notification permission not granted');
      return { success: false, error: 'permission_denied' };
    }

    // 3. Registrar Service Worker (se ainda não estiver)
    let registration = await navigator.serviceWorker.ready;
    console.log('[PUSH] Service Worker ready');

    // 4. Obter chave VAPID
    const vapidPublicKey = await getVapidPublicKey();
    console.log('[PUSH] VAPID public key obtained');

    // 5. Criar subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('[PUSH] Push subscription created:', subscription.endpoint);

    // 6. Enviar subscription para o servidor
    const response = await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription on server');
    }

    const result = await response.json();
    console.log('[PUSH] ✓ Push subscription saved on server:', result);

    return { success: true, subscription };

  } catch (error) {
    console.error('[PUSH] Failed to subscribe:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancela subscription de push notification
 */
export async function unsubscribeFromPushNotifications(token) {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('[PUSH] No active subscription to unsubscribe');
      return { success: true };
    }

    // Cancelar no cliente
    await subscription.unsubscribe();
    console.log('[PUSH] Push subscription cancelled locally');

    // Remover do servidor
    const response = await fetch(`${API_URL}/api/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });

    if (!response.ok) {
      console.warn('[PUSH] Failed to remove subscription from server');
    }

    console.log('[PUSH] ✓ Push subscription removed');
    return { success: true };

  } catch (error) {
    console.error('[PUSH] Failed to unsubscribe:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verifica se já existe uma subscription ativa
 */
export async function getActiveSubscription() {
  try {
    if (!isPushSupported()) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    return subscription;
  } catch (error) {
    console.error('[PUSH] Failed to get active subscription:', error);
    return null;
  }
}

/**
 * Mostra uma notificação de teste
 */
export async function showTestNotification() {
  if (!hasNotificationPermission()) {
    const granted = await requestNotificationPermission();
    if (!granted) {
      return false;
    }
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification('ZORAH CHAT', {
    body: 'Notificações push ativadas! 🎉',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'test-notification'
  });

  return true;
}
