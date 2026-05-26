export const messageContactKeys = {
  all: ['message-contacts'] as const,
  lists: () => [...messageContactKeys.all, 'list'] as const,
  list: (filters?: { search?: string; page?: number; per_page?: number }) =>
    [...messageContactKeys.lists(), filters ?? {}] as const,
  details: () => [...messageContactKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...messageContactKeys.details(), id] as const,
};
