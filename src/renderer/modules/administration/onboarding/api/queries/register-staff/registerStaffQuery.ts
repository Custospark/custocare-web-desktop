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
import { axiosInstance } from '../../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../../app/store/contexts/toast/useToast';
import { useAppDispatch } from '../../../../../../app/store/hooks/useApp';
import { 
  setUserContext,
  switchCapability,
  switchFacility,
  setLoading as setContextLoading,
  setError as setContextError,
  type UserContext,
} from '../../../../../../app/store/slices/activeContextSlice';
import type { RegisterStaffRequest, RegisterStaffResponse } from './registerStaffTypes';
import type { AxiosError } from 'axios';
import { ROUTES } from '../../../routes/onboardingRouteConstants';

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
const getDefaultFacilityRole = (context: UserContext): { facilityId: number; roleCode: string } | null => {
  if (context.facility_roles.length === 0) {
    return null;
  }
  
  // Try to find primary facility first
  const primaryRole = context.facility_roles.find(role => role.is_primary_facility);
  if (primaryRole) {
    return {
      facilityId: primaryRole.facility_id,
      roleCode: primaryRole.role_code
    };
  }
  
  // Otherwise return the first role
  const firstRole = context.facility_roles[0];
  return {
    facilityId: firstRole.facility_id,
    roleCode: firstRole.role_code
  };
};

/**
 * Check if user has staff capability in the context
 */
const hasStaffCapability = (context: UserContext): boolean => {
  return Boolean(context.capabilities.staff);
};

  /**
   * Check if staff has facility assignments
   */
  /**
   * Check if user has facility assignments in the given context
   * @param context UserContext to check
   * @returns boolean indicating if user has facility assignments
   */
  const hasFacilityAssignments = (context: UserContext): boolean => {
    if (!context.capabilities.staff) {
      return false;
    }
    
    const staffCapability = context.capabilities.staff;
    return staffCapability.facilities?.length > 0 || false;
  };

/**
 * Get available capabilities from context
 */
