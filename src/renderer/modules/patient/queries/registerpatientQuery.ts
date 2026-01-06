/**
 * ============================================================================
 * REGISTER PATIENT QUERY - UPDATED WITH ACTIVE CONTEXT SYNC
 * ============================================================================
 * 
 * This query now properly handles patient registration and automatically
 * updates the user's active context with patient capabilities.
 * 
 * Key Features:
 * ✅ Updates activeContext after successful registration
 * ✅ Automatically enables patient portal access
 * ✅ Handles user context refresh for existing users
 * ✅ Supports both new patient-only users and staff registering patients
 * ✅ Proper error handling and navigation
 * ✅ Maintains type safety throughout
 */

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../app/store/contexts/toast/useToast';
import { useAppDispatch } from '../../../app/store/hooks/useApp';
import { 
  setUserContext,
  switchCapability,
  setLoading as setContextLoading,
  setError as setContextError,
  type UserContext,
} from '../../../app/store/slices/activeContextSlice';
import type {
  RegisterPatientRequest,
  RegisterPatientResponse,
  RegisterPatientErrorResponse,
} from './registerPatientTypes';
import { registerPatient } from './registerPatientTypes';
import { ROUTES } from '../../onboading/routes/onboardingRouteConstants';
import { mapRegisterPatientError, extractErrorMessage } from './registerPatientErrorMapper';
import { axiosInstance } from '../../../app/api/axiosConfig';

/**
 * Fetch updated user context after patient registration
 * This ensures the user's capabilities are up-to-date (patient capability added)
 */
const fetchUpdatedUserContext = async (): Promise<UserContext> => {
  try {
    const response = await axiosInstance.get('/user/context/resolve');
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Invalid context response from server');
  } catch (error) {
    console.error('Failed to fetch updated user context:', error);
    throw error;
  }
};

/**
 * Check if user context has patient capability
 */
const hasPatientCapability = (context: UserContext): boolean => {
  return Boolean(context.capabilities.patient);
};

/**
 * Check if user context has staff capability
 */
const hasStaffCapability = (context: UserContext): boolean => {
  return Boolean(context.capabilities.staff);
};

/**
 * Get available capabilities from context
 */
const getAvailableCapabilities = (context: UserContext): string[] => {
  return Object.keys(context.capabilities);
};

/**
 * Check if patient capability should be activated automatically
 */
const shouldActivatePatientCapability = (
  context: UserContext,
  autoSwitchToPatientMode: boolean
): boolean => {
  if (!autoSwitchToPatientMode) {
    return false;
  }
  
  // Check if patient capability exists
  if (!hasPatientCapability(context)) {
    return false;
  }
  
  // Check if patient is available as an option
  const capabilities = getAvailableCapabilities(context);
  return capabilities.includes('patient');
};

/**
 * Options for useRegisterPatient hook
 */
interface UseRegisterPatientOptions {
  onSuccess?: (data: RegisterPatientResponse) => void;
  onError?: (error: RegisterPatientErrorResponse) => void;
  /**
   * Whether to automatically switch to patient mode after registration
   * @default true
   */
  autoSwitchToPatientMode?: boolean;
  /**
   * Whether to navigate to patient dashboard after registration
   * @default true
   */
  autoNavigateToDashboard?: boolean;
  /**
   * Whether to show success toast messages
   * @default true
   */
  showSuccessToast?: boolean;
  /**
   * Whether to show error toast messages
   * @default true
   */
  showErrorToast?: boolean;
}

