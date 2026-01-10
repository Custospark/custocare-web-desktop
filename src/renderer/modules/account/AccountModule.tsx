import React, { useState, useCallback } from 'react';
import { ContentLayout, type Operation } from '../../shared/components/content/ContentLayout';
import {
  User,
  Shield,
  Mail,
  Palette,
  MessageSquare,
} from 'lucide-react';

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
 * - Theme & preferences
 *
 * Architecture Highlights:
 * -----------------------
 * - Mirrors AdminModule & PatientModule patterns
 * - Stateless UI placeholders (div-based)
 * - RBAC-friendly operation IDs
 * - Scalable and replaceable with real components later
 *
 * Module Structure:
 * ----------------
 * 1. Profile
 * 2. Security
 * 3. Invitations
 * 4. Messages
 * 5. Appearance
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
    description: 'Pending and sent invitations',
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'System messages and notifications',
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
  /**
   * =========================================================================
   * REDUX STATE
   * =========================================================================
   */

//   const theme = useSelector((state: RootState) => state.ui.theme);

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
        return <div>Profile settings (placeholder)</div>;

      case 'security':
        return <div>Security & authentication (placeholder)</div>;

      case 'invitations':
        return <div>Invitations management (placeholder)</div>;

      case 'messages':
        return <div>Messages & notifications (placeholder)</div>;

      case 'appearance':
        return <div>Theme & appearance preferences (placeholder)</div>;

      default:
        return <div>Account workspace</div>;
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
    >
      {renderWorkspaceContent()}
    </ContentLayout>
  );
};

// Display name for React DevTools
AccountModule.displayName = 'AccountModule';

export default AccountModule;
