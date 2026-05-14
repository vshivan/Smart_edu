/**
 * TEST SUITE 13 — Tutor Service
 * Covers: list tutors, get profile, availability, slots, sessions, earnings
 */
const { client, authHeader, expectSuccess, expectFail } = require('./helpers/setup');

const ts = Date.now();
let learnerToken, tutorToken, tutorId, tutorProfileId;

beforeAll(async () => {
  const lr = await client.post('/auth/register', {
    email: `tutor_learner_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Tutor', last_name: 'Learner', role: 'learner',
  });
  learnerToken = lr.data.data.accessToken;

  const tr = await client.post('/auth/register', {
    email: `tutor_tutor_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Tutor', last_name: 'Tutor', role: 'tutor',
  });
  tutorToken = tr.data.data.accessToken;
  tutorId    = tr.data.data.user.id;
});

describe('👨‍🏫 Tutors — Public Listing', () => {
  test('GET /tutors → returns paginated tutor list', async () => {
    const res = await client.get('/tutors');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
    expect(res.data.pagination).toBeDefined();
  });

  test('GET /tutors?search=test → filters by search', async () => {
    const res = await client.get('/tutors?search=test');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test('GET /tutors/:id → 404 for non-existent tutor', async () => {
    const res = await client.get('/tutors/00000000-0000-0000-0000-000000000000');
    expectFail(res, 404);
  });
});

describe('👨‍🏫 Tutors — Self Profile', () => {
  test('GET /tutors/me → tutor gets own profile', async () => {
    const res = await client.get('/tutors/me', { headers: authHeader(tutorToken) });
    // May return null if profile not yet set up, but should not error
    expect([200]).toContain(res.status);
  });

  test('GET /tutors/me → learner cannot access → 403', async () => {
    const res = await client.get('/tutors/me', { headers: authHeader(learnerToken) });
    expectFail(res, 403);
  });

  test('GET /tutors/me → unauthenticated → 401', async () => {
    const res = await client.get('/tutors/me');
    expectFail(res, 401);
  });
});

describe('👨‍🏫 Tutors — Availability', () => {
  test('PUT /tutors/availability → tutor sets availability', async () => {
    const res = await client.put('/tutors/availability',
      { is_available: true },
      { headers: authHeader(tutorToken) }
    );
    const data = expectSuccess(res, 200);
    expect(data.is_available).toBe(true);
  });

  test('PUT /tutors/availability → learner cannot set availability → 403', async () => {
    const res = await client.put('/tutors/availability',
      { is_available: true },
      { headers: authHeader(learnerToken) }
    );
    expectFail(res, 403);
  });

  test('PUT /tutors/availability → unauthenticated → 401', async () => {
    const res = await client.put('/tutors/availability', { is_available: true });
    expectFail(res, 401);
  });
});

describe('👨‍🏫 Tutors — Earnings', () => {
  test('GET /tutors/earnings → tutor gets earnings summary', async () => {
    const res = await client.get('/tutors/earnings', { headers: authHeader(tutorToken) });
    const data = expectSuccess(res, 200);
    expect(data.total_earnings).toBeDefined();
    expect(data.total_sessions).toBeDefined();
    expect(data.completed_sessions).toBeDefined();
  });

  test('GET /tutors/earnings → learner cannot access → 403', async () => {
    const res = await client.get('/tutors/earnings', { headers: authHeader(learnerToken) });
    expectFail(res, 403);
  });

  test('GET /tutors/earnings → unauthenticated → 401', async () => {
    const res = await client.get('/tutors/earnings');
    expectFail(res, 401);
  });
});

describe('👨‍🏫 Tutors — Slots', () => {
  test('POST /tutors/slots → tutor adds availability slots', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(11, 0, 0, 0);

    const res = await client.post('/tutors/slots',
      { slots: [{ start: tomorrow.toISOString(), end: end.toISOString() }] },
      { headers: authHeader(tutorToken) }
    );
    const data = expectSuccess(res, 201);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].slot_start).toBeDefined();
  });

  test('POST /tutors/slots → learner cannot add slots → 403', async () => {
    const res = await client.post('/tutors/slots',
      { slots: [] },
      { headers: authHeader(learnerToken) }
    );
    expectFail(res, 403);
  });
});

describe('👨‍🏫 Tutors — Session Booking', () => {
  test('POST /tutors/sessions/book → tutor cannot book → 403', async () => {
    const res = await client.post('/tutors/sessions/book',
      { tutor_id: 'some-id', slot_id: 'some-slot', subject: 'Math' },
      { headers: authHeader(tutorToken) }
    );
    expectFail(res, 403);
  });

  test('POST /tutors/sessions/book → unauthenticated → 401', async () => {
    const res = await client.post('/tutors/sessions/book',
      { tutor_id: 'some-id', slot_id: 'some-slot', subject: 'Math' }
    );
    expectFail(res, 401);
  });
});
