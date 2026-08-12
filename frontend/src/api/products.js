import { api } from './client';

export const productsApi = {
  list(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.set(key, value);
      }
    });
    const qs = search.toString();
    return api.get(`/products${qs ? `?${qs}` : ''}`);
  },
  get(id) {
    return api.get(`/products/${id}`);
  },
  getBySlug(slug) {
    return api.get(`/products/slug/${slug}`);
  },
  getRelated(id, limit = 6) {
    return api.get(`/products/${id}/related?limit=${limit}`);
  },
};

export const categoriesApi = {
  list() {
    return api.get('/categories');
  },
  get(slug) {
    return api.get(`/categories/${slug}`);
  },
};