const getAvailableCapabilities = (context: UserContext): string[] => {
  return Object.keys(context.capabilities);
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
        const staffName = 'Staff member';
        showToast(
          'success', 
          data.message || `${staffName} registered as staff successfully!`, 
          6000
        );
        
        // Fetch updated user context to include staff capabilities
        const updatedContext = await fetchUpdatedUserContext();
        
        // Update activeContext with staff capability
        dispatch(setUserContext(updatedContext));
        
        // Determine if user has staff capability now
        const hasStaffAccess = hasStaffCapability(updatedContext);
        
        if (hasStaffAccess) {
          // Switch to staff capability if not already in staff mode
          const capabilities = getAvailableCapabilities(updatedContext);
          if (capabilities.includes('staff')) {
            dispatch(switchCapability('staff'));
            
            // Check for facility access
            const hasFacilities = hasFacilityAssignments(updatedContext);
            
            if (hasFacilities) {
              // User has facility assignments
              const facilityCount = updatedContext.capabilities.staff?.facilities?.length || 0;
              showToast(
                'success',
                `Staff access granted! You have access to ${facilityCount} facility(s).`,
                5000
              );
              
              // Automatically select first facility role if configured
              if (autoSelectFacilityRole) {
                const defaultRole = getDefaultFacilityRole(updatedContext);
                if (defaultRole) {
                  dispatch(switchFacility(defaultRole.facilityId));
                  
                  const facilityName = updatedContext.capabilities.staff?.facilities?.find(
                    f => f.facility_id === defaultRole.facilityId
                  )?.facility_name || 'facility';
                  
                  showToast(
                    'info',
                    `Automatically selected ${facilityName} as your workspace.`,
                    4000
                  );
                }
              }
            } else {
              // Staff registered but no facilities yet
              showToast(
                'info',
                'Staff registration complete! You will need facility assignment to access professional tools.',
                6000
              );
            }
          }
        } else {
          // Staff registration succeeded but staff capability not in context
          showToast(
            'warning',
            'Staff registration completed, but staff access is not yet available. Please contact support.',
            7000
          );
        }
        
        // Call custom success handler if provided
        options.onSuccess?.(data);
        
        // Handle navigation
        if (autoNavigate) {
          setTimeout(() => {
            if (hasStaffAccess) {
              // Has staff access - navigate to appropriate destination
              if (hasFacilityAssignments(updatedContext)) {
                navigate(redirectTo);
                showToast(
                  'info',
                  'You can now access the staff portal with your assigned facilities.',
                  4000
                );
              } else {
                // No facility access yet
                navigate(ROUTES.PORTAL_SELECTOR);
                showToast(
                  'warning',
                  'Please contact your facility administrator for workspace assignment.',
                  6000
                );
              }
            } else {
              // No staff access - navigate to portal selector
              navigate(ROUTES.PORTAL_SELECTOR);
            }
          }, 1500);
        }
        
      } catch (contextError) {
        // Staff registered but context update failed
        console.error('Failed to update user context:', contextError);
        
        const errorMessage = contextError instanceof Error 
          ? contextError.message 
          : 'Failed to update staff portal access';
        
        dispatch(setContextError(errorMessage));
        
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
export const useBecomeStaff = (options?: Omit<UseRegisterStaffOptions, 'autoNavigate' | 'autoSelectFacilityRole' | 'redirectTo'>) => {
  return useRegisterStaff({
    autoNavigate: true,
    autoSelectFacilityRole: true,
    redirectTo: ROUTES.PORTAL_SELECTOR,
    onSuccess: (data) => {
      console.log('Successfully transitioned to staff role:', data);
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * Helper hook for administrators registering new staff members
 * Stays in admin mode without automatic navigation
 */
export const useRegisterStaffAsAdmin = (options?: Omit<UseRegisterStaffOptions, 'autoNavigate' | 'autoSelectFacilityRole'>) => {
  return useRegisterStaff({
    autoNavigate: false,
    autoSelectFacilityRole: false,
    onSuccess: (data) => {
      console.log('Staff member registered by admin:', data);
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * Helper hook for facility-specific staff registration
 * Automatically assigns the registered staff to a specific facility
 */
export const useRegisterStaffForFacility = (facilityId: number, options?: Omit<UseRegisterStaffOptions, 'autoNavigate' | 'autoSelectFacilityRole' | 'redirectTo'>) => {
  const mutation = useRegisterStaff({
    autoNavigate: true,
    autoSelectFacilityRole: true,
    redirectTo: ROUTES.STAFF_DASHBOARD,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  // Wrap the mutation to include facility ID in the request
  return {
    ...mutation,
    mutate: (data: Omit<RegisterStaffRequest, 'facility_id'>) => {
      return mutation.mutate({
        ...data,
        facility_id: facilityId,
      } as RegisterStaffRequest);
    },
    mutateAsync: (data: Omit<RegisterStaffRequest, 'facility_id'>) => {
      return mutation.mutateAsync({
        ...data,
        facility_id: facilityId,
      } as RegisterStaffRequest);
    },
  };
};

/**
 * Helper hook for registering staff with specific role
 */
export const useRegisterStaffWithRole = (roleCode: string, options?: UseRegisterStaffOptions) => {
  const mutation = useRegisterStaff(options);

  return {
    ...mutation,
    mutate: (data: Omit<RegisterStaffRequest, 'role_code'>) => {
      return mutation.mutate({
        ...data,
        role_code: roleCode,
      } as RegisterStaffRequest);
    },
    mutateAsync: (data: Omit<RegisterStaffRequest, 'role_code'>) => {
      return mutation.mutateAsync({
        ...data,
        role_code: roleCode,
      } as RegisterStaffRequest);
    },
  };
};

/**
 * Combined registration for staff with both facility and role
 */
export const useRegisterStaffForFacilityWithRole = (facilityId: number, roleCode: string, options?: Omit<UseRegisterStaffOptions, 'autoNavigate' | 'autoSelectFacilityRole' | 'redirectTo'>) => {
  const mutation = useRegisterStaff({
    autoNavigate: true,
    autoSelectFacilityRole: true,
    redirectTo: ROUTES.STAFF_DASHBOARD,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return {
    ...mutation,
    mutate: (data: Omit<RegisterStaffRequest, 'facility_id' | 'role_code'>) => {
      return mutation.mutate({
        ...data,
        facility_id: facilityId,
        role_code: roleCode,
      } as RegisterStaffRequest);
    },
    mutateAsync: (data: Omit<RegisterStaffRequest, 'facility_id' | 'role_code'>) => {
      return mutation.mutateAsync({
        ...data,
        facility_id: facilityId,
        role_code: roleCode,
      } as RegisterStaffRequest);
    },
  };
};