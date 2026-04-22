require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const Stripe = require('stripe');
const { Pool } = require('pg');
const { authenticate } = require('../../shared/middleware/auth');
const { sendSuccess, sendCreated } = require('../../shared/utils/response');
const { errorHandler, notFound } = require('../../shared/middleware/errorHandler');
const { AppError } = require('../../shared/utils/errors');
const logger = require('../../shared/utils/logger');

const app = express();
const PORT = process.env.PAYMENT_SERVICE_PORT || 3008;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(','), credentials: true }));

// Raw body needed for Stripe webhook
app.use('/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'payment-service' }));

// Create Stripe checkout session
app.post('/payments/checkout', authenticate, async (req, res, next) => {
  try {
    const { reference_type, reference_id, amount, currency = 'usd', success_url, cancel_url } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency,
          product_data: { name: `SmartEduLearn — ${reference_type}` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: success_url || `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url:  cancel_url  || `${process.env.FRONTEND_URL}/payment/cancel`,
      metadata: { user_id: req.user.id, reference_type, reference_id },
    });

    await pool.query(
      `INSERT INTO payments (user_id, reference_type, reference_id, amount, currency, stripe_session_id)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, reference_type, reference_id, amount, currency, session.id]
    );

    sendCreated(res, { checkout_url: session.url, session_id: session.id });
  } catch(e) { next(e); }
});

// Stripe webhook
app.post('/payments/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).send('Webhook signature verification failed');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await pool.query(
      `UPDATE payments SET status = 'completed', stripe_payment_id = $1
       WHERE stripe_session_id = $2`,
      [session.payment_intent, session.id]
    );
    logger.info(`Payment completed: ${session.id}`);
  }

  res.json({ received: true });
});

// Payment history
app.get('/payments/history', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    sendSuccess(res, rows);
  } catch(e) { next(e); }
});

// Subscribe to plan
app.post('/payments/subscribe', authenticate, async (req, res, next) => {
  try {
    const { plan } = req.body;
    const prices = { pro: process.env.STRIPE_PRO_PRICE_ID, enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID };
    if (!prices[plan]) throw new AppError('Invalid plan', 400);

    const customer = await stripe.customers.create({ email: req.user.email, metadata: { user_id: req.user.id } });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: prices[plan] }],
    });

    await pool.query(
      `INSERT INTO subscriptions (user_id, plan, stripe_sub_id, stripe_cust_id, expires_at)
       VALUES ($1,$2,$3,$4, NOW() + INTERVAL '1 month')
       ON CONFLICT (user_id) DO UPDATE SET plan=$2, stripe_sub_id=$3, status='active'`,
      [req.user.id, plan, subscription.id, customer.id]
    );

    sendCreated(res, { subscription_id: subscription.id, plan });
  } catch(e) { next(e); }
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => logger.info(`Payment service → port ${PORT}`));
module.exports = app;
