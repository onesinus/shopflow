import { api } from './client';

export const adminApi = {
  dashboardStats() {
    return api.get('/admin/dashboard/stats', { auth: true });
  },
  listProducts(params = {}) {
    const search = new URLSearchParams(params);
    return api.get(`/products?${search.toString()}`, { auth: true });
  },
  createProduct(payload) {
    return api.post('/products', payload, { auth: true });
  },
  updateProduct(id, payload) {
    return api.patch(`/products/${id}`, payload, { auth: true });
  },
  uploadProductImage(id, file) {
    const formData = new FormData();
    formData.append('image', file);
    return api.upload(`/admin/products/${id}/image`, formData, { auth: true });
  },
  listOrders(params = {}) {
    const search = new URLSearchParams(params);
    return api.get(`/admin/orders?${search.toString()}`, { auth: true });
  },
  updateOrderStatus(id, status) {
    return api.patch(`/admin/orders/${id}/status`, { status }, { auth: true });
  },
  listUsers(params = {}) {
    const search = new URLSearchParams(params);
    return api.get(`/admin/users?${search.toString()}`, { auth: true });
  },
  lowStock() {
    return api.get('/admin/products/low-stock', { auth: true });
  },
  salesExport() {
    return api.get('/admin/reports/sales/export', { auth: true });
  },
};
