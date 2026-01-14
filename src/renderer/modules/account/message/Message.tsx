/**
 * ============================================================================
 * DISPENSING WORKSPACE COMPONENT
 * ============================================================================
 *
 * Internal, state-driven dispensing workflow for pharmacy operations.
 * No routing. No navigation. Conditional rendering only.
 *
 * This is a logic prototype — panels are placeholders and can be replaced later.
 */

import React, { useState } from 'react';
import {
  Pill,
  Inbox,
  SendIcon,
  Notebook,
  Trash,
} from 'lucide-react';
import { FaViruses } from 'react-icons/fa';

type MessageView =
  | 'inbox'
  | 'sent'
  | 'draft'
  | 'trash'
  | 'spam';

interface MessageProps {
  theme: 'light' | 'dark';
}

const Message: React.FC<MessageProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  const [activeView, setActiveView] =
    useState<MessageView>('inbox');

  const actionButtons: {
    key: MessageView;
    label: string;
    icon: React.ReactNode;
  }[] = [
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
      icon: <FaViruses className="w-4 h-4" />,
    },
  ];

  const renderActivePanel = () => {
    switch (activeView) {
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
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`rounded-xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Pill className="w-6 h-6" />
          My Messages
        </h2>

        {/* Action Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {actionButtons.map((action) => {
            const isActive = activeView === action.key;

            return (
              <button
                key={action.key}
                onClick={() => setActiveView(action.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {action.icon}
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Panel */}
      <div
        className={`rounded-xl p-6 border min-h-[300px] ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        {renderActivePanel()}
      </div>
    </div>
  );
};

export default Message;

/**
 * ============================================================================
 * PLACEHOLDER PANEL (TEMPORARY)
 * ============================================================================
 */

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500">
        This is a temporary placeholder.
        <br />
        Replace with the actual component when ready.
      </p>
    </div>
  );
};
