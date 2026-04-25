/**
 * TEST SUITE 4 — Gamification Service (Learner)
 * Covers: XP, streaks, leaderboard, profile, role restrictions
 */
const { client, authHeader, expectSuccess, expectFail } = require('./helpers/setup');

const ts = Date.now();
let learnerToken, tutorToken, learnerId;

beforeAll(async () => {
  const lr = await client.post('/auth/register', {
    email: `gamify_learner_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Gamify', last_name: 'Learner', role: 'learner',
  });
  learnerToken = lr.data.data.accessToken;
  learnerId    = lr.data.data.user.id;

  const tr = await client.post('/auth/register', {
    email: `gamify_tutor_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Gamify', last_name: 'Tutor', role: 'tutor',
  });
  tutorToken = tr.data.data.accessToken;
});

describe('🎮 Gamification — Profile', () => {
  test('GET /gamification/profile → learner gets profile', async () => {
    const res = await client.get('/gamification/profile', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(data.xp_total).toBeDefined();
    expect(data.level).toBeDefined();
    expect(data.streak_days).toBeDefined();
    expect(data.longest_streak).toBeDefined();
    expect(data.level_info).toBeDefined();
    expect(data.xp_to_next_level).toBeDefined();
    expect(typeof data.xp_total).toBe('number');
    expect(typeof data.level).toBe('number');
  });

  test('GET /gamification/profile → tutor cannot access → 403', async () => {
    const res = await client.get('/gamification/profile', { headers: authHeader(tutorToken) });
    expectFail(res, 403);
  });

  test('GET /gamification/profile → unauthenticated → 401', async () => {
    const res = await client.get('/gamification/profile');
    expectFail(res, 401);
  });
});

describe('🎮 Gamification — Streak', () => {
  test('POST /gamification/streak → learner checks streak', async () => {
    const res = await client.post('/gamification/streak', {}, { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(data.streak).toBeDefined();
    expect(data.xp_earned).toBeDefined();
    expect(typeof data.streak).toBe('number');
    expect(data.streak).toBeGreaterThanOrEqual(1);
  });

  test('POST /gamification/streak → same day → already_checked', async () => {
    // Second call same day should return already_checked
    const res = await client.post('/gamification/streak', {}, { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(data.already_checked).toBe(true);
    expect(data.xp_earned).toBe(0);
  });

  test('POST /gamification/streak → tutor cannot access → 403', async () => {
    const res = await client.post('/gamification/streak', {}, { headers: authHeader(tutorToken) });
    expectFail(res, 403);
  });
});

describe('🎮 Gamification — XP', () => {
  test('POST /gamification/xp → awards XP to learner', async () => {
    const before = await client.get('/gamification/profile', { headers: authHeader(learnerToken) });
    const xpBefore = before.data.data.xp_total;

    const res = await client.post('/gamification/xp',
      { amount: 50, reason: 'test_award' },
      { headers: authHeader(learnerToken) }
    );
    const data = expectSuccess(res, 200);
    expect(data.xp_total).toBeGreaterThan(xpBefore);
    expect(data.level).toBeDefined();
    expect(data.leveled_up).toBeDefined();
  });

  test('POST /gamification/xp → XP reflected in profile', async () => {
    const res = await client.get('/gamification/profile', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(data.xp_total).toBeGreaterThan(0);
  });

  test('POST /gamification/xp → unauthenticated → 401', async () => {
    const res = await client.post('/gamification/xp', { amount: 10, reason: 'test' });
    expectFail(res, 401);
  });
});

describe('🎮 Gamification — Leaderboard', () => {
  test('GET /gamification/leaderboard → returns entries', async () => {
    const res = await client.get('/gamification/leaderboard', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /gamification/leaderboard?limit=5 → respects limit', async () => {
    const res = await client.get('/gamification/leaderboard?limit=5', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(data.length).toBeLessThanOrEqual(5);
  });

  test('GET /gamification/leaderboard → tutor can access', async () => {
    const res = await client.get('/gamification/leaderboard', { headers: authHeader(tutorToken) });
    expectSuccess(res, 200);
  });

  test('GET /gamification/leaderboard → unauthenticated → 401', async () => {
    const res = await client.get('/gamification/leaderboard');
    expectFail(res, 401);
  });
});
