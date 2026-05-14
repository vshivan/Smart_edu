/**
 * TEST SUITE 12 — AI Service
 * Covers: course generation, quiz generation, chat, access control
 *
 * Note: AI tests require GEMINI_API_KEY or GROQ_API_KEY to be set.
 * If not set, generation tests are skipped gracefully.
 * Access control tests always run.
 */
const { client, authHeader, expectSuccess, expectFail } = require('./helpers/setup');

const ts = Date.now();
let learnerToken, tutorToken;

beforeAll(async () => {
  const lr = await client.post('/auth/register', {
    email: `ai_learner_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'AI', last_name: 'Learner', role: 'learner',
  });
  learnerToken = lr.data.data.accessToken;

  const tr = await client.post('/auth/register', {
    email: `ai_tutor_${ts}@sel-test.com`, password: 'TestPass123!',
    first_name: 'AI', last_name: 'Tutor', role: 'tutor',
  });
  tutorToken = tr.data.data.accessToken;
});

describe('🤖 AI — Access Control', () => {
  test('POST /ai/generate-course → unauthenticated → 401', async () => {
    const res = await client.post('/ai/generate-course', { subject: 'Python' });
    expectFail(res, 401);
  });

  test('POST /ai/generate-course → tutor cannot generate → 403', async () => {
    const res = await client.post('/ai/generate-course',
      { subject: 'Python' },
      { headers: authHeader(tutorToken) }
    );
    expectFail(res, 403);
  });

  test('POST /ai/generate-quiz → learner cannot generate quiz → 403', async () => {
    const res = await client.post('/ai/generate-quiz',
      { topic: 'Python', num_questions: 5 },
      { headers: authHeader(learnerToken) }
    );
    expectFail(res, 403);
  });

  test('POST /ai/chat → unauthenticated → 401', async () => {
    const res = await client.post('/ai/chat', { message: 'Hello' });
    expectFail(res, 401);
  });

  test('POST /ai/chat → tutor cannot use chat → 403', async () => {
    const res = await client.post('/ai/chat',
      { message: 'Hello' },
      { headers: authHeader(tutorToken) }
    );
    expectFail(res, 403);
  });

  test('POST /ai/summarize → unauthenticated → 401', async () => {
    const res = await client.post('/ai/summarize', { title: 'Test', content: 'Content' });
    expectFail(res, 401);
  });
});

describe('🤖 AI — Generate and Save (full flow)', () => {
  test('POST /ai/generate-and-save → generates course with modules and lessons', async () => {
    const res = await client.post('/ai/generate-and-save', {
      subject:         'JavaScript Basics',
      topics:          ['Variables', 'Functions'],
      difficulty:      'beginner',
      estimated_hours: 3,
    }, { headers: authHeader(learnerToken) });

    if (res.status === 503) {
      return console.log('⚠️  Skipped: AI service not configured (no API key)');
    }

    const data = expectSuccess(res, 201);
    expect(data.course).toBeDefined();
    expect(data.course.id).toBeDefined();
    expect(data.course.title).toBeDefined();
    expect(data.modules_count).toBeGreaterThan(0);
    expect(data.lessons_count).toBeGreaterThan(0);
    expect(data.enrolled).toBe(true);
    expect(data.xp_earned).toBeGreaterThan(0);
  }, 120000); // 2 min timeout for AI generation

  test('POST /ai/generate-and-save → missing subject → 400', async () => {
    const res = await client.post('/ai/generate-and-save',
      { difficulty: 'beginner' },
      { headers: authHeader(learnerToken) }
    );
    expectFail(res, 400);
  });
});

describe('🤖 AI — Chat', () => {
  test('POST /ai/chat → learner can chat', async () => {
    const res = await client.post('/ai/chat',
      { message: 'What is JavaScript?' },
      { headers: authHeader(learnerToken) }
    );

    if (res.status === 503) {
      return console.log('⚠️  Skipped: AI service not configured');
    }

    const data = expectSuccess(res, 200);
    expect(data.reply).toBeDefined();
    expect(typeof data.reply).toBe('string');
    expect(data.reply.length).toBeGreaterThan(10);
    expect(data.session_id).toBeDefined();
  }, 60000);

  test('POST /ai/chat → continues conversation with session_id', async () => {
    // First message
    const first = await client.post('/ai/chat',
      { message: 'What is a variable?' },
      { headers: authHeader(learnerToken) }
    );

    if (first.status === 503) return console.log('⚠️  Skipped: AI service not configured');

    const sessionId = first.data.data.session_id;
    expect(sessionId).toBeDefined();

    // Follow-up using session
    const second = await client.post('/ai/chat',
      { message: 'Give me an example', session_id: sessionId },
      { headers: authHeader(learnerToken) }
    );

    if (second.status === 503) return;
    const data = expectSuccess(second, 200);
    expect(data.session_id).toBe(sessionId);
    expect(data.message_count).toBeGreaterThan(2);
  }, 120000);
});

describe('🤖 AI — Recommendations', () => {
  test('POST /ai/recommendations → returns topic recommendations', async () => {
    const res = await client.post('/ai/recommendations',
      { completed_subjects: ['Python'], interests: ['Web Development'] },
      { headers: authHeader(learnerToken) }
    );

    if (res.status === 503) return console.log('⚠️  Skipped: AI service not configured');

    const data = expectSuccess(res, 200);
    expect(data.recommendations).toBeDefined();
    expect(Array.isArray(data.recommendations)).toBe(true);
    if (data.recommendations.length > 0) {
      expect(data.recommendations[0].subject).toBeDefined();
      expect(data.recommendations[0].reason).toBeDefined();
    }
  }, 60000);
});
