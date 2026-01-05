import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { AUTH_ENDPOINTS } from '../../api-endpoints';
import { AxiosError } from 'axios';
import { type UserContext } from '../../../../../app/store/slices/activeContextSlice';

export interface RegisterRequest {
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirmation: string;
}

export interface UserResource {
  id: string;
  uuid: string;
  national_id_country_code: string | null;
  identity: {
    state: string;
    verified_at: string | null;
    verification_method: string | null;
  };
  compliance: {
    data_residency_region: string;
    allowed_processing_regions: string[];
    created_from_facility_id: string | null;
  };
  profile: {
    first_name: string;
    last_name: string;
    full_name: string;
    title: string | null;
    display_name: string | null;
    dob: string | null;
    gender: string | null;
  };
  contact: {
    email: string | null;
    phone: string | null;
  };
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
  };
  security: {
    requires_password_change: boolean;
    mfa_enabled: boolean;
    failed_login_attempts: number;
    account_locked_until: string | null;
  };
  activity: {
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
  };
  metadata: Record<string, unknown> | null;
}

export interface RegisterResponse {
  success: boolean;
  code: string;
  message: string;
  user: UserResource | null;
  context?: UserContext; 
  token: string | null;
  requires_mfa: boolean;
}

export interface RegisterErrorResponse {
  success: false;
  code:
    | 'EMAIL_ALREADY_REGISTERED'
    | 'NATIONAL_ID_ALREADY_REGISTERED'
    | 'REGISTRATION_FAILED'
    | 'NETWORK_ERROR'
    | 'VALIDATION_FAILED'
    | 'UNKNOWN_ERROR';
  message: string;
  user: null;
  token: null;
  requires_mfa: false;
}

export const registerUser = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  try {
    const response = await axiosInstance.post<RegisterResponse>(
      AUTH_ENDPOINTS.REGISTER,
      data
    );

    // If API returns success: false, treat it as an error
    if (!response.data.success) {
      throw new Error(response.data.code || 'REGISTRATION_FAILED');
    }

    return response.data;
  } catch (error) {
    // Transform Axios errors into RegisterErrorResponse
    if (error instanceof Error && error.message) {
      // Check if it's a business logic error (API returned success: false)
      const axiosError = error as AxiosError<RegisterResponse>;
      
      if (axiosError.response?.data) {
        const apiError = axiosError.response.data;
        throw {
          success: false,
          code: apiError.code || 'REGISTRATION_FAILED',
          message: apiError.message || 'Registration failed',
          user: null,
          token: null,
          requires_mfa: false,
        } as RegisterErrorResponse;
      }

      // Network error
      if (!axiosError.response) {
        throw {
          success: false,
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to the server',
          user: null,
          token: null,
          requires_mfa: false,
        } as RegisterErrorResponse;
      }
    }

    // Unknown error
    throw {
      success: false,
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      user: null,
      token: null,
      requires_mfa: false,
    } as RegisterErrorResponse;
  }
};
