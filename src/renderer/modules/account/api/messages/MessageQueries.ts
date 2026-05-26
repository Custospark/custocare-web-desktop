/**
 * ============================================================================
 * MESSAGE MODULE REACT QUERY HOOKS
 * ============================================================================
 *
 * Endpoints (baseURL = API_BASE_URL):
 *   GET    /messages
 *   GET    /messages/stats
 *   POST   /messages
 *   POST   /messages/bulk
 *   DELETE /messages/trash/empty
 *
 *   GET    /messages/{id}
 *   PUT    /messages/{id}
 *   DELETE /messages/{id}
 *
 *   POST   /messages/{id}/send
 *   POST   /messages/{id}/restore
 *   DELETE /messages/{id}/permanent
 *
 *   PATCH  /messages/{id}/read
 *   PATCH  /messages/{id}/unread
 *   PATCH  /messages/{id}/star
 *   PATCH  /messages/{id}/archive
 *   PATCH  /messages/{id}/unarchive
 *
 *   POST   /messages/{id}/labels
 *   DELETE /messages/{id}/labels/{label}
 *
 *   POST   /messages/{id}/attachments
 *   DELETE /messages/attachments/{attachmentId}
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { axiosInstance } from '../../../../app/api/axiosConfig';
import { selectUser } from '../../../../app/store/slices/authSlice';
import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { useToast } from '../../../../app/store/contexts/toast/useToast';

import type {
  ApiErrorResponse,
  MutationCallbacks,
  GetMessagesParams,
  GetMessagesResponse,
  MessageFolderStats,
  StoreMessageRequest,
  StoreMessageResponse,
  ShowMessageResponse,
  UpdateMessageRequest,
  UpdateMessageResponse,
  TrashMessageResponse,
  SendDraftResponse,
  RestoreMessageResponse,
  PermanentDeleteResponse,
  ReadStateResponse,
  ArchiveStateResponse,
  StarToggleResponse,
  AddLabelRequest,
  LabelActionResponse,
  UploadAttachmentResponse,
  RemoveAttachmentResponse,
  BulkActionRequest,
  BulkActionResponse,
  EmptyTrashResponse,
} from './MessageTypes';

import { formatValidationErrors, extractErrorMessage } from '../settings/preferences/PreferencesQueries';
import { useMessagesModuleActive } from './useMessagesModuleActive';
import { messageKeys } from './messageKeys';
import {
  adjustFolderStats,
  getMessageRowForOptimistic,
  patchMessageDetail,
  patchMessageInAllLists,
  removeMessageFromAllLists,
  restoreMessageCachesWithUser,
  snapshotMessageCaches,
  type MessageCacheSnapshot,
} from './messageCacheUtils';

export { messageKeys };

/* -------------------------------------------------------------------------- */
/*                            Cache / Realtime Policy                          */
/* -------------------------------------------------------------------------- */

/** Option A: fetch once, slow backup poll, optimistic mutations with rollback. */
const MESSAGE_GC_TIME_MS = 30 * 60 * 1000;
const MESSAGE_LIST_STALE_MS = 5 * 60 * 1000;
const MESSAGE_STATS_STALE_MS = 60 * 1000;
const MESSAGE_STATS_POLL_MS = 60_000;
const MESSAGE_LIST_POLL_MS = 120_000;

/* -------------------------------------------------------------------------- */
/*                                  Auth Helper                                */
/* -------------------------------------------------------------------------- */

/** Resolved user id for query keys; queries stay disabled until id exists (no throw during render). */
const useOptionalAuthUserId = (): number | string | undefined => {
  const user = useAppSelector(selectUser);
  return user?.id;
};

/* -------------------------------------------------------------------------- */
/*                             Query: Folder Listing                           */
/* -------------------------------------------------------------------------- */

export const useGetMessages = (
  params: GetMessagesParams,
  options?: Omit<
    UseQueryOptions<GetMessagesResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<GetMessagesResponse, AxiosError<ApiErrorResponse>> => {
  const userId = useOptionalAuthUserId();
  const messagesModuleActive = useMessagesModuleActive();

  return useQuery<GetMessagesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: messageKeys.list(userId ?? 0, params),
    queryFn: async () => {
      const res = await axiosInstance.get<GetMessagesResponse>('messages', { params });
      return res.data;
    },

    staleTime: MESSAGE_LIST_STALE_MS,
    gcTime: MESSAGE_GC_TIME_MS,
    refetchInterval: messagesModuleActive ? MESSAGE_LIST_POLL_MS : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,

    ...options,
    enabled: !!userId && (options?.enabled ?? true),
  });
};

