//loginQuery.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../../../app/store/hooks/useApp';
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from '../../../../../app/store/slices/authSlice';
import { 
  setUserContext,
  setLoading as setContextLoading,
  setError as setContextError,
} from '../../../../../app/store/slices/activeContextSlice';
import { authApi } from '../../endpoints/login';
import { ROUTES } from '../../../routes/onboardingRouteConstants';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import axiosInstance from '../../../../../app/api/axiosConfig';
import type { 
  LoginRequest, 
  BackendLoginResponse, 
  UnifiedUserProfile, 
} from '../../../../../shared/types/userTypes';
import { 
  mapLoginUserToProfile 
} from '../../../../../shared/types/userTypes';
import type { UserContext } from '../../../../../app/store/slices/activeContextSlice';

// What we return from mutation (matches what loginSuccess expects)
interface AuthData {
  user: UnifiedUserProfile;
  token: string;
}

/**
 * Fetch user context from backend
 * This gets the user's capabilities, facility roles, and full context
 */
const fetchUserContext = async (): Promise<UserContext> => {
  try {
    const response = await axiosInstance.get('/user/context/resolve');
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Invalid context response from server');
  } catch (error) {
    console.error('Failed to fetch user context:', error);
    throw error;
  }
};

export const useLoginMutation = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  return useMutation<AuthData | null, Error, LoginRequest>({
    mutationFn: async (credentials): Promise<AuthData | null> => {
      const response: BackendLoginResponse = await authApi.login(credentials);

      switch (response.code) {
        case 'LOGIN_SUCCESS': {
          if (!response.user || !response.token) {
            throw new Error('Invalid login response from server.');
          }

          // Map to UnifiedUserProfile
          const userProfile: UnifiedUserProfile = mapLoginUserToProfile(response.user);
          
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

    onSuccess: async (data: AuthData | null) => {
      if (data) {
        // 1. Store auth data (user + token) in auth slice
        dispatch(loginSuccess(data));
        
        // 2. Fetch and set user context (capabilities + facility roles)
        try {
          dispatch(setContextLoading(true));
          
          const userContext = await fetchUserContext();
          
          // Set complete user context in activeContext slice
          dispatch(setUserContext(userContext));
          
          // Success toast
          showToast(
            'success',
            'Login successful. Welcome back to CustoCare AI.',
            5000
          );
          
          // Navigate to portal selector
          navigate(ROUTES.PORTAL_SELECTOR);
          
        } catch (contextError) {
          // Context fetch failed - handle gracefully
          console.error('Context fetch failed:', contextError);
          
          dispatch(setContextError(
            contextError instanceof Error 
              ? contextError.message 
              : 'Failed to load user context'
          ));
          
          // Still navigate but show warning
          showToast(
            'warning',
            'Login successful, but some features may be limited. Please refresh the page.',
            7000
          );
          
          navigate(ROUTES.PORTAL_SELECTOR);
        }
      } else {
        // MFA required
        showToast('info', 'Two-factor authentication required.', 4000);
        navigate(ROUTES.TWO_FACTOR_AUTH);
      }
    },

    onError: (error) => {
      let message = error.message;

      if (message.toLowerCase().includes('network') || 
          message.toLowerCase().includes('timeout')) {
        message = 'Unable to connect to the server. Please check your internet connection.';
      }

      dispatch(loginFailure(message));
      showToast('error', message, 7000);
      console.error('Login error:', error);
    },
  });
};