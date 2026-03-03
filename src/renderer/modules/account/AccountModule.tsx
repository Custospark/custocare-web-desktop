// AccountModule.tsx
/**
 * ============================================================================
 * ACCOUNT MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import { DoorOpen, MessageCircleMore, Settings } from 'lucide-react';
import { BaseModuleWorkspace } from '../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, ACCOUNT_ROUTES } from '../../app/routes/routeConstants';

const ACCOUNT_OPERATIONS = [
  { id: 'settings', label: 'Account Center', icon: <Settings className="w-4 h-4" /> },
  { id: 'messages', label: 'Message Center', icon: <MessageCircleMore className="w-4 h-4" /> },
  { id: 'invitations', label: 'Access & Invitations', icon: <DoorOpen className="w-4 h-4" /> },
];

const AccountModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Account"
      operations={ACCOUNT_OPERATIONS}
      basePath={ROUTES.ACCOUNT}
      defaultOperationPath={ACCOUNT_ROUTES.SETTINGS_PROFILE}
    />
  );
};

export default AccountModule;