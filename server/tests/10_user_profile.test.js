/**
 * TEST SUITE 10 — User Profile Service
 * Covers: get profile, update profile, check email, learner progress, achievements
 */
const { client, authHeader, expectSuccess, expectFail } = require('./helpers/setup');

const ts = Date.now();
let learnerToken, learnerId;

beforeAll(async () => {
  const lr = await client.post('/auth/register', {
    email: `profile_learner_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Profile', last_name: 'Learner', role: 'learner',
  });
  learnerToken = lr.data.data.accessToken;
  learnerId    = lr.data.data.user.id;
});

describe('👤 User Profile — Get', () => {
  test('GET /users/profile → returns full profile', async () => {
    const res = await client.get('/users/profile', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(data.id).toBe(learnerId);
    expect(data.email).toBeDefined();
    expect(data.first_name).toBe('Profile');
    expect(data.last_name).toBe('Learner');
    expect(data.role).toBe('learner');
    // Should not expose password
    expect(data.password_hash).toBeUndefined();
  });

  test('GET /users/profile → unauthenticated → 401', async () => {
    const res = await client.get('/users/profile');
    expectFail(res, 401);
  });
});

describe('👤 User Profile — Update', () => {
  test('PUT /users/profile → updates first_name and last_name', async () => {
    const res = await client.put('/users/profile',
      { first_name: 'Updated', last_name: 'Name' },
      { headers: authHeader(learnerToken) }
    );
    const data = expectSuccess(res, 200);
    expect(data.first_name).toBe('Updated');
    expect(data.last_name).toBe('Name');
  });

  test('PUT /users/profile → updates bio', async () => {
    const res = await client.put('/users/profile',
      { bio: 'I love learning new things!' },
      { headers: authHeader(learnerToken) }
    );
    const data = expectSuccess(res, 200);
    expect(data.bio).toBe('I love learning new things!');
  });

  test('PUT /users/profile → bio too long → 400', async () => {
    const res = await client.put('/users/profile',
      { bio: 'x'.repeat(501) },
      { headers: authHeader(learnerToken) }
    );
    expectFail(res, 400);
  });

  test('PUT /users/profile → unauthenticated → 401', async () => {
    const res = await client.put('/users/profile', { first_name: 'Hacker' });
    expectFail(res, 401);
  });
});

describe('👤 User Profile — Email Check', () => {
  test('GET /users/check-email → available email returns true', async () => {
    const res = await client.get(`/users/check-email?email=definitely_not_taken_${ts}@test.com`);
    const data = expectSuccess(res, 200);
    expect(data.available).toBe(true);
  });

  test('GET /users/check-email → taken email returns false', async () => {
    const res = await client.get(`/users/check-email?email=profile_learner_${ts}@sel-test.com`);
    const data = expectSuccess(res, 200);
    expect(data.available).toBe(false);
  });

  test('GET /users/check-email → no email param → available: false', async () => {
    const res = await client.get('/users/check-email');
    const data = expectSuccess(res, 200);
    expect(data.available).toBe(false);
  });
});

describe('👤 User Profile — Learner Progress', () => {
  test('GET /users/learner/progress → returns enrollment list', async () => {
    const res = await client.get('/users/learner/progress', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(Array.isArray(data)).toBe(true);
    // Each enrollment should have course info
    data.forEach(e => {
      expect(e.course_id).toBeDefined();
      expect(typeof e.progress_pct).toBe('string'); // decimal from DB
    });
  });

  test('GET /users/learner/progress → unauthenticated → 401', async () => {
    const res = await client.get('/users/learner/progress');
    expectFail(res, 401);
  });
});

describe('👤 User Profile — Achievements', () => {
  test('GET /users/learner/achievements → returns badge list', async () => {
    const res = await client.get('/users/learner/achievements', { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /users/learner/achievements → unauthenticated → 401', async () => {
    const res = await client.get('/users/learner/achievements');
    expectFail(res, 401);
  });
});
