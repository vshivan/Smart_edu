/**
 * TEST SUITE 8 — Admin Service
 * Covers: dashboard, user management, tutor verification, analytics
 * Uses a pre-seeded admin account (test@example.com / password123)
 */
const { client, authHeader, expectSuccess, expectFail } = require('./helpers/setup');

const ts = Date.now();
let adminToken, learnerToken, learnerId;

beforeAll(async () => {
  // Login as existing admin (created in previous test runs)
  const adminLogin = await client.post('/auth/login', {
    email: 'test@example.com', password: 'password123',
  });

  if (adminLogin.status === 200 && adminLogin.data.data.user.role === 'admin') {
    adminToken = adminLogin.data.data.accessToken;
  }

  // Register a fresh learner for management tests
  const lr = await client.post('/auth/register', {
    email: `admin_target_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Admin', last_name: 'Target', role: 'learner',
  });
  learnerToken = lr.data.data.accessToken;
  learnerId    = lr.data.data.user.id;
});

describe('🛡️ Admin — Access Control', () => {
  test('GET /admin/dashboard → learner cannot access → 403', async () => {
    const res = await client.get('/admin/dashboard', { headers: authHeader(learnerToken) });
    expectFail(res, 403);
  });

  test('GET /admin/dashboard → unauthenticated → 401', async () => {
    const res = await client.get('/admin/dashboard');
    expectFail(res, 401);
  });

  test('GET /admin/users → learner cannot access → 403', async () => {
    const res = await client.get('/admin/users', { headers: authHeader(learnerToken) });
    expectFail(res, 403);
  });

  test('GET /admin/analytics → unauthenticated → 401', async () => {
    const res = await client.get('/admin/analytics');
    expectFail(res, 401);
  });
});

describe('🛡️ Admin — Dashboard (requires admin account)', () => {
  beforeEach(() => {
    if (!adminToken) return;
  });

  test('GET /admin/dashboard → returns platform metrics', async () => {
    if (!adminToken) return console.log('⚠️  Skipped: no admin token');
    const res = await client.get('/admin/dashboard', { headers: authHeader(adminToken) });
    const data = expectSuccess(res, 200);
    expect(data.users).toBeDefined();
    expect(data.courses).toBeDefined();
    expect(data.revenue).toBeDefined();
    expect(data.engagement).toBeDefined();
    expect(parseInt(data.users.total)).toBeGreaterThanOrEqual(0);
  });

  test('GET /admin/users → returns paginated user list', async () => {
    if (!adminToken) return console.log('⚠️  Skipped: no admin token');
    const res = await client.get('/admin/users', { headers: authHeader(adminToken) });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
    expect(res.data.pagination).toBeDefined();
  });

  test('GET /admin/users?role=learner → filters by role', async () => {
    if (!adminToken) return console.log('⚠️  Skipped: no admin token');
    const res = await client.get('/admin/users?role=learner', { headers: authHeader(adminToken) });
    expect(res.status).toBe(200);
    res.data.data.forEach(u => expect(u.role).toBe('learner'));
  });

  test('GET /admin/users?search=admin → filters by search', async () => {
    if (!adminToken) return console.log('⚠️  Skipped: no admin token');
    const res = await client.get('/admin/users?search=admin', { headers: authHeader(adminToken) });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test('GET /admin/tutors/pending → returns pending tutors', async () => {
    if (!adminToken) return console.log('⚠️  Skipped: no admin token');
    const res = await client.get('/admin/tutors/pending', { headers: authHeader(adminToken) });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test('GET /admin/courses → returns all courses', async () => {
    if (!adminToken) return console.log('⚠️  Skipped: no admin token');
    const res = await client.get('/admin/courses', { headers: authHeader(adminToken) });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test('GET /admin/analytics?period=7d → returns 7-day analytics', async () => {
    if (!adminToken) return console.log('⚠️  Skipped: no admin token');
    const res = await client.get('/admin/analytics?period=7d', { headers: authHeader(adminToken) });
    const data = expectSuccess(res, 200);
    expect(data.signups).toBeDefined();
    expect(data.enrollments).toBeDefined();
    expect(data.quiz_stats).toBeDefined();
    expect(data.revenue).toBeDefined();
  });

  test('GET /admin/analytics?period=30d → returns 30-day analytics', async () => {
    if (!adminToken) return console.log('⚠️  Skipped: no admin token');
    const res = await client.get('/admin/analytics?period=30d', { headers: authHeader(adminToken) });
    expectSuccess(res, 200);
  });

  test('GET /admin/analytics?period=90d → returns 90-day analytics', async () => {
    if (!adminToken) return console.log('⚠️  Skipped: no admin token');
    const res = await client.get('/admin/analytics?period=90d', { headers: authHeader(adminToken) });
    expectSuccess(res, 200);
  });

  test('GET /admin/audit-log → returns audit entries', async () => {
    if (!adminToken) return console.log('⚠️  Skipped: no admin token');
    const res = await client.get('/admin/audit-log', { headers: authHeader(adminToken) });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test('PUT /admin/users/:id/ban → bans a user', async () => {
    if (!adminToken) return console.log('⚠️  Skipped: no admin token');
    const res = await client.put(`/admin/users/${learnerId}/ban`,
      { reason: 'Test ban from automated test suite' },
      { headers: authHeader(adminToken) }
    );
    const data = expectSuccess(res, 200);
    expect(data.message).toMatch(/banned/i);
  });

  test('PUT /admin/users/:id/unban → unbans a user', async () => {
    if (!adminToken) return console.log('⚠️  Skipped: no admin token');
    const res = await client.put(`/admin/users/${learnerId}/unban`, {},
      { headers: authHeader(adminToken) }
    );
    const data = expectSuccess(res, 200);
    expect(data.message).toMatch(/unbanned/i);
  });

  test('PUT /admin/users/:id/ban → cannot ban admin → 403', async () => {
    if (!adminToken) return console.log('⚠️  Skipped: no admin token');
    // Get admin user id
    const meRes = await client.get('/auth/me', { headers: authHeader(adminToken) });
    const adminId = meRes.data.data.id;
    const res = await client.put(`/admin/users/${adminId}/ban`,
      { reason: 'Self-ban attempt' },
      { headers: authHeader(adminToken) }
    );
    expectFail(res, 403);
  });
});
