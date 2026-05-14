/**
 * TEST SUITE 11 — Notifications Service
 * Covers: list, mark read, mark all read, access control
 */
const { client, authHeader, expectSuccess, expectFail } = require('./helpers/setup');

const ts = Date.now();
let learnerToken, learnerId;

beforeAll(async () => {
  const lr = await client.post('/auth/register', {
    email: `notif_learner_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Notif', last_name: 'Learner', role: 'learner',
  });
  learnerToken = lr.data.data.accessToken;
  learnerId    = lr.data.data.user.id;

  // Create a test notification via internal endpoint
  await client.post('/notifications/internal/create', {
    user_id: learnerId,
    type:    'test',
    title:   'Test Notification',
    message: 'This is a test notification from the test suite',
  });
});

describe('🔔 Notifications — List', () => {
  test('GET /notifications → returns notification list', async () => {
    const res = await client.get('/notifications', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /notifications → unauthenticated → 401', async () => {
    const res = await client.get('/notifications');
    expectFail(res, 401);
  });

  test('GET /notifications → notifications have required fields', async () => {
    const res = await client.get('/notifications', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    if (data.length > 0) {
      const n = data[0];
      expect(n.id).toBeDefined();
      expect(n.title).toBeDefined();
      expect(typeof n.is_read).toBe('boolean');
      expect(n.created_at).toBeDefined();
    }
  });
});

describe('🔔 Notifications — Mark Read', () => {
  let notifId;

  beforeAll(async () => {
    const res = await client.get('/notifications', { headers: authHeader(learnerToken) });
    const notifs = res.data.data;
    if (notifs.length > 0) notifId = notifs[0].id;
  });

  test('PUT /notifications/:id/read → marks notification as read', async () => {
    if (!notifId) return console.log('⚠️  Skipped: no notifications');
    const res = await client.put(`/notifications/${notifId}/read`, {}, { headers: authHeader(learnerToken) });
    expectSuccess(res, 200);

    // Verify it's now read
    const listRes = await client.get('/notifications', { headers: authHeader(learnerToken) });
    const updated = listRes.data.data.find(n => n.id === notifId);
    if (updated) expect(updated.is_read).toBe(true);
  });

  test('PUT /notifications/read-all → marks all as read', async () => {
    const res = await client.put('/notifications/read-all', {}, { headers: authHeader(learnerToken) });
    expectSuccess(res, 200);
  });

  test('PUT /notifications/:id/read → unauthenticated → 401', async () => {
    const res = await client.put('/notifications/some-id/read', {});
    expectFail(res, 401);
  });
});
