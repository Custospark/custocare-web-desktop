import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../../app/store/hooks/useApp';
import { loginSuccess } from '../../../../app/store/slices/authSlice';
import { 
  registerUser, 
  RegisterRequest, 
  RegisterResponse,
  RegisterErrorResponse 
} from '../endpoints/register'
import { ROUTES } from '../../routes/onboardingRouteConstants';

interface UseRegisterOptions {
  onSuccess?: (data: RegisterResponse) => void;
  onError?: (error: RegisterErrorResponse) => void;
}

export const useRegister = (options?: UseRegisterOptions): UseMutationResult<
  RegisterResponse,
  RegisterErrorResponse,
  RegisterRequest
> => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      if (data.success && data.token && data.user) {
        dispatch(loginSuccess({
          user: {
            id: data.user.id,
            email: data.user.contact.email || '',
            name: `${data.user.profile.first_name} ${data.user.profile.last_name}`,
            role: 'user'
          },
          token: data.token,
        }));

        if (data.requires_mfa) {
          navigate(ROUTES.TWO_FACTOR_AUTH);
        } else {
          navigate(ROUTES.TWO_FACTOR_AUTH);
        }
      }
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};