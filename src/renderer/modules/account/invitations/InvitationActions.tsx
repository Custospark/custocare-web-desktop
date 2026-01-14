/**
 * ============================================================================
 * INVITATION ACTIONS COMPONENT
 * ============================================================================
 * 
 * Provides action buttons for accepting, declining, and viewing invitations.
 * Handles loading states, confirmation dialogs, and mutation callbacks.
 * 
 * @component InvitationActions
 * @description Type-safe action buttons with enterprise UX patterns
 */

import React, { useCallback } from 'react';
import { Check, X, Eye, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { 
  useAcceptInvitation, 
  useDeclineInvitation,
  staffInvitationKeys
} from '../../administration/admin-module/api/team-management/queries/useStaffInvitationQueries';
import type { StaffInvitation } from '../../administration/admin-module/api/team-management/types/staffInvitationTypes';

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

  /* ------------------------------- Mutations ------------------------------ */

  const acceptMutation = useAcceptInvitation({
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: staffInvitationKeys.all });
      queryClient.invalidateQueries({ queryKey: staffInvitationKeys.myPending() });
      
      // Call callback if provided
      onActionComplete?.();
    },
    onError: (error) => {
      console.error('Accept invitation error:', error);
    },
  });

  const declineMutation = useDeclineInvitation({
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: staffInvitationKeys.all });
      queryClient.invalidateQueries({ queryKey: staffInvitationKeys.myPending() });
      
      // Call callback if provided
      onActionComplete?.();
    },
    onError: (error) => {
      console.error('Decline invitation error:', error);
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

      acceptMutation.mutate({ id: invitation.id });
    } catch (error) {
      console.error('Error in handleAccept:', error);
    }
  }, [confirm, invitation, theme, acceptMutation]);

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
    ? 'flex items-center gap-2' 
    : 'flex flex-col gap-2';

  /* ------------------------------- Render --------------------------------- */

  return (
    <div className={containerClasses}>
      {/* Accept Button */}
      {invitation.can_be_accepted && (
        <button
          onClick={handleAccept}
          disabled={isProcessing}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            isProcessing
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-[1.02] active:scale-[0.98]'
          } bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          aria-label="Accept invitation"
        >
          {acceptMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Accepting...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Accept</span>
            </>
          )}
        </button>
      )}

      {/* Decline Button */}
      {
      // invitation.can_be_declined && 
      (
        <button
          onClick={handleDecline}
          disabled={isProcessing}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            isProcessing
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-[1.02] active:scale-[0.98]'
          } bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          aria-label="Decline invitation"
        >
          {declineMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Declining...</span>
            </>
          ) : (
            <>
              <X className="w-4 h-4" />
              <span>Decline</span>
            </>
          )}
        </button>
      )}

      {/* View Details Button (Optional) */}
      {
      // onViewDetails &&
       (
        <button
          onClick={handleViewDetails}
          disabled={isProcessing}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            isProcessing
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-[1.02] active:scale-[0.98]'
          } ${
            isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          } shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          aria-label="View invitation details"
        >
          <Eye className="w-4 h-4" />
          <span className="sr-only md:not-sr-only">Details</span>
        </button>
      )}
    </div>
  );
};

export default InvitationActions;
