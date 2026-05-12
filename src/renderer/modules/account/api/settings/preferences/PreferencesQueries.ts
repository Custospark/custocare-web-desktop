/**
 * ============================================================================
 * USER PREFERENCES REACT QUERY HOOKS
 * ============================================================================
 *
 * Endpoints (baseURL = API_BASE_URL):
 *   GET /{user}/preferences - Returns { theme_mode, ui_density, timezone, locale }
 *   PUT /{user}/preferences - Updates with same fields
 *
 * These hooks sync with the UI slice to keep theme and other preferences in sync.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { useAppSelector, useAppDispatch }  from '../../../../../app/store/hooks/useApp';
import { selectUser } from '../../../../../app/store/slices/authSlice';
import { setTheme } from '../../../../../app/store/slices/uiSlice';

import type {
  ApiErrorResponse,
  GetUserPreferencesResponse,
  UpdateUserPreferencesParams,
  UpdateUserPreferencesResponse,
  MutationCallbacks,
  UserPreferences,
  ThemeMode,
} from './PreferencesTypes';
import { mapBackendThemeToUI, normalizeLocale } from './PreferencesTypes';

/* -------------------------------------------------------------------------- */
/*                                  Keys                                      */
/* -------------------------------------------------------------------------- */

export const preferencesKeys = {
  all: ['preferences'] as const,
  details: () => [...preferencesKeys.all, 'detail'] as const,
  detail: (userId: number | string) => [...preferencesKeys.details(), userId] as const,
};

/* -------------------------------------------------------------------------- */
/*                                Helpers                                     */
/* -------------------------------------------------------------------------- */

export const formatValidationErrors = (errors?: Record<string, string[]>): string => {
  if (!errors || Object.keys(errors).length === 0) return '';
  return Object.entries(errors)
    .map(([field, messages]) => {
      const label = field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return `${label}: ${messages.join(', ')}`;
    })
    .join(' | ');
};

export const extractErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallback = 'An unexpected error occurred.',
): string => error.response?.data?.message || error.message || fallback;

/* -------------------------------------------------------------------------- */
/*                                Hooks                                       */
/* -------------------------------------------------------------------------- */

const useOptionalAuthUserId = (): number | string | undefined => {
  return useAppSelector(selectUser)?.id;
};

/**
 * Hook to fetch user preferences
 * Returns the exact data structure from backend: { theme_mode, ui_density, timezone, locale }
 * Automatically syncs theme with UI slice using useEffect
 * 
 * Usage:
 * const { data, isLoading } = useGetUserPreferences();
 * // data is GetUserPreferencesResponse which contains the UserPreferences object in data.data
 */
export const useGetUserPreferences = (
  options?: Omit<
    UseQueryOptions<GetUserPreferencesResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<GetUserPreferencesResponse, AxiosError<ApiErrorResponse>> => {
  const userId = useOptionalAuthUserId();
  const dispatch = useAppDispatch();

  const queryResult = useQuery<GetUserPreferencesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: preferencesKeys.detail(userId ?? 0),
    queryFn: async () => {
      const res = await axiosInstance.get<GetUserPreferencesResponse>(`users/${userId}/preferences`);
      return res.data;
    },
    ...options,
    enabled: !!userId && (options?.enabled ?? true),
  });

  // Use useEffect to handle side effects when data changes
  useEffect(() => {
    if (queryResult.data) {
      // Sync theme from backend to UI slice
      // This ensures 'system' preference is properly resolved
      const uiTheme = mapBackendThemeToUI(queryResult.data.data.theme_mode);
      dispatch(setTheme(uiTheme));
    }
  }, [queryResult.data, dispatch]);

  return queryResult;
};

/**
 * Hook to update user preferences
 * Automatically syncs theme with UI slice on success
 * 
 * Usage:
 * const { mutate: updatePreferences, isPending } = useUpdateUserPreferences({
 *   onSuccess: (data) => console.log('Preferences updated:', data),
 *   onError: (error) => console.error('Update failed:', error),
 * });
 * 
 * // Update single preference
 * updatePreferences({ data: { theme_mode: 'dark' } });
 * 
 * // Update multiple preferences
 * updatePreferences({ 
 *   data: { 
 *     theme_mode: 'system', 
 *     ui_density: 'compact',
 *     timezone: 'America/New_York',
 *     locale: 'en_us'
 *   } 
 * });
 */
