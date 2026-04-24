/**
 * TEST SUITE 1 — Health & Infrastructure
 * Verifies the server, databases, and all services are reachable
 */
const { client } = require('./helpers/setup');

describe('🏥 Health & Infrastructure', () => {
  test('GET /health → server is running', async () => {
    const res = await client.get('/health');
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ok');
    expect(res.data.service).toBe('smartedulear-unified');
    expect(res.data.timestamp).toBeDefined();
  });

  test('Unknown route → 404 with proper error shape', async () => {
    const res = await client.get('/this-route-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.data.status).toMatch(/fail|error/);
    expect(res.data.message).toBeDefined();
  });

  test('Protected route without token → 401', async () => {
    const res = await client.get('/auth/me');
    expect(res.status).toBe(401);
  });

  test('Protected route with invalid token → 401', async () => {
    const res = await client.get('/auth/me', {
      headers: { Authorization: 'Bearer invalid.token.here' },
    });
    expect(res.status).toBe(401);
  });
});
