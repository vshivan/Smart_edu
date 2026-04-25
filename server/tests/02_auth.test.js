/**
 * TEST SUITE 2 — Authentication Service
 * Covers: register, login, /me, token refresh, logout, validation errors
 */
const { client, authHeader, expectSuccess, expectFail } = require('./helpers/setup');

const ts = Date.now();
const LEARNER = {
  email: `auth_learner_${ts}@sel-test.com`,
  password: 'SecurePass123!',
  first_name: 'Auth',
  last_name: 'Learner',
  role: 'learner',
};
const TUTOR = {
  email: `auth_tutor_${ts}@sel-test.com`,
  password: 'SecurePass123!',
  first_name: 'Auth',
  last_name: 'Tutor',
  role: 'tutor',
};

let learnerToken, learnerRefresh, learnerId;
let tutorToken, tutorId;

describe('🔐 Auth — Registration', () => {
  test('POST /auth/register → learner registers successfully', async () => {
    const res = await client.post('/auth/register', LEARNER);
    const data = expectSuccess(res, 201);
    expect(data.user.email).toBe(LEARNER.email);
    expect(data.user.role).toBe('learner');
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
    expect(data.user.password_hash).toBeUndefined(); // never exposed
    learnerToken   = data.accessToken;
    learnerRefresh = data.refreshToken;
    learnerId      = data.user.id;
  });

  test('POST /auth/register → tutor registers successfully', async () => {
    const res = await client.post('/auth/register', TUTOR);
    const data = expectSuccess(res, 201);
    expect(data.user.role).toBe('tutor');
    tutorToken = data.accessToken;
    tutorId    = data.user.id;
  });

  test('POST /auth/register → duplicate email → 409', async () => {
    const res = await client.post('/auth/register', LEARNER);
    expectFail(res, 409);
    expect(res.data.message).toMatch(/already registered/i);
  });

  test('POST /auth/register → missing fields → 400', async () => {
    const res = await client.post('/auth/register', { email: 'bad@test.com' });
    expectFail(res, 400);
  });

  test('POST /auth/register → short password → 400', async () => {
    const res = await client.post('/auth/register', {
      email: `short_${ts}@test.com`, password: '123', first_name: 'A', last_name: 'B', role: 'learner',
    });
    expectFail(res, 400);
  });

  test('POST /auth/register → invalid email format → 400', async () => {
    const res = await client.post('/auth/register', {
      email: 'not-an-email', password: 'ValidPass123!', first_name: 'A', last_name: 'B', role: 'learner',
    });
    expectFail(res, 400);
  });

  test('POST /auth/register → invalid role → 400', async () => {
    const res = await client.post('/auth/register', {
      email: `role_${ts}@test.com`, password: 'ValidPass123!', first_name: 'A', last_name: 'B', role: 'superadmin',
    });
    expectFail(res, 400);
  });
});

describe('🔐 Auth — Login', () => {
  test('POST /auth/login → learner logs in successfully', async () => {
    const res = await client.post('/auth/login', { email: LEARNER.email, password: LEARNER.password });
    const data = expectSuccess(res, 200);
    expect(data.user.role).toBe('learner');
    expect(data.accessToken).toBeDefined();
    learnerToken   = data.accessToken;
    learnerRefresh = data.refreshToken;
  });

  test('POST /auth/login → wrong password → 401', async () => {
    const res = await client.post('/auth/login', { email: LEARNER.email, password: 'WrongPassword!' });
    expectFail(res, 401);
  });

  test('POST /auth/login → non-existent email → 401', async () => {
    const res = await client.post('/auth/login', { email: 'nobody@nowhere.com', password: 'Pass123!' });
    expectFail(res, 401);
  });

  test('POST /auth/login → missing password → 400', async () => {
    const res = await client.post('/auth/login', { email: LEARNER.email });
    expectFail(res, 400);
  });
});

describe('🔐 Auth — Token & Session', () => {
  test('GET /auth/me → returns authenticated user', async () => {
    const res = await client.get('/auth/me', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(data.id).toBe(learnerId);
    expect(data.email).toBe(LEARNER.email);
  });

  test('POST /auth/refresh → returns new access token', async () => {
    const res = await client.post('/auth/refresh', { refreshToken: learnerRefresh });
    const data = expectSuccess(res, 200);
    expect(data.accessToken).toBeDefined();
    expect(typeof data.accessToken).toBe('string');
    expect(data.accessToken.split('.').length).toBe(3); // valid JWT structure
    learnerToken = data.accessToken;
  });

  test('POST /auth/refresh → invalid refresh token → 401', async () => {
    const res = await client.post('/auth/refresh', { refreshToken: 'invalid.refresh.token' });
    expectFail(res, 401);
  });

  test('POST /auth/refresh → missing token → 401', async () => {
    const res = await client.post('/auth/refresh', {});
    expectFail(res, 401);
  });

  test('POST /auth/logout → clears session', async () => {
    // Login fresh to get a token to logout
    const loginRes = await client.post('/auth/login', { email: TUTOR.email, password: TUTOR.password });
    const token = loginRes.data.data.accessToken;
    const refresh = loginRes.data.data.refreshToken;

    const logoutRes = await client.post('/auth/logout', {}, { headers: authHeader(token) });
    expectSuccess(logoutRes, 200);

    // Refresh should now fail (session deleted)
    const refreshRes = await client.post('/auth/refresh', { refreshToken: refresh });
    expectFail(refreshRes, 401);
  });

  test('POST /auth/forgot-password → always returns success (no leak)', async () => {
    const res = await client.post('/auth/forgot-password', { email: 'anyone@test.com' });
    expect(res.status).toBe(200);
  });
});

describe('🔐 Auth — Role-Based Access', () => {
  test('Learner cannot access tutor-only endpoint', async () => {
    const res = await client.put('/tutors/availability',
      { is_available: true },
      { headers: authHeader(learnerToken) }
    );
    expectFail(res, 403);
  });

  test('Tutor cannot access learner-only endpoint', async () => {
    const loginRes = await client.post('/auth/login', { email: TUTOR.email, password: TUTOR.password });
    const token = loginRes.data.data.accessToken;
    const res = await client.post('/gamification/streak', {}, { headers: authHeader(token) });
    expectFail(res, 403);
  });

  test('Unauthenticated user cannot access admin endpoint', async () => {
    const res = await client.get('/admin/dashboard');
    expectFail(res, 401);
  });
});

module.exports = { getLearnerToken: () => learnerToken, getTutorToken: () => tutorToken, getLearnerId: () => learnerId };
