// hooks/useRegister.ts
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../../../app/store/hooks/useApp';
import { loginSuccess } from '../../../../../app/store/slices/authSlice';
import { setUserContext } from '../../../../../app/store/slices/activeContextSlice';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import type { RegisterRequest, RegisterResponse, RegisterErrorResponse } from './registerUserTypes';
import { registerUser } from './registerUserTypes';
import { ROUTES } from '../../../routes/onboardingRouteConstants';
import { mapRegisterError } from './registerErrorMapper';
import { mapUserResourceToProfile } from '../../../../../shared/types/userTypes';

interface UseRegisterOptions {
  onSuccess?: (data: RegisterResponse) => void;
  onError?: (error: RegisterErrorResponse) => void;
}

export const useRegister = (
  options?: UseRegisterOptions
): UseMutationResult<RegisterResponse, RegisterErrorResponse, RegisterRequest> => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: registerUser,

    onSuccess: (data) => {
      showToast('success', data.message || 'Account created successfully!');

      if (data.user && data.token && data.context) {
        const userProfile = mapUserResourceToProfile(data.user);
        
        // Set auth state
        dispatch(loginSuccess({
          user: userProfile,
          token: data.token,
        }));
        
        // Set user context
        dispatch(setUserContext(data.context));

        // Navigate based on MFA requirement
        navigate(data.requires_mfa ? ROUTES.TWO_FACTOR_AUTH : ROUTES.ROLE_SELECTION);
      }

      options?.onSuccess?.(data);
    },

    onError: (error: RegisterErrorResponse) => {
      const { message, variant } = mapRegisterError(error.code);
      showToast(variant, message, 7000);
      options?.onError?.(error);
    },
  });
};