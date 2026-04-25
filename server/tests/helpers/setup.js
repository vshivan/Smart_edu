/**
 * Test helpers — shared setup, teardown, and utilities
 * Tests run against the LIVE running server on port 3001
 */
const axios = require('axios');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001';

// ── HTTP client ───────────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: BASE,
  timeout: 15000,
  validateStatus: () => true, // never throw on HTTP errors
});

// ── Auth helpers ──────────────────────────────────────────────────────────────
const TEST_USERS = {
  learner: {
    email:      `test_learner_${Date.now()}@sel-test.com`,
    password:   'TestPass123!',
    first_name: 'Test',
    last_name:  'Learner',
    role:       'learner',
  },
  tutor: {
    email:      `test_tutor_${Date.now()}@sel-test.com`,
    password:   'TestPass123!',
    first_name: 'Test',
    last_name:  'Tutor',
    role:       'tutor',
  },
};

async function registerAndLogin(userData) {
  const reg = await client.post('/auth/register', userData);
  if (reg.status !== 201) throw new Error(`Register failed: ${JSON.stringify(reg.data)}`);
  return {
    user:         reg.data.data.user,
    accessToken:  reg.data.data.accessToken,
    refreshToken: reg.data.data.refreshToken,
  };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

// ── Assertion helpers ─────────────────────────────────────────────────────────
function expectSuccess(res, statusCode = 200) {
  expect(res.status).toBe(statusCode);
  expect(res.data.status).toBe('success');
  return res.data.data;
}

function expectFail(res, statusCode) {
  expect(res.status).toBe(statusCode);
  expect(['fail', 'error']).toContain(res.data.status);
}

module.exports = { client, TEST_USERS, registerAndLogin, authHeader, expectSuccess, expectFail };
