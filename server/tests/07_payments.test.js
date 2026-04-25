/**
 * TEST SUITE 7 — Payment Service
 * Covers: payment history, invalid plan, access control
 * Note: Stripe checkout/subscribe require real keys — tests validate structure & auth
 */
const { client, authHeader, expectSuccess, expectFail } = require('./helpers/setup');

const ts = Date.now();
let learnerToken;

beforeAll(async () => {
  const lr = await client.post('/auth/register', {
    email: `payment_learner_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Payment', last_name: 'Learner', role: 'learner',
  });
  learnerToken = lr.data.data.accessToken;
});

describe('💳 Payments — History', () => {
  test('GET /payments/history → learner gets empty history', async () => {
    const res = await client.get('/payments/history', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /payments/history → unauthenticated → 401', async () => {
    const res = await client.get('/payments/history');
    expectFail(res, 401);
  });
});

describe('💳 Payments — Subscription Validation', () => {
  test('POST /payments/subscribe → invalid plan → 400', async () => {
    const res = await client.post('/payments/subscribe',
      { plan: 'invalid_plan' },
      { headers: authHeader(learnerToken) }
    );
    expectFail(res, 400);
    expect(res.data.message).toMatch(/invalid plan/i);
  });

  test('POST /payments/subscribe → unauthenticated → 401', async () => {
    const res = await client.post('/payments/subscribe', { plan: 'pro' });
    expectFail(res, 401);
  });

  test('POST /payments/checkout → unauthenticated → 401', async () => {
    const res = await client.post('/payments/checkout', {
      reference_type: 'course', reference_id: 'some-id', amount: 29.99,
    });
    expectFail(res, 401);
  });
});
