/**
 * ============================================================================
 * INVITATION ACTIONS COMPONENT - WITH CONTEXT SYNC & REDIRECT
 * ============================================================================
 * 
 * Provides action buttons for accepting, declining, and viewing invitations.
 * Handles loading states, confirmation dialogs, and mutation callbacks.
 * Automatically resolves user context after accepting invitation and redirects
 * to portal selector.
 * 
 * @component InvitationActions
 * @description Type-safe action buttons with enterprise UX patterns
 */

import React, { useCallback } from 'react';
import { Check, X, Loader2, Eye } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { 
  useAcceptInvitation, 
  useDeclineInvitation,
  staffInvitationKeys
} from '../../administration/admin-module/api/team-management/queries/useStaffInvitationQueries';
import type { StaffInvitation } from '../../administration/admin-module/api/team-management/types/staffInvitationTypes';
import { useToast } from '../../../app/store/contexts/toast/useToast';
import { useAppDispatch } from '../../../app/store/hooks/useApp';
import { 
  setUserContext,
  setLoading as setContextLoading,
  setError as setContextError,
  type UserContext,
} from '../../../app/store/slices/activeContextSlice';
import { axiosInstance } from '../../../../renderer/app/api/axiosConfig';
import { ROUTES } from '../../administration/onboarding/routes/onboardingRouteConstants';


