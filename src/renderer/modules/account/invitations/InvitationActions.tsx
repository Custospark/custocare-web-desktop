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
import { Check, X, Loader2} from 'lucide-react';
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
  disabled?: boolean;
  showLabels?: boolean;
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
  disabled = false,
  showLabels = true,
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
            'Invitation accepted, but facility access not detected. Please reload the application.',
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
  const isGlobalDisabled = disabled || isProcessing;

  /* ---------------------------- Cursor Utilities --------------------------- */

  const getCursorClass = (isActionDisabled: boolean = false) => {
    if (isGlobalDisabled || isActionDisabled) {
      return 'cursor-not-allowed';
    }
    return 'cursor-pointer hover:cursor-pointer active:cursor-pointer';
  };

  const getTooltipContent = (action: 'accept' | 'decline' | 'view') => {
    if (isGlobalDisabled) return 'Actions are currently disabled';
    
    if (isProcessing) {
      if (action === 'accept' && acceptMutation.isPending) return 'Accepting invitation...';
      if (action === 'decline' && declineMutation.isPending) return 'Declining invitation...';
      return 'Processing another action...';
    }

    switch (action) {
      case 'accept':
        return `Accept invitation from ${invitation.facility?.facility_name || 'this facility'}`;
      case 'decline':
        return `Decline invitation from ${invitation.facility?.facility_name || 'this facility'}`;
      case 'view':
        return 'View invitation details';
      default:
        return '';
    }
  };

  /* ----------------------------- Event Handlers --------------------------- */

  const handleAccept = useCallback(async (): Promise<void> => {
    if (isGlobalDisabled) return;

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
  }, [confirm, invitation, theme, acceptMutation, dispatch, isGlobalDisabled]);

  const handleDecline = useCallback(async (): Promise<void> => {
    if (isGlobalDisabled) return;

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
  }, [confirm, invitation, theme, declineMutation, isGlobalDisabled]);


  /* --------------------------- Button Styling ----------------------------- */

  const getButtonClasses = (
    type: 'accept' | 'decline' | 'view',
    isActionAvailable: boolean = true
  ) => {
    const isActionDisabled = !isActionAvailable || isGlobalDisabled;
    const baseClasses = [
      'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md',
      'text-xs font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:transform-none disabled:shadow-none',
      getCursorClass(isActionDisabled),
    ];

    const stateClasses = isActionDisabled
      ? [
          'opacity-50',
          'cursor-not-allowed',
          'hover:transform-none',
          'active:transform-none',
        ]
      : [
          'hover:scale-[1.02]',
          'active:scale-[0.98]',
          'hover:shadow-md',
          'focus:shadow-lg',
        ];

    const typeClasses = {
      accept: [
        'bg-green-600 hover:bg-green-700 active:bg-green-800',
        'text-white shadow-sm',
        'focus:ring-green-500 focus:ring-offset-2',
        isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
      ],
      decline: [
        'bg-red-600 hover:bg-red-700 active:bg-red-800',
        'text-white shadow-sm',
        'focus:ring-red-500 focus:ring-offset-2',
        isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
      ],
      view: [
        isDark
          ? 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-300'
          : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700',
        'shadow-sm',
        'focus:ring-gray-500 focus:ring-offset-2',
        isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
      ],
    };

    return [...baseClasses, ...stateClasses, ...typeClasses[type]].join(' ');
  };

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
        {/* Decline Button */}
      {(
        <button
          onClick={handleDecline}
          disabled={isGlobalDisabled}
          className={getButtonClasses('decline', invitation.can_be_declined)}
          aria-label={getTooltipContent('decline')}
          title={getTooltipContent('decline')}
          aria-busy={declineMutation.isPending}
          aria-disabled={isGlobalDisabled}
        >
          {declineMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span className={showLabels ? 'hidden sm:inline' : 'sr-only'}>
                Declining...
              </span>
            </>
          ) : (
            <>
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              <span className={showLabels ? 'hidden sm:inline' : 'sr-only'}>
                Decline
              </span>
            </>
          )}
        </button>
      )} 

      {/* Accept Button */}
      {invitation.can_be_accepted && (
        <button
          onClick={handleAccept}
          disabled={isGlobalDisabled}
          className={getButtonClasses('accept', invitation.can_be_accepted)}
          aria-label={getTooltipContent('accept')}
          title={getTooltipContent('accept')}
          aria-busy={acceptMutation.isPending}
          aria-disabled={isGlobalDisabled}
        >
          {acceptMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span className={showLabels ? 'hidden sm:inline' : 'sr-only'}>
                Accepting...
              </span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span className={showLabels ? 'hidden sm:inline' : 'sr-only'}>
                Accept
              </span>
            </>
          )}
        </button>
      )}

      

      {/* Status Indicator (for debugging/visual feedback) */}
      {(acceptMutation.isPending || declineMutation.isPending) && (
        <div 
          className={`
            absolute inset-0 rounded-md pointer-events-none
            bg-gradient-to-r from-transparent via-white/10 to-transparent
            animate-pulse-subtle
            ${isDark ? 'mix-blend-lighten' : 'mix-blend-multiply'}
          `}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default InvitationActions;