import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  ApiErrorResponse,
  ApiResponse,
  CreateHubSupportTicketPayload,
  HubSupportTicketDto,
} from './supportTicketTypes';

export const hubSupportTicketKeys = {
  all: ['hub-support-tickets'] as const,
  detail: (ref: string) => [...hubSupportTicketKeys.all, 'detail', ref] as const,
};

export function useHubSupportTicketDetail(
  ticketRef: string | undefined,
  options?: Omit<
    UseQueryOptions<ApiResponse<HubSupportTicketDto>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  const ref = ticketRef?.trim() || undefined;

  return useQuery<ApiResponse<HubSupportTicketDto>, AxiosError<ApiErrorResponse>>({
    queryKey: ref ? hubSupportTicketKeys.detail(ref) : hubSupportTicketKeys.all,
    enabled: Boolean(ref),
    queryFn: async () => {
      // Prefer one endpoint, but fall back to common variants.
      const encoded = encodeURIComponent(ref!);

      try {
        const res = await axiosInstance.get<ApiResponse<HubSupportTicketDto>>(`/hub-support/tickets/${encoded}`);
        return res.data;
      } catch (e) {
        const err = e as AxiosError<ApiErrorResponse>;
        if (err.response?.status === 404) {
          const fallback = await axiosInstance.get<ApiResponse<HubSupportTicketDto>>(
            `/hub-support/tickets/track/${encoded}`,
          );
          return fallback.data;
        }
        throw e;
      }
    },
    ...options,
  });
}

export function useCreateHubSupportTicket() {
  const qc = useQueryClient();

  return useMutation<ApiResponse<HubSupportTicketDto>, AxiosError<ApiErrorResponse>, CreateHubSupportTicketPayload>({
    mutationFn: async (payload) => {
      // Prefer `/hub-support/tickets`, but fall back if the backend uses `/hub-support/ticket`.
      try {
        const res = await axiosInstance.post<ApiResponse<HubSupportTicketDto>>('/hub-support/tickets', payload);
        return res.data;
      } catch (e) {
        const err = e as AxiosError<ApiErrorResponse>;
        if (err.response?.status === 404) {
          const res = await axiosInstance.post<ApiResponse<HubSupportTicketDto>>('/hub-support/ticket', payload);
          return res.data;
        }
        throw e;
      }
    },
    onError: (_err) => {
      console.error('Failed to create support ticket:', _err);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: hubSupportTicketKeys.all });
    },
  });
}

