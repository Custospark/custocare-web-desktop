import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../../app/store/hooks/useApp';
import { loginStart, loginSuccess, loginFailure } from '../../../../app/store/slices/authSlice';
import { authApi, LoginRequest } from '../endpoints/index';

export const useLoginMutation = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onMutate: () => {
      dispatch(loginStart());
    },
    onSuccess: (data) => {
      // Log the full response from the backend
      console.log('Login mutation successful, returned data:', data);

      dispatch(loginSuccess(data));
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Login failed. Please check your credentials and try again.';
      dispatch(loginFailure(errorMessage));

      // Optional: log the error for debugging
      console.error('Login mutation failed:', error);
    },
  });
};
