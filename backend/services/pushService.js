const webPush = require('web-push');
const { getDb } = require('../database');

// VAPID Keys (geradas com web-push generate-vapid-keys)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BDJRU6hQzwy0HPWIxtdruE51Bmq30MwyEFxnV3HyWDtIRunoX0icuK5TFwOpK4NUNpDERX3cemEJZkkL0ClxeRY';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'o7DgxdmlDSzHfYie7O_yEf9bTfr7EqUCyoyMLHsNJzk';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:kalebe.caldas@hotmail.com';

// Configurar web-push com VAPID
webPush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

/**
 * Salvar subscription do usuário
 */
async function saveSubscription(userId, subscription) {
  const db = getDb();
  const subscriptionJson = JSON.stringify(subscription);
  
  try {
    // Verificar se já existe
    const existing = await db.get(
      'SELECT * FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, subscription.endpoint]
    );

    if (existing) {
      // Atualizar
      await db.run(
        'UPDATE push_subscriptions SET subscription = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [subscriptionJson, existing.id]
      );
      console.log(`[PUSH] Updated subscription for user ${userId}`);
    } else {
      // Inserir nova
      await db.run(
        'INSERT INTO push_subscriptions (user_id, endpoint, subscription) VALUES (?, ?, ?)',
        [userId, subscription.endpoint, subscriptionJson]
      );
      console.log(`[PUSH] Saved new subscription for user ${userId}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[PUSH] Error saving subscription:', error);
    throw error;
  }
}

/**
 * Remover subscription
 */
async function removeSubscription(userId, endpoint) {
  const db = getDb();
  
  try {
    await db.run(
      'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, endpoint]
    );
    console.log(`[PUSH] Removed subscription for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('[PUSH] Error removing subscription:', error);
    throw error;
  }
}

/**
 * Buscar todas as subscriptions de um usuário
 */
async function getUserSubscriptions(userId) {
  const db = getDb();
  
  try {
    const rows = await db.all(
      'SELECT * FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );
    
    return rows.map(row => ({
      id: row.id,
      endpoint: row.endpoint,
      subscription: JSON.parse(row.subscription),
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('[PUSH] Error getting subscriptions:', error);
    return [];
  }
}

/**
 * Enviar notificação push para um usuário
 */
async function sendPushNotification(userId, payload) {
  const subscriptions = await getUserSubscriptions(userId);
  
  if (subscriptions.length === 0) {
    console.log(`[PUSH] No subscriptions found for user ${userId}`);
    return { sent: 0, failed: 0 };
  }

  const payloadString = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

  console.log(`[PUSH] Sending notification to ${subscriptions.length} subscription(s) for user ${userId}`);

  // Enviar para todas as subscriptions do usuário (múltiplos dispositivos)
  const promises = subscriptions.map(async (sub) => {
    try {
      await webPush.sendNotification(sub.subscription, payloadString);
      sent++;
      console.log(`[PUSH] ✓ Sent to subscription ${sub.id}`);
    } catch (error) {
      failed++;
      console.error(`[PUSH] ✗ Failed to send to subscription ${sub.id}:`, error.message);
      
      // Se subscription expirou ou é inválida, remover do banco
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.log(`[PUSH] Removing invalid subscription ${sub.id}`);
        await removeSubscription(userId, sub.endpoint);
      }
    }
  });

  await Promise.all(promises);

  console.log(`[PUSH] Results for user ${userId}: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

/**
 * Enviar notificação de nova mensagem
 */
async function sendNewMessageNotification(userId, messageData) {
  const { 
    senderName, 
    messageText, 
    channelName, 
    workspaceName,
    isDirect,
    channelId,
    dmId,
    workspaceId
  } = messageData;

  // Construir título e corpo da notificação
  const title = isDirect 
    ? `💬 ${senderName}` 
    : `#${channelName}`;
  
  const body = isDirect
    ? messageText
    : `${senderName}: ${messageText}`;

  // URL para abrir quando clicar na notificação
  const url = isDirect
    ? `/workspace/${workspaceId}/dm/${dmId}`
    : `/workspace/${workspaceId}/channel/${channelId}`;

  const payload = {
    title,
    body: body.length > 100 ? body.substring(0, 97) + '...' : body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url,
      workspaceName,
      channelName: isDirect ? 'Mensagem Direta' : channelName,
      timestamp: Date.now()
    }
  };

  return await sendPushNotification(userId, payload);
}

/**
 * Enviar notificação de menção
 */
async function sendMentionNotification(userId, mentionData) {
  const { 
    senderName, 
    messageText, 
    channelName, 
    workspaceName,
    channelId,
    workspaceId,
    isChannelMention
  } = mentionData;

  const title = isChannelMention
    ? `📢 @channel em #${channelName}`
    : `@menção em #${channelName}`;
  
  const body = `${senderName}: ${messageText}`;
  const url = `/workspace/${workspaceId}/channel/${channelId}`;

  const payload = {
    title,
    body: body.length > 100 ? body.substring(0, 97) + '...' : body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `mention-${channelId}`, // Agrupa menções do mesmo canal
    data: {
      url,
      workspaceName,
      channelName,
      type: 'mention',
      timestamp: Date.now()
    }
  };

  return await sendPushNotification(userId, payload);
}

module.exports = {
  saveSubscription,
  removeSubscription,
  getUserSubscriptions,
  sendPushNotification,
  sendNewMessageNotification,
  sendMentionNotification,
  VAPID_PUBLIC_KEY
};
