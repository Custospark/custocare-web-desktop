import React, { useMemo } from 'react';

import { MessagesPollingContext } from './messagesPollingState';

interface MessagesPollingProviderProps {
  children: React.ReactNode;
}

export const MessagesPollingProvider: React.FC<MessagesPollingProviderProps> = ({ children }) => {
  const value = useMemo(() => true, []);
  return (
    <MessagesPollingContext.Provider value={value}>{children}</MessagesPollingContext.Provider>
  );
};
