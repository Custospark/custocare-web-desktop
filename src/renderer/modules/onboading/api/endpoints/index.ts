import { axiosInstance } from '../../../../app/api/axiosConfig';
import { AUTH_ENDPOINTS } from '../constants/index';
import type { LoginRequest, BackendLoginResponse } from '../auth';
import { AxiosError } from 'axios';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<BackendLoginResponse> => {
    try {
      const response = await axiosInstance.post<BackendLoginResponse>(
        AUTH_ENDPOINTS.LOGIN,
        credentials
      );
      return response.data;
    } catch (error) {
      // Check if it's an AxiosError
      if (error instanceof AxiosError && error.response?.data) {
        // Return the error data - trusting it matches BackendLoginResponse
        return error.response.data as BackendLoginResponse;
      }
      
      // Rethrow for network errors or other issues
      throw error;
    }
  },
};

export type { LoginRequest, BackendLoginResponse };