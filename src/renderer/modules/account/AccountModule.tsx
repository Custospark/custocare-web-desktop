// AccountModule.tsx
/**
 * ============================================================================
 * ACCOUNT MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import { User, Shield, Mail, Palette, MessageSquare } from 'lucide-react';
import { BaseModuleWorkspace } from '../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, ACCOUNT_ROUTES } from '../../app/routes/routeConstants';

const ACCOUNT_OPERATIONS = [
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  { id: 'invitations', label: 'Invitations', icon: <Mail className="w-4 h-4" /> },
  { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
];

const AccountModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Account"
      operations={ACCOUNT_OPERATIONS}
      basePath={ROUTES.ACCOUNT}
      defaultOperationPath={ACCOUNT_ROUTES.PROFILE}
    />
  );
};

export default AccountModule;
