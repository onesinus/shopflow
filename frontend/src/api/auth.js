import { api, getAccessToken, setTokens, clearTokens } from './client';

export const authApi = {
  async register(payload) {
    return api.post('/auth/register', payload);
  },
  async login(payload) {
    const result = await api.post('/auth/login', payload);
    setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    return result.user;
  },
  async refresh() {
    const refreshToken = localStorage.getItem('shopflow_refresh_token');
    if (!refreshToken) return null;
    const result = await api.post('/auth/refresh', { refreshToken });
    setTokens(result);
    return result.accessToken;
  },
  async logout() {
    const refreshToken = localStorage.getItem('shopflow_refresh_token');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // ignore network errors on logout
    }
    clearTokens();
  },
  me() {
    return api.get('/users/me', { auth: true });
  },
  updateMe(payload) {
    return api.patch('/users/me', payload, { auth: true });
  },
  get currentUser() {
    try {
      return JSON.parse(localStorage.getItem('shopflow_user') || 'null');
    } catch {
      return null;
    }
  },
  saveUser(user) {
    if (user) localStorage.setItem('shopflow_user', JSON.stringify(user));
    else localStorage.removeItem('shopflow_user');
  },
  hasToken() {
    return Boolean(getAccessToken());
  },
};
