  import { ROUTES } from "./shared.paths"; 
  export const ACCOUNT_ROUTES = {
    ROOT: ROUTES.ACCOUNT,
    PROFILE: `${ROUTES.ACCOUNT}/profile`,
    SECURITY: `${ROUTES.ACCOUNT}/security`,
    INVITATIONS: `${ROUTES.ACCOUNT}/invitations`,
    MESSAGES: `${ROUTES.ACCOUNT}/messages`,
    APPEARANCE: `${ROUTES.ACCOUNT}/appearance`,

    // Messages nested actions
    MESSAGES_INBOX: `${ROUTES.ACCOUNT}/messages/inbox`,
    MESSAGES_SENT: `${ROUTES.ACCOUNT}/messages/sent`,
    MESSAGES_DRAFT: `${ROUTES.ACCOUNT}/messages/draft`,
    MESSAGES_TRASH: `${ROUTES.ACCOUNT}/messages/trash`,
    MESSAGES_SPAM: `${ROUTES.ACCOUNT}/messages/spam`,
  } as const;