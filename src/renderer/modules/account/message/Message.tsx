// Message.tsx
/**
 * ============================================================================
 * MESSAGE MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import React from 'react';
import { Inbox, SendIcon, Notebook, Trash, MessageCircleMore } from 'lucide-react';
import { FaVirus } from 'react-icons/fa';
import { BaseActionWorkspace } from '../../../shared/components/workspace/BaseActionWorkspace';
import { ACCOUNT_ROUTES } from '../../../app/routes/routeConstants';

interface MessageProps {
  theme: 'light' | 'dark';
}

const Message: React.FC<MessageProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Messages"
      icon={<MessageCircleMore className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={ACCOUNT_ROUTES.MESSAGES_INBOX}
      actions={[
        { 
          key: 'inbox', 
          label: 'Inbox', 
          icon: <Inbox className="w-4 h-4" />, 
          to: ACCOUNT_ROUTES.MESSAGES_INBOX 
        },
        { 
          key: 'sent', 
          label: 'Sent', 
          icon: <SendIcon className="w-4 h-4" />, 
          to: ACCOUNT_ROUTES.MESSAGES_SENT 
        },
        { 
          key: 'draft', 
          label: 'Draft', 
          icon: <Notebook className="w-4 h-4" />, 
          to: ACCOUNT_ROUTES.MESSAGES_DRAFT 
        },
        { 
          key: 'trash', 
          label: 'Trash', 
          icon: <Trash className="w-4 h-4" />, 
          to: ACCOUNT_ROUTES.MESSAGES_TRASH 
        },
        { 
          key: 'spam', 
          label: 'Spam', 
          icon: <FaVirus className="w-4 h-4" />, 
          to: ACCOUNT_ROUTES.MESSAGES_SPAM 
        },
      ]}
    />
  );
};

export default Message;
