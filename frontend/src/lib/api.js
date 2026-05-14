import axios from 'axios';

// ── Base URL resolution ───────────────────────────────────────────────────────
// Dev (npm run dev):  Vite proxy rewrites /api → localhost:3001, so baseURL = /api
// Docker (nginx):     nginx proxies /api/ → server:3001/, so baseURL = /api
// Render + Vercel:    VITE_API_URL = https://smartedumate-server.onrender.com
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

// Attach stored token on startup (persisted from previous session)
const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}');
if (stored?.state?.token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${stored.state.token}`;
}

// ── Auto-refresh on 401 ───────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.refreshToken;
        if (!refresh) throw new Error('No refresh token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
        const newToken = data.data.accessToken;
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        original.headers['Authorization'] = `Bearer ${newToken}`;
        const { useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().setTokens(newToken, data.data.refreshToken);
        return api(original);
      } catch {
        const { useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
