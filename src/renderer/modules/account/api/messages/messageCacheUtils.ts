import type { QueryClient, QueryKey } from '@tanstack/react-query';

import { messageKeys } from './messageKeys';
import type {
  GetMessagesResponse,
  MessageFolder,
  MessageFolderStats,
  MessageStateWithMessage,
  ShowMessageResponse,
} from './MessageTypes';

export type MessageCacheSnapshot = {
  previousLists: [QueryKey, GetMessagesResponse | undefined][];
  previousStats?: MessageFolderStats;
  previousDetails: [QueryKey, ShowMessageResponse | undefined][];
};

export const snapshotMessageCaches = (
  queryClient: QueryClient,
  userId: number | string
): MessageCacheSnapshot => ({
  previousLists: queryClient.getQueriesData<GetMessagesResponse>({ queryKey: messageKeys.lists() }),
  previousStats: queryClient.getQueryData<MessageFolderStats>(messageKeys.statsByUser(userId)),
  previousDetails: queryClient.getQueriesData<ShowMessageResponse>({ queryKey: messageKeys.details() }),
});

export const restoreMessageCachesWithUser = (
  queryClient: QueryClient,
  userId: number | string,
  snapshot: MessageCacheSnapshot
): void => {
  for (const [key, data] of snapshot.previousLists) {
    queryClient.setQueryData(key, data);
  }
  if (snapshot.previousStats !== undefined) {
    queryClient.setQueryData(messageKeys.statsByUser(userId), snapshot.previousStats);
  }
  for (const [key, data] of snapshot.previousDetails) {
    queryClient.setQueryData(key, data);
  }
};

const findMessageInLists = (
  queryClient: QueryClient,
  messageId: number
): MessageStateWithMessage | undefined => {
  const entries = queryClient.getQueriesData<GetMessagesResponse>({ queryKey: messageKeys.lists() });
  for (const [, data] of entries) {
    const hit = data?.data?.find((row) => row.message?.id === messageId);
    if (hit) return hit;
  }
  return undefined;
};

export const patchMessageInAllLists = (
  queryClient: QueryClient,
  messageId: number,
  patch: (row: MessageStateWithMessage) => MessageStateWithMessage
): void => {
  queryClient.setQueriesData<GetMessagesResponse>({ queryKey: messageKeys.lists() }, (old) => {
    if (!old?.data?.length) return old;
    let changed = false;
    const data = old.data.map((row) => {
      if (row.message?.id !== messageId) return row;
      changed = true;
      return patch(row);
    });
    return changed ? { ...old, data } : old;
  });
};

export const removeMessageFromAllLists = (queryClient: QueryClient, messageId: number): void => {
  queryClient.setQueriesData<GetMessagesResponse>({ queryKey: messageKeys.lists() }, (old) => {
    if (!old?.data?.length) return old;
    const data = old.data.filter((row) => row.message?.id !== messageId);
    if (data.length === old.data.length) return old;
    return {
      ...old,
      data,
      total: Math.max(0, (old.total ?? data.length) - 1),
    };
  });
};

export const adjustFolderStats = (
  queryClient: QueryClient,
  userId: number | string,
  adjustments: Array<{ folder: MessageFolder; totalDelta?: number; unreadDelta?: number }>
): void => {
  queryClient.setQueryData<MessageFolderStats>(messageKeys.statsByUser(userId), (old) => {
    if (!old) return old;
    const next = { ...old } as MessageFolderStats;
    for (const { folder, totalDelta = 0, unreadDelta = 0 } of adjustments) {
      const current = next[folder] ?? { total: 0, unread: 0 };
      next[folder] = {
        total: Math.max(0, current.total + totalDelta),
        unread: Math.max(0, current.unread + unreadDelta),
      };
    }
    return next;
  });
};

export const patchMessageDetail = (
  queryClient: QueryClient,
  userId: number | string,
  messageId: number,
  patch: (current: ShowMessageResponse) => ShowMessageResponse
): void => {
  const key = messageKeys.detail(userId, messageId);
  const current = queryClient.getQueryData<ShowMessageResponse>(key);
  if (current) {
    queryClient.setQueryData(key, patch(current));
  }
};

export const getMessageRowForOptimistic = (
  queryClient: QueryClient,
  messageId: number
): MessageStateWithMessage | undefined => findMessageInLists(queryClient, messageId);
