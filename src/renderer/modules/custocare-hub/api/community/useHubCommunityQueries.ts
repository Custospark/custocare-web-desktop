import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  ApiErrorResponse,
  ApiPaginatedResponse,
  ApiResponse,
  HubCommunityChannel,
  HubCommunityCommentDto,
  HubCommunityPostDetailDto,
  HubCommunityPostDetailResponse,
  HubCommunityPostSummaryDto,
} from './hubCommunityTypes';

export const hubCommunityKeys = {
  all: ['hub-community'] as const,
  posts: (channel: HubCommunityChannel | null, page: number) =>
    [...hubCommunityKeys.all, 'posts', channel ?? 'all', page] as const,
  post: (uuid: string) => [...hubCommunityKeys.all, 'post', uuid] as const,
};

export function useHubCommunityPosts(
  channel: HubCommunityChannel | null,
  page: number,
  perPage = 15,
  options?: Omit<
    UseQueryOptions<ApiPaginatedResponse<HubCommunityPostSummaryDto>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<ApiPaginatedResponse<HubCommunityPostSummaryDto>, AxiosError<ApiErrorResponse>>({
    queryKey: hubCommunityKeys.posts(channel, page),
    queryFn: async () => {
      const res = await axiosInstance.get<ApiPaginatedResponse<HubCommunityPostSummaryDto>>(
        '/hub-community/posts',
        {
          params: {
            ...(channel ? { channel } : {}),
            page,
            per_page: perPage,
          },
        },
      );
      return res.data;
    },
    staleTime: 20_000,
    ...options,
  });
}

export function useHubCommunityPostDetail(
  uuid: string | null,
  options?: Omit<
    UseQueryOptions<ApiResponse<HubCommunityPostDetailResponse>, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn' | 'enabled'
  > & { enabled?: boolean },
) {
  const { enabled: enabledOption = true, ...queryOptions } = options ?? {};
  const enabled = !!uuid && enabledOption;

  return useQuery<ApiResponse<HubCommunityPostDetailResponse>, AxiosError<ApiErrorResponse>>({
    ...queryOptions,
    queryKey: hubCommunityKeys.post(uuid ?? ''),
    queryFn: async () => {
      const res = await axiosInstance.get<ApiResponse<HubCommunityPostDetailResponse>>(
        `/hub-community/posts/${uuid}`,
      );
      return res.data;
    },
    enabled,
    staleTime: 15_000,
  });
}

export interface CreateHubCommunityPostPayload {
  channel: HubCommunityChannel;
  title: string;
  body: string;
}

export function useCreateHubCommunityPost() {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<HubCommunityPostDetailDto>,
    AxiosError<ApiErrorResponse>,
    CreateHubCommunityPostPayload
  >({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post<ApiResponse<HubCommunityPostDetailDto>>('/hub-community/posts', payload);
      return res.data;
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: hubCommunityKeys.posts(payload.channel, 1) });
      const previous = qc.getQueryData<ApiPaginatedResponse<HubCommunityPostSummaryDto>>(
        hubCommunityKeys.posts(payload.channel, 1),
      );
      if (previous) {
        const optimisticPost: HubCommunityPostSummaryDto = {
          uuid: `temp-${Date.now()}`,
          channel: payload.channel,
          title: payload.title,
          excerpt: payload.body.slice(0, 150),
          comments_count: 0,
          author: { id: null, display_name: 'You' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        qc.setQueryData<ApiPaginatedResponse<HubCommunityPostSummaryDto>>(
          hubCommunityKeys.posts(payload.channel, 1),
          {
            ...previous,
            data: [optimisticPost, ...previous.data],
            meta: { ...previous.meta, total: previous.meta.total + 1 },
          },
        );
      }
      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        qc.setQueryData(hubCommunityKeys.posts(_payload.channel, 1), context.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: hubCommunityKeys.all });
    },
  });
}

export function useCreateHubCommunityComment() {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<HubCommunityCommentDto>,
    AxiosError<ApiErrorResponse>,
    { postUuid: string; body: string }
  >({
    mutationFn: async ({ postUuid, body }) => {
      const res = await axiosInstance.post<ApiResponse<HubCommunityCommentDto>>(
        `/hub-community/posts/${postUuid}/comments`,
        { body },
      );
      return res.data;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: hubCommunityKeys.post(vars.postUuid) });
      const previous = qc.getQueryData<ApiResponse<HubCommunityPostDetailResponse>>(
        hubCommunityKeys.post(vars.postUuid),
      );
      if (previous?.data) {
        const optimisticComment: HubCommunityCommentDto = {
          uuid: `temp-${Date.now()}`,
          body: vars.body,
          author: { id: null, display_name: 'You' },
          created_at: new Date().toISOString(),
        };
        qc.setQueryData<ApiResponse<HubCommunityPostDetailResponse>>(
          hubCommunityKeys.post(vars.postUuid),
          {
            ...previous,
            data: {
              ...previous.data,
              comments: [...previous.data.comments, optimisticComment],
            },
          },
        );
      }
      return { previous };
    },
    onError: (_err, vars, context) => {
      if (context?.previous) {
        qc.setQueryData(hubCommunityKeys.post(vars.postUuid), context.previous);
      }
    },
    onSettled: (_data, _err, vars) => {
      void qc.invalidateQueries({ queryKey: hubCommunityKeys.post(vars.postUuid) });
      void qc.invalidateQueries({ queryKey: hubCommunityKeys.all });
    },
  });
}
