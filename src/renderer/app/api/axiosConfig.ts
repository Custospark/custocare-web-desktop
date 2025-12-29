import axios, { type AxiosInstance, AxiosError,type AxiosResponse } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { API_BASE_URL, API_TIMEOUT } from './apiConfig';

/**
 * Axios Instance Configuration
 */
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Request Interceptor
 * Adds auth token to every request
 */
axiosInstance.interceptors.request.use(
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

/**
 * Response Interceptor
 * Handles common error scenarios
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - Clear token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    if (error.response?.status === 403) {
      console.error('Access denied: You do not have permission to access this resource');
    }

    if (error.response?.status === 500) {
      console.error('Server error: Please try again later');
    }

    return Promise.reject(error);
  }
);

/**
 * React Query Client Configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default axiosInstance;