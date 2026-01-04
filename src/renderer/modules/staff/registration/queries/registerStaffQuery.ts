/**
 * ============================================================================
 * REGISTER STAFF QUERY - UPDATED WITH ACTIVE CONTEXT SYNC
 * ============================================================================
 * 
 * This query now properly handles staff registration and automatically
 * updates the user's active context with staff capabilities.
 * 
 * Key Features:
 * ✅ Updates activeContext after successful registration
 * ✅ Enables staff portal access immediately
 * ✅ Handles context refresh for existing users gaining staff capabilities
 * ✅ Supports both new staff-only users and patients becoming staff
 * ✅ Proper facility role assignment handling
 * ✅ Comprehensive error handling and navigation
 * ✅ Type-safe with proper loading states
 */

import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { useAppDispatch } from '../../../../app/store/hooks/useApp';
import { 
  setUserContext,
  switchFacilityRole,
  setLoading as setContextLoading,
  setError as setContextError,
  type UserContext,
  type FacilityRole,
} from '../../../../app/store/slices/activeContextSlice';
import type { RegisterStaffRequest, RegisterStaffResponse } from './registerStaffTypes';
import type { AxiosError } from 'axios';
import { ROUTES } from '../../../onboading/routes/onboardingRouteConstants';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

interface UseRegisterStaffOptions {
  onSuccess?: (data: RegisterStaffResponse) => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
  /**
   * Whether to automatically navigate after successful registration
   * @default true
   */
  autoNavigate?: boolean;
  /**
   * Whether to automatically select the first facility role if available
   * @default true
   */
  autoSelectFacilityRole?: boolean;
  /**
   * Target route after successful registration
   * @default ROUTES.PORTAL_SELECTOR
   */
  redirectTo?: string;
}

/**
 * Fetch updated user context after staff registration
 * This ensures the user's capabilities and facility roles are up-to-date
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
 * Extract the first available facility role from user context
 * Used for automatically selecting a workspace after staff registration
 */
const getDefaultFacilityRole = (context: UserContext): FacilityRole | null => {
  if (context.facility_roles.length === 0) {
    return null;
  }
  
  // Try to find primary facility first
  const primaryRole = context.facility_roles.find(role => role.is_primary_facility);
  if (primaryRole) {
    return primaryRole;
  }
  
  // Otherwise return the first role
  return context.facility_roles[0];
};

