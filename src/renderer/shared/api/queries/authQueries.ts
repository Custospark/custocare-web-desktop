import { useMutation, useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../app/api/axiosConfig';
import { API_ENDPOINTS } from '../endpoints/endpoints';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

/**
 * Login Mutation
 */
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const { data } = await axiosInstance.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      // Store token
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      return data;
    },
  });
};

/**
 * Logout Mutation
 */
export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
      localStorage.removeItem('authToken');
    },
  });
};

/**
 * Get Current User Profile
 */
export const useGetProfile = () => {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: async () => {
      const { data } = await axiosInstance.get<User>(
        API_ENDPOINTS.AUTH.GET_PROFILE
      );
      return data;
    },
    enabled: !!localStorage.getItem('authToken'),
    retry: false,
  });
};

/**
 * Update User Profile
 */
export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (profileData: Partial<User>) => {
      const { data } = await axiosInstance.put<User>(
        API_ENDPOINTS.AUTH.UPDATE_PROFILE,
        profileData
      );
      return data;
    },
  });
};