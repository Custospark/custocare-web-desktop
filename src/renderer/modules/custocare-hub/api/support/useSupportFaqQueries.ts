import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type { ApiErrorResponse, ApiResponse, SupportFaqDto } from './supportFaqTypes';

export const supportFaqKeys = {
  all: ['hub-support-faqs'] as const,
  published: (q?: string) => [...supportFaqKeys.all, 'published', q ?? ''] as const,
};

export function usePublishedSupportFaqs(
  searchQuery: string | undefined,
  options?: Omit<
    UseQueryOptions<ApiResponse<SupportFaqDto[]>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  const q = searchQuery?.trim() || undefined;

  return useQuery<ApiResponse<SupportFaqDto[]>, AxiosError<ApiErrorResponse>>({
    queryKey: supportFaqKeys.published(q),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      const qs = params.toString();
      const url = qs ? `/hub-support/faqs?${qs}` : '/hub-support/faqs';
      const res = await axiosInstance.get<ApiResponse<SupportFaqDto[]>>(url);
      return res.data;
    },
    staleTime: 60_000,
    ...options,
  });
}
