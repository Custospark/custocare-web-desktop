import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  FacilityTasksListResponse,
  MyFacilityTasksQueryParams,
  UpdateFacilityTaskApiResponse,
  UpdateFacilityTaskPayload,
} from './facilityTaskTypes';

export const facilityTaskKeys = {
  all: ['nursing', 'facility-tasks'] as const,
  my: (facilityId: number, filters: Record<string, unknown>) =>
    [...facilityTaskKeys.all, 'my', facilityId, filters] as const,
};

export function useMyFacilityTasks(params: MyFacilityTasksQueryParams & { enabled?: boolean }) {
  const { facilityId, status, priority, page = 1, per_page = 25, enabled = true } = params;

  const queryEnabled = enabled && facilityId > 0;

  return useQuery({
    queryKey: facilityTaskKeys.my(facilityId, { status: status ?? '', priority: priority ?? '', page, per_page }),
    queryFn: async () => {
      const response = await axiosInstance.get<FacilityTasksListResponse>('/facility-tasks/my', {
        params: {
          facility_id: facilityId,
          ...(status ? { status } : {}),
          ...(priority ? { priority } : {}),
          page,
          per_page,
        },
      });
      return response.data;
    },
    enabled: queryEnabled,
    staleTime: 30_000,
  });
}

export function useUpdateFacilityTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, payload }: { taskId: number; payload: UpdateFacilityTaskPayload }) => {
      const response = await axiosInstance.patch<UpdateFacilityTaskApiResponse>(
        `/facility-tasks/${taskId}`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facilityTaskKeys.all });
    },
  });
}
