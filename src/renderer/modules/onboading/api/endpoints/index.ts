import { axiosInstance } from '../../../../app/api/axiosConfig'
import { AUTH_ENDPOINTS } from '../constants/index';

export interface LoginRequest {
  email: string;
  password: string;
  mfa_code?: string;
  rememberMe?:boolean;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>(
      AUTH_ENDPOINTS.LOGIN,
      credentials
    );
    return response.data;
  },
};