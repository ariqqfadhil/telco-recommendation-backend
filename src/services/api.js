import axios from 'axios';

// Backend API Base URL - GANTI dengan URL Railway Anda
const API_BASE_URL = 'https://telco-recommendation-backend-production.up.railway.app';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// ==================== AUTH APIs ====================
export const authAPI = {
  // Register
  register: (phoneNumber, pin, name) =>
    api.post('/api/auth/register', { phoneNumber, pin, name }),

  // Login
  login: (phoneNumber, pin) =>
    api.post('/api/auth/login', { phoneNumber, pin }),

  // Get profile
  getProfile: () => api.get('/api/auth/profile'),

  // Update profile
  updateProfile: (data) => api.put('/api/auth/profile', data),

  // Change PIN
  changePin: (oldPin, newPin) =>
    api.post('/api/auth/change-pin', { oldPin, newPin }),

  // Check phone availability
  checkPhone: (phoneNumber) =>
    api.post('/api/auth/check-phone', { phoneNumber }),

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    return Promise.resolve();
  },
};

// ==================== PRODUCT APIs ====================
export const productAPI = {
  // Get all products with filters
  getProducts: (params) => api.get('/api/products', { params }),

  // Get product by ID
  getProductById: (id) => api.get(`/api/products/${id}`),

  // Get categories
  getCategories: () => api.get('/api/products/categories/list'),

  // Get popular products
  getPopular: (limit = 10) =>
    api.get('/api/products/popular/list', { params: { limit } }),
};

// ==================== RECOMMENDATION APIs ====================
export const recommendationAPI = {
  // Get recommendations
  getRecommendations: (algorithm = 'hybrid', limit = 5) =>
    api.get('/api/recommendations', { params: { algorithm, limit } }),

  // Get recommendation history
  getHistory: (page = 1, limit = 10) =>
    api.get('/api/recommendations/history', { params: { page, limit } }),

  // Track interaction
  trackInteraction: (recommendationId, productId, action) =>
    api.post(`/api/recommendations/${recommendationId}/interaction`, {
      productId,
      action,
    }),

  // Submit feedback
  submitFeedback: (recommendationId, rating, comment) =>
    api.post('/api/recommendations/feedback', {
      recommendationId,
      rating,
      comment,
    }),
};

// ==================== HELPER FUNCTIONS ====================
export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export default api;