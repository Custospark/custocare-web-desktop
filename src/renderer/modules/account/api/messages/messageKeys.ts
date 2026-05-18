import type { GetMessagesParams } from './MessageTypes';

export const messageKeys = {
  all: ['messages'] as const,

  lists: () => [...messageKeys.all, 'list'] as const,
  list: (userId: number | string, params: GetMessagesParams) =>
    [...messageKeys.lists(), userId, params] as const,

  stats: () => [...messageKeys.all, 'stats'] as const,
  statsByUser: (userId: number | string) => [...messageKeys.stats(), userId] as const,

  details: () => [...messageKeys.all, 'detail'] as const,
  detail: (userId: number | string, id: number) => [...messageKeys.details(), userId, id] as const,
};
