import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type { ApiErrorResponse, ApiResponse } from '../../../custocare-hub/api/support/supportFaqTypes';
import { supportFaqKeys } from '../../../custocare-hub/api/support/useSupportFaqQueries';

export const platformHubSupportFaqKeys = {
  all: ['platform-admin', 'hub-support-faqs'] as const,
  list: (filters?: { is_published?: boolean; include_trash?: boolean; q?: string }) =>
    [...platformHubSupportFaqKeys.all, 'list', filters] as const,
};

export interface PlatformSupportFaqAdminDto {
  id: number;
  uuid: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
  created_by: number | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

export function usePlatformHubSupportFaqs(
  filters: { is_published?: boolean; include_trash?: boolean; q?: string } = {},
  options?: Omit<
    UseQueryOptions<ApiResponse<PlatformSupportFaqAdminDto[]>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<ApiResponse<PlatformSupportFaqAdminDto[]>, AxiosError<ApiErrorResponse>>({
    queryKey: platformHubSupportFaqKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.is_published !== undefined) params.set('is_published', String(filters.is_published));
      if (filters.include_trash) params.set('include_trash', '1');
      if (filters.q) params.set('q', filters.q);
      const qs = params.toString();
      const url = qs ? `/platform-admin/hub-support-faqs?${qs}` : '/platform-admin/hub-support-faqs';
      const res = await axiosInstance.get<ApiResponse<PlatformSupportFaqAdminDto[]>>(url);
      return res.data;
    },
    staleTime: 0,
    ...options,
  });
}

export interface SupportFaqPayload {
  question: string;
  answer: string;
  sort_order?: number;
  is_published?: boolean;
}

export function useCreatePlatformHubSupportFaq() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<PlatformSupportFaqAdminDto>, AxiosError<ApiErrorResponse>, SupportFaqPayload>({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post<ApiResponse<PlatformSupportFaqAdminDto>>('/platform-admin/hub-support-faqs', payload);
      return res.data;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: platformHubSupportFaqKeys.all });
      const prev = qc.getQueryData(platformHubSupportFaqKeys.all);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(platformHubSupportFaqKeys.all, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: platformHubSupportFaqKeys.all });
      void qc.invalidateQueries({ queryKey: supportFaqKeys.all });
    },
  });
}

export function useUpdatePlatformHubSupportFaq() {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<PlatformSupportFaqAdminDto>,
    AxiosError<ApiErrorResponse>,
    { id: number; payload: Partial<SupportFaqPayload> }
  >({
    mutationFn: async ({ id, payload }) => {
      const res = await axiosInstance.put<ApiResponse<PlatformSupportFaqAdminDto>>(
        `/platform-admin/hub-support-faqs/${id}`,
        payload,
      );
      return res.data;
    },
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: platformHubSupportFaqKeys.all });
      const prev = qc.getQueryData(platformHubSupportFaqKeys.all);
      qc.setQueryData<ApiResponse<PlatformSupportFaqAdminDto[]>>(platformHubSupportFaqKeys.all, (old) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((item) => (item.id === id ? { ...item, ...payload } : item)) };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(platformHubSupportFaqKeys.all, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: platformHubSupportFaqKeys.all });
      void qc.invalidateQueries({ queryKey: supportFaqKeys.all });
    },
  });
}

export function useDeletePlatformHubSupportFaq() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<null>, AxiosError<ApiErrorResponse>, { id: number }>({
    mutationFn: async ({ id }) => {
      const res = await axiosInstance.delete<ApiResponse<null>>(`/platform-admin/hub-support-faqs/${id}`);
      return res.data;
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: platformHubSupportFaqKeys.all });
      const prev = qc.getQueryData(platformHubSupportFaqKeys.all);
      qc.setQueryData<ApiResponse<PlatformSupportFaqAdminDto[]>>(platformHubSupportFaqKeys.all, (old) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter((item) => item.id !== id) };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(platformHubSupportFaqKeys.all, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: platformHubSupportFaqKeys.all });
      void qc.invalidateQueries({ queryKey: supportFaqKeys.all });
    },
  });
}
