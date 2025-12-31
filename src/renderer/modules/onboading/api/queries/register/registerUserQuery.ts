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
} from './registerUsertypes_';
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
      // Business failure: success = false
      if (!data.success) {
        const { message, variant } = mapRegisterError(data.code);
        showToast(variant, message, 7000);
        options?.onError?.(data as RegisterErrorResponse);
        return;
      }

      // Successful registration
      showToast('success', data.message || 'Account created successfully!');

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

        navigate(data.requires_mfa ? ROUTES.TWO_FACTOR_AUTH : ROUTES.STAFF_DASHBOARD);
      }

      options?.onSuccess?.(data);
    },

    onError: () => {
      showToast(
        'error',
        'Unable to connect to the server. Please check your internet connection.',
        7000
      );
    },
  });
};
