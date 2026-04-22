import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,

      login: async (credentials) => {
        const { data } = await api.post('/auth/login', credentials);
        set({ user: data.data.user, token: data.data.accessToken, refreshToken: data.data.refreshToken });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
        return data.data;
      },

      register: async (payload) => {
        const { data } = await api.post('/auth/register', payload);
        set({ user: data.data.user, token: data.data.accessToken, refreshToken: data.data.refreshToken });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
        return data.data;
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch {}
        set({ user: null, token: null, refreshToken: null });
        delete api.defaults.headers.common['Authorization'];
      },

      setTokens: (accessToken, refreshToken) => {
        set({ token: accessToken, refreshToken });
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      },

      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, token: s.token, refreshToken: s.refreshToken }) }
  )
);
