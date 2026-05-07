import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  NursingMedicationDoseListResponse,
  NursingMedicationScheduleQueryParams,
} from './nursingMedicationTypes';

export const nursingMedicationKeys = {
  all: ['nursing', 'medication-treatment'] as const,
  schedule: (facilityId: number, filters: Record<string, unknown>) =>
    [...nursingMedicationKeys.all, 'schedule', facilityId, filters] as const,
};

export function useNursingMedicationSchedule(
  params: NursingMedicationScheduleQueryParams & { enabled?: boolean }
) {
  const {
    facilityId,
    visit_id,
    ward_id,
    patient_id,
    status,
    from,
    to,
    page = 1,
    per_page = 20,
    enabled = true,
  } = params;

  const queryEnabled = enabled && facilityId > 0;

  return useQuery({
    queryKey: nursingMedicationKeys.schedule(facilityId, {
      visit_id: visit_id ?? '',
      ward_id: ward_id ?? '',
      patient_id: patient_id ?? '',
      status: status ?? '',
      from: from ?? '',
      to: to ?? '',
      page,
      per_page,
    }),
    queryFn: async () => {
      const response = await axiosInstance.get<NursingMedicationDoseListResponse>(
        '/nursing/medication-doses',
        {
          params: {
            facility_id: facilityId,
            ...(visit_id ? { visit_id } : {}),
            ...(ward_id ? { ward_id } : {}),
            ...(patient_id ? { patient_id } : {}),
            ...(status ? { status } : {}),
            ...(from ? { from } : {}),
            ...(to ? { to } : {}),
            page,
            per_page,
          },
        }
      );
      return response.data;
    },
    enabled: queryEnabled,
    staleTime: 30_000,
  });
}
