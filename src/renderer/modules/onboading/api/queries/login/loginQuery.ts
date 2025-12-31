import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../../../app/store/hooks/useApp';
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from '../../../../../app/store/slices/authSlice';
import { authApi } from '../../endpoints/login';
import type { LoginRequest, LoginResponse, UserProfile } from './loginTypes';
import { ROUTES } from '../../../routes/onboardingRouteConstants';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';

export const useLoginMutation = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  return useMutation<LoginResponse | null, Error, LoginRequest>({
    mutationFn: async (credentials) => {
      const response = await authApi.login(credentials);

      switch (response.code) {
        case 'LOGIN_SUCCESS': {
          if (!response.user || !response.token) {
            throw new Error('Invalid login response from server.');
          }

          const userProfile: UserProfile = {
            id: response.user.id.toString(),
            uuid: response.user.uuid,
            email: response.user.email || '',
            name:
              response.user.name ||
              response.user.profile?.full_name ||
              '',
            role: response.user.role || 'user',
            national_id_country_code:
              response.user.national_id_country_code,
            profile: response.user.profile,
          };

          return {
            user: userProfile,
            token: response.token,
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

    onSuccess: (data) => {
      if (data) {
        // ✅ Successful login
        dispatch(loginSuccess(data));

        showToast(
          'success',
          'Login successful. Welcome back!',
          3000
        );

        navigate(ROUTES.PORTAL_SELECTOR);
      } else {
        // 🔐 MFA required
        showToast(
          'info',
          'Two-factor authentication required.',
          4000
        );

        navigate(ROUTES.TWO_FACTOR_AUTH);
      }
    },

    onError: (error) => {
      let message = error.message;

      // Network / infra errors
      if (
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('timeout')
      ) {
        message =
          'Unable to connect to the server. Please check your internet connection.';
      }

      dispatch(loginFailure(message));

      showToast('error', message, 7000);

      console.error('Login error:', error);
    },
  });
};
