/**
 * Account Module Routes Configuration
 * 
 * This file defines all routes related to user account management including:
 * - Invitations management
 * - Message/Inbox system
 * - User settings (profile, preferences, security)
 * 
 * All routes are protected and wrapped with necessary providers for theme,
 * authentication, and suspense loading states.
 */

import { Route, Navigate } from "react-router-dom";
import { 
  SuspenseWrapper, 
  WithThemeProp, 
  WithAuthProp,
  ProtectedThemeOutlet
} from "./shared/routeUtils";
import { ACCOUNT_ROUTES } from "../routeConstants";

// Lazy load components for better performance
import React from 'react';

// ============================================================================
// EAGER IMPORTS
// These components are imported eagerly as they are critical for initial load
// ============================================================================
import UserPreferences from "../../../modules/account/ui/Preferences/Prefrences";
import UserSecurity from "../../../modules/account/ui/security/Security";
import Inbox from "../../../modules/account/ui/message/Inbox";
import Sent from "../../../modules/account/ui/message/Sent";
import Draft from "../../../modules/account/ui/message/Draft";
import Trash from "../../../modules/account/ui/message/Trash";
import Spam from "../../../modules/account/ui/message/Spam";

// ============================================================================
// LAZY IMPORTS
// These components are loaded only when their routes are accessed
// ============================================================================
const MyInvitations = React.lazy(() => import("../../../modules/account/ui/invitations/MyInvitations"));
const Message = React.lazy(() => import("../../../modules/account/ui/message/Message"));
const Settings = React.lazy(() => import("../../../modules/account/ui/settings/Settings"));
const UserProfile = React.lazy(() => import("../../../modules/account/ui/settings/profile/UserProfile"));

// ============================================================================
// ACCOUNT ROUTES CONFIGURATION
// All routes are nested under the main account layout with theme protection
// ============================================================================
export const accountRoutes = [
  <Route 
    key="account-base" 
    element={<ProtectedThemeOutlet />}
  >
    {/* ========================================================================
        INVITATIONS SECTION
        Route: /account/invitations
        Purpose: Display user's pending and accepted invitations
        ======================================================================== */}
    <Route
      key="account-invitations"
      path="invitations"
      element={
        <SuspenseWrapper variant="table">
          <MyInvitations />
        </SuspenseWrapper>
      }
    />
    
    {/* ========================================================================
        MESSAGES/INBOX SECTION
        Base Route: /account/messages
        Purpose: Handle all messaging functionality with sub-routes for different 
                 message categories (inbox, sent, draft, trash, spam)
        ======================================================================== */}
    <Route
      key="account-messages"
      path="messages"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={Message} />
        </SuspenseWrapper>
      }
    >
      {/* Default redirect to inbox when accessing /messages */}
      <Route 
        index 
        element={<Navigate to={ACCOUNT_ROUTES.MESSAGES_INBOX} replace />} 
      />
      
      {/* Message Category Routes */}
      <Route 
        path={ACCOUNT_ROUTES.MESSAGES_INBOX}   
        element={
          <SuspenseWrapper variant="table">
            <WithThemeProp Component={Inbox} />
          </SuspenseWrapper>
        } 
      />
      
      <Route 
        path={ACCOUNT_ROUTES.MESSAGES_SENT}  
        element={
          <SuspenseWrapper variant="table">
            <WithThemeProp Component={Sent} />
          </SuspenseWrapper>
        } 
      />
      
      <Route 
        path={ACCOUNT_ROUTES.MESSAGES_DRAFT}   
        element={
          <SuspenseWrapper variant="table">
            <WithThemeProp Component={Draft} />
          </SuspenseWrapper>
        } 
      />
      
      <Route 
        path={ACCOUNT_ROUTES.MESSAGES_TRASH}   
        element={
          <SuspenseWrapper variant="table">
            <WithThemeProp Component={Trash} />
          </SuspenseWrapper>
        } 
      />
      
      <Route 
        path={ACCOUNT_ROUTES.MESSAGES_SPAM} 
        element={
          <SuspenseWrapper variant="table">
            <WithThemeProp Component={Spam} />
          </SuspenseWrapper>
        } 
      />
    </Route>
    
    {/* ========================================================================
        SETTINGS SECTION
        Base Route: /account/settings
        Purpose: Manage user account settings including profile, preferences,
                 and security configurations
        Note: Profile, preferences, and security routes use WithAuthProp to 
              inject userId from auth slice for data fetching
        ======================================================================== */}
    <Route
      key="account-settings"
      path="settings"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={Settings} />
        </SuspenseWrapper>
      }
    >
      {/* Default redirect to profile when accessing /settings */}
      <Route 
        index 
        element={<Navigate to={ACCOUNT_ROUTES.SETTINGS_PROFILE} replace />} 
      />
      
      {/* User Profile Settings - Requires authentication */}
      <Route 
        path={ACCOUNT_ROUTES.SETTINGS_PROFILE} 
        element={
          <SuspenseWrapper variant="detail">
            <WithAuthProp Component={UserProfile} />
          </SuspenseWrapper>
        } 
      />       
      
      {/* User Preferences Settings - Requires authentication */}
      <Route 
        path={ACCOUNT_ROUTES.SETTINGS_PREFERENCES} 
        element={
          <SuspenseWrapper variant="detail">
            <WithAuthProp Component={UserPreferences} />
          </SuspenseWrapper>
        } 
      />       
      
      {/* User Security Settings - Requires authentication */}
      <Route 
        path={ACCOUNT_ROUTES.SETTINGS_SECURITY} 
        element={
          <SuspenseWrapper variant="detail">
            <WithAuthProp Component={UserSecurity} />
          </SuspenseWrapper>
        } 
      />       
    </Route>
  </Route>
];

// ============================================================================
// USAGE NOTES:
// 
// 1. All routes are protected by ProtectedThemeOutlet which ensures:
//    - User is authenticated
//    - Theme context is properly provided
// 
// 2. SuspenseWrapper handles loading states with different variants:
//    - 'table' variant for list/table views
//    - 'detail' variant for detailed/single item views
// 
// 3. WithThemeProp injects theme-related props to components
// 
// 4. WithAuthProp injects authentication data (userId) to components
// 
// 5. Route paths are centralized in ACCOUNT_ROUTES constant for consistency
// ============================================================================