/**
 * Custom hook for patient registration with React Query
 * 
 * Enhanced Features:
 * - Updates activeContext with patient capabilities after registration
 * - Optionally switches to patient mode automatically
 * - Supports both new patients and staff registering patients
 * - Automatic error mapping to user-friendly messages
 * - Toast notifications for success/error states
 * - Navigation handling after successful registration
 * - Type-safe mutation with proper error handling
 * 
 * @param options Optional callbacks and configuration
 * @returns React Query mutation result
 * 
 * @example
 * ```tsx
 * // Basic usage for new patient registration
 * const registerPatientMutation = useRegisterPatient({
 *   onSuccess: (data) => {
 *     console.log('Patient registered:', data.data.patient_uuid);
 *   }
 * });
 * 
 * // Usage for staff registering a patient (stays in staff mode)
 * const registerPatientAsStaff = useRegisterPatient({
 *   autoSwitchToPatientMode: false,
 *   autoNavigateToDashboard: false,
 *   onSuccess: (data) => {
 *     // Show patient registration success but stay in staff portal
 *   }
 * });
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
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const autoSwitchToPatientMode = options?.autoSwitchToPatientMode ?? true;
  const autoNavigateToDashboard = options?.autoNavigateToDashboard ?? true;
  const showSuccessToast = options?.showSuccessToast ?? true;
  const showErrorToast = options?.showErrorToast ?? true;

  return useMutation({
    mutationFn: registerPatient,

    /**
     * Handle mutation start
     */
    onMutate: () => {
      // Set loading state before mutation starts
      dispatch(setContextLoading(true));
    },

    /**
     * Handle successful patient registration
     */
    onSuccess: async (data) => {
      try {
        // Show success toast if enabled
        if (showSuccessToast) {
          const patientName = 'Patient';
          
          showToast(
            'success',
            `${patientName} registered successfully!}`,
            6000
          );
        }

        // Fetch updated user context to include patient capability
        const updatedContext = await fetchUpdatedUserContext();
        
        // Update activeContext with patient capability
        dispatch(setUserContext(updatedContext));
        
        // Check if we should activate patient capability
        const shouldActivatePatient = shouldActivatePatientCapability(
          updatedContext,
          autoSwitchToPatientMode
        );
        
        if (shouldActivatePatient) {
          // Switch to patient mode using switchCapability action
          dispatch(switchCapability('patient'));
          
          if (showSuccessToast) {
            showToast(
              'info',
              'Switched to Patient Portal. You can now access your personal health dashboard.',
              5000
            );
          }
        }

        // Call custom success handler if provided
        options?.onSuccess?.(data);

        // Handle navigation based on configuration
        if (autoNavigateToDashboard) {
          setTimeout(() => {
            // Determine appropriate dashboard based on current capability
            if (shouldActivatePatient) {
              navigate(ROUTES.PATIENT_DASHBOARD);
            } else if (hasStaffCapability(updatedContext)) {
              navigate(ROUTES.STAFF_DASHBOARD);
              if (showSuccessToast) {
                showToast(
                  'info',
                  'Patient registered successfully. You have been redirected to staff dashboard.',
                  4000
                );
              }
            } else {
              navigate(ROUTES.PORTAL_SELECTOR);
            }
          }, 1500);
        }

      } catch (contextError) {
        // Patient registered but context update failed
        console.error('Failed to update user context:', contextError);
        
        const errorMessage = contextError instanceof Error 
          ? contextError.message 
          : 'Failed to update patient portal access';
        
        dispatch(setContextError(errorMessage));
        
        // Still show success for patient registration
        if (showSuccessToast) {
          showToast(
            'success',
            'Patient registration completed! Please refresh the page to access patient portal.',
            7000
          );
        }
        
        // Navigate based on configuration
        if (autoNavigateToDashboard) {
          setTimeout(() => {
            navigate(ROUTES.PORTAL_SELECTOR);
          }, 1000);
        }
      } finally {
        dispatch(setContextLoading(false));
      }
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

      // Show error toast if enabled
      if (showErrorToast) {
        showToast(variant, displayMessage, 7000);
      }

      // Set error in context slice
      dispatch(setContextError(displayMessage));

      // Handle specific error cases
      switch (error.code) {
        case 'USER_NOT_FOUND':
          // Session expired or unauthorized - redirect to login
          if (showErrorToast) {
            showToast('warning', 'Session expired. Please login again.', 4000);
          }
          setTimeout(() => {
            navigate(ROUTES.LOGIN);
          }, 2000);
          break;

        case 'PATIENT_ALREADY_EXISTS':
          // Patient already registered - refresh context
          if (showErrorToast) {
            showToast('info', 'Patient profile already exists. Updating your access...', 4000);
          }
          
          dispatch(setContextLoading(true));
          fetchUpdatedUserContext()
            .then(updatedContext => {
              dispatch(setUserContext(updatedContext));
              
              // Check if patient capability exists and switch if configured
              if (autoSwitchToPatientMode && hasPatientCapability(updatedContext)) {
                dispatch(switchCapability('patient'));
                if (autoNavigateToDashboard) {
                  navigate(ROUTES.PATIENT_DASHBOARD);
                }
              } else if (autoNavigateToDashboard) {
                navigate(ROUTES.PORTAL_SELECTOR);
              }
            })
            .catch(err => {
              console.error('Failed to refresh context:', err);
              navigate(ROUTES.PORTAL_SELECTOR);
            })
            .finally(() => {
              dispatch(setContextLoading(false));
            });
          break;

        default:
          // For other errors, navigate to portal selector
          if (autoNavigateToDashboard) {
            setTimeout(() => {
              navigate(ROUTES.PORTAL_SELECTOR);
            }, 2000);
          }
          break;
      }

      // Call custom error handler if provided
      options?.onError?.(error);
    },

    /**
     * Handle mutation completion (success or error)
     */
    onSettled: () => {
      // Ensure loading state is reset regardless of success/error
      dispatch(setContextLoading(false));
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

/**
 * Helper function for staff members registering patients
 * Keeps the user in staff mode after registration
 */
export const useRegisterPatientAsStaff = (
  options?: Omit<UseRegisterPatientOptions, 
    'autoSwitchToPatientMode' | 
    'autoNavigateToDashboard' | 
    'showSuccessToast' | 
    'showErrorToast'>
): UseMutationResult<
  RegisterPatientResponse,
  RegisterPatientErrorResponse,
  RegisterPatientRequest
> => {
  return useRegisterPatient({
    autoSwitchToPatientMode: false,
    autoNavigateToDashboard: false,
    showSuccessToast: true,
    showErrorToast: true,
    ...options,
  });
};

/**
 * Helper function for self-registration (becoming a patient)
 * Automatically switches to patient mode after registration
 */
export const useRegisterAsPatient = (
  options?: Omit<UseRegisterPatientOptions, 
    'autoSwitchToPatientMode' | 
    'autoNavigateToDashboard' | 
    'showSuccessToast' | 
    'showErrorToast'>
): UseMutationResult<
  RegisterPatientResponse,
  RegisterPatientErrorResponse,
  RegisterPatientRequest
> => {
  return useRegisterPatient({
    autoSwitchToPatientMode: true,
    autoNavigateToDashboard: true,
    showSuccessToast: true,
    showErrorToast: true,
    ...options,
  });
};

/**
 * Helper function for silent patient registration (no UI feedback)
 * Useful for background registrations
 */
export const useRegisterPatientSilently = (
  options?: Omit<UseRegisterPatientOptions, 'showSuccessToast' | 'showErrorToast'>
): UseMutationResult<
  RegisterPatientResponse,
  RegisterPatientErrorResponse,
  RegisterPatientRequest
> => {
  return useRegisterPatient({
    showSuccessToast: false,
    showErrorToast: false,
    autoSwitchToPatientMode: true,
    autoNavigateToDashboard: true,
    ...options,
  });
};

/**
 * Helper function for batch patient registration
 * Stays in current mode and doesn't navigate
 */
export const useRegisterPatientInBatch = (
  options?: Omit<UseRegisterPatientOptions, 
    'autoSwitchToPatientMode' | 
    'autoNavigateToDashboard'>
): UseMutationResult<
  RegisterPatientResponse,
  RegisterPatientErrorResponse,
  RegisterPatientRequest
> => {
  return useRegisterPatient({
    autoSwitchToPatientMode: false,
    autoNavigateToDashboard: false,
    ...options,
  });
};

/**
 * Helper to check if patient registration should be allowed
 * based on current context
 */
export const canRegisterPatient = (
  currentCapability: string | null,
  isStaff: boolean
): boolean => {
  // Staff can always register patients
  if (isStaff) {
    return true;
  }
  
  // Non-staff users can only register if they're not already patients
  return currentCapability !== 'patient';
};
