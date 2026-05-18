// Message.tsx
/**
 * ============================================================================
 * MESSAGE MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import React from 'react';
import { Inbox, SendIcon, Notebook, Trash, MessageCircleMore, Edit3 } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { ACCOUNT_ROUTES } from '../../../../app/routes/routeConstants';
import { MessagesPollingProvider } from '../../api/messages/MessagesPollingProvider';

/** Navigation targets for Message Center tabs (Account or embedded, e.g. Patient Portal notifications). */
export type MessageCenterRoutes = {
  inbox: string;
  sent: string;
  draft: string;
  trash: string;
  compose: string;
};

const DEFAULT_MESSAGE_ROUTES: MessageCenterRoutes = {
  inbox: ACCOUNT_ROUTES.MESSAGES_INBOX,
  sent: ACCOUNT_ROUTES.MESSAGES_SENT,
  draft: ACCOUNT_ROUTES.MESSAGES_DRAFT,
  trash: ACCOUNT_ROUTES.MESSAGES_TRASH,
  compose: ACCOUNT_ROUTES.MESSAGES_COMPOSE,
};

interface MessageProps {
  theme: 'light' | 'dark';
  /** When set, tabs navigate under these URLs (e.g. Patient Portal `/…/notifications/…`). */
  messageRoutes?: MessageCenterRoutes;
}

const Message: React.FC<MessageProps> = ({ theme, messageRoutes }) => {
  const r = messageRoutes ?? DEFAULT_MESSAGE_ROUTES;
  return (
    <MessagesPollingProvider>
    <BaseActionWorkspace
      title="Message Center"
      icon={<MessageCircleMore className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={r.inbox}
      outletContextExtras={messageRoutes ? { messageInboxPath: r.inbox } : undefined}
      actions={[
        { 
          key: 'compose', 
          label: 'Compose', 
          icon: <Edit3 className="w-4 h-4" />, 
          to: r.compose 
        },
        { 
          key: 'inbox', 
          label: 'Inbox', 
          icon: <Inbox className="w-4 h-4" />, 
          to: r.inbox 
        },
        { 
          key: 'sent', 
          label: 'Sent', 
          icon: <SendIcon className="w-4 h-4" />, 
          to: r.sent 
        },
        { 
          key: 'draft', 
          label: 'Draft', 
          icon: <Notebook className="w-4 h-4" />, 
          to: r.draft 
        },
        { 
          key: 'trash', 
          label: 'Trash', 
          icon: <Trash className="w-4 h-4" />, 
          to: r.trash 
        },
      ]}
    />
    </MessagesPollingProvider>
  );
};

export default Message;