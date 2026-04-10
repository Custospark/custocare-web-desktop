/**
 * ============================================================================
 * ACCOUNT MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import { DoorOpen, MessageCircleMore, Settings, Sparkles } from 'lucide-react';
import { useSelector } from 'react-redux';
import { BaseModuleWorkspace } from '../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, ACCOUNT_ROUTES } from '../../app/routes/routeConstants';
import type { RootState } from '../../app/store/rootReducer';

const AccountModule = () => {
  // Get staff without facility status from Redux
  const isStaffWithoutFacility = useSelector(
    (state: RootState) => state.activeContext.isStaffWithoutFacility
  );

  // Base operations always available
  const baseOperations = [
    { id: 'settings', label: 'Account Center', icon: <Settings className="w-4 h-4" /> },
    { id: 'messages', label: 'Message Center', icon: <MessageCircleMore className="w-4 h-4" /> },
    { id: 'invitations', label: 'Access & Invitations', icon: <DoorOpen className="w-4 h-4" /> },
  ];

  // Welcome operation for staff without facility
  const welcomeOperation = {
    id: 'staff_without_facility_assignment',
    label: 'Welcome to Custocare',
    icon: <Sparkles className="w-4 h-4" />,
  };

  // Combine operations - add welcome tab for staff without facility
  const ACCOUNT_OPERATIONS = isStaffWithoutFacility
    ? [welcomeOperation, ...baseOperations]
    : baseOperations;

  // Determine default operation path
  const getDefaultOperationPath = () => {
    if (isStaffWithoutFacility) {
      return ACCOUNT_ROUTES.STAFF_WITHOUT_FACILITY || ROUTES.ACCOUNT;
    }
    return ACCOUNT_ROUTES.SETTINGS_PROFILE;
  };

  return (
    <BaseModuleWorkspace
      contextTitle="Account"
      operations={ACCOUNT_OPERATIONS}
      basePath={ROUTES.ACCOUNT}
      defaultOperationPath={getDefaultOperationPath()}
    />
  );
};

export default AccountModule;