export const useRegisterStaff = (options: UseRegisterStaffOptions = {}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const autoNavigate = options.autoNavigate ?? true;
  const autoSelectFacilityRole = options.autoSelectFacilityRole ?? true;
  const redirectTo = options.redirectTo ?? ROUTES.PORTAL_SELECTOR;

  return useMutation<RegisterStaffResponse, AxiosError<ApiErrorResponse>, RegisterStaffRequest>({
    mutationFn: async (data: RegisterStaffRequest) => {
      const response = await axiosInstance.post<RegisterStaffResponse>('/staff', data);
      return response.data;
    },
    
    /**
     * Handle mutation start
     */
    onMutate: () => {
      // Set loading state before mutation starts
      dispatch(setContextLoading(true));
    },
    
    /**
     * Handle successful staff registration
     */
    onSuccess: async (data) => {
      try {
        // Show success toast with staff details
        const staffName =  'Staff member';
        showToast(
          'success', 
          data.message || `${staffName} registered as staff successfully!`, 
          6000
        );
        
        // Fetch updated user context to include staff capabilities
        dispatch(setContextLoading(true));
        
        const updatedContext = await fetchUpdatedUserContext();
        
        // Update activeContext with staff capability
        dispatch(setUserContext(updatedContext));
        
        // Determine if user has facility access
        const hasFacilityAccess = updatedContext.facility_roles.length > 0;
        
        // Show appropriate success message
        if (hasFacilityAccess) {
          showToast(
            'success',
            `Staff access granted! You have access to ${updatedContext.facility_roles.length} facility(s).`,
            5000
          );
          
          // Automatically select first facility role if configured
          if (autoSelectFacilityRole && updatedContext.facility_roles.length > 0) {
            const defaultRole = getDefaultFacilityRole(updatedContext);
            if (defaultRole) {
              dispatch(
                switchFacilityRole({
                  facilityId: defaultRole.facility_id,
                  roleCode: defaultRole.role_code,
                })
              );
              
              showToast(
                'info',
                `Automatically selected ${defaultRole.facility_name || 'facility'} as your workspace.`,
                4000
              );
            }
          }
        } else {
          showToast(
            'info',
            'Staff registration complete! You will need facility assignment to access professional tools.',
            6000
          );
        }
        
        // Call custom success handler if provided
        options.onSuccess?.(data);
        
        // Handle navigation
        if (autoNavigate) {
          setTimeout(() => {
            if (hasFacilityAccess) {
              // Has facility access - navigate to portal selector or staff dashboard
              navigate(redirectTo);
              showToast(
                'info',
                'You can now access the staff portal with your assigned facilities.',
                4000
              );
            } else {
              // No facility access yet - navigate to portal selector
              navigate(ROUTES.PORTAL_SELECTOR);
              showToast(
                'warning',
                'Please contact your facility administrator for workspace assignment.',
                6000
              );
            }
          }, 1500);
        }
        
      } catch (contextError) {
        // Staff registered but context update failed
        console.error('Failed to update user context:', contextError);
        
        dispatch(setContextError(
          contextError instanceof Error 
            ? contextError.message 
            : 'Failed to update staff portal access'
        ));
        
        // Still show success for staff registration
        showToast(
          'success',
          'Staff registration completed! Please refresh the page to access staff portal.',
          7000
        );
        
        // Navigate to portal selector
        if (autoNavigate) {
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
    onError: (error: AxiosError<ApiErrorResponse>) => {
      // Extract error message
      const apiMessage = error.response?.data?.message || 
                        error.message || 
                        'Staff registration failed!';
      
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
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        // Unauthorized - session expired
        setTimeout(() => {
          navigate(ROUTES.LOGIN);
        }, 2000);
      } else if (error.response?.status === 409) {
        // Conflict - staff already exists
        setTimeout(() => {
          navigate(ROUTES.PORTAL_SELECTOR);
          showToast(
            'info',
            'Staff profile already exists. Redirecting to portal selector...',
            4000
          );
        }, 2000);
      }
      
      // Call optional error callback
      options.onError?.(error);
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
 * Helper hook for users becoming staff (gaining staff capabilities)
 * Useful for patients who are registering as healthcare providers
 */
export const useBecomeStaff = () => {
  return useRegisterStaff({
    autoNavigate: true,
    autoSelectFacilityRole: true,
    redirectTo: ROUTES.PORTAL_SELECTOR,
    onSuccess: (data) => {
      // Additional success handling for role transition
      console.log('Successfully transitioned to staff role:', data);
    },
  });
};

/**
 * Helper hook for administrators registering new staff members
 * Stays in admin mode without automatic navigation
 */
export const useRegisterStaffAsAdmin = () => {
  return useRegisterStaff({
    autoNavigate: false,
    autoSelectFacilityRole: false,
    onSuccess: (data) => {
      // Show success but stay in current context
      console.log('Staff member registered by admin:', data);
    },
  });
};

/**
 * Helper hook for facility-specific staff registration
 * Automatically assigns the registered staff to a specific facility
 */
export const useRegisterStaffForFacility = (facilityId: number) => {
  const enhancedMutation = useRegisterStaff({
    autoNavigate: true,
    autoSelectFacilityRole: true,
    redirectTo: ROUTES.STAFF_DASHBOARD,
  });

  // Wrap the mutation to include facility ID in the request
  return {
    ...enhancedMutation,
    mutate: (data: Omit<RegisterStaffRequest, 'facility_id'>) => {
      return enhancedMutation.mutate({
        ...data,
        facility_id: facilityId,
      } as RegisterStaffRequest);
    },
    mutateAsync: (data: Omit<RegisterStaffRequest, 'facility_id'>) => {
      return enhancedMutation.mutateAsync({
        ...data,
        facility_id: facilityId,
      } as RegisterStaffRequest);
    },
  };
};