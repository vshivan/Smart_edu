import axios from 'axios';

const api = axios.create({
  // In dev: Vite proxies all backend routes directly (no /api prefix)
  // In prod: VITE_API_URL points to the Render backend
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on startup
const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}');
if (stored?.state?.token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${stored.state.token}`;
}

// Response interceptor — auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.refreshToken;
        if (!refresh) throw new Error('No refresh token');
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: refresh });
        const newToken = data.data.accessToken;
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        original.headers['Authorization'] = `Bearer ${newToken}`;
        // Update store
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
