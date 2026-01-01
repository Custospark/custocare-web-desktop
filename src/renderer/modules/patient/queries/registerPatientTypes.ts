import { axiosInstance } from '../../../app/api//axiosConfig';
import { PATIENT_ENDPOINTS } from '../api/api-enpoints/endpoints';
import { AxiosError } from 'axios';

/**
 * Patient Registration Request Payload
 * Minimal data collection as per requirements
 */
export interface RegisterPatientRequest {
  user_id:string;
  date_of_birth: string; // Format: YYYY-MM-DD
  biological_sex: 'male' | 'female' | 'intersex' | 'unknown';
  emergency_contact_chain_encrypted: {
    full_name: string;
    phone: string;
    relationship: string;
  };
}

/**
 * Patient Resource returned from backend
 * Matches Laravel PatientResource structure
 */
export interface PatientResource {
  patient_uuid: string;
  user_id: string;
  
  // Demographics
  date_of_birth: string | null;
  age: number | null;
  biological_sex: 'male' | 'female' | 'intersex' | 'unknown' | null;
  gender_identity: string | null;
  blood_type: string | null;
  ethnicity: string | null;
  
  // Clinical information (filtered based on consent)
  known_allergies: string[] | null;
  chronic_conditions: string[] | null;
  active_medications: string[] | null;
  is_organ_donor: boolean;
  advance_directives: string | null;
  
  // Risk stratification
  acuity_baseline: string | null;
  requires_isolation: boolean;
  isolation_type: string | null;
  
  // Consent & privacy
  default_consent_level: 'full' | 'restricted' | 'minimal';
  research_participation_allowed: boolean;
  data_sharing_allowed: boolean;
  
  // Insurance
  primary_insurance_provider: string | null;
  secondary_insurance_provider: string | null;
  payment_responsibility: string | null;
  
  // Care coordination
  primary_care_provider_staff_id: string | null;
  primary_care_facility_id: string | null;
  last_wellness_visit_at: string | null;
  next_scheduled_appointment_at: string | null;
  
  // Patient portal
  portal_access_enabled: boolean;
  portal_terms_accepted_at: string | null;
  preferred_language: string | null;
  preferred_communication_method: string | null;
  
  // Status tracking
  status: 'active' | 'inactive' | 'deceased' | 'merged';
  deceased_at: string | null;
  
  // Audit trail
  created_at: string;
  updated_at: string;
  
  // Relationships
  user?: any; // UserResource when loaded
}

/**
 * Success response from backend
 */
export interface RegisterPatientResponse {
  success: true;
  message: string;
  data: PatientResource;
  meta?: {
    consent_level: string;
    data_restrictions_applied: boolean;
    can_update: boolean;
  };
}

/**
 * Error response from backend
 */
export interface RegisterPatientErrorResponse {
  success: false;
  code:
    | 'PATIENT_ALREADY_EXISTS'
    | 'INVALID_DATE_OF_BIRTH'
    | 'INVALID_BIOLOGICAL_SEX'
    | 'EMERGENCY_CONTACT_REQUIRED'
    | 'USER_NOT_FOUND'
    | 'PATIENT_CREATION_FAILED'
    | 'VALIDATION_FAILED'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';
  message: string;
  errors: Record<string, string[]>;
  data: null;
}

/**
 * Register a new patient
 * @param data Patient registration data
 * @returns Promise<RegisterPatientResponse>
 * @throws RegisterPatientErrorResponse
 */
export const registerPatient = async (
  data: RegisterPatientRequest
): Promise<RegisterPatientResponse> => {
  try {
    const response = await axiosInstance.post<RegisterPatientResponse>(
      PATIENT_ENDPOINTS.REGISTER,
      data
    );

    // If API returns success: false, treat it as an error
    if (!response.data.success) {
      throw new Error('PATIENT_CREATION_FAILED');
    }

    return response.data;
  } catch (error) {
    // Transform Axios errors into RegisterPatientErrorResponse
    if (error instanceof Error && error.message) {
      const axiosError = error as AxiosError<RegisterPatientResponse>;
      
      // Check if it's a business logic error (API returned success: false)
      if (axiosError.response?.data) {
        const apiResponse = axiosError.response.data as any;
        
        // Backend returned structured error
        if (!apiResponse.success) {
          throw {
            success: false,
            code: determineErrorCode(axiosError.response.status, apiResponse),
            message: apiResponse.message || 'Patient registration failed',
            errors: apiResponse.errors || {},
            data: null,
          } as RegisterPatientErrorResponse;
        }
      }

      // Network error (no response from server)
      if (!axiosError.response) {
        throw {
          success: false,
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to the server. Please check your internet connection.',
          errors: {},
          data: null,
        } as RegisterPatientErrorResponse;
      }

      // HTTP error codes
      const status = axiosError.response?.status;
      if (status === 422) {
        throw {
          success: false,
          code: 'VALIDATION_FAILED',
          message: 'Some of the information you entered is invalid.',
          errors: (axiosError.response?.data as any)?.errors || {},
          data: null,
        } as RegisterPatientErrorResponse;
      }

      if (status === 409) {
        throw {
          success: false,
          code: 'PATIENT_ALREADY_EXISTS',
          message: 'A patient record already exists for this user.',
          errors: {},
          data: null,
        } as RegisterPatientErrorResponse;
      }

      if (status === 404) {
        throw {
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'User account not found. Please log in again.',
          errors: {},
          data: null,
        } as RegisterPatientErrorResponse;
      }
    }

    // Unknown error
    throw {
      success: false,
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred during registration.',
      errors: {},
      data: null,
    } as RegisterPatientErrorResponse;
  }
};

/**
 * Determine error code based on HTTP status and response
 */
function determineErrorCode(
  status: number,
  apiResponse: any
): RegisterPatientErrorResponse['code'] {
  // Check if backend provided a specific error code
  if (apiResponse.code) {
    return apiResponse.code;
  }

  // Map HTTP status to error code
  switch (status) {
    case 422:
      return 'VALIDATION_FAILED';
    case 409:
      return 'PATIENT_ALREADY_EXISTS';
    case 404:
      return 'USER_NOT_FOUND';
    case 500:
      return 'PATIENT_CREATION_FAILED';
    default:
      return 'UNKNOWN_ERROR';
  }
}