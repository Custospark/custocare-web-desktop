// hooks/useLoginMutation.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../../../app/store/hooks/useApp';
import { loginStart, loginSuccess, loginFailure } from '../../../../../app/store/slices/authSlice';
import { setUserContext } from '../../../../../app/store/slices/activeContextSlice';
import { authApi } from '../../endpoints/login';
import { ROUTES } from '../../../routes/onboardingRouteConstants';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import type { LoginRequest, BackendLoginResponse, UnifiedUserProfile } from '../../../../../shared/types/userTypes';
import { mapLoginUserToProfile } from '../../../../../shared/types/userTypes';
import type { UserContext } from '../../../../../app/store/slices/activeContextSlice';

interface AuthData {
  user: UnifiedUserProfile;
  token: string;
  context: UserContext;
}

export const useLoginMutation = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  return useMutation<AuthData | null, Error, LoginRequest>({
    mutationFn: async (credentials): Promise<AuthData | null> => {
      const response: BackendLoginResponse = await authApi.login(credentials);

      switch (response.code) {
        case 'LOGIN_SUCCESS': {
          if (!response.user || !response.token || !response.context) {
            throw new Error('Invalid login response from server.');
          }

          const userProfile: UnifiedUserProfile = mapLoginUserToProfile(response.user);
          
          return {
            user: userProfile,
            token: response.token,
            context: response.context,
          };
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
        // Set auth state
        dispatch(loginSuccess({
          user: data.user,
          token: data.token,
        }));
        
        // Set user context (facilities, roles, capabilities)
        dispatch(setUserContext(data.context));
        
        showToast('success', 'Login successful. Welcome back!', 5000);
        
        // Navigate based on user type
        if (data.context.capabilities.staff && data.context.facility_roles.length > 0) {
          navigate(ROUTES.DASHBOARD); // Staff dashboard
        } else if (data.context.capabilities.patient) {
          navigate(ROUTES.PATIENT_PORTAL); // Patient portal
        } else {
          navigate(ROUTES.PORTAL_SELECTOR);
        }
      } else {
        showToast('info', 'Two-factor authentication required.', 4000);
        navigate(ROUTES.TWO_FACTOR_AUTH);
      }
    },

    onError: (error) => {
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