export const useUpdateUserPreferences = (
  callbacks: MutationCallbacks<
    UpdateUserPreferencesResponse,
    AxiosError<ApiErrorResponse>
  > = {},
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const userId = useOptionalAuthUserId();

  return useMutation<
    UpdateUserPreferencesResponse,
    AxiosError<ApiErrorResponse>,
    Omit<UpdateUserPreferencesParams, 'userId'> // userId is injected automatically
  >({
    mutationFn: async ({ data }) => {
      if (userId == null) {
        throw new Error('User not authenticated');
      }
      // Normalize locale if present (matches backend prepareForValidation)
      const processedData = {
        ...data,
        ...(data.locale && { locale: normalizeLocale(data.locale) }),
      };

      const res = await axiosInstance.put<UpdateUserPreferencesResponse>(
        `users/${userId}/preferences`,
        processedData,
      );
      return res.data;
    },

    onSuccess: (data: UpdateUserPreferencesResponse, vars) => {
      showToast('success', data.message || 'Preferences updated successfully!', 6000);

      // Update cache with new preferences
      if (userId != null) {
        queryClient.setQueryData(preferencesKeys.detail(userId), data);
      }

      // Sync theme from backend to UI slice if theme was updated
      if (vars.data.theme_mode) {
        const uiTheme = mapBackendThemeToUI(data.data.theme_mode);
        dispatch(setTheme(uiTheme));
      }

      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const base = extractErrorMessage(error, 'Failed to update preferences.');
      const details = formatValidationErrors(error.response?.data?.errors);
      
      // Show appropriate error message based on validation errors
      if (error.response?.status === 422) {
        showToast('error', details || 'Validation failed. Please check your input.', 9000);
      } else if (error.response?.status === 403) {
        showToast('error', 'You are not authorized to update preferences.', 9000);
      } else {
        showToast('error', details ? `${base} (${details})` : base, 9000);
      }
      
      callbacks.onError?.(error);
    },
  });
};

/**
 * Convenience hook for updating a single preference
 * 
 * Usage:
 * const { updateTheme, updateDensity } = useUpdateSinglePreference();
 * updateTheme('dark'); // This will be saved as 'dark' in backend
 * updateDensity('compact');
 * updateTimezone('America/New_York');
 * updateLocale('en_us');
 */
export const useUpdateSinglePreference = () => {
  const { mutateAsync: updatePreferences } = useUpdateUserPreferences();

  const updateTheme = async (theme_mode: ThemeMode) => {
    return updatePreferences({ data: { theme_mode } });
  };

  const updateDensity = async (ui_density: UserPreferences['ui_density']) => {
    return updatePreferences({ data: { ui_density } });
  };

  const updateTimezone = async (timezone: string) => {
    return updatePreferences({ data: { timezone } });
  };

  const updateLocale = async (locale: string) => {
    return updatePreferences({ data: { locale } });
  };

  return {
    updateTheme,
    updateDensity,
    updateTimezone,
    updateLocale,
  };
};

/**
 * Hook to initialize UI preferences on app load
 * Call this once when the app initializes
 * 
 * Usage:
 * useEffect(() => {
 *   initializeUIPreferences();
 * }, []);
 */
export const useInitializeUIPreferences = () => {
  const userId = useAppSelector(selectUser)?.id;
  const { data, isLoading, error } = useGetUserPreferences({
    // Only fetch if user is authenticated
    enabled: !!userId,
    // Don't retry on 404 if preferences don't exist yet
    retry: (failureCount, error) => {
      if (error.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  return {
    preferences: data?.data, // This is the UserPreferences object: { theme_mode, ui_density, timezone, locale }
    isLoading,
    error,
  };
};

/**
 * Hook to get current preferences with loading state
 * Useful for components that need to display preference values
 * 
 * Usage:
 * const { preferences, isLoading } = useUserPreferences();
 * if (preferences) {
 *   console.log(preferences.theme_mode); // 'light' | 'dark' | 'system'
 *   console.log(preferences.ui_density);  // 'compact' | 'comfortable' | 'spacious'
 * }
 */
export const useUserPreferences = () => {
  const { data, isLoading, error } = useGetUserPreferences();
  
  return {
    preferences: data?.data, // This is the UserPreferences object
    isLoading,
    error,
  };
};

/**
 * Hook to get a specific preference value
 * 
 * Usage:
 * const themeMode = usePreferenceValue('theme_mode');
 * const density = usePreferenceValue('ui_density');
 */
export const usePreferenceValue = <K extends keyof UserPreferences>(
  key: K
): UserPreferences[K] | undefined => {
  const { preferences } = useUserPreferences();
  return preferences?.[key];
};