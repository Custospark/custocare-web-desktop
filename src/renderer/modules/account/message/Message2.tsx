/**
 * ============================================================================
 * INVENTORY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
Inbox,
  SendIcon,
  Notebook,
  Trash,
  MessageCircleMore,
} from 'lucide-react';
import { BaseActionWorkspace } from '../../../shared/components/workspace/BaseActionWorkspace';
import { FaVirus } from 'react-icons/fa';

type MessageAction =
   | 'inbox'
  | 'sent'
  | 'draft'
  | 'trash'
  | 'spam';

interface MessageProps {
  theme: 'light' | 'dark';
}

const Message: React.FC<MessageProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace<MessageAction>
      title="Messages"
      icon={<MessageCircleMore className="w-6 h-6" />}
      theme={theme}
      defaultAction="inbox"
      moduleId="patients"

      actions={[
     {
          key: 'inbox',
          label: 'Inbox',
          icon: <Inbox className="w-4 h-4" />,
        },
        {
          key: 'sent',
          label: 'Sent',
          icon: <SendIcon className="w-4 h-4" />,
        },
        {
          key: 'draft',
          label: 'Draft',
          icon: <Notebook className="w-4 h-4" />,
        },
        {
          key: 'trash',
          label: 'Trash',
          icon: <Trash className="w-4 h-4" />,
        },
        {
          key: 'spam',
          label: 'Spam',
          icon: <FaVirus className="w-4 h-4" />,
        },
      ]}
      renderAction={(action:MessageAction) => {
        switch (action) {
        case 'inbox':
        return <PlaceholderPanel title="New Messages" />;

        case 'sent':
            return <PlaceholderPanel title="Sent Messages" />;

        case 'draft':
            return <PlaceholderPanel title="Messages in draft" />;

        case 'trash':
            return <PlaceholderPanel title="Messages in trash" />;

        case 'spam':
        default:
            return <PlaceholderPanel title="Spam Messages." />;
        }
      }}
    />
  );
};

export default Message;

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">
      Temporary placeholder. Replace with real implementation.
    </p>
  </div>
);
