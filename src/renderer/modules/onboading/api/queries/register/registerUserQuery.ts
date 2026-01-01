import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../../../app/store/hooks/useApp';
import { loginSuccess } from '../../../../../app/store/slices/authSlice';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import type {
  RegisterRequest,
  RegisterResponse,
  RegisterErrorResponse,
} from './registerUserTypes';
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
): UseMutationResult<
  RegisterResponse,
  RegisterErrorResponse,
  RegisterRequest
> => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: registerUser,

    onSuccess: (data) => {
      showToast('success', data.message + " Please Choose your role." || 'Account created successfully!');

      if (data.user && data.token) {
        // Map UserResource to UserProfile
        const userProfile = mapUserResourceToProfile(data.user);
        
        dispatch(loginSuccess({
          user: userProfile,
          token: data.token,
        }));

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