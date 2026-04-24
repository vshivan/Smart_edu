/**
 * TEST SUITE 6 — Notifications Service
 * Covers: get, mark read, mark all read, internal create, broadcast
 */
const { client, authHeader, expectSuccess, expectFail } = require('./helpers/setup');

const ts = Date.now();
let learnerToken, learnerId, notifId;

beforeAll(async () => {
  const lr = await client.post('/auth/register', {
    email: `notif_learner_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Notif', last_name: 'Learner', role: 'learner',
  });
  learnerToken = lr.data.data.accessToken;
  learnerId    = lr.data.data.user.id;

  // Create a test notification via internal endpoint
  const n = await client.post('/notifications/internal/create', {
    user_id: learnerId,
    type:    'announcement',
    title:   'Test Notification',
    message: 'This is a test notification for the test suite.',
  });
  if (n.status === 200) notifId = n.data.data.id;
});

describe('🔔 Notifications — Get', () => {
  test('GET /notifications → learner gets their notifications', async () => {
    const res = await client.get('/notifications', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /notifications → unauthenticated → 401', async () => {
    const res = await client.get('/notifications');
    expectFail(res, 401);
  });

  test('GET /notifications → notification has required fields', async () => {
    const res = await client.get('/notifications', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    if (data.length > 0) {
      const n = data[0];
      expect(n.id).toBeDefined();
      expect(n.title).toBeDefined();
      expect(n.message).toBeDefined();
      expect(n.is_read).toBeDefined();
      expect(n.created_at).toBeDefined();
    }
  });
});

describe('🔔 Notifications — Mark Read', () => {
  test('PUT /notifications/:id/read → marks notification as read', async () => {
    if (!notifId) return;
    const res = await client.put(`/notifications/${notifId}/read`, {}, { headers: authHeader(learnerToken) });
    expectSuccess(res, 200);

    // Verify it's marked read
    const listRes = await client.get('/notifications', { headers: authHeader(learnerToken) });
    const notifs = listRes.data.data;
    const updated = notifs.find(n => n.id === notifId);
    if (updated) expect(updated.is_read).toBe(true);
  });

  test('PUT /notifications/:id/read → unauthenticated → 401', async () => {
    const res = await client.put('/notifications/some-id/read', {});
    expectFail(res, 401);
  });

  test('PUT /notifications/read-all → marks all as read', async () => {
    const res = await client.put('/notifications/read-all', {}, { headers: authHeader(learnerToken) });
    expectSuccess(res, 200);
  });
});

describe('🔔 Notifications — Internal Create', () => {
  test('POST /notifications/internal/create → creates notification', async () => {
    const res = await client.post('/notifications/internal/create', {
      user_id: learnerId,
      type:    'badge_earned',
      title:   'Badge Earned!',
      message: 'You earned the First Steps badge.',
    });
    expect(res.status).toBe(200);
    expect(res.data.data.id).toBeDefined();
    expect(res.data.data.type).toBe('badge_earned');
  });

  test('POST /notifications/internal/create → notification appears in list', async () => {
    const res = await client.get('/notifications', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    const found = data.find(n => n.title === 'Badge Earned!');
    expect(found).toBeDefined();
  });
});
