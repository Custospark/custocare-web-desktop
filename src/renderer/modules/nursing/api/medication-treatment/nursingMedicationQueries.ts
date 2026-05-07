import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  CreateNursingMedicationAdministrationApiResponse,
  CreateNursingMedicationAdministrationPayload,
  CreateNursingTreatmentLogApiResponse,
  CreateNursingTreatmentLogPayload,
  NursingMedicationAdministrationListResponse,
  NursingMedicationAdministrationQueryParams,
  NursingMedicationDoseListResponse,
  NursingMedicationScheduleQueryParams,
  NursingTreatmentLogListResponse,
  NursingTreatmentLogQueryParams,
} from './nursingMedicationTypes';

export const nursingMedicationKeys = {
  all: ['nursing', 'medication-treatment'] as const,
  schedule: (facilityId: number, filters: Record<string, unknown>) =>
    [...nursingMedicationKeys.all, 'schedule', facilityId, filters] as const,
  missed: (facilityId: number, filters: Record<string, unknown>) =>
    [...nursingMedicationKeys.all, 'missed', facilityId, filters] as const,
  administrations: (facilityId: number, filters: Record<string, unknown>) =>
    [...nursingMedicationKeys.all, 'administrations', facilityId, filters] as const,
  treatmentLogs: (facilityId: number, filters: Record<string, unknown>) =>
    [...nursingMedicationKeys.all, 'treatment-logs', facilityId, filters] as const,
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

export function useNursingMedicationAdministrations(
  params: NursingMedicationAdministrationQueryParams & { enabled?: boolean }
) {
  const { facilityId, visit_id, outcome, from, to, page = 1, per_page = 20, enabled = true } = params;
  const queryEnabled = enabled && facilityId > 0;

  return useQuery({
    queryKey: nursingMedicationKeys.administrations(facilityId, {
      visit_id: visit_id ?? '',
      outcome: outcome ?? '',
      from: from ?? '',
      to: to ?? '',
      page,
      per_page,
    }),
    queryFn: async () => {
      const response = await axiosInstance.get<NursingMedicationAdministrationListResponse>(
        '/nursing/medication-administrations',
        {
          params: {
            facility_id: facilityId,
            ...(visit_id ? { visit_id } : {}),
            ...(outcome ? { outcome } : {}),
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

export function useNursingMissedMedicationDoses(
  params: {
    facilityId: number;
    visit_id?: number;
    ward_id?: number;
    as_of?: string;
    page?: number;
    per_page?: number;
    enabled?: boolean;
  }
) {
  const { facilityId, visit_id, ward_id, as_of, page = 1, per_page = 20, enabled = true } = params;
  const queryEnabled = enabled && facilityId > 0;

  return useQuery({
    queryKey: nursingMedicationKeys.missed(facilityId, {
      visit_id: visit_id ?? '',
      ward_id: ward_id ?? '',
      as_of: as_of ?? '',
      page,
      per_page,
    }),
    queryFn: async () => {
      const response = await axiosInstance.get<NursingMedicationDoseListResponse>(
        '/nursing/medication-doses/missed',
        {
          params: {
            facility_id: facilityId,
            ...(visit_id ? { visit_id } : {}),
            ...(ward_id ? { ward_id } : {}),
            ...(as_of ? { as_of } : {}),
            page,
            per_page,
          },
        }
      );
      return response.data;
    },
    enabled: queryEnabled,
    staleTime: 15_000,
  });
}

export function useCreateNursingMedicationAdministration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateNursingMedicationAdministrationPayload) => {
      const response = await axiosInstance.post<CreateNursingMedicationAdministrationApiResponse>(
        '/nursing/medication-administrations',
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nursingMedicationKeys.all });
    },
  });
}

export function useNursingTreatmentLogs(
  params: NursingTreatmentLogQueryParams & { enabled?: boolean }
) {
  const { facilityId, visit_id, category, from, to, page = 1, per_page = 20, enabled = true } = params;
  const queryEnabled = enabled && facilityId > 0;

  return useQuery({
    queryKey: nursingMedicationKeys.treatmentLogs(facilityId, {
      visit_id: visit_id ?? '',
      category: category ?? '',
      from: from ?? '',
      to: to ?? '',
      page,
      per_page,
    }),
    queryFn: async () => {
      const response = await axiosInstance.get<NursingTreatmentLogListResponse>('/nursing/treatment-logs', {
        params: {
          facility_id: facilityId,
          ...(visit_id ? { visit_id } : {}),
          ...(category ? { category } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
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

export function useCreateNursingTreatmentLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateNursingTreatmentLogPayload) => {
      const response = await axiosInstance.post<CreateNursingTreatmentLogApiResponse>(
        '/nursing/treatment-logs',
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nursingMedicationKeys.all });
    },
  });
}
