import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../app/store/contexts/toast/useToast';
import type {
  RegisterPatientRequest,
  RegisterPatientResponse,
  RegisterPatientErrorResponse,
} from './registerPatientTypes';
import { registerPatient } from './registerPatientTypes';
import { ROUTES } from '../../onboading/routes/onboardingRouteConstants';
import { mapRegisterPatientError, extractErrorMessage } from './registerPatientErrorMapper';

/**
 * Options for useRegisterPatient hook
 */
interface UseRegisterPatientOptions {
  onSuccess?: (data: RegisterPatientResponse) => void;
  onError?: (error: RegisterPatientErrorResponse) => void;
}

/**
 * Custom hook for patient registration with React Query
 * 
 * Features:
 * - Automatic error mapping to user-friendly messages
 * - Toast notifications for success/error states
 * - Navigation handling after successful registration
 * - Type-safe mutation with proper error handling
 * 
 * @param options Optional callbacks for success/error handling
 * @returns React Query mutation result
 * 
 * @example
 * ```tsx
 * const registerPatientMutation = useRegisterPatient({
 *   onSuccess: (data) => {
 *     console.log('Patient registered:', data.data.patient_uuid);
 *   }
 * });
 * 
 * const handleSubmit = () => {
 *   registerPatientMutation.mutate({
 *     date_of_birth: '1990-01-01',
 *     biological_sex: 'male',
 *     emergency_contact: {
 *       full_name: 'John Doe',
 *       phone: '+1234567890',
 *       relationship: 'Spouse'
 *     }
 *   });
 * };
 * ```
 */
export const useRegisterPatient = (
  options?: UseRegisterPatientOptions
): UseMutationResult<
  RegisterPatientResponse,
  RegisterPatientErrorResponse,
  RegisterPatientRequest
> => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: registerPatient,

    /**
     * Handle successful patient registration
     */
    onSuccess: (data) => {
      // Show success toast with patient ID
      showToast(
        'success',
        data.message || 'Patient registration completed successfully!',
        5000
      );

      // Call custom success handler if provided
      options?.onSuccess?.(data);

      // Note: Navigation is handled by the component after user interaction
      // The component will navigate to dashboard when user clicks "Continue"
    },

    /**
     * Handle registration errors
     */
    onError: (error: RegisterPatientErrorResponse) => {
      // Map error code to user-friendly message
      const { message, variant } = mapRegisterPatientError(error.code);

      // If there are validation errors, include them in the message
      let displayMessage = message;
      if (error.errors && Object.keys(error.errors).length > 0) {
        const validationMessage = extractErrorMessage(error.errors);
        displayMessage = `${message} ${validationMessage}`;
      }

      // Show error toast
      showToast(variant, displayMessage, 7000);

      // Handle specific error cases
      if (error.code === 'USER_NOT_FOUND') {
        // Session expired - redirect to login
        setTimeout(() => {
          navigate(ROUTES.LOGIN);
        }, 2000);
      }

      if (error.code === 'PATIENT_ALREADY_EXISTS') {
        // Patient already registered - redirect to dashboard
        setTimeout(() => {
          navigate(ROUTES.PATIENT_DASHBOARD);
        }, 2000);
      }

      // Call custom error handler if provided
      options?.onError?.(error);
    },
  });
};

/**
 * Type helper for mutation state
 */
export type RegisterPatientMutationState = {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: RegisterPatientErrorResponse | null;
  data: RegisterPatientResponse | undefined;
};

/**
 * Extract mutation state from useRegisterPatient result
 * Useful for conditional rendering in components
 */
export const extractMutationState = (
  mutation: UseMutationResult<
    RegisterPatientResponse,
    RegisterPatientErrorResponse,
    RegisterPatientRequest
  >
): RegisterPatientMutationState => ({
  isLoading: mutation.isPending,
  isSuccess: mutation.isSuccess,
  isError: mutation.isError,
  error: mutation.error ?? null,
  data: mutation.data,
});