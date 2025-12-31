import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../../../app/store/hooks/useApp';
import { loginSuccess } from '../../../../../app/store/slices/authSlice';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import {
  registerUser,
  RegisterRequest,
  RegisterResponse,
  RegisterErrorResponse,
} from './registerUserTypes';
import { ROUTES } from '../../../routes/onboardingRouteConstants';
import { mapRegisterError } from './registerErrorMapper';

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
      // Show success toast
      showToast('success', data.message || 'Account created successfully!');

      // Dispatch login and navigate
      if (data.user && data.token) {
        dispatch(
          loginSuccess({
            user: {
              id: data.user.id,
              email: data.user.contact.email || '',
              name: `${data.user.profile.first_name} ${data.user.profile.last_name}`,
              role: 'user',
            },
            token: data.token,
          })
        );

        navigate(data.requires_mfa ? ROUTES.TWO_FACTOR_AUTH : ROUTES.ROLE_SELECTION);
      }

      options?.onSuccess?.(data);
    },

    onError: (error: RegisterErrorResponse) => {
      // Map error code to user-friendly message
      const { message, variant } = mapRegisterError(error.code);
      
      // Show error toast
      showToast(variant, message, 7000);

      // Call custom error handler if provided
      options?.onError?.(error);
    },
  });
};
