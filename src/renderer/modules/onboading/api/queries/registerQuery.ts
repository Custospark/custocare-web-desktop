import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../../app/store/hooks/useApp';
import { loginSuccess } from '../../../../app/store/slices/authSlice';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { 
  registerUser, 
  RegisterRequest, 
  RegisterResponse,
  RegisterErrorResponse 
} from '../endpoints/register';
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
  const { showToast } = useToast();

  return useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      if (data.success && data.token && data.user) {
        // Show success toast
        showToast('success', data.message || 'Registration successful!');
        
        dispatch(loginSuccess({
          user: {
            id: data.user.id,
            email: data.user.contact.email || '',
            name: `${data.user.profile.first_name} ${data.user.profile.last_name}`,
            role: 'user'
          },
          token: data.token,
        }));

        // Navigate based on MFA requirement
        if (data.requires_mfa) {
          navigate(ROUTES.TWO_FACTOR_AUTH);
        } else {
          navigate(ROUTES.STAFF_DASHBOARD);
        }
      } else {
        // Show error toast for unsuccessful registration
        showToast('error', data.message || 'Registration failed');
      }
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      // Show appropriate error toast based on error code
      let toastMessage = error.message;
      let toastVariant: 'error' | 'warning' = 'error';
      
      if (error.code === 'EMAIL_ALREADY_REGISTERED') {
        toastMessage = 'This email is already registered. Please use a different email or try logging in.';
        toastVariant = 'warning';
      } else if (error.code === 'NATIONAL_ID_ALREADY_REGISTERED') {
        toastMessage = 'This national ID is already registered. Please contact support if you believe this is an error.';
        toastVariant = 'error';
      } else if (error.code === 'REGISTRATION_FAILED') {
        toastMessage = 'Registration failed. Please check your information and try again.';
        toastVariant = 'error';
      }
      
      showToast(toastVariant, toastMessage, 7000); // Longer duration for errors
      options?.onError?.(error);
    },
    onSettled: () => {
      // Optional: You could add additional cleanup or logging here
      // showToast('info', 'Registration process completed', 2000);
    },
  });
};