/**
 * Convenience hooks for standard folders (keeps components clean).
 */
export const useInboxMessages = (params: Omit<GetMessagesParams, 'folder'> = {}, options?: Parameters<typeof useGetMessages>[1]) =>
  useGetMessages({ folder: 'inbox', ...params }, options);

export const useDraftMessages = (params: Omit<GetMessagesParams, 'folder'> = {}, options?: Parameters<typeof useGetMessages>[1]) =>
  useGetMessages({ folder: 'drafts', ...params }, options);

export const useSentMessages = (params: Omit<GetMessagesParams, 'folder'> = {}, options?: Parameters<typeof useGetMessages>[1]) =>
  useGetMessages({ folder: 'sent', ...params }, options);

export const useTrashMessages = (params: Omit<GetMessagesParams, 'folder'> = {}, options?: Parameters<typeof useGetMessages>[1]) =>
  useGetMessages({ folder: 'trash', ...params }, options);

export const useArchiveMessages = (params: Omit<GetMessagesParams, 'folder'> = {}, options?: Parameters<typeof useGetMessages>[1]) =>
  useGetMessages({ folder: 'archive', ...params }, options);

/* -------------------------------------------------------------------------- */
/*                               Query: Stats                                  */
/* -------------------------------------------------------------------------- */

