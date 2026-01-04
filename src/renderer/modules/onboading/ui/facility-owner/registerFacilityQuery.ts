/**
 * ============================================================================
 * REGISTER FACILITY QUERY - UPDATED WITH ACTIVE CONTEXT SYNC
 * ============================================================================
 * 
 * This query now properly handles facility registration and automatically
 * updates the user's active context with the new facility assignment.
 * 
 * Key Features:
 * ✅ Updates activeContext after successful registration
 * ✅ Automatically sets the new facility as active workspace
 * ✅ Handles errors gracefully with meaningful messages
 * ✅ Maintains type safety throughout
 * ✅ Provides proper loading states
 */

import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { useAppDispatch } from '../../../../app/store/hooks/useApp';
import { 
  setUserContext,
  setLoading as setContextLoading,
  setError as setContextError,
  type UserContext,
} from '../../../../app/store/slices/activeContextSlice';
import type { 
  RegisterFacilityRequest, 
  RegisterFacilityResponse 
} from './registerFacilityTypes';
import type { AxiosError } from 'axios';
import { ROUTES } from '../../routes/onboardingRouteConstants';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

interface UseRegisterFacilityOptions {
  onSuccess?: (data: RegisterFacilityResponse) => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}

/**
 * Fetch updated user context after facility registration
 * This ensures the user's facility roles are up-to-date
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

export const useRegisterFacility = (options: UseRegisterFacilityOptions = {}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  return useMutation<RegisterFacilityResponse, AxiosError<ApiErrorResponse>, RegisterFacilityRequest>({
    mutationFn: async (data: RegisterFacilityRequest) => {
      const response = await axiosInstance.post<RegisterFacilityResponse>('/facilities', data);
      return response.data;
    },
    
    onMutate: () => {
      // Set loading state before mutation starts
      dispatch(setContextLoading(true));
    },
    
    onSuccess: async (data: RegisterFacilityResponse) => {
      try {
        // Show success toast
        showToast(
          'success', 
          data.message || 'Facility created successfully!', 
          8000
        );  
        // Fetch updated user context to include the new facility
        dispatch(setContextLoading(true));
        
        const updatedContext = await fetchUpdatedUserContext();
        
        // Update activeContext with the new facility information
        dispatch(setUserContext(updatedContext));
        // Navigate to portal selector or staff dashboard
        if (updatedContext.facility_roles.length > 0) {
          // User now has facility access - navigate to portal selector
          navigate(ROUTES.PORTAL_SELECTOR);
        } else {
          // This shouldn't happen,graceful handling.
          showToast(
            'warning',
            'Facility created, but not yet assigned to your account. Please contact support.',
            7000
          );
        }
        
        // Call optional success callback
        options.onSuccess?.(data);
        
      } catch (contextError) {
        // Facility created but context update failed
        console.error('Failed to update user context:', contextError);
        
        dispatch(setContextError(
          contextError instanceof Error 
            ? contextError.message 
            : 'Failed to update workspace context'
        ));
        
        // Still show success for facility creation
        showToast(
          'success',
          'Facility created successfully! Please refresh the page to see it in your workspace.',
          7000
        );
        
        navigate(ROUTES.PORTAL_SELECTOR);
      } finally {
        dispatch(setContextLoading(false));
      }
    },
    
    onError: (error: AxiosError<ApiErrorResponse>) => {
      // Handle registration errors
      const apiMessage = error.response?.data?.message || 
                        error.message || 
                        'Facility creation failed!';
      
      let errorDetails = '';
      
      // Process validation errors if present
      if (error.response?.data?.errors) {
        errorDetails = Object.entries(error.response.data.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join(' | ');
      }
      
      // Show appropriate error message
      const fullErrorMessage = errorDetails 
        ? `${apiMessage} (${errorDetails})` 
        : apiMessage;
      
      showToast('error', fullErrorMessage, 8000);
      
      // Set error in context slice
      dispatch(setContextError(fullErrorMessage));
      
      // Reset loading state
      dispatch(setContextLoading(false));
      
      // Call optional error callback
      options.onError?.(error);
    },
    
    onSettled: () => {
      // Ensure loading state is reset regardless of success/error
      dispatch(setContextLoading(false));
    },
  });
};