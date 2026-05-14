/**
 * TEST SUITE 9 — Gamification Service
 * Covers: XP award, streak check, leaderboard, profile, access control
 */
const { client, authHeader, expectSuccess, expectFail } = require('./helpers/setup');

const ts = Date.now();
let learnerToken, learnerId, tutorToken;

beforeAll(async () => {
  const lr = await client.post('/auth/register', {
    email: `gamif_learner_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Gamif', last_name: 'Learner', role: 'learner',
  });
  learnerToken = lr.data.data.accessToken;
  learnerId    = lr.data.data.user.id;

  const tr = await client.post('/auth/register', {
    email: `gamif_tutor_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Gamif', last_name: 'Tutor', role: 'tutor',
  });
  tutorToken = tr.data.data.accessToken;
});

describe('🎮 Gamification — Profile', () => {
  test('GET /gamification/profile → learner gets their profile', async () => {
    const res = await client.get('/gamification/profile', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(typeof data.xp_total).toBe('number');
    expect(typeof data.level).toBe('number');
    expect(typeof data.streak_days).toBe('number');
    expect(data.level_info).toBeDefined();
    expect(data.level_info.title).toBeDefined();
    expect(typeof data.xp_to_next_level).toBe('number');
    expect(data.xp_total).toBeGreaterThanOrEqual(0);
    expect(data.level).toBeGreaterThanOrEqual(1);
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

describe('🎮 Gamification — XP', () => {
  test('POST /gamification/xp → awards XP to learner', async () => {
    const res = await client.post('/gamification/xp',
      { amount: 10, reason: 'test_award' },
      { headers: authHeader(learnerToken) }
    );
    const data = expectSuccess(res, 200);
    expect(typeof data.xp_total).toBe('number');
    expect(data.xp_total).toBeGreaterThan(0);
    expect(data.level).toBeDefined();
  });

  test('POST /gamification/xp → unauthenticated → 401', async () => {
    const res = await client.post('/gamification/xp', { amount: 10, reason: 'test' });
    expectFail(res, 401);
  });

  test('POST /gamification/xp → XP increases profile total', async () => {
    const before = await client.get('/gamification/profile', { headers: authHeader(learnerToken) });
    const xpBefore = before.data.data.xp_total;

    await client.post('/gamification/xp', { amount: 25, reason: 'test_increase' }, { headers: authHeader(learnerToken) });

    const after = await client.get('/gamification/profile', { headers: authHeader(learnerToken) });
    const xpAfter = after.data.data.xp_total;

    expect(xpAfter).toBe(xpBefore + 25);
  });
});

describe('🎮 Gamification — Streak', () => {
  test('POST /gamification/streak → learner checks streak', async () => {
    const res = await client.post('/gamification/streak', {}, { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(typeof data.streak).toBe('number');
    expect(data.streak).toBeGreaterThanOrEqual(1);
  });

  test('POST /gamification/streak → calling twice same day returns already_checked', async () => {
    await client.post('/gamification/streak', {}, { headers: authHeader(learnerToken) });
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

describe('🎮 Gamification — Leaderboard', () => {
  test('GET /gamification/leaderboard → returns ranked list', async () => {
    const res = await client.get('/gamification/leaderboard', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(Array.isArray(data)).toBe(true);
    // Each entry should have rank and xp
    if (data.length > 0) {
      expect(data[0].rank).toBe(1);
      expect(typeof data[0].xp).toBe('number');
    }
  });

  test('GET /gamification/leaderboard?limit=5 → respects limit', async () => {
    const res = await client.get('/gamification/leaderboard?limit=5', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(data.length).toBeLessThanOrEqual(5);
  });

  test('GET /gamification/leaderboard → unauthenticated → 401', async () => {
    const res = await client.get('/gamification/leaderboard');
    expectFail(res, 401);
  });

  test('GET /gamification/leaderboard → entries have user names', async () => {
    const res = await client.get('/gamification/leaderboard', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    // All entries should have user_id at minimum
    data.forEach(entry => {
      expect(entry.user_id).toBeDefined();
      expect(typeof entry.xp).toBe('number');
    });
  });
});
