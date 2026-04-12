// src/renderer/app/api/axiosConfig.ts

import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { QueryClient } from '@tanstack/react-query';

import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';                        
import { imperativeToast } from '../store/contexts/toast/imperativeToast';
import { imperativeNavigate } from '../routes/navigation/imperativeNavigate';  
import { API_BASE_URL, API_TIMEOUT } from './apiConfig';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();

    const token = state.auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const { activeFacilityId, isPatient, isStaffWithFacility, capabilities } =
      state.activeContext;

    if (isStaffWithFacility && activeFacilityId) {
      config.headers['X-Active-Facility-Id'] = String(activeFacilityId);
      config.headers['X-Facility-Id'] = String(activeFacilityId);
    }

    if (isPatient) {
      const patientId = capabilities.patient?.patient_id;
      if (patientId) config.headers['X-Patient-Id'] = String(patientId);
    }

    const staffId = capabilities.staff?.staff_id;
    if (staffId) config.headers['X-Staff-Id'] = String(staffId);

    const isFormData =
      typeof FormData !== 'undefined' && config.data instanceof FormData;

    if (isFormData) {
      (config.headers as any)?.delete?.('Content-Type');
      delete (config.headers as any)['Content-Type'];
    } else {
      const method = (config.method || 'get').toLowerCase();
      const hasBody = ['post', 'put', 'patch', 'delete'].includes(method);

      if (hasBody && config.data !== undefined) {
        (config.headers as any)?.set?.('Content-Type', 'application/json');
        if (!(config.headers as any)?.set) {
          (config.headers as any)['Content-Type'] = 'application/json';
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let _isHandling401 = false;
let _redirectPathOnLogin: string | null = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !_isHandling401) {
      _isHandling401 = true;

      const currentPath = window.location.pathname;
      const isLoginPage = currentPath === '/login';
      
      if (!isLoginPage && !_redirectPathOnLogin) {
        _redirectPathOnLogin = currentPath;
      }

      store.dispatch(logout());

      imperativeToast.show(
        'error',
        'Your session has expired. Please log in again.',
        8000,
      );

      imperativeNavigate.to('/login');

      setTimeout(() => {
        _isHandling401 = false;
      }, 3000);
    }

    return Promise.reject(error);
  },
);

export const getRedirectPath = (): string | null => {
  return _redirectPathOnLogin;
};

export const resetRedirectPath = (): void => {
  _redirectPathOnLogin = null;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: { retry: 1 },
  },
});

export { axiosInstance };
export default axiosInstance;