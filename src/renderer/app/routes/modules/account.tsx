import { Route, Navigate } from "react-router-dom";
import { 
  SuspenseWrapper, 
  WithThemeProp, 
  WithAuthProp,
  PlaceholderPanel,
  ProtectedThemeOutlet
} from "./shared/routeUtils";
import { ACCOUNT_ROUTES } from "../routeConstants";

// Lazy load components for better performance
import React from 'react';
import UserPreferences from "../../../modules/account/ui/Preferences/Prefrences";
import UserSecurity from "../../../modules/account/ui/security/Security";

// Lazy imports
const MyInvitations = React.lazy(() => import("../../../modules/account/ui/invitations/MyInvitations"));
const Message = React.lazy(() => import("../../../modules/account/ui/message/Message"));
const Settings = React.lazy(() => import("../../../modules/account/ui/settings/Settings"));
const UserProfile = React.lazy(() => import("../../../modules/account/ui/settings/profile/UserProfile"));

export const accountRoutes = [
  <Route key="account-base" element={<ProtectedThemeOutlet />}>
    {/* Invitations Route */}
    <Route
      key="account-invitations"
      path="invitations"
      element={
        <SuspenseWrapper variant="table">
          <MyInvitations />
        </SuspenseWrapper>
      }
    />,
    
    {/* Messages Routes */}
    <Route
      key="account-messages"
      path="messages"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={Message} />
        </SuspenseWrapper>
      }
    >
      <Route index element={<Navigate to={ACCOUNT_ROUTES.MESSAGES_INBOX} replace />} />
      <Route path="inbox" element={<PlaceholderPanel title="Inbox Messages" />} />
      <Route path="sent" element={<PlaceholderPanel title="Sent Messages" />} />
      <Route path="draft" element={<PlaceholderPanel title="Draft Messages" />} />
      <Route path="trash" element={<PlaceholderPanel title="Trash Messages" />} />
      <Route path="spam" element={<PlaceholderPanel title="Spam Messages" />} />
    </Route>,
    
    {/* Settings Routes */}
    <Route
      key="account-settings"
      path="settings"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={Settings} />
        </SuspenseWrapper>
      }
    >
      <Route index element={<Navigate to={ACCOUNT_ROUTES.SETTINGS_PROFILE} replace />} />
      
      {/* UserProfile - Using WithAuthProp to inject userId from auth slice */}
      <Route 
        path={ACCOUNT_ROUTES.SETTINGS_PROFILE} 
        element={
          <SuspenseWrapper variant="detail">
            <WithAuthProp 
              Component={UserProfile} 
            />
          </SuspenseWrapper>
        } 
      />       
      <Route 
        path={ACCOUNT_ROUTES.SETTINGS_PREFERENCES} 
        element={
          <SuspenseWrapper variant="detail">
            <WithAuthProp 
              Component={UserPreferences} 
            />
          </SuspenseWrapper>
        } 
      />       
      <Route 
        path={ACCOUNT_ROUTES.SETTINGS_SECURITY} 
        element={
          <SuspenseWrapper variant="detail">
            <WithAuthProp 
              Component={UserSecurity} 
            />
          </SuspenseWrapper>
        } 
      />       
          </Route>,
  </Route>
];