import { useContext } from 'react';

import { MessagesPollingContext } from './messagesPollingState';

/** True while Message Center (inbox/sent/draft/trash/compose) is mounted. */
export const useMessagesModuleActive = (): boolean => useContext(MessagesPollingContext);
