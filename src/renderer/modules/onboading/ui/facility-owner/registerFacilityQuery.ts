import { useMutation } from '@tanstack/react-query';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import type { 
  RegisterFacilityRequest, 
  RegisterFacilityResponse 
} from './registerFacilityTypes';
import type { AxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

interface UseRegisterFacilityOptions {
  onSuccess?: (data: RegisterFacilityResponse) => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}

export const useRegisterFacility = (options: UseRegisterFacilityOptions = {}) => {
  const { showToast } = useToast();

  return useMutation<RegisterFacilityResponse, AxiosError<ApiErrorResponse>, RegisterFacilityRequest>({
    mutationFn: async (data: RegisterFacilityRequest) => {
      const response = await axiosInstance.post<RegisterFacilityResponse>('/facilities', data);
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Facility created successfully!', 8000);
      options.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Facility creation failed!';

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