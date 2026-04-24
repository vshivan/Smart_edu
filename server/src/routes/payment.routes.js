/**
 * Payment Routes — Cashfree Payment Gateway
 *
 * Why Cashfree instead of Razorpay:
 *  - Free to sign up, no minimum balance
 *  - Test mode works without real money
 *  - Indian payment gateway (UPI, cards, netbanking)
 *  - Simple REST API
 *
 * Flow:
 *  1. POST /payments/order   → create Cashfree order → return order_id + payment_session_id
 *  2. Frontend opens Cashfree checkout with payment_session_id
 *  3. POST /payments/verify  → verify payment status via Cashfree API
 *  4. POST /payments/webhook → Cashfree webhook (optional)
 *
 * Get free test keys: https://merchant.cashfree.com → Developers → API Keys
 * Test App ID starts with: TEST...
 */
const router = require('express').Router();
const crypto = require('crypto');
const axios  = require('axios');
const { authenticate } = require('../middleware/auth');
const { sendSuccess, sendCreated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { pool }     = require('../config/db');
const logger       = require('../utils/logger');

// ── Cashfree config ───────────────────────────────────────────────────────────
const CF_APP_ID  = process.env.CASHFREE_APP_ID     || '';
const CF_SECRET  = process.env.CASHFREE_SECRET_KEY || '';
const CF_ENV     = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
const CF_BASE    = CF_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';
const CF_VERSION = '2023-08-01';

const cfHeaders = () => ({
  'x-client-id':     CF_APP_ID,
  'x-client-secret': CF_SECRET,
  'x-api-version':   CF_VERSION,
  'Content-Type':    'application/json',
});

// ── Graceful no-key mode ──────────────────────────────────────────────────────
const isConfigured = () => CF_APP_ID && CF_SECRET && CF_APP_ID !== '';

// ── Create order ──────────────────────────────────────────────────────────────
router.post('/order', authenticate, async (req, res, next) => {
  try {
    const {
      reference_type,
      reference_id,
      amount,           // in INR (e.g. 499 = ₹499)
      currency = 'INR',
    } = req.body;

    if (!amount || amount <= 0) throw new AppError('Invalid amount', 400);

    if (!isConfigured()) {
      // Demo mode — return a mock order so UI can be tested without real keys
      logger.warn('Cashfree keys not set — returning mock payment order');
      return sendCreated(res, {
        order_id:           `mock_order_${Date.now()}`,
        payment_session_id: `mock_session_${Date.now()}`,
        amount,
        currency,
        demo_mode:          true,
        message:            'Payment gateway not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.',
      });
    }

    const orderId = `sel_${Date.now()}_${req.user.id.slice(0, 8)}`;

    const { data } = await axios.post(`${CF_BASE}/orders`, {
      order_id:       orderId,
      order_amount:   amount,
      order_currency: currency,
      customer_details: {
        customer_id:    req.user.id,
        customer_email: req.user.email,
        customer_phone: '9999999999',   // required by Cashfree — update from user profile
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment/callback?order_id={order_id}`,
      },
      order_note: `${reference_type}:${reference_id}`,
    }, { headers: cfHeaders() });

    // Save pending payment record
    await pool.query(
      `INSERT INTO payments
         (user_id, reference_type, reference_id, amount, currency, stripe_session_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending')`,
      [req.user.id, reference_type, reference_id, amount, currency, data.order_id]
    );

    sendCreated(res, {
      order_id:           data.order_id,
      payment_session_id: data.payment_session_id,
      amount,
      currency,
    });
  } catch (e) {
    if (e.response?.data) logger.error('Cashfree error:', e.response.data);
    next(e);
  }
});

// ── Verify payment ────────────────────────────────────────────────────────────
router.post('/verify', authenticate, async (req, res, next) => {
  try {
    const { order_id } = req.body;
    if (!order_id) throw new AppError('order_id is required', 400);

    if (!isConfigured() || order_id.startsWith('mock_')) {
      // Demo mode — mark as completed
      sendSuccess(res, { order_id, status: 'demo_completed' }, 'Demo payment verified');
      return;
    }

    // Fetch order status from Cashfree
    const { data } = await axios.get(`${CF_BASE}/orders/${order_id}`, {
      headers: cfHeaders(),
    });

    const status = data.order_status;   // PAID | ACTIVE | EXPIRED | CANCELLED

    if (status === 'PAID') {
      await pool.query(
        `UPDATE payments
         SET status = 'completed', stripe_payment_id = $1, updated_at = NOW()
         WHERE stripe_session_id = $2`,
        [data.cf_order_id?.toString() || order_id, order_id]
      );
      logger.info(`Cashfree payment verified: ${order_id}`);
      sendSuccess(res, { order_id, status: 'completed' }, 'Payment successful');
    } else {
      throw new AppError(`Payment not completed. Status: ${status}`, 400);
    }
  } catch (e) {
    if (e.response?.data) logger.error('Cashfree verify error:', e.response.data);
    next(e);
  }
});

// ── Cashfree webhook ──────────────────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;

    if (webhookSecret) {
      // Cashfree webhook signature: HMAC-SHA256 of timestamp + raw body
      const ts        = req.headers['x-webhook-timestamp'];
      const signature = req.headers['x-webhook-signature'];
      const payload   = ts + JSON.stringify(req.body);
      const expected  = crypto.createHmac('sha256', webhookSecret).update(payload).digest('base64');

      if (signature !== expected) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const { type, data } = req.body;

    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = data?.order?.order_id;
      if (orderId) {
        await pool.query(
          `UPDATE payments SET status = 'completed' WHERE stripe_session_id = $1`,
          [orderId]
        );
        logger.info(`Webhook: payment success ${orderId}`);
      }
    }

    if (type === 'PAYMENT_FAILED_WEBHOOK') {
      const orderId = data?.order?.order_id;
      if (orderId) {
        await pool.query(
          `UPDATE payments SET status = 'failed' WHERE stripe_session_id = $1`,
          [orderId]
        );
        logger.warn(`Webhook: payment failed ${orderId}`);
      }
    }

    res.json({ received: true });
  } catch (e) {
    logger.error('Webhook error', e);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ── Payment history ───────────────────────────────────────────────────────────
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, reference_type, reference_id, amount, currency,
              status, stripe_payment_id AS payment_id, created_at
       FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    sendSuccess(res, rows);
  } catch (e) { next(e); }
});

// ── Subscription plans ────────────────────────────────────────────────────────
router.post('/subscribe', authenticate, async (req, res, next) => {
  try {
    const { plan } = req.body;

    const PLANS = {
      pro:        { amount: 499,  label: 'Pro Plan — ₹499/month' },
      enterprise: { amount: 1999, label: 'Enterprise Plan — ₹1999/month' },
    };

    if (!PLANS[plan]) throw new AppError('Invalid plan. Choose "pro" or "enterprise"', 400);

    const { amount, label } = PLANS[plan];

    if (!isConfigured()) {
      return sendCreated(res, {
        order_id:           `mock_sub_${plan}_${Date.now()}`,
        payment_session_id: `mock_session_${Date.now()}`,
        amount, currency: 'INR', plan, label, demo_mode: true,
      });
    }

    const orderId = `sub_${plan}_${Date.now()}`;

    const { data } = await axios.post(`${CF_BASE}/orders`, {
      order_id:       orderId,
      order_amount:   amount,
      order_currency: 'INR',
      customer_details: {
        customer_id:    req.user.id,
        customer_email: req.user.email,
        customer_phone: '9999999999',
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment/callback?order_id={order_id}`,
      },
      order_note: `subscription:${plan}`,
    }, { headers: cfHeaders() });

    await pool.query(
      `INSERT INTO subscriptions (user_id, plan, stripe_sub_id, stripe_cust_id, expires_at)
       VALUES ($1,$2,$3,$4, NOW() + INTERVAL '1 month')
       ON CONFLICT (user_id) DO UPDATE SET plan=$2, stripe_sub_id=$3, status='active'`,
      [req.user.id, plan, data.order_id, req.user.id]
    );

    sendCreated(res, {
      order_id:           data.order_id,
      payment_session_id: data.payment_session_id,
      amount, currency: 'INR', plan, label,
    });
  } catch (e) { next(e); }
});

module.exports = router;
