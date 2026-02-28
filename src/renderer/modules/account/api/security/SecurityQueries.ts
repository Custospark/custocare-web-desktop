/**
 * ============================================================================
 * USER SECURITY REACT QUERY HOOKS
 * ============================================================================
 *
 * Endpoints (baseURL = API_BASE_URL):
 *   GET /{user}/security - Returns user security settings
 *   PUT /{user}/security - Updates security settings
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { selectUser } from '../../../../app/store/slices/authSlice';
import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { useToast } from '../../../../app/store/contexts/toast/useToast';

import type {
  ApiErrorResponse,
  GetUserSecurityResponse,
  UpdateUserSecurityParams,
  UpdateUserSecurityResponse,
  MutationCallbacks,
  UserSecurity,
} from './SecurityTypes';
import { formatValidationErrors,extractErrorMessage } from '../settings/preferences/PreferencesQueries';
/* -------------------------------------------------------------------------- */
/*                                  Keys                                      */
/* -------------------------------------------------------------------------- */

export const securityKeys = {
  all: ['security'] as const,
  details: () => [...securityKeys.all, 'detail'] as const,
  detail: (userId: number | string) => [...securityKeys.details(), userId] as const,
};

/* -------------------------------------------------------------------------- */
/*                                Hooks                                       */
/* -------------------------------------------------------------------------- */

/**
 * Custom hook to get the current user ID from auth slice
 * Throws error if user is not authenticated
 */
const useAuthUserId = (): number | string => {
  const user = useAppSelector(selectUser);
  
  if (!user?.id) {
    throw new Error('User not authenticated');
  }
  
  return user.id;
};

/**
 * Hook to fetch user security settings
 * Returns the exact data structure from backend
 * 
 * Usage:
 * const { data, isLoading } = useGetUserSecurity();
 * // data.data contains: { mfa_enabled, requires_password_change, password_changed_at, ... }
 */
