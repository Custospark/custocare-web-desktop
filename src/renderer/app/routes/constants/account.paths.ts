import { ROUTES } from "./shared.paths"; 
export const ACCOUNT_ROUTES = {
  ROOT: ROUTES.ACCOUNT,
  SECURITY: `${ROUTES.ACCOUNT}/security`,
  INVITATIONS: `${ROUTES.ACCOUNT}/invitations`,
  MESSAGES: `${ROUTES.ACCOUNT}/messages`,

  // Messages nested actions
  MESSAGES_INBOX: `${ROUTES.ACCOUNT}/messages/inbox`,
  MESSAGES_SENT: `${ROUTES.ACCOUNT}/messages/sent`,
  MESSAGES_DRAFT: `${ROUTES.ACCOUNT}/messages/draft`,
  MESSAGES_TRASH: `${ROUTES.ACCOUNT}/messages/trash`,
  MESSAGES_COMPOSE: `${ROUTES.ACCOUNT}/messages/compose`,

  // Settings routes
  SETTINGS_PROFILE: `${ROUTES.ACCOUNT}/settings/profile`,
  SETTINGS_SECURITY: `${ROUTES.ACCOUNT}/settings/security`,
  SETTINGS_PREFERENCES: `${ROUTES.ACCOUNT}/settings/preferences`,
} as const;