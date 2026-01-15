import React, { useState, useCallback } from 'react';
import { ContentLayout, type Operation } from '../../shared/components/content/ContentLayout';
import {
  User,
  Shield,
  Mail,
  Palette,
  MessageSquare,
} from 'lucide-react';

import Profile from './profile/Profile';
import Security from './security/Security';
import MyInvitations from './invitations/MyInvitations';
import Message from './message/Message';
import Appearance from './apearance/Appearance';
import { useAppSelector } from '../../app/store/hooks/useApp';

/**
 * ============================================================================
 * ACCOUNT MODULE - MAIN INTEGRATION COMPONENT
 * ============================================================================
 *
 * Purpose:
 * --------
 * Centralized user account workspace for managing:
 * - Profile information
 * - Security & authentication
 * - Invitations
 * - Messages & notifications
 * - Appearance & preferences
 *
 * Architecture Highlights:
 * -----------------------
 * - Mirrors AdminModule integration pattern
 * - Stateless workspace container
 * - RBAC-friendly operation IDs
 * - Easily extendable with backend data
 */

/* ============================================================================
   OPERATIONS CONFIGURATION
============================================================================ */

const ACCOUNT_OPERATIONS: Operation[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="w-4 h-4" />,
    description: 'Manage personal information',
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield className="w-4 h-4" />,
    description: 'Passwords, sessions, and authentication',
  },
  {
    id: 'invitations',
    label: 'Invitations',
    icon: <Mail className="w-4 h-4" />,
    description: 'Manage staff and workspace invitations',
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'System notifications and messages',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: <Palette className="w-4 h-4" />,
    description: 'Theme and display preferences',
  },
];



/* ============================================================================
   TYPES
============================================================================ */

export type AccountOperationId =
  | 'profile'
  | 'security'
  | 'invitations'
  | 'messages'
  | 'appearance';

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export const AccountModule: React.FC = () => {

   const theme = useAppSelector(state => state.ui.theme);
 

  /**
   * =========================================================================
   * LOCAL STATE
   * =========================================================================
   */

  const [activeOperation, setActiveOperation] =
    useState<AccountOperationId>('profile');

  /**
   * =========================================================================
   * EVENT HANDLERS
   * =========================================================================
   */

  const handleOperationChange = useCallback((operationId: string) => {
    setActiveOperation(operationId as AccountOperationId);
  }, []);

  /**
   * =========================================================================
   * WORKSPACE CONTENT RENDERER
   * =========================================================================
   */

  const renderWorkspaceContent = () => {
    switch (activeOperation) {
      case 'profile':
        return <Profile />;

      case 'security':
        return <Security />;

      case 'invitations':
        return <MyInvitations />;

      case 'messages':
        return <Message theme={theme}/>;

      case 'appearance':
        return <Appearance />;

      default:
        return <Profile />;
    }
  };

  /**
   * =========================================================================
   * MAIN RENDER
   * =========================================================================
   */

  return (
    <ContentLayout
      operations={ACCOUNT_OPERATIONS}
      activeOperation={activeOperation}
      onOperationChange={handleOperationChange}
      defaultOperation="profile"
      contextTitle="Account"
    >
      {renderWorkspaceContent()}
    </ContentLayout>
  );
};

AccountModule.displayName = 'AccountModule';
export default AccountModule;
