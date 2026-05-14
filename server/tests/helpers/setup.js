/**
 * Test helpers — shared setup, teardown, and utilities
 *
 * Runs against:
 *   - Local:  http://localhost:3001  (default)
 *   - Render: set TEST_BASE_URL=https://smart-edu-ed5y.onrender.com
 *
 * Usage:
 *   npm test                                          ← local
 *   TEST_BASE_URL=https://smart-edu-ed5y.onrender.com npm test  ← Render
 */
const axios = require('axios');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001';
const IS_REMOTE = BASE.includes('onrender.com') || BASE.includes('render.com');

// Remote (Render free tier) needs longer timeouts — cold start can take 30s
const TIMEOUT = IS_REMOTE ? 60000 : 15000;

console.log(`\n🎯 Testing against: ${BASE}${IS_REMOTE ? ' (Render — longer timeouts)' : ''}\n`);

// ── HTTP client ───────────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: BASE,
  timeout: TIMEOUT,
  validateStatus: () => true, // never throw on HTTP errors — we assert manually
});

// ── Auth helpers ──────────────────────────────────────────────────────────────
function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function registerAndLogin(userData) {
  const reg = await client.post('/auth/register', userData);
  if (reg.status === 409) {
    // Already registered — just login
    const login = await client.post('/auth/login', {
      email: userData.email, password: userData.password,
    });
    if (login.status !== 200) throw new Error(`Login failed: ${JSON.stringify(login.data)}`);
    return {
      user:         login.data.data.user,
      accessToken:  login.data.data.accessToken,
      refreshToken: login.data.data.refreshToken,
    };
  }
  if (reg.status !== 201) throw new Error(`Register failed (${reg.status}): ${JSON.stringify(reg.data)}`);
  return {
    user:         reg.data.data.user,
    accessToken:  reg.data.data.accessToken,
    refreshToken: reg.data.data.refreshToken,
  };
}

// ── Assertion helpers ─────────────────────────────────────────────────────────
function expectSuccess(res, statusCode = 200) {
  if (res.status !== statusCode) {
    throw new Error(`Expected ${statusCode}, got ${res.status}: ${JSON.stringify(res.data)}`);
  }
  expect(res.status).toBe(statusCode);
  expect(res.data.status).toBe('success');
  return res.data.data;
}

function expectFail(res, statusCode) {
  if (res.status !== statusCode) {
    throw new Error(`Expected ${statusCode}, got ${res.status}: ${JSON.stringify(res.data)}`);
  }
  expect(res.status).toBe(statusCode);
  expect(['fail', 'error']).toContain(res.data.status);
}

// ── Wake up Render free tier before tests ─────────────────────────────────────
async function wakeServer() {
  if (!IS_REMOTE) return;
  console.log('⏳ Waking Render server (free tier may be sleeping)...');
  for (let i = 0; i < 6; i++) {
    try {
      const res = await client.get('/health');
      if (res.status === 200) {
        console.log('✅ Server is awake\n');
        return;
      }
    } catch {}
    console.log(`   Attempt ${i + 1}/6 — waiting 10s...`);
    await new Promise(r => setTimeout(r, 10000));
  }
  throw new Error('Server did not wake up in time');
}

module.exports = {
  client,
  BASE,
  IS_REMOTE,
  TIMEOUT,
  authHeader,
  registerAndLogin,
  expectSuccess,
  expectFail,
  wakeServer,
};
