import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  ApiErrorResponse,
  ApiResponse,
  LearningMaterialDto,
} from '../../../custocare-hub/api/learning/learningMaterialTypes';

export const platformLearningMaterialKeys = {
  all: ['platform-admin', 'learning-materials'] as const,
  list: (filters?: { category?: string; is_published?: boolean; include_trash?: boolean }) =>
    [...platformLearningMaterialKeys.all, 'list', filters] as const,
};

export function usePlatformLearningMaterials(
  filters: { category?: string; is_published?: boolean; include_trash?: boolean } = {},
  options?: Omit<
    UseQueryOptions<ApiResponse<LearningMaterialDto[]>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<ApiResponse<LearningMaterialDto[]>, AxiosError<ApiErrorResponse>>({
    queryKey: platformLearningMaterialKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.is_published !== undefined) params.set('is_published', String(filters.is_published));
      if (filters.include_trash) params.set('include_trash', '1');
      const qs = params.toString();
      const url = qs ? `/platform-admin/learning-materials?${qs}` : '/platform-admin/learning-materials';
      const response = await axiosInstance.get<ApiResponse<LearningMaterialDto[]>>(url);
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    ...options,
  });
}

export interface LearningMaterialPayload {
  title: string;
  description?: string | null;
  video_url: string;
  thumbnail_path?: string | null;
  thumbnail_url?: string | null;
  banner_image_url?: string | null;
  category: string;
  sort_order?: number;
  is_published?: boolean;
}

export function useCreateLearningMaterial() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<LearningMaterialDto>, AxiosError<ApiErrorResponse>, LearningMaterialPayload, { prev: ApiResponse<LearningMaterialDto[]> | undefined }>({
    mutationFn: async (payload) => {
      const response = await axiosInstance.post<ApiResponse<LearningMaterialDto>>(
        '/platform-admin/learning-materials',
        payload,
      );
      return response.data;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: platformLearningMaterialKeys.all });
      const prev = qc.getQueryData<ApiResponse<LearningMaterialDto[]>>(platformLearningMaterialKeys.all);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(platformLearningMaterialKeys.all, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: platformLearningMaterialKeys.all });
      void qc.invalidateQueries({ queryKey: ['learning-materials'] });
    },
  });
}

export function useUpdateLearningMaterial() {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<LearningMaterialDto>,
    AxiosError<ApiErrorResponse>,
    { id: number; payload: Partial<LearningMaterialPayload> },
    { prev: ApiResponse<LearningMaterialDto[]> | undefined }
  >({
    mutationFn: async ({ id, payload }) => {
      const response = await axiosInstance.put<ApiResponse<LearningMaterialDto>>(
        `/platform-admin/learning-materials/${id}`,
        payload,
      );
      return response.data;
    },
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: platformLearningMaterialKeys.all });
      const prev = qc.getQueryData<ApiResponse<LearningMaterialDto[]>>(platformLearningMaterialKeys.all);
      qc.setQueryData<ApiResponse<LearningMaterialDto[]>>(platformLearningMaterialKeys.all, (old) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((item) => (item.id === id ? { ...item, ...payload } : item)) };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(platformLearningMaterialKeys.all, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: platformLearningMaterialKeys.all });
      void qc.invalidateQueries({ queryKey: ['learning-materials'] });
    },
  });
}

export function usePreviewThumbnailFromVideo() {
  return useMutation<ApiResponse<{ thumbnail_url: string | null }>, AxiosError<ApiErrorResponse>, { video_url: string }>({
    mutationFn: async ({ video_url }) => {
      const params = new URLSearchParams({ video_url });
      const response = await axiosInstance.get<ApiResponse<{ thumbnail_url: string | null }>>(
        `/platform-admin/learning-materials/thumbnail-preview?${params.toString()}`,
      );
      return response.data;
    },
  });
}

export function useUploadLearningThumbnail() {
  return useMutation<
    ApiResponse<{ thumbnail_path: string; thumbnail_url?: string }>,
    AxiosError<ApiErrorResponse>,
    { file: File; learningMaterialId?: number; previousThumbnailPath?: string | null }
  >({
    mutationFn: async ({ file, learningMaterialId, previousThumbnailPath }) => {
      const body = new FormData();
      body.append('photo', file);
      const prev = previousThumbnailPath?.trim();
      if (prev && learningMaterialId == null) {
        body.append('previous_thumbnail_path', prev);
      }
      const url =
        learningMaterialId != null
          ? `/platform-admin/learning-materials/${learningMaterialId}/thumbnail`
          : '/platform-admin/learning-materials/thumbnail';
      const response = await axiosInstance.post<ApiResponse<{ thumbnail_path: string; thumbnail_url?: string }>>(
        url,
        body,
      );
      return response.data;
    },
  });
}

export function useDeleteLearningMaterial() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<null>, AxiosError<ApiErrorResponse>, { id: number }, { prev: ApiResponse<LearningMaterialDto[]> | undefined }>({
    mutationFn: async ({ id }) => {
      const response = await axiosInstance.delete<ApiResponse<null>>(`/platform-admin/learning-materials/${id}`);
      return response.data;
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: platformLearningMaterialKeys.all });
      const prev = qc.getQueryData<ApiResponse<LearningMaterialDto[]>>(platformLearningMaterialKeys.all);
      qc.setQueryData<ApiResponse<LearningMaterialDto[]>>(platformLearningMaterialKeys.all, (old) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter((item) => item.id !== id) };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(platformLearningMaterialKeys.all, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: platformLearningMaterialKeys.all });
      void qc.invalidateQueries({ queryKey: ['learning-materials'] });
    },
  });
}
