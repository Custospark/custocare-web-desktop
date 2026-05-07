import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  CreateFacilityShiftHandoverApiResponse,
  CreateFacilityShiftHandoverPayload,
  FacilityShiftHandoversListResponse,
} from './shiftHandoverTypes';

export const shiftHandoverKeys = {
  all: ['nursing', 'facility-shift-handovers'] as const,
  list: (facilityId: number, page: number, perPage: number) =>
    [...shiftHandoverKeys.all, 'list', facilityId, page, perPage] as const,
};

export interface FacilityShiftHandoversQueryParams {
  facilityId: number;
  page?: number;
  per_page?: number;
  enabled?: boolean;
}

export function useFacilityShiftHandovers(params: FacilityShiftHandoversQueryParams) {
  const { facilityId, page = 1, per_page = 20, enabled = true } = params;
  const queryEnabled = enabled && facilityId > 0;

  return useQuery({
    queryKey: shiftHandoverKeys.list(facilityId, page, per_page),
    queryFn: async () => {
      const response = await axiosInstance.get<FacilityShiftHandoversListResponse>('/facility-shift-handovers', {
        params: {
          facility_id: facilityId,
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

export function useCreateFacilityShiftHandover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateFacilityShiftHandoverPayload) => {
      const response = await axiosInstance.post<CreateFacilityShiftHandoverApiResponse>(
        '/facility-shift-handovers',
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftHandoverKeys.all });
    },
  });
}
