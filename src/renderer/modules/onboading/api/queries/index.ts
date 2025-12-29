import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../../app/store/hooks/useApp';
import { loginStart, loginSuccess, loginFailure } from '../../../../app/store/slices/authSlice';
import { authApi } from '../endpoints/index';
import type { LoginRequest, LoginResponse, UserProfile } from '../auth';

export const useLoginMutation = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return useMutation<LoginResponse | null, Error, LoginRequest>({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse | null> => {
      const backendResponse = await authApi.login(credentials);
      
      // Handle different response codes
      switch (backendResponse.code) {
        case 'LOGIN_SUCCESS':
          if (backendResponse.user && backendResponse.token) {
            // Map backend response to our frontend format
            const userProfile: UserProfile = {
              id: backendResponse.user.id.toString(),
              email: backendResponse.user.email || '',
              name: backendResponse.user.name || backendResponse.user.profile?.full_name || '',
              role: backendResponse.user.role || 'user',
              uuid: backendResponse.user.uuid,
              national_id_country_code: backendResponse.user.national_id_country_code,
              profile: backendResponse.user.profile,
            };
            
            return {
              user: userProfile,
              token: backendResponse.token,
            };
          }
          throw new Error('Invalid response from server');
        
        case 'MFA_REQUIRED':
          // Return null for MFA - we'll handle this differently
          return null;
        
        default:
          // For error cases, throw with the backend message
          throw new Error(backendResponse.message);
      }
    },
    onMutate: () => {
      dispatch(loginStart());
    },
    onSuccess: (data: LoginResponse | null) => {
      if (data) {
        // Successful login
        dispatch(loginSuccess(data));
        navigate('/dashboard');
      } else {
        // MFA required - navigate to MFA page
        navigate('/verify-mfa');
      }
    },
    onError: (error: Error) => {
      // Show appropriate error message
      let errorMessage = error.message;
      
      if (error.message.includes('Network Error') || error.message.includes('timeout')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
      
      dispatch(loginFailure(errorMessage));
      console.error('Login error:', error);
    },
  });
};