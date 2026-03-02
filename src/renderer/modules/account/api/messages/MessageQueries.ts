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

/* -------------------------------------------------------------------------- */
/*                            Cache / Realtime Policy                          */
/* -------------------------------------------------------------------------- */

/**
 * You requested "real-time" data with minimal caching.
 * We keep a short cache window (~20 seconds) to reduce UI flicker and load,
 * while still refetching frequently.
 */
const REALTIME_STALE_TIME_MS = 20_000;
const REALTIME_GC_TIME_MS = 20_000;
const REALTIME_REFETCH_INTERVAL_MS = 20_000;

/* -------------------------------------------------------------------------- */
/*                                    Keys                                     */
/* -------------------------------------------------------------------------- */

export const messageKeys = {
  all: ['messages'] as const,

  /**
   * Folder list keys are scoped by userId + params to avoid cross-user cache bleeding.
   */
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (userId: number | string, params: GetMessagesParams) =>
    [...messageKeys.lists(), userId, params] as const,

  stats: () => [...messageKeys.all, 'stats'] as const,
  statsByUser: (userId: number | string) => [...messageKeys.stats(), userId] as const,

  details: () => [...messageKeys.all, 'detail'] as const,
  detail: (userId: number | string, id: number) => [...messageKeys.details(), userId, id] as const,
};

/* -------------------------------------------------------------------------- */
/*                                  Auth Helper                                */
/* -------------------------------------------------------------------------- */

/**
 * Custom hook to get the current user ID from auth slice.
 * Throws error if user is not authenticated (same behavior as SecurityQueries.ts).
 */
