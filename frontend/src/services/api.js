import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response time for debugging
    const endTime = new Date();
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      const duration = endTime - startTime;
      console.debug(`API Request: ${response.config.url} - ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden:', data.message);
          break;
        case 404:
          // Not found
          console.error('Resource not found:', data.message);
          break;
        case 500:
          // Server error
          console.error('Server error:', data.message);
          break;
        default:
          console.error(`HTTP ${status}:`, data.message);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
    } else {
      // Other error
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    refresh: () => api.post('/auth/refresh'),
    profile: () => api.get('/auth/profile'),
  },

  // Class endpoints
  classes: {
    getAll: (params) => api.get('/classes', { params }),
    getById: (id) => api.get(`/classes/${id}`),
    create: (classData) => api.post('/classes', classData),
    update: (id, classData) => api.put(`/classes/${id}`, classData),
    delete: (id) => api.delete(`/classes/${id}`),
  },

  // Subject endpoints
  subjects: {
    getAll: (params) => api.get('/subjects', { params }),
    getById: (id) => api.get(`/subjects/${id}`),
    create: (subjectData) => api.post('/subjects', subjectData),
    update: (id, subjectData) => api.put(`/subjects/${id}`, subjectData),
    delete: (id) => api.delete(`/subjects/${id}`),
    getByClass: (classId) => api.get(`/classes/${classId}/subjects`),
  },

  // KPI endpoints
  kpis: {
    getAll: (params) => api.get('/kpis', { params }),
    getById: (id) => api.get(`/kpis/${id}`),
    create: (kpiData) => api.post('/kpis', kpiData),
    update: (id, kpiData) => api.put(`/kpis/${id}`, kpiData),
    delete: (id) => api.delete(`/kpis/${id}`),
    getBySubject: (subjectId) => api.get(`/subjects/${subjectId}/kpis`),
    toggle: (id) => api.patch(`/kpis/${id}/toggle`),
  },

  // Topic endpoints
  topics: {
    getAll: (params) => api.get('/topics', { params }),
    getById: (id) => api.get(`/topics/${id}`),
    create: (topicData) => api.post('/topics', topicData),
    update: (id, topicData) => api.put(`/topics/${id}`, topicData),
    delete: (id) => api.delete(`/topics/${id}`),
    getBySubject: (subjectId) => api.get(`/subjects/${subjectId}/topics`),
  },

  // Task endpoints
  tasks: {
    getAll: (params) => api.get('/tasks', { params }),
    getById: (id) => api.get(`/tasks/${id}`),
    create: (taskData) => api.post('/tasks', taskData),
    update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
    delete: (id) => api.delete(`/tasks/${id}`),
    toggle: (id) => api.patch(`/tasks/${id}/toggle`),
  },

  // Progress endpoints
  progress: {
    getAll: (params) => api.get('/progress', { params }),
    getById: (id) => api.get(`/progress/${id}`),
    create: (progressData) => api.post('/progress', progressData),
    update: (id, progressData) => api.put(`/progress/${id}`, progressData),
    delete: (id) => api.delete(`/progress/${id}`),
    getBySubject: (subjectId) => api.get(`/subjects/${subjectId}/progress`),
  },

  // Analytics endpoints
  analytics: {
    dashboard: () => api.get('/analytics/dashboard'),
    progress: (params) => api.get('/analytics/progress', { params }),
    performance: (params) => api.get('/analytics/performance', { params }),
    trends: (params) => api.get('/analytics/trends', { params }),
  },

  // Reports endpoints
  reports: {
    generate: (reportData) => api.post('/reports/generate', reportData),
    download: (reportId) => api.get(`/reports/${reportId}/download`),
    scheduled: {
      getAll: () => api.get('/reports/scheduled'),
      create: (scheduleData) => api.post('/reports/scheduled', scheduleData),
      update: (id, scheduleData) => api.put(`/reports/scheduled/${id}`, scheduleData),
      delete: (id) => api.delete(`/reports/scheduled/${id}`),
    },
  },

  // Export endpoints
  export: {
    excel: (params) => api.get('/export/excel', { 
      params, 
      responseType: 'blob' 
    }),
    pdf: (params) => api.get('/export/pdf', { 
      params, 
      responseType: 'blob' 
    }),
    csv: (params) => api.get('/export/csv', { 
      params, 
      responseType: 'blob' 
    }),
  },

  // Admin endpoints
  admin: {
    users: {
      getAll: (params) => api.get('/admin/users', { params }),
      getById: (id) => api.get(`/admin/users/${id}`),
      create: (userData) => api.post('/admin/users', userData),
      update: (id, userData) => api.put(`/admin/users/${id}`, userData),
      delete: (id) => api.delete(`/admin/users/${id}`),
    },
    system: {
      stats: () => api.get('/admin/system/stats'),
      logs: (params) => api.get('/admin/system/logs', { params }),
      backup: () => api.post('/admin/system/backup'),
    },
  },
};

// Utility functions
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

export default api; 