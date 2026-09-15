import api from './api';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  addAddress: (data) => api.post('/auth/addresses', data),
  updateAddress: (id, data) => api.put(`/auth/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}`),
  setDefaultAddress: (id) => api.put(`/auth/addresses/${id}/default`),
};

export const productApi = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  suggestions: (q) => api.get('/products/search/suggestions', { params: { q } }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
  duplicate: (id) => api.post(`/products/${id}/duplicate`),
  addVariant: (id, data) => api.post(`/products/${id}/variants`, data),
  updateVariant: (id, variantId, data) =>
    api.put(`/products/${id}/variants/${variantId}`, data),
  deleteVariant: (id, variantId) => api.delete(`/products/${id}/variants/${variantId}`),
  bulk: (data) => api.post('/products/bulk', data),
};

export const categoryApi = {
  list: (params) => api.get('/categories', { params }),
  get: (slug) => api.get(`/categories/${slug}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
  reorder: (orderedIds) => api.put('/categories/reorder', { orderedIds }),
};

export const orderApi = {
  create: (data) => api.post('/orders', data),
  myOrders: (params) => api.get('/orders/my-orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
};

export const settingsApi = {
  get: () => api.get('/settings'),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  search: (q) => api.get('/admin/search', { params: { q } }),
  orders: (params) => api.get('/admin/orders', { params }),
  createInStoreOrder: (data) => api.post('/admin/orders/in-store', data),
  order: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  updatePayment: (id, data) => api.put(`/admin/orders/${id}/payment`, data),
  updateNotes: (id, data) => api.put(`/admin/orders/${id}/notes`, data),
  inventory: (params) => api.get('/admin/inventory', { params }),
  adjustStock: (variantId, data) =>
    api.post(`/admin/inventory/${variantId}/adjust`, data),
  stockHistory: (variantId) => api.get(`/admin/inventory/${variantId}/history`),
  bulkStock: (data) => api.post('/admin/inventory/bulk', data),
  customers: (params) => api.get('/admin/customers', { params }),
  customer: (id) => api.get(`/admin/customers/${id}`),
  updateCustomer: (id, data) => api.put(`/admin/customers/${id}`, data),
  salesReport: (params) => api.get('/admin/reports/sales', { params }),
  productReport: (params) => api.get('/admin/reports/products', { params }),
  inventoryReport: (params) => api.get('/admin/reports/inventory', { params }),
  exportOrders: (params) =>
    api.get('/admin/reports/export/orders', { params, responseType: 'blob' }),
  exportProducts: () =>
    api.get('/admin/reports/export/products', { responseType: 'blob' }),
  settings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  importProducts: (formData, preview = false) =>
    api.post(`/admin/products/import${preview ? '?preview=true' : ''}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  notifications: (params) => api.get('/admin/notifications', { params }),
};