const useAuthUserId = (): number | string => {
  const user = useAppSelector(selectUser);

  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  return user.id;
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
  const userId = useAuthUserId();

  return useQuery<GetMessagesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: messageKeys.list(userId, params),
    queryFn: async () => {
      const res = await axiosInstance.get<GetMessagesResponse>('messages', { params });
      return res.data;
    },

    // short caching window
    staleTime: REALTIME_STALE_TIME_MS,
    gcTime: REALTIME_GC_TIME_MS,

    // keep fresh by polling (can be overridden by passing options)
    refetchInterval: REALTIME_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,

    ...options,
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
  const userId = useAuthUserId();

  return useQuery<MessageFolderStats, AxiosError<ApiErrorResponse>>({
    queryKey: messageKeys.statsByUser(userId),
    queryFn: async () => {
      const res = await axiosInstance.get<MessageFolderStats>('messages/stats');
      return res.data;
    },
    staleTime: REALTIME_STALE_TIME_MS,
    gcTime: REALTIME_GC_TIME_MS,
    refetchInterval: REALTIME_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
    ...options,
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
  const userId = useAuthUserId();

  return useQuery<ShowMessageResponse, AxiosError<ApiErrorResponse>>({
    queryKey: messageKeys.detail(userId, id),
    queryFn: async () => {
      const res = await axiosInstance.get<ShowMessageResponse>(`messages/${id}`);
      return res.data;
    },
    staleTime: REALTIME_STALE_TIME_MS,
    gcTime: REALTIME_GC_TIME_MS,
    refetchInterval: REALTIME_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                          Internal helper: invalidation                      */
/* -------------------------------------------------------------------------- */

const invalidateMessageData = async (qc: ReturnType<typeof useQueryClient>) => {
  // Invalidate all lists + stats (short cache already helps, but we force correctness)
  await Promise.all([
    qc.invalidateQueries({ queryKey: messageKeys.lists() }),
    qc.invalidateQueries({ queryKey: messageKeys.stats() }),
  ]);
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

  return useMutation<StoreMessageResponse, AxiosError<ApiErrorResponse>, StoreMessageRequest>({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post<StoreMessageResponse>('messages', payload);
      return res.data;
    },
    onSuccess: async (data) => {
      // small, friendly status-based toast
      if (data.status === 'draft_saved') showToast('success', 'Draft saved.', 5000);
      if (data.status === 'sent') showToast('success', 'Message sent.', 5000);
      if (data.status === 'scheduled') showToast('success', 'Message scheduled.', 6000);

      await invalidateMessageData(qc);
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
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

  return useMutation<
    UpdateMessageResponse,
    AxiosError<ApiErrorResponse>,
    { id: number; data: UpdateMessageRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await axiosInstance.put<UpdateMessageResponse>(`messages/${id}`, data);
      return res.data;
    },
    onSuccess: async (data) => {
      showToast('success', 'Draft updated.', 5000);
      await invalidateMessageData(qc);
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
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

  return useMutation<TrashMessageResponse, AxiosError<ApiErrorResponse>, { id: number }>({
    mutationFn: async ({ id }) => {
      const res = await axiosInstance.delete<TrashMessageResponse>(`messages/${id}`);
      return res.data;
    },
    onSuccess: async (data) => {
      showToast('success', 'Moved to trash.', 4000);
      await invalidateMessageData(qc);
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
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

  return useMutation<RestoreMessageResponse, AxiosError<ApiErrorResponse>, { id: number }>({
    mutationFn: async ({ id }) => {
      const res = await axiosInstance.post<RestoreMessageResponse>(`messages/${id}/restore`);
      return res.data;
    },
    onSuccess: async (data) => {
      showToast('success', 'Message restored.', 5000);
      await invalidateMessageData(qc);
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
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

  return useMutation<PermanentDeleteResponse, AxiosError<ApiErrorResponse>, { id: number }>({
    mutationFn: async ({ id }) => {
      const res = await axiosInstance.delete<PermanentDeleteResponse>(`messages/${id}/permanent`);
      return res.data;
    },
    onSuccess: async (data) => {
      showToast('success', 'Message permanently deleted.', 6000);
      await invalidateMessageData(qc);
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
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

  return useMutation<EmptyTrashResponse, AxiosError<ApiErrorResponse>, void>({
    mutationFn: async () => {
      const res = await axiosInstance.delete<EmptyTrashResponse>('messages/trash/empty');
      return res.data;
    },
    onSuccess: async (data) => {
      showToast('success', `Trash emptied (${data.deleted} deleted).`, 7000);
      await invalidateMessageData(qc);
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
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

  return useMutation<SendDraftResponse, AxiosError<ApiErrorResponse>, { id: number }>({
    mutationFn: async ({ id }) => {
      const res = await axiosInstance.post<SendDraftResponse>(`messages/${id}/send`);
      return res.data;
    },
    onSuccess: async (data) => {
      showToast('success', 'Draft sent.', 5000);
      await invalidateMessageData(qc);
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
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
  return useMutation<ReadStateResponse, AxiosError<ApiErrorResponse>, { id: number }>({
    mutationFn: async ({ id }) => (await axiosInstance.patch<ReadStateResponse>(`messages/${id}/read`)).data,
    onSuccess: async () => {
      await invalidateMessageData(qc);
    },
  });
};

/**
 * PATCH /messages/{id}/unread
 */
export const useMarkUnreadMessage = () => {
  const qc = useQueryClient();
  return useMutation<ReadStateResponse, AxiosError<ApiErrorResponse>, { id: number }>({
    mutationFn: async ({ id }) => (await axiosInstance.patch<ReadStateResponse>(`messages/${id}/unread`)).data,
    onSuccess: async () => {
      await invalidateMessageData(qc);
    },
  });
};

/**
 * PATCH /messages/{id}/star
 */
export const useToggleStarMessage = () => {
  const qc = useQueryClient();
  return useMutation<StarToggleResponse, AxiosError<ApiErrorResponse>, { id: number }>({
    mutationFn: async ({ id }) => (await axiosInstance.patch<StarToggleResponse>(`messages/${id}/star`)).data,
    onSuccess: async () => {
      await invalidateMessageData(qc);
    },
  });
};

/**
 * PATCH /messages/{id}/archive
 */
export const useArchiveMessage = () => {
  const qc = useQueryClient();
  return useMutation<ArchiveStateResponse, AxiosError<ApiErrorResponse>, { id: number }>({
    mutationFn: async ({ id }) => (await axiosInstance.patch<ArchiveStateResponse>(`messages/${id}/archive`)).data,
    onSuccess: async () => {
      await invalidateMessageData(qc);
    },
  });
};

/**
 * PATCH /messages/{id}/unarchive
 */
export const useUnarchiveMessage = () => {
  const qc = useQueryClient();
  return useMutation<ArchiveStateResponse, AxiosError<ApiErrorResponse>, { id: number }>({
    mutationFn: async ({ id }) => (await axiosInstance.patch<ArchiveStateResponse>(`messages/${id}/unarchive`)).data,
    onSuccess: async () => {
      await invalidateMessageData(qc);
    },
  });
};

/**
 * POST /messages/{id}/labels
 */
export const useAddMessageLabel = () => {
  const qc = useQueryClient();
  return useMutation<
    LabelActionResponse,
    AxiosError<ApiErrorResponse>,
    { id: number; data: AddLabelRequest }
  >({
    mutationFn: async ({ id, data }) =>
      (await axiosInstance.post<LabelActionResponse>(`messages/${id}/labels`, data)).data,
    onSuccess: async () => {
      await invalidateMessageData(qc);
    },
  });
};

/**
 * DELETE /messages/{id}/labels/{label}
 */
export const useRemoveMessageLabel = () => {
  const qc = useQueryClient();
  return useMutation<
    LabelActionResponse,
    AxiosError<ApiErrorResponse>,
    { id: number; label: string }
  >({
    mutationFn: async ({ id, label }) =>
      (await axiosInstance.delete<LabelActionResponse>(`messages/${id}/labels/${encodeURIComponent(label)}`)).data,
    onSuccess: async () => {
      await invalidateMessageData(qc);
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
    onSuccess: async () => {
      await invalidateMessageData(qc);
    },
  });
};

/**
 * DELETE /messages/attachments/{attachmentId}
 */
export const useRemoveMessageAttachment = () => {
  const qc = useQueryClient();
  return useMutation<
    RemoveAttachmentResponse,
    AxiosError<ApiErrorResponse>,
    { attachmentId: number }
  >({
    mutationFn: async ({ attachmentId }) =>
      (await axiosInstance.delete<RemoveAttachmentResponse>(`messages/attachments/${attachmentId}`)).data,
    onSuccess: async () => {
      await invalidateMessageData(qc);
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

  return useMutation<BulkActionResponse, AxiosError<ApiErrorResponse>, BulkActionRequest>({
    mutationFn: async (payload) => (await axiosInstance.post<BulkActionResponse>('messages/bulk', payload)).data,
    onSuccess: async (data) => {
      showToast('success', `Bulk action complete: ${data.action} (${data.affected}).`, 7000);
      await invalidateMessageData(qc);
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
      showToast('error', extractErrorMessage(error, 'Bulk action failed.'), 9000);
      callbacks.onError?.(error);
    },
  });
};
