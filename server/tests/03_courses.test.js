/**
 * TEST SUITE 3 — Course Service (Learner + Tutor flows)
 * Covers: list, get, create (tutor), enroll (learner), update, access control
 */
const { client, authHeader, expectSuccess, expectFail } = require('./helpers/setup');

const ts = Date.now();
let learnerToken, tutorToken, courseId;

beforeAll(async () => {
  // Register learner
  const lr = await client.post('/auth/register', {
    email: `course_learner_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Course', last_name: 'Learner', role: 'learner',
  });
  learnerToken = lr.data.data.accessToken;

  // Register tutor
  const tr = await client.post('/auth/register', {
    email: `course_tutor_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'Course', last_name: 'Tutor', role: 'tutor',
  });
  tutorToken = tr.data.data.accessToken;
});

describe('📚 Courses — Public Listing', () => {
  test('GET /courses → returns paginated list', async () => {
    const res = await client.get('/courses');
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('success');
    expect(Array.isArray(res.data.data)).toBe(true);
    expect(res.data.pagination).toBeDefined();
    expect(res.data.pagination.page).toBe(1);
    expect(res.data.pagination.limit).toBeDefined();
    expect(res.data.pagination.total).toBeDefined();
  });

  test('GET /courses?difficulty=beginner → filters by difficulty', async () => {
    const res = await client.get('/courses?difficulty=beginner');
    expect(res.status).toBe(200);
    const courses = res.data.data;
    courses.forEach(c => expect(c.difficulty).toBe('beginner'));
  });

  test('GET /courses?search=python → filters by search term', async () => {
    const res = await client.get('/courses?search=python');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test('GET /courses?page=1&limit=5 → respects pagination', async () => {
    const res = await client.get('/courses?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.data.data.length).toBeLessThanOrEqual(5);
    expect(res.data.pagination.limit).toBe(5);
  });

  test('GET /courses/:id → 404 for non-existent course', async () => {
    const res = await client.get('/courses/00000000-0000-0000-0000-000000000000');
    expectFail(res, 404);
  });
});

describe('📚 Courses — Tutor Creates Course', () => {
  test('POST /courses → tutor creates a course successfully', async () => {
    const res = await client.post('/courses', {
      title:           'Introduction to Testing',
      description:     'Learn how to write proper test cases for Node.js applications.',
      subject:         'Software Testing',
      difficulty:      'beginner',
      estimated_hours: 5,
      is_free:         true,
      tags:            ['testing', 'nodejs', 'jest'],
    }, { headers: authHeader(tutorToken) });

    const data = expectSuccess(res, 201);
    expect(data.title).toBe('Introduction to Testing');
    expect(data.difficulty).toBe('beginner');
    expect(data.is_free).toBe(true);
    courseId = data.id;
  });

  test('POST /courses → learner cannot create course → 403', async () => {
    const res = await client.post('/courses', {
      title: 'Unauthorized Course', description: 'Test', subject: 'Test',
      difficulty: 'beginner', estimated_hours: 1, is_free: true,
    }, { headers: authHeader(learnerToken) });
    expectFail(res, 403);
  });

  test('POST /courses → unauthenticated → 401', async () => {
    const res = await client.post('/courses', {
      title: 'No Auth Course', description: 'Test', subject: 'Test',
      difficulty: 'beginner', estimated_hours: 1, is_free: true,
    });
    expectFail(res, 401);
  });
});

describe('📚 Courses — Get Course Detail', () => {
  test('GET /courses/:id → returns course with modules', async () => {
    if (!courseId) return;
    const res = await client.get(`/courses/${courseId}`);
    const data = expectSuccess(res, 200);
    expect(data.id).toBe(courseId);
    expect(data.title).toBe('Introduction to Testing');
    expect(Array.isArray(data.modules)).toBe(true);
  });

  test('GET /courses/:id → learner sees enrollment status', async () => {
    if (!courseId) return;
    const res = await client.get(`/courses/${courseId}`, { headers: authHeader(learnerToken) });
    const data = expectSuccess(res, 200);
    // is_enrolled is only present when user is authenticated and enrolled
    expect(data.id).toBe(courseId);
    expect(typeof data.is_enrolled === 'boolean' || data.is_enrolled === undefined).toBe(true);
  });
});

describe('📚 Courses — Tutor Updates Course', () => {
  test('PUT /courses/:id → tutor updates own course', async () => {
    if (!courseId) return;
    const res = await client.put(`/courses/${courseId}`, {
      title: 'Introduction to Testing (Updated)',
      estimated_hours: 8,
    }, { headers: authHeader(tutorToken) });
    const data = expectSuccess(res, 200);
    expect(data.title).toBe('Introduction to Testing (Updated)');
    expect(parseInt(data.estimated_hours)).toBe(8);
  });

  test('PUT /courses/:id → learner cannot update course → 403', async () => {
    if (!courseId) return;
    const res = await client.put(`/courses/${courseId}`,
      { title: 'Hacked Title' },
      { headers: authHeader(learnerToken) }
    );
    expectFail(res, 403);
  });

  test('PUT /courses/:id → no fields to update → 400', async () => {
    if (!courseId) return;
    const res = await client.put(`/courses/${courseId}`, {}, { headers: authHeader(tutorToken) });
    expectFail(res, 400);
  });
});

describe('📚 Courses — Learner Enrollment', () => {
  test('POST /courses/:id/enroll → course not published → 400', async () => {
    if (!courseId) return;
    // Course is not published by default
    const res = await client.post(`/courses/${courseId}/enroll`, {}, { headers: authHeader(learnerToken) });
    expectFail(res, 400);
    expect(res.data.message).toMatch(/not available/i);
  });

  test('POST /courses/:id/enroll → tutor cannot enroll → 403', async () => {
    if (!courseId) return;
    const res = await client.post(`/courses/${courseId}/enroll`, {}, { headers: authHeader(tutorToken) });
    expectFail(res, 403);
  });

  test('POST /courses/:id/enroll → unauthenticated → 401', async () => {
    if (!courseId) return;
    const res = await client.post(`/courses/${courseId}/enroll`, {});
    expectFail(res, 401);
  });
});

module.exports = { getCourseId: () => courseId, getTutorToken: () => tutorToken, getLearnerToken: () => learnerToken };
