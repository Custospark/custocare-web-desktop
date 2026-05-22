import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type { ApiErrorResponse } from '../../../custocare-hub/api/support/supportFaqTypes';
import { hubCommunityKeys } from '../../../custocare-hub/api/community/useHubCommunityQueries';

export interface PlatformHubProductUpdateRowDto {
  id: number;
  uuid: string;
  title: string;
  excerpt: string;
  comments_count: number;
  author: { id: number | null; display_name: string };
  created_at: string | null;
  updated_at: string | null;
}

export interface PlatformHubProductUpdateDetailDto {
  id: number;
  uuid: string;
  title: string;
  body: string;
  comments_count: number;
  author: { id: number | null; display_name: string };
  created_at: string | null;
  updated_at: string | null;
}

export interface HubProductUpdatesListMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiPaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: HubProductUpdatesListMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const platformHubProductUpdateKeys = {
  all: ['platform-admin', 'hub-product-updates'] as const,
  list: (filters: { page?: number; q?: string }) => [...platformHubProductUpdateKeys.all, 'list', filters] as const,
  detail: (id: number) => [...platformHubProductUpdateKeys.all, 'detail', id] as const,
};

export function usePlatformHubProductUpdates(
  filters: { page?: number; q?: string } = {},
  options?: Omit<
    UseQueryOptions<ApiPaginatedResponse<PlatformHubProductUpdateRowDto>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<ApiPaginatedResponse<PlatformHubProductUpdateRowDto>, AxiosError<ApiErrorResponse>>({
    queryKey: platformHubProductUpdateKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.q?.trim()) params.set('q', filters.q.trim());
      const qs = params.toString();
      const url = qs ? `/platform-admin/hub-product-updates?${qs}` : '/platform-admin/hub-product-updates';
      const res = await axiosInstance.get<ApiPaginatedResponse<PlatformHubProductUpdateRowDto>>(url);
      return res.data;
    },
    staleTime: 15_000,
    ...options,
  });
}

export function usePlatformHubProductUpdateDetail(
  id: number | null,
  options?: Omit<
    UseQueryOptions<ApiResponse<PlatformHubProductUpdateDetailDto>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn' | 'enabled'
  > & { enabled?: boolean },
) {
  const { enabled: enabledFromOption = true, ...rest } = options ?? {};
  const enabled = enabledFromOption && id != null;

  return useQuery<ApiResponse<PlatformHubProductUpdateDetailDto>, AxiosError<ApiErrorResponse>>({
    ...rest,
    queryKey: platformHubProductUpdateKeys.detail(id ?? 0),
    queryFn: async () => {
      const res = await axiosInstance.get<ApiResponse<PlatformHubProductUpdateDetailDto>>(
        `/platform-admin/hub-product-updates/${id}`,
      );
      return res.data;
    },
    enabled,
    staleTime: 15_000,
  });
}

export interface HubProductUpdatePayload {
  title: string;
  body: string;
}

export function useCreatePlatformHubProductUpdate() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<PlatformHubProductUpdateDetailDto>, AxiosError<ApiErrorResponse>, HubProductUpdatePayload, { prev: ApiPaginatedResponse<PlatformHubProductUpdateRowDto> | undefined }>({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post<ApiResponse<PlatformHubProductUpdateDetailDto>>(
        '/platform-admin/hub-product-updates',
        payload,
      );
      return res.data;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: platformHubProductUpdateKeys.all });
      const prev = qc.getQueryData<ApiPaginatedResponse<PlatformHubProductUpdateRowDto>>(platformHubProductUpdateKeys.all);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(platformHubProductUpdateKeys.all, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: platformHubProductUpdateKeys.all });
      void qc.invalidateQueries({ queryKey: hubCommunityKeys.all });
    },
  });
}

export function useUpdatePlatformHubProductUpdate() {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<PlatformHubProductUpdateDetailDto>,
    AxiosError<ApiErrorResponse>,
    { id: number; payload: Partial<HubProductUpdatePayload> },
    { prev: ApiPaginatedResponse<PlatformHubProductUpdateRowDto> | undefined }
  >({
    mutationFn: async ({ id, payload }) => {
      const res = await axiosInstance.put<ApiResponse<PlatformHubProductUpdateDetailDto>>(
        `/platform-admin/hub-product-updates/${id}`,
        payload,
      );
      return res.data;
    },
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: platformHubProductUpdateKeys.all });
      const prev = qc.getQueryData<ApiPaginatedResponse<PlatformHubProductUpdateRowDto>>(platformHubProductUpdateKeys.all);
      qc.setQueryData<ApiPaginatedResponse<PlatformHubProductUpdateRowDto>>(platformHubProductUpdateKeys.all, (old) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((item) => (item.id === id ? { ...item, ...payload } : item)) };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(platformHubProductUpdateKeys.all, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: platformHubProductUpdateKeys.all });
      void qc.invalidateQueries({ queryKey: hubCommunityKeys.all });
    },
  });
}

export function useDeletePlatformHubProductUpdate() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<null>, AxiosError<ApiErrorResponse>, { id: number }, { prev: ApiPaginatedResponse<PlatformHubProductUpdateRowDto> | undefined }>({
    mutationFn: async ({ id }) => {
      const res = await axiosInstance.delete<ApiResponse<null>>(`/platform-admin/hub-product-updates/${id}`);
      return res.data;
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: platformHubProductUpdateKeys.all });
      const prev = qc.getQueryData<ApiPaginatedResponse<PlatformHubProductUpdateRowDto>>(platformHubProductUpdateKeys.all);
      qc.setQueryData<ApiPaginatedResponse<PlatformHubProductUpdateRowDto>>(platformHubProductUpdateKeys.all, (old) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter((item) => item.id !== id) };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(platformHubProductUpdateKeys.all, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: platformHubProductUpdateKeys.all });
      void qc.invalidateQueries({ queryKey: hubCommunityKeys.all });
    },
  });
}
