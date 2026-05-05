import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const dashboard = {
  get: () => api.get('/dashboard').then(r => r.data),
};

export const consultants = {
  list: () => api.get('/consultants').then(r => r.data),
  get: (id) => api.get(`/consultants/${id}`).then(r => r.data),
  create: (data) => api.post('/consultants', data).then(r => r.data),
  update: (id, data) => api.put(`/consultants/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/consultants/${id}`).then(r => r.data),
};

export const projects = {
  list: () => api.get('/projects').then(r => r.data),
  get: (id) => api.get(`/projects/${id}`).then(r => r.data),
  create: (data) => api.post('/projects', data).then(r => r.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/projects/${id}`).then(r => r.data),
};

export const allocations = {
  list: (params) => api.get('/allocations', { params }).then(r => r.data),
  create: (data) => api.post('/allocations', data).then(r => r.data),
  update: (id, data) => api.put(`/allocations/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/allocations/${id}`).then(r => r.data),
};
