/**
 * TEST SUITE 5 — Tutor Service
 * Covers: list tutors, profile, availability, slots, earnings, role restrictions
 */
const { client, authHeader, expectSuccess, expectFail } = require('./helpers/setup');

const ts = Date.now();
let learnerToken, tutorToken, tutorUserId, tutorProfileId;

beforeAll(async () => {
  const lr = await client.post('/auth/register', {
    email: `tutor_learner_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Tutor', last_name: 'Learner', role: 'learner',
  });
  learnerToken = lr.data.data.accessToken;

  const tr = await client.post('/auth/register', {
    email: `tutor_tutor_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Tutor', last_name: 'Tester', role: 'tutor',
  });
  tutorToken   = tr.data.data.accessToken;
  tutorUserId  = tr.data.data.user.id;
});

describe('👨‍🏫 Tutors — Public Listing', () => {
  test('GET /tutors → returns paginated list (public)', async () => {
    const res = await client.get('/tutors');
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('success');
    expect(Array.isArray(res.data.data)).toBe(true);
    expect(res.data.pagination).toBeDefined();
  });

  test('GET /tutors?search=test → filters by search', async () => {
    const res = await client.get('/tutors?search=test');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test('GET /tutors?min_rating=4 → filters by rating', async () => {
    const res = await client.get('/tutors?min_rating=4');
    expect(res.status).toBe(200);
    const tutors = res.data.data;
    tutors.forEach(t => expect(parseFloat(t.rating)).toBeGreaterThanOrEqual(4));
  });

  test('GET /tutors/:id → 404 for non-existent tutor', async () => {
    const res = await client.get('/tutors/00000000-0000-0000-0000-000000000000');
    expectFail(res, 404);
  });
});

describe('👨‍🏫 Tutors — Availability Management', () => {
  test('PUT /tutors/availability → tutor sets available=true', async () => {
    const res = await client.put('/tutors/availability',
      { is_available: true },
      { headers: authHeader(tutorToken) }
    );
    const data = expectSuccess(res, 200);
    expect(data.is_available).toBe(true);
  });

  test('PUT /tutors/availability → tutor sets available=false', async () => {
    const res = await client.put('/tutors/availability',
      { is_available: false },
      { headers: authHeader(tutorToken) }
    );
    const data = expectSuccess(res, 200);
    expect(data.is_available).toBe(false);
  });

  test('PUT /tutors/availability → learner cannot toggle → 403', async () => {
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

describe('👨‍🏫 Tutors — Slot Management', () => {
  let slotId;

  test('POST /tutors/slots → tutor adds availability slots', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const slotEnd = new Date(tomorrow);
    slotEnd.setHours(11, 0, 0, 0);

    const res = await client.post('/tutors/slots', {
      slots: [{ start: tomorrow.toISOString(), end: slotEnd.toISOString() }],
    }, { headers: authHeader(tutorToken) });

    const data = expectSuccess(res, 201);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].tutor_id).toBeDefined();
    slotId = data[0].id;
  });

  test('POST /tutors/slots → learner cannot add slots → 403', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const res = await client.post('/tutors/slots',
      { slots: [{ start: tomorrow.toISOString(), end: tomorrow.toISOString() }] },
      { headers: authHeader(learnerToken) }
    );
    expectFail(res, 403);
  });

  test('POST /tutors/slots → unauthenticated → 401', async () => {
    const res = await client.post('/tutors/slots', { slots: [] });
    expectFail(res, 401);
  });
});

describe('👨‍🏫 Tutors — Earnings', () => {
  test('GET /tutors/earnings → tutor gets earnings data', async () => {
    const res = await client.get('/tutors/earnings', { headers: authHeader(tutorToken) });
    const data = expectSuccess(res, 200);
    expect(data.total_earnings).toBeDefined();
    expect(data.earnings_30d).toBeDefined();
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

describe('👨‍🏫 Tutors — Session Booking (Learner)', () => {
  test('POST /tutors/sessions/book → tutor cannot book → 403', async () => {
    const res = await client.post('/tutors/sessions/book',
      { tutor_id: 'some-id', slot_id: 'some-slot', subject: 'Math' },
      { headers: authHeader(tutorToken) }
    );
    expectFail(res, 403);
  });

  test('POST /tutors/sessions/book → invalid slot → 409', async () => {
    const res = await client.post('/tutors/sessions/book', {
      tutor_id: '00000000-0000-0000-0000-000000000000',
      slot_id:  '00000000-0000-0000-0000-000000000000',
      subject:  'Math',
    }, { headers: authHeader(learnerToken) });
    expectFail(res, 409);
  });

  test('POST /tutors/sessions/book → unauthenticated → 401', async () => {
    const res = await client.post('/tutors/sessions/book', {
      tutor_id: 'id', slot_id: 'id', subject: 'Math',
    });
    expectFail(res, 401);
  });
});
