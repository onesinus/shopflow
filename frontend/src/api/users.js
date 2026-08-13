import { api } from './client';

export const userApi = {
  getMe() {
    return api.get('/users/me', { auth: true });
  },
  updateMe(payload) {
    return api.patch('/users/me', payload, { auth: true });
  },
};