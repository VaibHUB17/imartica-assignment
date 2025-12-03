import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasToken: !!token,
      headers: config.headers
    });
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      method: response.config?.method?.toUpperCase(),
      url: response.config?.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.log('API Error:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Only redirect to login if it's not the initial auth check
    // This prevents redirect loops when checking authentication status
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/me')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't auto-redirect if user is on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),
  logout: () => api.post('/auth/logout'),
  getAllUsers: () => api.get('/auth/users'),
};

// Course API
export const courseAPI = {
  getAllCourses: () => api.get('/courses'),
  getCourse: (id) => api.get(`/courses/${id}`),
  createCourse: (courseData) => api.post('/courses', courseData),
  updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  getCourseStats: () => api.get('/courses/stats'),
  
  // Module operations
  addModule: (courseId, moduleData) => api.post(`/courses/${courseId}/modules`, moduleData),
  updateModule: (courseId, moduleId, moduleData) => api.put(`/courses/${courseId}/modules/${moduleId}`, moduleData),
  deleteModule: (courseId, moduleId) => api.delete(`/courses/${courseId}/modules/${moduleId}`),
  
  // Item operations (lectures/documents)
  addItem: (courseId, moduleId, itemData) => api.post(`/courses/${courseId}/modules/${moduleId}/items`, itemData),
  getModuleItems: (courseId, moduleId) => api.get(`/courses/${courseId}/modules/${moduleId}/items`),
  getItem: (courseId, moduleId, itemId) => api.get(`/courses/${courseId}/modules/${moduleId}/items/${itemId}`),
  updateItem: (courseId, moduleId, itemId, itemData) => api.put(`/courses/${courseId}/modules/${moduleId}/items/${itemId}`, itemData),
  deleteItem: (courseId, moduleId, itemId) => api.delete(`/courses/${courseId}/modules/${moduleId}/items/${itemId}`),
  reorderItems: (courseId, moduleId, itemsOrder) => api.put(`/courses/${courseId}/modules/${moduleId}/items/reorder`, itemsOrder),
};

// Enrollment API
export const enrollmentAPI = {
  enrollInCourse: (courseId) => api.post('/enrollments', { courseId }),
  getUserEnrollments: (userId) => api.get(`/enrollments/${userId}`),
  updateProgress: (userId, progressData) => api.put(`/enrollments/${userId}/update`, progressData),
  getEnrollmentDetails: (userId, courseId) => api.get(`/enrollments/${userId}/${courseId}`),
  cancelEnrollment: (userId, courseId) => api.put(`/enrollments/${userId}/${courseId}/cancel`),
  rateCourse: (userId, courseId, ratingData) => api.put(`/enrollments/${userId}/${courseId}/rate`, ratingData),
  getEnrollmentStats: () => api.get('/enrollments/stats'),
};

export default api;