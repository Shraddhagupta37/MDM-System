// import axios from 'axios';

// const API_URL = 'http://localhost:5000/api';

// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add token to requests
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers['x-auth-token'] = token;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Handle response errors
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token');
//       window.location = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// export const auth = {
//   login: (email, password) => api.post('/auth/login', { email, password }),
//   verify: () => api.get('/auth/verify'),
// };

// export const devices = {
//   getAll: (params) => api.get('/devices', { params }),
//   getOne: (imei) => api.get(`/devices/${imei}`),
//   heartbeat: (data) => api.post('/devices/heartbeat', data),
//   block: (imei) => api.post(`/devices/${imei}/block`),
// };

// export const versions = {
//   getAll: () => api.get('/versions'),
//   create: (data) => api.post('/versions', data),
//   getLatest: () => api.get('/versions/latest'),
//   update: (versionCode, data) => api.put(`/versions/${versionCode}`, data),
// };

// export const schedules = {
//   getAll: (params) => api.get('/schedules', { params }),
//   getOne: (id) => api.get(`/schedules/${id}`),
//   create: (data) => api.post('/schedules', data),
//   approve: (id) => api.put(`/schedules/${id}/approve`),
//   nextBatch: (id) => api.post(`/schedules/${id}/next-batch`),
//   cancel: (id) => api.put(`/schedules/${id}/cancel`),
// };

// export const updates = {
//   getDeviceJobs: (imei) => api.get(`/updates/device/${imei}/pending`),
//   getDeviceHistory: (imei) => api.get(`/updates/device/${imei}/history`),
//   getJob: (jobId) => api.get(`/updates/job/${jobId}`),
// };

// export const audit = {
//   getLogs: (params) => api.get('/audit', { params }),
//   getDeviceTimeline: (imei) => api.get(`/audit/device/${imei}`),
//   getScheduleTimeline: (scheduleId) => api.get(`/audit/schedule/${scheduleId}`),
// };

// export default api;

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

console.log("API URL:", API_URL);

// Create a simple axios instance without interceptors for now
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple request interceptor - just add token if exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Simple response interceptor - just log errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  verify: () => api.get('/auth/verify'),
};

export const devices = {
  getAll: (params) => api.get('/devices', { params }),
  getOne: (imei) => api.get(`/devices/${imei}`),
  heartbeat: (data) => api.post('/devices/heartbeat', data),
  block: (imei) => api.post(`/devices/${imei}/block`),
  bulkUpdate: (deviceIds, targetVersionCode) => api.post('/devices/bulk-update', { deviceIds, targetVersionCode }),
};

export const versions = {
  getAll: () => api.get('/versions'),
  create: (data) => api.post('/versions', data),
  getLatest: () => api.get('/versions/latest'),
  update: (versionCode, data) => api.put(`/versions/${versionCode}`, data),
  delete: (versionCode) => api.delete(`/versions/${versionCode}`),
};

export const schedules = {
  getAll: (params) => api.get('/schedules', { params }),
  getOne: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  approve: (id) => api.put(`/schedules/${id}/approve`),
  nextBatch: (id) => api.post(`/schedules/${id}/next-batch`),
  cancel: (id) => api.put(`/schedules/${id}/cancel`),
  delete: (id) => api.delete(`/schedules/${id}`),
};

export const updates = {
  getDeviceJobs: (imei) => api.get(`/updates/device/${imei}/pending`),
  getDeviceHistory: (imei) => api.get(`/updates/device/${imei}/history`),
  getJob: (jobId) => api.get(`/updates/job/${jobId}`),
  simulateProgress: (jobId, action) => api.post(`/updates/simulate/${jobId}`, { action }),
};

export const audit = {
  getLogs: (params) => api.get('/audit', { params }),
  getDeviceTimeline: (imei) => api.get(`/audit/device/${imei}`),
  getScheduleTimeline: (scheduleId) => api.get(`/audit/schedule/${scheduleId}`),
};

export default api;