import axios from 'axios';

// ── Base URL resolution ───────────────────────────────────────────────────────
// Dev (npm run dev):  Vite proxy rewrites /api → localhost:3001, so baseURL = /api
// Docker (nginx):     nginx proxies /api/ → server:3001/, so baseURL = /api
// Render + Vercel:    VITE_API_URL = https://smartedumate-server.onrender.com
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,   // default 30s for most requests
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

// ── AI generation needs a much longer timeout (content gen takes 60-120s) ─────
export const aiApi = axios.create({
  baseURL: BASE_URL,
  timeout: 180000,  // 3 minutes for AI course generation
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

// Attach stored token on startup (persisted from previous session)
const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}');
if (stored?.state?.token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${stored.state.token}`;
  aiApi.defaults.headers.common['Authorization'] = `Bearer ${stored.state.token}`;
}

// ── Shared token sync helper ──────────────────────────────────────────────────
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    aiApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
    delete aiApi.defaults.headers.common['Authorization'];
  }
}

// ── Auto-refresh on 401 ───────────────────────────────────────────────────────
const makeRefreshInterceptor = (instance) => {
  instance.interceptors.response.use(
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
          setAuthToken(newToken);
          original.headers['Authorization'] = `Bearer ${newToken}`;
          const { useAuthStore } = await import('../store/authStore');
          useAuthStore.getState().setTokens(newToken, data.data.refreshToken);
          return instance(original);
        } catch {
          // Token refresh failed — clear auth state without hard reload
          // React Router will handle the redirect via ProtectedRoute
          const { useAuthStore } = await import('../store/authStore');
          useAuthStore.getState().logout();
          // Use soft navigation — avoids full page reload
          if (window.location.pathname !== '/login') {
            window.location.replace('/login');
          }
        }
      }
      return Promise.reject(err);
    }
  );
};

makeRefreshInterceptor(api);
makeRefreshInterceptor(aiApi);

export default api;
