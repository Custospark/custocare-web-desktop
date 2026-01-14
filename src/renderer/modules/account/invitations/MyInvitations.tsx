/**
 * ============================================================================
 * MY INVITATIONS PAGE
 * ============================================================================
 * 
 * Main page component for staff to view and manage facility invitations.
 * Integrates InvitationList, InvitationCard, and InvitationActions components.
 * 
 * @page MyInvitations
 */

import React from 'react';
import { useAppSelector } from '../../../app/store/hooks/useApp';
import { InvitationList } from './InvitationList';
import type { StaffInvitation } from '../../administration/admin-module/api/team-management/types/staffInvitationTypes';
export const MyInvitations: React.FC = () => {
  // Get theme from Redux store
  const theme = useAppSelector(state => state.ui.theme);

  // Optional: Handle invitation selection for detailed view
  const handleInvitationSelect = (invitation: StaffInvitation): void => {
    console.log('Selected invitation:', invitation);
    // Implement detailed view logic here if needed
  };

  return (
    <div className="container mx-auto max-w-8xl">
      <InvitationList 
        theme={theme} 
        onInvitationSelect={handleInvitationSelect}
      />
    </div>
  );
};

export default MyInvitations;
