// AccountModule.tsx
/**
 * ============================================================================
 * ACCOUNT MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import { Mail, MessageSquare, Settings } from 'lucide-react';
import { BaseModuleWorkspace } from '../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, ACCOUNT_ROUTES } from '../../app/routes/routeConstants';

const ACCOUNT_OPERATIONS = [
  { id: 'invitations', label: 'Access & Invitations', icon: <Mail className="w-4 h-4" /> },
  { id: 'messages', label: 'Communication Center', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'settings', label: 'Account Administration', icon: <Settings className="w-4 h-4" /> },
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