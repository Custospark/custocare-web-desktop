import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type { ApiErrorResponse, ApiResponse } from '../../../custocare-hub/api/feedback/hubFeedbackTypes';
import type { HubFeedbackCategory, HubFeedbackStatus } from '../../../custocare-hub/api/feedback/hubFeedbackTypes';

export const platformHubFeedbackKeys = {
  all: ['platform-admin', 'hub-feedback'] as const,
  list: (filters?: { status?: string; category?: string; q?: string }) =>
    [...platformHubFeedbackKeys.all, 'list', filters] as const,
  detail: (id: number) => [...platformHubFeedbackKeys.all, 'detail', id] as const,
};

export interface PlatformHubFeedbackRowDto {
  id: number;
  uuid: string;
  user_id: number;
  user_display: string;
  category: HubFeedbackCategory;
  subject: string;
  status: HubFeedbackStatus;
  include_in_roadmap: boolean;
  votes_count: number;
  created_at: string | null;
}

export interface PlatformHubFeedbackDetailDto extends PlatformHubFeedbackRowDto {
  body: string;
  staff_reply: string | null;
  admin_internal_notes: string | null;
  updated_at: string | null;
}

export function usePlatformHubFeedbackList(
  filters: { status?: string; category?: string; q?: string } = {},
  options?: Omit<
    UseQueryOptions<ApiResponse<PlatformHubFeedbackRowDto[]>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<ApiResponse<PlatformHubFeedbackRowDto[]>, AxiosError<ApiErrorResponse>>({
    queryKey: platformHubFeedbackKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.category) params.set('category', filters.category);
      if (filters.q) params.set('q', filters.q);
      const qs = params.toString();
      const url = qs ? `/platform-admin/hub-feedback?${qs}` : '/platform-admin/hub-feedback';
      const res = await axiosInstance.get<ApiResponse<PlatformHubFeedbackRowDto[]>>(url);
      return res.data;
    },
    staleTime: 0,
    ...options,
  });
}

export function usePlatformHubFeedbackDetail(
  id: number | null,
  options?: Omit<
    UseQueryOptions<ApiResponse<PlatformHubFeedbackDetailDto>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<ApiResponse<PlatformHubFeedbackDetailDto>, AxiosError<ApiErrorResponse>>({
    queryKey: platformHubFeedbackKeys.detail(id ?? 0),
    queryFn: async () => {
      const res = await axiosInstance.get<ApiResponse<PlatformHubFeedbackDetailDto>>(`/platform-admin/hub-feedback/${id}`);
      return res.data;
    },
    enabled: id != null && id > 0,
    staleTime: 0,
    ...options,
  });
}

export interface PlatformHubFeedbackUpdatePayload {
  status?: HubFeedbackStatus;
  staff_reply?: string | null;
  admin_internal_notes?: string | null;
  include_in_roadmap?: boolean;
}

export function useUpdatePlatformHubFeedback() {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<PlatformHubFeedbackDetailDto>,
    AxiosError<ApiErrorResponse>,
    { id: number; payload: PlatformHubFeedbackUpdatePayload },
    { prev: ApiResponse<PlatformHubFeedbackRowDto[]> | undefined }
  >({
    mutationFn: async ({ id, payload }) => {
      const res = await axiosInstance.patch<ApiResponse<PlatformHubFeedbackDetailDto>>(
        `/platform-admin/hub-feedback/${id}`,
        payload,
      );
      return res.data;
    },
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: platformHubFeedbackKeys.all });
      const prev = qc.getQueryData<ApiResponse<PlatformHubFeedbackRowDto[]>>(platformHubFeedbackKeys.all);
      qc.setQueryData<ApiResponse<PlatformHubFeedbackRowDto[]>>(platformHubFeedbackKeys.all, (old) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((item) => (item.id === id ? { ...item, ...payload } : item)) };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(platformHubFeedbackKeys.all, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: platformHubFeedbackKeys.all });
      void qc.invalidateQueries({ queryKey: ['hub-feedback'] });
    },
  });
}