/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface InvitationActionsProps {
  invitation: StaffInvitation;
  theme: 'light' | 'dark';
  onActionComplete?: () => void;
  onViewDetails?: (invitation: StaffInvitation) => void;
  layout?: 'horizontal' | 'vertical';
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

/**
 * Fetch updated user context after accepting invitation
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

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const InvitationActions: React.FC<InvitationActionsProps> = ({
  invitation,
  theme,
  onActionComplete,
  onViewDetails,
  layout = 'horizontal',
}) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  /* ----------------------------- Accept Mutation ---------------------------- */

  const acceptMutation = useAcceptInvitation({
    onSuccess: async () => {
      try {
        // Set loading state for context update
        dispatch(setContextLoading(true));

        // Fetch updated user context to include the new facility
        const updatedContext = await fetchUpdatedUserContext();

        // Update activeContext with the new facility information
        dispatch(setUserContext(updatedContext));

        // Invalidate all relevant queries
        queryClient.invalidateQueries({ queryKey: staffInvitationKeys.all });
        queryClient.invalidateQueries({ queryKey: staffInvitationKeys.myPending() });

        // Call callback if provided
        onActionComplete?.();

        // Navigate to portal selector
        if (updatedContext.facility_roles.length > 0) {
          // User now has facility access - navigate to portal selector
          navigate(ROUTES.PORTAL_SELECTOR);
        } else {
          // This shouldn't happen, but handle gracefully
          showToast(
            'warning',
            'Invitation accepted, but facility access not detected. Please reload the Application',
            7000
          );
        }

      } catch (contextError) {
        // Invitation accepted but context update failed
        console.error('Failed to update user context:', contextError);
        
        dispatch(setContextError(
          contextError instanceof Error 
            ? contextError.message 
            : 'Failed to update workspace context'
        ));

        // Still show success for invitation acceptance
        showToast(
          'success',
          'Invitation accepted!',
          7000
        );

        // Invalidate queries even if context update failed
        queryClient.invalidateQueries({ queryKey: staffInvitationKeys.all });
        queryClient.invalidateQueries({ queryKey: staffInvitationKeys.myPending() });
        onActionComplete?.();

        // Navigate to portal selector anyway
        navigate(ROUTES.PORTAL_SELECTOR);
        
      } finally {
        dispatch(setContextLoading(false));
      }
    },
    onError: (error) => {
      console.error('Accept invitation error:', error);
      
      // Handle API errors
      const apiMessage = error.response?.data?.message || 
                        error.message || 
                        'Failed to accept invitation.';
      
      // Process validation errors if present
      let errorDetails = '';
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
    },
  });

  /* ---------------------------- Decline Mutation --------------------------- */

  const declineMutation = useDeclineInvitation({
    onSuccess: () => {
      // Show success toast--handled by the actual query hook. 
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: staffInvitationKeys.all });
      queryClient.invalidateQueries({ queryKey: staffInvitationKeys.myPending() });
      
      // Call callback if provided
      onActionComplete?.();
    },
    onError: (error) => {
      console.error('Decline invitation error:', error);
      
      // Handle API errors
      const apiMessage = error.response?.data?.message || 
                        error.message || 
                        'Failed to decline invitation.';
      
      // Process validation errors if present
      let errorDetails = '';
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
    },
  });

  const isProcessing = acceptMutation.isPending || declineMutation.isPending;

  /* ----------------------------- Event Handlers --------------------------- */

  const handleAccept = useCallback(async (): Promise<void> => {
    try {
      const confirmed = await confirm({
        title: 'Accept Invitation',
        message: `Are you sure you want to accept the invitation from ${invitation.facility?.facility_name || 'this facility'}? You will be granted access to their system with the role of ${invitation.role?.code || invitation.role}.`,
        confirmText: 'Accept Invitation',
        cancelText: 'Cancel',
        variant: 'info',
        theme,
      });

      if (!confirmed) return;

      // Set loading state for context
      dispatch(setContextLoading(true));
      
      acceptMutation.mutate({ id: invitation.id });
    } catch (error) {
      console.error('Error in handleAccept:', error);
      dispatch(setContextLoading(false));
    }
  }, [confirm, invitation, theme, acceptMutation, dispatch]);

  const handleDecline = useCallback(async (): Promise<void> => {
    try {
      const confirmed = await confirm({
        title: 'Decline Invitation',
        message: `Are you sure you want to decline the invitation from ${invitation.facility?.facility_name || 'this facility'}? This action cannot be undone.`,
        confirmText: 'Decline Invitation',
        cancelText: 'Cancel',
        variant: 'danger',
        theme,
      });

      if (!confirmed) return;

      declineMutation.mutate({ id: invitation.id });
    } catch (error) {
      console.error('Error in handleDecline:', error);
    }
  }, [confirm, invitation, theme, declineMutation]);

  const handleViewDetails = useCallback((): void => {
    if (onViewDetails) {
      onViewDetails(invitation);
    }
  }, [onViewDetails, invitation]);

  /* --------------------------- Conditional Rendering ---------------------- */

  // Don't show actions if invitation cannot be accepted or declined
  const hasActions = invitation.can_be_accepted || invitation.can_be_declined || onViewDetails;
  
  if (!hasActions) {
    return null;
  }

  const containerClasses = layout === 'horizontal' 
    ? 'flex items-center gap-1.5' 
    : 'flex flex-col gap-1.5';

  /* ------------------------------- Render --------------------------------- */

  return (
    <div className={containerClasses}>
      {/* Accept Button */}
      {invitation.can_be_accepted && (
        <button
          onClick={handleAccept}
          disabled={isProcessing}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            isProcessing
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-[1.02] active:scale-[0.98]'
          } bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          aria-label="Accept invitation"
          title="Accept this invitation"
        >
          {acceptMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Accepting...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Accept</span>
            </>
          )}
        </button>
      )}

      {/* Decline Button */}
      {(
        <button
          onClick={handleDecline}
          disabled={isProcessing}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            isProcessing
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-[1.02] active:scale-[0.98]'
          } bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          aria-label="Decline invitation"
          title="Decline this invitation"
        >
          {declineMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Declining...</span>
            </>
          ) : (
            <>
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Decline</span>
            </>
          )}
        </button>
      )}

      {/* View Details Button (Optional) */}
      {onViewDetails && (
        <button
          onClick={handleViewDetails}
          disabled={isProcessing}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            isProcessing
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-[1.02] active:scale-[0.98]'
          } ${
            isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          } shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          aria-label="View invitation details"
          title="View invitation details"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Details</span>
        </button>
      )}
    </div>
  );
};

export default InvitationActions;