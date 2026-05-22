import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  ApiErrorResponse,
  ApiResponse,
  HubSupportTicketCategory,
  HubSupportTicketPriority,
  HubSupportTicketStatus,
  HubSupportTicketTimelineItemDto,
} from '../../../custocare-hub/api/support/supportTicketTypes';
import { hubSupportTicketKeys } from '../../../custocare-hub/api/support/useSupportTicketQueries';

export const platformHubSupportTicketKeys = {
  all: ['platform-admin', 'hub-support-tickets'] as const,
  list: (filters?: { status?: string; category?: string; priority?: string; q?: string }) =>
    [...platformHubSupportTicketKeys.all, 'list', filters] as const,
  detail: (id: number) => [...platformHubSupportTicketKeys.all, 'detail', id] as const,
};

export interface PlatformHubSupportTicketRowDto {
  id: number;
  uuid: string;
  user_id: number;
  user_display: string;
  category: HubSupportTicketCategory | string;
  priority: HubSupportTicketPriority | string;
  subject: string;
  status: HubSupportTicketStatus | string;
  created_at: string | null;
}

export interface PlatformHubSupportTicketDetailDto extends PlatformHubSupportTicketRowDto {
  body: string;
  staff_reply: string | null;
  admin_internal_notes: string | null;
  updated_at: string | null;
  timeline: HubSupportTicketTimelineItemDto[] | null;
}

export function usePlatformHubSupportTicketList(
  filters: { status?: string; category?: string; priority?: string; q?: string } = {},
  options?: Omit<
    UseQueryOptions<ApiResponse<PlatformHubSupportTicketRowDto[]>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<ApiResponse<PlatformHubSupportTicketRowDto[]>, AxiosError<ApiErrorResponse>>({
    queryKey: platformHubSupportTicketKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.category) params.set('category', filters.category);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.q) params.set('q', filters.q);
      const qs = params.toString();
      const url = qs ? `/platform-admin/hub-support-tickets?${qs}` : '/platform-admin/hub-support-tickets';
      const res = await axiosInstance.get<ApiResponse<PlatformHubSupportTicketRowDto[]>>(url);
      return res.data;
    },
    staleTime: 0,
    ...options,
  });
}

export function usePlatformHubSupportTicketDetail(
  id: number | null,
  options?: Omit<
    UseQueryOptions<ApiResponse<PlatformHubSupportTicketDetailDto>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<ApiResponse<PlatformHubSupportTicketDetailDto>, AxiosError<ApiErrorResponse>>({
    queryKey: platformHubSupportTicketKeys.detail(id ?? 0),
    queryFn: async () => {
      const res = await axiosInstance.get<ApiResponse<PlatformHubSupportTicketDetailDto>>(
        `/platform-admin/hub-support-tickets/${id}`,
      );
      return res.data;
    },
    enabled: id != null && id > 0,
    staleTime: 0,
    ...options,
  });
}

export interface PlatformHubSupportTicketUpdatePayload {
  status?: HubSupportTicketStatus;
  priority?: HubSupportTicketPriority;
  staff_reply?: string | null;
  admin_internal_notes?: string | null;
}

export function useUpdatePlatformHubSupportTicket() {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<PlatformHubSupportTicketDetailDto>,
    AxiosError<ApiErrorResponse>,
    { id: number; payload: PlatformHubSupportTicketUpdatePayload }
  >({
    mutationFn: async ({ id, payload }) => {
      const res = await axiosInstance.patch<ApiResponse<PlatformHubSupportTicketDetailDto>>(
        `/platform-admin/hub-support-tickets/${id}`,
        payload,
      );
      return res.data;
    },
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: platformHubSupportTicketKeys.all });
      const prev = qc.getQueryData(platformHubSupportTicketKeys.all);
      qc.setQueryData<ApiResponse<PlatformHubSupportTicketRowDto[]>>(platformHubSupportTicketKeys.all, (old) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((item) => (item.id === id ? { ...item, ...payload } : item)) };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(platformHubSupportTicketKeys.all, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: platformHubSupportTicketKeys.all });
      void qc.invalidateQueries({ queryKey: hubSupportTicketKeys.all });
    },
  });
}