export const useGetUserSecurity = (
  options?: Omit<
    UseQueryOptions<GetUserSecurityResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<GetUserSecurityResponse, AxiosError<ApiErrorResponse>> => {
  const userId = useAuthUserId();
  
  const queryResult = useQuery<GetUserSecurityResponse, AxiosError<ApiErrorResponse>>({
    queryKey: securityKeys.detail(userId),
    queryFn: async () => {
      const res = await axiosInstance.get<GetUserSecurityResponse>(`users/${userId}/security`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });

  return queryResult;
};

/**
 * Hook to update user security settings
 * Handles password change, MFA toggle, and requires_password_change flag
 * 
 * Usage:
 * const { mutate: updateSecurity, isPending } = useUpdateUserSecurity({
 *   onSuccess: (data) => console.log('Security updated:', data),
 *   onError: (error) => console.error('Update failed:', error),
 * });
 * 
 * // Change password
 * updateSecurity({ 
 *   data: { 
 *     current_password: 'oldpass123',
 *     password: 'newpass456',
 *     password_confirmation: 'newpass456'
 *   } 
 * });
 * 
 * // Toggle MFA
 * updateSecurity({ data: { mfa_enabled: true } });
 * 
 * // Clear forced password change flag
 * updateSecurity({ data: { requires_password_change: false } });
 */
export const useUpdateUserSecurity = (
  callbacks: MutationCallbacks<
    UpdateUserSecurityResponse,
    AxiosError<ApiErrorResponse>
  > = {},
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const userId = useAuthUserId();

  return useMutation<
    UpdateUserSecurityResponse,
    AxiosError<ApiErrorResponse>,
    Omit<UpdateUserSecurityParams, 'userId'> // userId is injected automatically
  >({
    mutationFn: async ({ data }) => {
      const res = await axiosInstance.put<UpdateUserSecurityResponse>(
        `users/${userId}/security`,
        data,
      );
      return res.data;
    },

    onSuccess: (data: UpdateUserSecurityResponse) => {
      showToast('success', data.message || 'Security settings updated successfully!', 6000);

      // Update cache with new security settings
      queryClient.setQueryData(securityKeys.detail(userId), data);

      // If password was changed, show additional message
      if (data.message?.toLowerCase().includes('password')) {
        showToast('info', 'Your password has been changed successfully.', 5000);
      }

      // If MFA was toggled, show appropriate message
      if (data.message?.toLowerCase().includes('mfa') || data.message?.toLowerCase().includes('two-factor')) {
        const mfaEnabled = data.data.mfa_enabled;
        showToast(
          'success',
          mfaEnabled 
            ? 'Two-factor authentication has been enabled.'
            : 'Two-factor authentication has been disabled.',
          6000
        );
      }

      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const base = extractErrorMessage(error, 'Failed to update security settings.');
      const details = formatValidationErrors(error.response?.data?.errors);
      
      // Check for specific validation errors
      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;
        
        // Handle current_password validation specifically
        if (errors?.current_password) {
          showToast('error', errors.current_password.join(', '), 9000);
        } else {
          showToast('error', details || 'Validation failed. Please check your input.', 9000);
        }
      } else if (error.response?.status === 403) {
        showToast('error', 'You are not authorized to update security settings.', 9000);
      } else {
        showToast('error', details ? `${base} (${details})` : base, 9000);
      }
      
      callbacks.onError?.(error);
    },
  });
};

/**
 * Hook to get current security settings with loading state
 * 
 * Usage:
 * const { security, isLoading } = useUserSecurity();
 * if (security) {
 *   console.log(security.mfa_enabled);
 *   console.log(security.last_login_at);
 * }
 */
export const useUserSecurity = () => {
  const { data, isLoading, error } = useGetUserSecurity();
  
  return {
    security: data?.data,
    isLoading,
    error,
  };
};

/**
 * Hook to get a specific security value
 * 
 * Usage:
 * const mfaEnabled = useSecurityValue('mfa_enabled');
 * const lastLogin = useSecurityValue('last_login_at');
 */
export const useSecurityValue = <K extends keyof UserSecurity>(
  key: K
): UserSecurity[K] | undefined => {
  const { security } = useUserSecurity();
  return security?.[key];
};

/**
 * Hook for password change only
 * Convenience wrapper around useUpdateUserSecurity
 */
export const useChangePassword = (
  callbacks: MutationCallbacks<UpdateUserSecurityResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { mutateAsync: updateSecurity, isPending } = useUpdateUserSecurity(callbacks);

  const changePassword = async (
    current_password: string,
    password: string,
    password_confirmation: string
  ) => {
    return updateSecurity({
      data: {
        current_password,
        password,
        password_confirmation,
      },
    });
  };

  return {
    changePassword,
    isPending,
  };
};

/**
 * Hook for toggling MFA
 * Convenience wrapper around useUpdateUserSecurity
 */
export const useToggleMFA = (
  callbacks: MutationCallbacks<UpdateUserSecurityResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { mutateAsync: updateSecurity, isPending } = useUpdateUserSecurity(callbacks);
  const { security } = useUserSecurity();

  const toggleMFA = async () => {
    if (!security) return;
    return updateSecurity({
      data: {
        mfa_enabled: !security.mfa_enabled,
      },
    });
  };

  return {
    toggleMFA,
    isPending,
    isMFAEnabled: security?.mfa_enabled ?? false,
  };
};

/**
 * Hook to clear forced password change flag
 * Convenience wrapper around useUpdateUserSecurity
 */
export const useClearPasswordChangeRequired = (
  callbacks: MutationCallbacks<UpdateUserSecurityResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { mutateAsync: updateSecurity, isPending } = useUpdateUserSecurity(callbacks);

  const clearFlag = async () => {
    return updateSecurity({
      data: {
        requires_password_change: false,
      },
    });
  };

  return {
    clearFlag,
    isPending,
  };
};