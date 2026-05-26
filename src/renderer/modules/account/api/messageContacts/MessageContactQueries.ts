import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { messageContactKeys } from './messageContactKeys';
import type {
  ApiErrorResponse,
  MessageContact,
  MessageContactFilters,
  MessageContactListResponse,
  MessageContactResponse,
  ResolveMessageContactRequest,
  ResolveMessageContactResponse,
  StoreMessageContactRequest,
  UpdateMessageContactRequest,
} from './MessageContactTypes';

const extractError = (error: AxiosError<ApiErrorResponse>): string => {
  const data = error.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return data?.message ?? error.message ?? 'Request failed.';
};

export const useGetMessageContacts = (
  filters?: MessageContactFilters,
  options?: Omit<UseQueryOptions<MessageContactListResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>,
) =>
  useQuery<MessageContactListResponse, AxiosError<ApiErrorResponse>>({
    queryKey: messageContactKeys.list(filters),
    queryFn: async () => {
      const res = await axiosInstance.get<MessageContactListResponse>('/message-contacts', {
        params: filters,
      });
      return res.data;
    },
    ...options,
  });

export const useGetMessageContact = (
  id: number | string,
  options?: Omit<UseQueryOptions<MessageContactResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>,
) =>
  useQuery<MessageContactResponse, AxiosError<ApiErrorResponse>>({
    queryKey: messageContactKeys.detail(id),
    enabled: !!id,
    queryFn: async () => {
      const res = await axiosInstance.get<MessageContactResponse>(`/message-contacts/${id}`);
      return res.data;
    },
    ...options,
  });

export const useCreateMessageContact = () => {
  const qc = useQueryClient();
  const { showToast } = useToast();

  return useMutation<MessageContactResponse, AxiosError<ApiErrorResponse>, StoreMessageContactRequest>({
    mutationFn: async (data) => {
      const res = await axiosInstance.post<MessageContactResponse>('/message-contacts', data);
      return res.data;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: messageContactKeys.lists() });
      showToast('success', res.message || 'Contact saved.');
    },
    onError: (err) => {
      showToast('error', extractError(err));
    },
  });
};

export const useUpdateMessageContact = () => {
  const qc = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    MessageContactResponse,
    AxiosError<ApiErrorResponse>,
    { id: number | string; data: UpdateMessageContactRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await axiosInstance.put<MessageContactResponse>(`/message-contacts/${id}`, data);
      return res.data;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: messageContactKeys.all });
      showToast('success', res.message || 'Contact updated.');
    },
    onError: (err) => {
      showToast('error', extractError(err));
    },
  });
};

export const useDeleteMessageContact = () => {
  const qc = useQueryClient();
  const { showToast } = useToast();

  return useMutation<void, AxiosError<ApiErrorResponse>, number | string>({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/message-contacts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageContactKeys.all });
      showToast('success', 'Contact removed.');
    },
    onError: (err) => {
      showToast('error', extractError(err));
    },
  });
};

export const useTouchMessageContact = () => {
  const qc = useQueryClient();

  return useMutation<MessageContactResponse, AxiosError<ApiErrorResponse>, number | string>({
    mutationFn: async (id) => {
      const res = await axiosInstance.post<MessageContactResponse>(`/message-contacts/${id}/touch`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageContactKeys.lists() });
    },
  });
};

export const useResolveMessageContact = () =>
  useMutation<ResolveMessageContactResponse, AxiosError<ApiErrorResponse>, ResolveMessageContactRequest>({
    mutationFn: async (data) => {
      const res = await axiosInstance.post<ResolveMessageContactResponse>('/message-contacts/resolve', data);
      return res.data;
    },
  });

/** Flat list helper for compose suggestions (client-side filter callers). */
export const fetchMessageContactsForPicker = async (): Promise<MessageContact[]> => {
  const res = await axiosInstance.get<MessageContactListResponse>('/message-contacts', {
    params: { per_page: 100 },
  });
  return res.data.data ?? [];
};
