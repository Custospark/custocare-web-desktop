import axios from 'axios';
import { store } from '../../../../renderer/store/store';
import { logout } from '../../../store/slices/authSlice';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID();
    config.headers['X-Client-Time'] = new Date().toISOString();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      // Handle specific error codes
      switch (status) {
        case 401:
          // Unauthorized - logout user
          store.dispatch(logout());
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden:', error.response.data);
          break;
        case 429:
          // Rate limiting
          console.warn('Rate limit exceeded. Please slow down.');
          break;
        case 500:
          // Server error
          console.error('Server error occurred');
          break;
        default:
          console.error(`API Error ${status}:`, error.response.data);
      }
      
      // Add error metadata to error object
      error.metadata = {
        timestamp: new Date().toISOString(),
        url: error.config?.url,
        method: error.config?.method,
        status,
        message: error.response.data?.message || 'An error occurred',
      };
    } else if (error.request) {
      // Network error
      error.metadata = {
        timestamp: new Date().toISOString(),
        message: 'Network error. Please check your connection.',
      };
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;