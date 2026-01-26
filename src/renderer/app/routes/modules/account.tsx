import { Route,Navigate} from "react-router-dom";
import { SuspenseWrapper } from "./routeUtils";
import MyInvitations from "../../../modules/account/invitations/MyInvitations";
import Profile from "../../../modules/account/profile/Profile";
import Security from "../../../modules/account/security/Security";
import { PlaceholderPanel } from "./routeUtils";
import { WithThemeProp } from "./routeUtils";
import { ACCOUNT_ROUTES } from "../routeConstants";
import Appearance from '../../../modules/account/apearance/Appearance';
import Message from "../../../modules/account/message/Message";
 export const accountRoutes = [
  <Route
    key="account-profile"
    path="profile"
    element={
      <SuspenseWrapper variant="table">
        <Profile />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="account-security"
    path="security"
    element={
      <SuspenseWrapper variant="table">
        <Security />
      </SuspenseWrapper>
    }
  />,
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
    key="account-appearance"
    path="appearance"
    element={
      <SuspenseWrapper variant="table">
        <Appearance />
      </SuspenseWrapper>
    }
  />,
];