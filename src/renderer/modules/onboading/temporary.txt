import { useMutation } from '@tanstack/react-query';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import type { RegisterStaffRequest, RegisterStaffResponse } from './registerStaffTypes';
import type { AxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

interface UseRegisterStaffOptions {
  onSuccess?: (data: RegisterStaffResponse) => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}

export const useRegisterStaff = (options: UseRegisterStaffOptions = {}) => {
  const { showToast } = useToast();

  return useMutation<RegisterStaffResponse, AxiosError<ApiErrorResponse>, RegisterStaffRequest>({
    mutationFn: async (data: RegisterStaffRequest) => {
      const response = await axiosInstance.post<RegisterStaffResponse>('/staff', data);
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Staff registration successful!', 8000);
      options.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Staff registration failed!';

      let errorDetails = '';
      if (error.response?.data?.errors) {
        // Convert the errors object into a readable string
        errorDetails = Object.entries(error.response.data.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join(' | ');
      }

      showToast(
        'error',
        errorDetails ? `${apiMessage} (${errorDetails})` : apiMessage,
        8000
      );

      options.onError?.(error);
    },
  });
};
