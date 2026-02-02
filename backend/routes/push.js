const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { 
  saveSubscription, 
  removeSubscription, 
  getUserSubscriptions,
  VAPID_PUBLIC_KEY 
} = require('../services/pushService');

/**
 * GET /api/push/vapid-public-key
 * Retorna a chave pública VAPID para o frontend
 */
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

/**
 * POST /api/push/subscribe
 * Salva uma push subscription para o usuário autenticado
 */
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const subscription = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }

    await saveSubscription(userId, subscription);
    
    res.json({ 
      success: true, 
      message: 'Push subscription saved successfully' 
    });
  } catch (error) {
    console.error('[PUSH API] Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

/**
 * POST /api/push/unsubscribe
 * Remove uma push subscription
 */
router.post('/unsubscribe', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint required' });
    }

    await removeSubscription(userId, endpoint);
    
    res.json({ 
      success: true, 
      message: 'Push subscription removed successfully' 
    });
  } catch (error) {
    console.error('[PUSH API] Error removing subscription:', error);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

/**
 * GET /api/push/subscriptions
 * Lista todas as subscriptions do usuário
 */
router.get('/subscriptions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const subscriptions = await getUserSubscriptions(userId);
    
    res.json({ subscriptions });
  } catch (error) {
    console.error('[PUSH API] Error getting subscriptions:', error);
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
});

module.exports = router;
