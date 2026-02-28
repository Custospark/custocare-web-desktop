import { Route, Navigate } from "react-router-dom";
import { SuspenseWrapper } from "./shared/routeUtils";
import MyInvitations from "../../../modules/account/ui/invitations/MyInvitations";
import { PlaceholderPanel } from "./shared/routeUtils";
import { WithThemeProp } from "./shared/routeUtils";
import { ACCOUNT_ROUTES } from "../routeConstants";
import Message from "../../../modules/account/ui/message/Message";
import Settings from "../../../modules/account/ui/settings/Settings";
export const accountRoutes = [
  <Route
    key="account-invitations"
    path="invitations"
    element={
      <SuspenseWrapper variant="table">
        <MyInvitations />
      </SuspenseWrapper>
    }
  />,
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
    <Route path="profile" element={<PlaceholderPanel title="Profile Settings" />} />
    <Route path="security" element={<PlaceholderPanel title="Security Settings" />} />
    <Route path="preferences" element={<PlaceholderPanel title="Preferences" />} />
  </Route>,
];