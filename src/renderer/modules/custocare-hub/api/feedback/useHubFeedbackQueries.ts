import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  ApiErrorResponse,
  ApiResponse,
  HubFeedbackCategory,
  HubFeedbackMineDto,
  HubFeedbackRoadmapItemDto,
} from './hubFeedbackTypes';

export const hubFeedbackKeys = {
  all: ['hub-feedback'] as const,
  mine: () => [...hubFeedbackKeys.all, 'mine'] as const,
  roadmap: () => [...hubFeedbackKeys.all, 'roadmap'] as const,
};

export function useHubFeedbackMine(
  options?: Omit<
    UseQueryOptions<ApiResponse<HubFeedbackMineDto[]>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<ApiResponse<HubFeedbackMineDto[]>, AxiosError<ApiErrorResponse>>({
    queryKey: hubFeedbackKeys.mine(),
    queryFn: async () => {
      const res = await axiosInstance.get<ApiResponse<HubFeedbackMineDto[]>>('/hub-feedback/mine');
      return res.data;
    },
    staleTime: 30_000,
    ...options,
  });
}

export function useHubFeedbackRoadmap(
  options?: Omit<
    UseQueryOptions<ApiResponse<HubFeedbackRoadmapItemDto[]>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<ApiResponse<HubFeedbackRoadmapItemDto[]>, AxiosError<ApiErrorResponse>>({
    queryKey: hubFeedbackKeys.roadmap(),
    queryFn: async () => {
      const res = await axiosInstance.get<ApiResponse<HubFeedbackRoadmapItemDto[]>>('/hub-feedback/roadmap');
      return res.data;
    },
    staleTime: 30_000,
    ...options,
  });
}

export interface CreateHubFeedbackPayload {
  category: HubFeedbackCategory;
  subject: string;
  body: string;
  include_in_roadmap?: boolean;
}

export function useCreateHubFeedback() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<HubFeedbackMineDto>, AxiosError<ApiErrorResponse>, CreateHubFeedbackPayload>({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post<ApiResponse<HubFeedbackMineDto>>('/hub-feedback', payload);
      return res.data;
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: hubFeedbackKeys.mine() });
      const prev = qc.getQueryData<ApiResponse<HubFeedbackMineDto[]>>(hubFeedbackKeys.mine());
      if (prev?.data) {
        const optimistic: HubFeedbackMineDto = {
          uuid: `optimistic-${Date.now()}`,
          category: payload.category,
          subject: payload.subject,
          body: payload.body,
          status: 'submitted',
          staff_reply: null,
          created_at: new Date().toISOString(),
        } as HubFeedbackMineDto;
        qc.setQueryData<ApiResponse<HubFeedbackMineDto[]>>(hubFeedbackKeys.mine(), {
          ...prev,
          data: [optimistic, ...prev.data],
        });
      }
      return { prev };
    },
    onError: (_err, _payload, context) => {
      if (context?.prev) {
        qc.setQueryData(hubFeedbackKeys.mine(), context.prev);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: hubFeedbackKeys.mine() });
      void qc.invalidateQueries({ queryKey: hubFeedbackKeys.roadmap() });
    },
  });
}

export function useVoteHubFeedback() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<{ uuid: string; votes_count: number; voted_by_you: boolean }>, AxiosError<ApiErrorResponse>, string>({
    mutationFn: async (uuid) => {
      const res = await axiosInstance.post<ApiResponse<{ uuid: string; votes_count: number; voted_by_you: boolean }>>(
        `/hub-feedback/${uuid}/vote`,
        {},
      );
      return res.data;
    },
    onMutate: async (uuid) => {
      await qc.cancelQueries({ queryKey: hubFeedbackKeys.roadmap() });
      const prev = qc.getQueryData<ApiResponse<HubFeedbackRoadmapItemDto[]>>(hubFeedbackKeys.roadmap());
      if (prev?.data) {
        qc.setQueryData<ApiResponse<HubFeedbackRoadmapItemDto[]>>(hubFeedbackKeys.roadmap(), {
          ...prev,
          data: prev.data.map((item) =>
            item.uuid === uuid
              ? {
                  ...item,
                  votes_count: item.voted_by_you ? item.votes_count - 1 : item.votes_count + 1,
                  voted_by_you: !item.voted_by_you,
                }
              : item,
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _uuid, context) => {
      if (context?.prev) {
        qc.setQueryData(hubFeedbackKeys.roadmap(), context.prev);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: hubFeedbackKeys.roadmap() });
    },
  });
}
