import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type { ApiErrorResponse, ApiResponse, LearningMaterialDto } from './learningMaterialTypes';

export const learningMaterialKeys = {
  all: ['learning-materials'] as const,
  list: (category?: string) => [...learningMaterialKeys.all, 'list', category ?? 'all'] as const,
  detail: (uuid: string) => [...learningMaterialKeys.all, 'detail', uuid] as const,
};

export function usePublishedLearningMaterials(
  category: string | undefined,
  options?: Omit<
    UseQueryOptions<ApiResponse<LearningMaterialDto[]>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<ApiResponse<LearningMaterialDto[]>, AxiosError<ApiErrorResponse>>({
    queryKey: learningMaterialKeys.list(category),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      const qs = params.toString();
      const url = qs ? `/learning-materials?${qs}` : '/learning-materials';
      const response = await axiosInstance.get<ApiResponse<LearningMaterialDto[]>>(url);
      return response.data;
    },
    staleTime: 60_000,
    ...options,
  });
}

export function usePublishedLearningMaterial(
  uuid: string | undefined,
  options?: Omit<
    UseQueryOptions<ApiResponse<LearningMaterialDto>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<ApiResponse<LearningMaterialDto>, AxiosError<ApiErrorResponse>>({
    queryKey: learningMaterialKeys.detail(uuid ?? ''),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<LearningMaterialDto>>(`/learning-materials/${uuid}`);
      return response.data;
    },
    enabled: Boolean(uuid),
    staleTime: 60_000,
    ...options,
  });
}
