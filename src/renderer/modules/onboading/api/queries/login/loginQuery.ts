// hooks/queries/loginQuery.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../../../app/store/hooks/useApp';
import { loginStart, loginSuccess, loginFailure } from '../../../../../app/store/slices/authSlice';
import { setAvailableRoles } from '../../../../../app/store/slices/activeContextSlice'; // NEW
import { authApi } from '../../endpoints/login';
import { ROUTES } from '../../../routes/onboardingRouteConstants';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import type { LoginRequest, BackendLoginResponse, UnifiedUserProfile } from '../../../../../shared/types/userTypes';
import { mapLoginUserToProfile } from '../../../../../shared/types/userTypes';

interface AuthData {
  user: UnifiedUserProfile;
  token: string;
}

export const useLoginMutation = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<AuthData | null> => {
      const response: BackendLoginResponse = await authApi.login(credentials);

      switch (response.code) {
        case 'LOGIN_SUCCESS': {
          if (!response.user || !response.token) {
            throw new Error('Invalid login response from server.');
          }

          const userProfile: UnifiedUserProfile = mapLoginUserToProfile(response.user);
          return { user: userProfile, token: response.token };
        }
        case 'MFA_REQUIRED':
          return null;
        default:
          throw new Error(response.message || 'Login failed.');
      }
    },

    onMutate: () => {
      dispatch(loginStart());
    },

    onSuccess: (data: AuthData | null) => {
      if (data) {
        // Store auth data
        dispatch(loginSuccess(data));
        
        // NEW: Initialize active context with available roles
        if (data.user.availableRoles && data.user.availableRoles.length > 0) {
          dispatch(setAvailableRoles(data.user.availableRoles));
          
          showToast('success', 'Login successful. Welcome back to CustoCare AI.', 5000);
          navigate(ROUTES.PORTAL_SELECTOR); // Or directly to dashboard if only one role
        } else {
          // User has no roles assigned
          showToast('warning', 'Your account has no active roles. Please contact administrator.', 7000);
          navigate(ROUTES.ROLE_SELECTION);
        }
      } else {
        showToast('info', 'Two-factor authentication required.', 4000);
        navigate(ROUTES.TWO_FACTOR_AUTH);
      }
    },

    onError: (error: Error) => {
      let message = error.message;
      if (message.toLowerCase().includes('network') || message.toLowerCase().includes('timeout')) {
        message = 'Unable to connect to the server. Please check your internet connection.';
      }
      dispatch(loginFailure(message));
      showToast('error', message, 7000);
      console.error('Login error:', error);
    },
  });
};