// src/renderer/app/api/axiosConfig.ts

import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { QueryClient } from '@tanstack/react-query';

import { store } from '../store/store';
import type { RootState } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { clearActiveContext } from '../store/slices/activeContextSlice';
import { imperativeToast } from '../store/contexts/toast/imperativeToast';
import { imperativeNavigate } from '../routes/navigation/imperativeNavigate';  
import { API_BASE_URL, API_TIMEOUT } from './apiConfig';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: 'application/json',
    // IMPORTANT: do NOT set Content-Type globally
  },
});

/** Strip accidental `Bearer ` prefix if token was stored that way. */
function normalizeBearerToken(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t) return null;
  return t.replace(/^Bearer\s+/i, '').trim() || null;
}

/** Prefer Redux (fresh login); fall back to localStorage for requests before/hydrate race. */
function resolveBearerToken(state: RootState): string | null {
  const fromRedux = normalizeBearerToken(state.auth.token);
  if (fromRedux) return fromRedux;
  return normalizeBearerToken(localStorage.getItem('authToken'));
}

function attachAuthorization(config: InternalAxiosRequestConfig, token: string): void {
  const headers = config.headers
    ? AxiosHeaders.from(config.headers)
    : new AxiosHeaders();
  headers.set('Authorization', `Bearer ${token}`);
  config.headers = headers;
}

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();

    // ---------------- Authorization ----------------
    const token = resolveBearerToken(state);
    if (token) {
      attachAuthorization(config, token);
    }

    // ---------------- Context Headers ----------------
    const {
      activeFacilityId,
      isPatient,
      isStaffWithFacility,
      capabilities,
      patientPortalResolvedFacilityId,
    } = state.activeContext;

    const fallbackFacilityId = localStorage.getItem('activeFacilityId');
    const patientPortalFacilityFromStorage = localStorage.getItem('patientPortalResolvedFacilityId');

    let resolvedFacilityId: string | null = null;
    if (isStaffWithFacility && activeFacilityId) {
      resolvedFacilityId = String(activeFacilityId);
    } else if (
      isPatient &&
      (patientPortalResolvedFacilityId != null ||
        (patientPortalFacilityFromStorage && patientPortalFacilityFromStorage !== ''))
    ) {
      /** Patient portal: facility comes from server-resolved latest visit (Redux + mirrored localStorage). */
      resolvedFacilityId = String(
        patientPortalResolvedFacilityId ?? patientPortalFacilityFromStorage,
      );
    }
    if (!resolvedFacilityId && fallbackFacilityId) {
      resolvedFacilityId = fallbackFacilityId;
    }

    if (resolvedFacilityId) {
      config.headers['X-Active-Facility-Id'] = resolvedFacilityId;
      config.headers['X-Facility-Id'] = resolvedFacilityId;
    }

    if (isPatient) {
      const patientId = capabilities.patient?.patient_id;
      if (patientId) config.headers['X-Patient-Id'] = String(patientId);
    }

    const staffId = capabilities.staff?.staff_id;
    if (staffId) config.headers['X-Staff-Id'] = String(staffId);

    // ---------------- Content-Type Strategy ----------------
    const isFormData =
      typeof FormData !== 'undefined' && config.data instanceof FormData;

    if (isFormData) {
      // Let the browser set: multipart/form-data; boundary=....
      // Remove any forced JSON content-type if present.
      // Axios v1 headers can be AxiosHeaders, so support both delete styles.
      (config.headers as any)?.delete?.('Content-Type');
      delete (config.headers as any)['Content-Type'];
    } else {
      // For JSON requests, set application/json when there's a body.
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

/**
 * Prevents multiple in-flight 401 responses (e.g. several parallel queries
 * all expiring at once) from each triggering a logout + toast + redirect.
 */
let _isHandling401 = false;

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const state = store.getState();
    const hasAuthToken = Boolean(state.auth.token || localStorage.getItem('authToken'));
    const url = String(error.config?.url ?? '');
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    if (error.response?.status === 401 && hasAuthToken && !isAuthEndpoint && !_isHandling401) {
      _isHandling401 = true;

      // 1️⃣  Wipe Redux auth + facility context + clear localStorage (token, user, verification)
      store.dispatch(logout());
      store.dispatch(clearActiveContext());
      queryClient.clear();

      // 2️⃣  Tell the user what happened
    imperativeToast.show(
        'error',
        'Session expired. Please log in again to continue. Your work has been saved.',
        8000,
      );

      // 3️⃣  Redirect to login page
      imperativeNavigate.to('/login');

      console.warn('[API] 401 Unauthorized — session expired, user logged out.');

      // Reset flag after a short window so future logins work normally
      setTimeout(() => {
        _isHandling401 = false;
      }, 3000);
    }

    return Promise.reject(error);
  },
);

export { axiosInstance };
export default axiosInstance;
