import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type { PatientMedicalHistoryApiResponse, PatientMedicalHistoryPayload } from './patientMedicalHistoryTypes';

export const patientMedicalHistoryKeys = {
  all: () => ['patient-medical-history'] as const,
  detail: (patientId: number) => [...patientMedicalHistoryKeys.all(), patientId] as const,
};

export function usePatientMedicalHistory(
  patientId: number,
  options?: Omit<
    UseQueryOptions<PatientMedicalHistoryPayload, AxiosError, PatientMedicalHistoryPayload>,
    'queryKey' | 'queryFn'
  > & { enabled?: boolean }
) {
  const { enabled: enabledOption, ...queryOptions } = options ?? {};

  return useQuery({
    queryKey: patientMedicalHistoryKeys.detail(patientId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<PatientMedicalHistoryApiResponse>(
        `/patients/${patientId}/medical-history`
      );
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to load patient medical history');
      }
      return data.data;
    },
    enabled: (enabledOption ?? true) && patientId > 0,
    staleTime: 60_000,
    ...queryOptions,
  });
}