export const useGetMessageStats = (
  options?: Omit<
    UseQueryOptions<MessageFolderStats, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<MessageFolderStats, AxiosError<ApiErrorResponse>> => {
  const userId = useOptionalAuthUserId();

  return useQuery<MessageFolderStats, AxiosError<ApiErrorResponse>>({
    queryKey: messageKeys.statsByUser(userId ?? 0),
    queryFn: async () => {
      const res = await axiosInstance.get<MessageFolderStats>('messages/stats');
      return res.data;
    },
    staleTime: MESSAGE_STATS_STALE_MS,
    gcTime: MESSAGE_GC_TIME_MS,
    refetchInterval: MESSAGE_STATS_POLL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    ...options,
    enabled: !!userId && (options?.enabled ?? true),
  });
};

/* -------------------------------------------------------------------------- */
/*                              Query: Message Detail                          */
/* -------------------------------------------------------------------------- */

export const useGetMessageDetail = (
  id: number,
  options?: Omit<
    UseQueryOptions<ShowMessageResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<ShowMessageResponse, AxiosError<ApiErrorResponse>> => {
  const userId = useOptionalAuthUserId();

  return useQuery<ShowMessageResponse, AxiosError<ApiErrorResponse>>({
    queryKey: messageKeys.detail(userId ?? 0, id),
    queryFn: async () => {
      const res = await axiosInstance.get<ShowMessageResponse>(`messages/${id}`);
      return res.data;
    },
    staleTime: MESSAGE_LIST_STALE_MS,
    gcTime: MESSAGE_GC_TIME_MS,
    refetchOnWindowFocus: true,
    ...options,
    enabled: !!userId && id > 0 && (options?.enabled ?? true),
  });
};

const useMessageMutationUserId = (): number | string => {
  const userId = useOptionalAuthUserId();
  if (!userId) {
    throw new Error('User must be authenticated to mutate messages.');
  }
  return userId;
};

/* -------------------------------------------------------------------------- */
/*                                 Mutations                                  */
/* -------------------------------------------------------------------------- */

/**
 * POST /messages
 * Used for:
 * - saving a draft (save_draft: true)
 * - sending a message immediately (save_draft omitted/false)
 * - scheduling a send (scheduled_send_at present)
 */
export const useStoreMessage = (
  callbacks: MutationCallbacks<StoreMessageResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    StoreMessageResponse,
    AxiosError<ApiErrorResponse>,
    StoreMessageRequest,
    MessageCacheSnapshot
  >({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post<StoreMessageResponse>('messages', payload);
      return res.data;
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      if (payload.save_draft) {
        adjustFolderStats(qc, userId, [{ folder: 'drafts', totalDelta: 1 }]);
      } else if (!payload.scheduled_send_at) {
        adjustFolderStats(qc, userId, [{ folder: 'sent', totalDelta: 1 }]);
      }
      return snapshot;
    },
    onSuccess: async (data) => {
      if (data.status === 'draft_saved') showToast('success', 'Draft saved.', 5000);
      if (data.status === 'sent') showToast('success', 'Message sent.', 5000);
      if (data.status === 'scheduled') showToast('success', 'Message scheduled.', 6000);

      if (data.skipped_recipients?.length) {
        const skippedSummary = data.skipped_recipients
          .map((s) => `${s.value} (${s.message})`)
          .join('; ');
        showToast(
          'warning',
          `Message sent. Skipped ${data.skipped_recipients.length} recipient(s) not on Custocare: ${skippedSummary}`,
          12_000,
        );
      }

      await qc.invalidateQueries({ queryKey: messageKeys.lists() });
      callbacks.onSuccess?.(data);
    },
    onError: (error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
      const base = extractErrorMessage(error, 'Failed to submit message.');
      const details = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * PUT /messages/{id} - updates an existing draft.
 */
export const useUpdateMessage = (
  callbacks: MutationCallbacks<UpdateMessageResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    UpdateMessageResponse,
    AxiosError<ApiErrorResponse>,
    { id: number; data: UpdateMessageRequest },
    MessageCacheSnapshot
  >({
    mutationFn: async ({ id, data }) => {
      const res = await axiosInstance.put<UpdateMessageResponse>(`messages/${id}`, data);
      return res.data;
    },
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      patchMessageInAllLists(qc, id, (row) => ({
        ...row,
        message: {
          ...row.message,
          subject: data.subject ?? row.message.subject,
          body: data.body ?? row.message.body,
          updated_at: new Date().toISOString(),
        },
      }));
      patchMessageDetail(qc, userId, id, (detail) => ({
        ...detail,
        message: {
          ...detail.message,
          subject: data.subject ?? detail.message.subject,
          body: data.body ?? detail.message.body,
          updated_at: new Date().toISOString(),
        },
      }));
      return snapshot;
    },
    onSuccess: async (data) => {
      showToast('success', 'Draft updated.', 5000);
      patchMessageInAllLists(qc, data.message.id, (row) => ({ ...row, message: data.message }));
      callbacks.onSuccess?.(data);
    },
    onError: (error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
      const base = extractErrorMessage(error, 'Failed to update message.');
      const details = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * DELETE /messages/{id} - move message to trash.
 */
export const useTrashMessage = (
  callbacks: MutationCallbacks<TrashMessageResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    TrashMessageResponse,
    AxiosError<ApiErrorResponse>,
    { id: number },
    MessageCacheSnapshot
  >({
    mutationFn: async ({ id }) => {
      const res = await axiosInstance.delete<TrashMessageResponse>(`messages/${id}`);
      return res.data;
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      const row = getMessageRowForOptimistic(qc, id);
      removeMessageFromAllLists(qc, id);
      if (row && row.folder !== 'trash') {
        adjustFolderStats(qc, userId, [
          {
            folder: row.folder,
            totalDelta: -1,
            unreadDelta: row.is_read ? 0 : -1,
          },
          { folder: 'trash', totalDelta: 1 },
        ]);
      }
      return snapshot;
    },
    onSuccess: async (data) => {
      showToast('success', 'Moved to trash.', 4000);
      callbacks.onSuccess?.(data);
    },
    onError: (error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
      showToast('error', extractErrorMessage(error, 'Failed to move to trash.'), 9000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * POST /messages/{id}/restore
 */
export const useRestoreMessage = (
  callbacks: MutationCallbacks<RestoreMessageResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    RestoreMessageResponse,
    AxiosError<ApiErrorResponse>,
    { id: number },
    MessageCacheSnapshot
  >({
    mutationFn: async ({ id }) => {
      const res = await axiosInstance.post<RestoreMessageResponse>(`messages/${id}/restore`);
      return res.data;
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      removeMessageFromAllLists(qc, id);
      adjustFolderStats(qc, userId, [
        { folder: 'trash', totalDelta: -1 },
        { folder: 'inbox', totalDelta: 1 },
      ]);
      return snapshot;
    },
    onSuccess: async (data) => {
      showToast('success', 'Message restored.', 5000);
      await qc.invalidateQueries({ queryKey: messageKeys.lists() });
      callbacks.onSuccess?.(data);
    },
    onError: (error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
      showToast('error', extractErrorMessage(error, 'Failed to restore message.'), 9000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * DELETE /messages/{id}/permanent
 */
export const usePermanentDeleteMessage = (
  callbacks: MutationCallbacks<PermanentDeleteResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    PermanentDeleteResponse,
    AxiosError<ApiErrorResponse>,
    { id: number },
    MessageCacheSnapshot
  >({
    mutationFn: async ({ id }) => {
      const res = await axiosInstance.delete<PermanentDeleteResponse>(`messages/${id}/permanent`);
      return res.data;
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      const row = getMessageRowForOptimistic(qc, id);
      removeMessageFromAllLists(qc, id);
      if (row?.folder === 'trash') {
        adjustFolderStats(qc, userId, [{ folder: 'trash', totalDelta: -1 }]);
      }
      return snapshot;
    },
    onSuccess: async (data) => {
      showToast('success', 'Message permanently deleted.', 6000);
      callbacks.onSuccess?.(data);
    },
    onError: (error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
      showToast('error', extractErrorMessage(error, 'Failed to permanently delete.'), 9000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * DELETE /messages/trash/empty
 */
export const useEmptyTrash = (
  callbacks: MutationCallbacks<EmptyTrashResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<EmptyTrashResponse, AxiosError<ApiErrorResponse>, void, MessageCacheSnapshot>({
    mutationFn: async () => {
      const res = await axiosInstance.delete<EmptyTrashResponse>('messages/trash/empty');
      return res.data;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      qc.setQueriesData<GetMessagesResponse>(
        { queryKey: messageKeys.lists(), predicate: (q) => q.queryKey.includes('trash') },
        (old) => (old ? { ...old, data: [], total: 0 } : old),
      );
      qc.setQueryData<MessageFolderStats>(messageKeys.statsByUser(userId), (old) =>
        old ? { ...old, trash: { total: 0, unread: 0 } } : old,
      );
      return snapshot;
    },
    onSuccess: async (data) => {
      showToast('success', `Trash emptied (${data.deleted} deleted).`, 7000);
      callbacks.onSuccess?.(data);
    },
    onError: (error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
      showToast('error', extractErrorMessage(error, 'Failed to empty trash.'), 9000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * POST /messages/{id}/send - send an existing draft.
 */
export const useSendDraftMessage = (
  callbacks: MutationCallbacks<SendDraftResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    SendDraftResponse,
    AxiosError<ApiErrorResponse>,
    { id: number },
    MessageCacheSnapshot
  >({
    mutationFn: async ({ id }) => {
      const res = await axiosInstance.post<SendDraftResponse>(`messages/${id}/send`);
      return res.data;
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      removeMessageFromAllLists(qc, id);
      adjustFolderStats(qc, userId, [
        { folder: 'drafts', totalDelta: -1 },
        { folder: 'sent', totalDelta: 1 },
      ]);
      return snapshot;
    },
    onSuccess: async (data) => {
      showToast('success', 'Draft sent.', 5000);
      await qc.invalidateQueries({ queryKey: messageKeys.lists() });
      callbacks.onSuccess?.(data);
    },
    onError: (error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
      showToast('error', extractErrorMessage(error, 'Failed to send draft.'), 9000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * PATCH /messages/{id}/read
 */
export const useMarkReadMessage = () => {
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    ReadStateResponse,
    AxiosError<ApiErrorResponse>,
    { id: number },
    MessageCacheSnapshot
  >({
    mutationFn: async ({ id }) => (await axiosInstance.patch<ReadStateResponse>(`messages/${id}/read`)).data,
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      const row = getMessageRowForOptimistic(qc, id);
      patchMessageInAllLists(qc, id, (item) => ({
        ...item,
        is_read: true,
        read_at: new Date().toISOString(),
      }));
      patchMessageDetail(qc, userId, id, (detail) => ({
        ...detail,
        state: { ...detail.state, is_read: true, read_at: new Date().toISOString() },
      }));
      if (row && !row.is_read) {
        adjustFolderStats(qc, userId, [{ folder: row.folder, unreadDelta: -1 }]);
      }
      return snapshot;
    },
    onError: (_error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
    },
  });
};

/**
 * PATCH /messages/{id}/unread
 */
export const useMarkUnreadMessage = () => {
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    ReadStateResponse,
    AxiosError<ApiErrorResponse>,
    { id: number },
    MessageCacheSnapshot
  >({
    mutationFn: async ({ id }) => (await axiosInstance.patch<ReadStateResponse>(`messages/${id}/unread`)).data,
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      const row = getMessageRowForOptimistic(qc, id);
      patchMessageInAllLists(qc, id, (item) => ({
        ...item,
        is_read: false,
        read_at: null,
      }));
      patchMessageDetail(qc, userId, id, (detail) => ({
        ...detail,
        state: { ...detail.state, is_read: false, read_at: null },
      }));
      if (row?.is_read) {
        adjustFolderStats(qc, userId, [{ folder: row.folder, unreadDelta: 1 }]);
      }
      return snapshot;
    },
    onError: (_error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
    },
  });
};

/**
 * PATCH /messages/{id}/star
 */
export const useToggleStarMessage = () => {
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    StarToggleResponse,
    AxiosError<ApiErrorResponse>,
    { id: number },
    MessageCacheSnapshot
  >({
    mutationFn: async ({ id }) => (await axiosInstance.patch<StarToggleResponse>(`messages/${id}/star`)).data,
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      patchMessageInAllLists(qc, id, (item) => ({
        ...item,
        is_starred: !item.is_starred,
        starred_at: !item.is_starred ? new Date().toISOString() : null,
      }));
      return snapshot;
    },
    onSuccess: (data, { id }) => {
      patchMessageInAllLists(qc, id, (item) => ({
        ...item,
        is_starred: data.starred,
        starred_at: data.starred ? new Date().toISOString() : null,
      }));
    },
    onError: (_error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
    },
  });
};

/**
 * PATCH /messages/{id}/archive
 */
export const useArchiveMessage = () => {
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    ArchiveStateResponse,
    AxiosError<ApiErrorResponse>,
    { id: number },
    MessageCacheSnapshot
  >({
    mutationFn: async ({ id }) => (await axiosInstance.patch<ArchiveStateResponse>(`messages/${id}/archive`)).data,
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      const row = getMessageRowForOptimistic(qc, id);
      removeMessageFromAllLists(qc, id);
      if (row && row.folder !== 'archive') {
        adjustFolderStats(qc, userId, [
          {
            folder: row.folder,
            totalDelta: -1,
            unreadDelta: row.is_read ? 0 : -1,
          },
          { folder: 'archive', totalDelta: 1 },
        ]);
      }
      return snapshot;
    },
    onError: (_error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
    },
  });
};

/**
 * PATCH /messages/{id}/unarchive
 */
export const useUnarchiveMessage = () => {
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    ArchiveStateResponse,
    AxiosError<ApiErrorResponse>,
    { id: number },
    MessageCacheSnapshot
  >({
    mutationFn: async ({ id }) => (await axiosInstance.patch<ArchiveStateResponse>(`messages/${id}/unarchive`)).data,
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      removeMessageFromAllLists(qc, id);
      adjustFolderStats(qc, userId, [
        { folder: 'archive', totalDelta: -1 },
        { folder: 'inbox', totalDelta: 1 },
      ]);
      return snapshot;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: messageKeys.lists() });
    },
    onError: (_error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
    },
  });
};

/**
 * POST /messages/{id}/labels
 */
export const useAddMessageLabel = () => {
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    LabelActionResponse,
    AxiosError<ApiErrorResponse>,
    { id: number; data: AddLabelRequest },
    MessageCacheSnapshot
  >({
    mutationFn: async ({ id, data }) =>
      (await axiosInstance.post<LabelActionResponse>(`messages/${id}/labels`, data)).data,
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      patchMessageInAllLists(qc, id, (item) => ({
        ...item,
        message: {
          ...item.message,
          labels: [...(item.message.labels ?? []), { id: Date.now(), message_id: id, user_id: Number(userId), label: data.label, created_at: new Date().toISOString() }],
        },
      }));
      return snapshot;
    },
    onError: (_error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
    },
  });
};

/**
 * DELETE /messages/{id}/labels/{label}
 */
export const useRemoveMessageLabel = () => {
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    LabelActionResponse,
    AxiosError<ApiErrorResponse>,
    { id: number; label: string },
    MessageCacheSnapshot
  >({
    mutationFn: async ({ id, label }) =>
      (await axiosInstance.delete<LabelActionResponse>(`messages/${id}/labels/${encodeURIComponent(label)}`)).data,
    onMutate: async ({ id, label }) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      patchMessageInAllLists(qc, id, (item) => ({
        ...item,
        message: {
          ...item.message,
          labels: (item.message.labels ?? []).filter((l) => l.label !== label),
        },
      }));
      return snapshot;
    },
    onError: (_error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
    },
  });
};

/**
 * POST /messages/{id}/attachments
 *
 * We support upload progress by accepting an optional onProgress callback.
 */
export const useUploadMessageAttachment = () => {
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    UploadAttachmentResponse,
    AxiosError<ApiErrorResponse>,
    { id: number; file: File; disk?: string; onProgress?: (pct: number) => void }
  >({
    mutationFn: async ({ id, file, disk, onProgress }) => {
      const form = new FormData();
      form.append('file', file);
      if (disk) form.append('disk', disk);

      const res = await axiosInstance.post<UploadAttachmentResponse>(
        `messages/${id}/attachments`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            if (!onProgress) return;
            const total = evt.total ?? 0;
            if (!total) return;
            const pct = Math.round((evt.loaded / total) * 100);
            onProgress(pct);
          },
        },
      );

      return res.data;
    },
    onSuccess: async (data, { id }) => {
      patchMessageDetail(qc, userId, id, (detail) => ({
        ...detail,
        message: {
          ...detail.message,
          attachments: [...(detail.message.attachments ?? []), data.attachment],
        },
      }));
    },
  });
};

/**
 * DELETE /messages/attachments/{attachmentId}
 */
export const useRemoveMessageAttachment = () => {
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    RemoveAttachmentResponse,
    AxiosError<ApiErrorResponse>,
    { attachmentId: number; messageId?: number },
    MessageCacheSnapshot
  >({
    mutationFn: async ({ attachmentId }) =>
      (await axiosInstance.delete<RemoveAttachmentResponse>(`messages/attachments/${attachmentId}`)).data,
    onMutate: async ({ attachmentId, messageId }) => {
      const resolvedMessageId =
        messageId ??
        qc
          .getQueriesData<GetMessagesResponse>({ queryKey: messageKeys.lists() })
          .flatMap(([, data]) => data?.data ?? [])
          .find((row) => row.message.attachments?.some((a) => a.id === attachmentId))?.message?.id;

      if (!resolvedMessageId) {
        return { previousLists: [], previousDetails: [] };
      }
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      patchMessageInAllLists(qc, resolvedMessageId, (item) => ({
        ...item,
        message: {
          ...item.message,
          attachments: (item.message.attachments ?? []).filter((a) => a.id !== attachmentId),
        },
      }));
      patchMessageDetail(qc, userId, resolvedMessageId, (detail) => ({
        ...detail,
        message: {
          ...detail.message,
          attachments: (detail.message.attachments ?? []).filter((a) => a.id !== attachmentId),
        },
      }));
      return snapshot;
    },
    onError: (_error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
    },
  });
};

const extractFileNameFromContentDisposition = (
  contentDisposition?: string,
): string | null => {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const asciiMatch = contentDisposition.match(/filename="([^"]+)"|filename=([^;]+)/i);
  if (!asciiMatch) return null;

  return (asciiMatch[1] ?? asciiMatch[2] ?? '').trim() || null;
};


/**
 * GET /messages/attachments/{attachmentId}
 *
 * The backend now returns a temporarySignedRoute URL in `download_url`.
 * We ALWAYS pipe through axios so the session cookie / Bearer token is sent.
 * Never use a bare <a href> for attachment downloads — it bypasses auth.
 */
export const useDownloadMessageAttachment = () => {
  const { showToast } = useToast();

  return useMutation<
    void,
    AxiosError<ApiErrorResponse>,
    { attachmentId: number; fileName: string; downloadUrl?: string | null }
  >({
    mutationFn: async ({ attachmentId, fileName, downloadUrl }) => {

      /*
       * Resolve the endpoint to call:
       *  - If backend gave us a full signed URL → use it (axios still adds auth headers)
       *  - Otherwise fall back to the standard REST path
       */
      const endpoint = downloadUrl ?? `messages/attachments/${attachmentId}`;

      /* ── DEV: log exactly what we're requesting ─────────────────────── */
      if (import.meta.env.DEV) {
        console.debug(
          '%c[AttachmentDownload] ▶ initiating',
          'color:#6366f1;font-weight:bold;',
          {
            attachmentId,
            fileName,
            endpoint,
            usingSignedUrl: !!downloadUrl,
            timestamp: new Date().toISOString(),
          },
        );
      }

      /*
       * Always use axios — this ensures the session cookie / Bearer token
       * is forwarded. A bare <a href> does NOT send auth headers and would
       * fail for signed API routes on private-disk files.
       */
      const response = await axiosInstance.get(endpoint, {
        responseType: 'blob',
        // If the URL is already absolute (signed URL), axios will use it as-is.
        // If it's a relative path, axios prepends baseURL as usual.
        baseURL: downloadUrl ? '' : undefined,
      });

      /* ── DEV: log response metadata ─────────────────────────────────── */
      if (import.meta.env.DEV) {
        console.debug('[AttachmentDownload] ✅ response received', {
          status:        response.status,
          contentType:   response.headers['content-type'],
          contentLength: response.headers['content-length'],
          blobSize:      (response.data as Blob)?.size,
          resolvedUrl:   endpoint,
        });
      }

      /* ── Trigger browser Save-As dialog ─────────────────────────────── */
      const serverFileName = extractFileNameFromContentDisposition(
  response.headers['content-disposition'] as string | undefined,
);

        const resolvedFileName = serverFileName || fileName;

        /*
        * response.data is already a Blob because responseType = 'blob'.
        * Do not wrap it again.
        */
        const blob = response.data;
        const objectUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = resolvedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);


      // Release after enough time for the browser to start the download
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    },

    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('[AttachmentDownload] ❌ failed', {
          status:  error.response?.status,
          message: error.message,
          data:    error.response?.data,
        });
      }
      showToast('error', extractErrorMessage(error, 'Failed to download attachment.'), 9000);
    },
  });
};

/**
 * POST /messages/bulk
 */
export const useBulkMessageAction = (
  callbacks: MutationCallbacks<BulkActionResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const userId = useMessageMutationUserId();

  return useMutation<
    BulkActionResponse,
    AxiosError<ApiErrorResponse>,
    BulkActionRequest,
    MessageCacheSnapshot
  >({
    mutationFn: async (payload) => (await axiosInstance.post<BulkActionResponse>('messages/bulk', payload)).data,
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: messageKeys.all });
      const snapshot = snapshotMessageCaches(qc, userId);
      for (const id of payload.message_ids) {
        if (payload.action === 'trash') {
          removeMessageFromAllLists(qc, id);
        }
        if (payload.action === 'markRead') {
          patchMessageInAllLists(qc, id, (item) => ({ ...item, is_read: true }));
        }
        if (payload.action === 'markUnread') {
          patchMessageInAllLists(qc, id, (item) => ({ ...item, is_read: false }));
        }
        if (payload.action === 'permanentDelete') {
          removeMessageFromAllLists(qc, id);
        }
      }
      return snapshot;
    },
    onSuccess: async (data) => {
      showToast('success', `Bulk action complete: ${data.action} (${data.affected}).`, 7000);
      await qc.invalidateQueries({ queryKey: messageKeys.lists() });
      await qc.invalidateQueries({ queryKey: messageKeys.stats() });
      callbacks.onSuccess?.(data);
    },
    onError: (error, _variables, context) => {
      if (context) restoreMessageCachesWithUser(qc, userId, context);
      showToast('error', extractErrorMessage(error, 'Bulk action failed.'), 9000);
      callbacks.onError?.(error);
    },
  });
};
