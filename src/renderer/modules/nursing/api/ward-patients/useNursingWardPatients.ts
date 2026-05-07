import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type { RootState } from '../../../../app/store/store';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import type {
  ApiErrorResponse,
  QueueVisitItem,
} from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';

export interface NursingWardPatientsMeta {
  facility_id: number;
  ward_id?: number | null;
  queue_visits: QueueVisitItem[];
  total: number;
}

export interface NursingWardPatientsResponse {
  success: boolean;
  message?: string;
  meta: NursingWardPatientsMeta;
}

export const nursingWardPatientsKeys = {
  all: ['nursing', 'ward-patients'] as const,
  list: (facilityId: number, wardId?: number) =>
    [...nursingWardPatientsKeys.all, facilityId, wardId ?? 'all'] as const,
};

export interface NursingWardPatientsFilters {
  ward_id?: number;
  limit?: number;
}

export function useNursingWardPatients(
  filters: NursingWardPatientsFilters = {},
  options?: Omit<
    UseQueryOptions<NursingWardPatientsResponse, AxiosError<ApiErrorResponse>, NursingWardPatientsResponse>,
    'queryKey' | 'queryFn'
  >
) {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const fid = Number(facilityId) || 0;

  return useQuery({
    queryKey: nursingWardPatientsKeys.list(fid, filters.ward_id),
    queryFn: async (): Promise<NursingWardPatientsResponse> => {
      if (!fid) {
        throw new Error('No active facility');
      }

      const res = await axiosInstance.get<NursingWardPatientsResponse>('nursing/ward-patients', {
        params: {
          ward_id: filters.ward_id,
          limit: filters.limit ?? 100,
        },
        headers: {
          'X-Facility-Id': String(fid),
        },
      });

      if (!res.data?.success || !res.data.meta) {
        throw new Error(res.data?.message || 'Failed to load ward patients');
      }

      return res.data;
    },
    enabled: fid > 0 && (options?.enabled ?? true),
    staleTime: 5000,
    refetchInterval: 15000,
    ...options,
  });
}
