import { useMutation, useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  AssignWardBedApiResponse,
  AssignWardBedPayload,
  WardBedOptionsApiResponse,
  BedOption,
} from './wardBedTypes';

export const nursingWardBedKeys = {
  all: ['nursing', 'ward-bed'] as const,
  byVisit: (visitUuid: string) => [...nursingWardBedKeys.all, visitUuid] as const,
  byWard: (wardId: number) => [...nursingWardBedKeys.all, 'ward', wardId] as const,
};

export const useWardBedOptions = (visitUuid: string | null) =>
  useQuery({
    queryKey: nursingWardBedKeys.byVisit(visitUuid ?? 'unknown'),
    enabled: Boolean(visitUuid),
    queryFn: async () => {
      const response = await axiosInstance.get<WardBedOptionsApiResponse>(
        `/visits/${visitUuid}/ward-bed-options`
      );
      return response.data.data;
    },
  });

export const useAssignWardBed = () =>
  useMutation({
    mutationFn: async ({
      visitUuid,
      payload,
    }: {
      visitUuid: string;
      payload: AssignWardBedPayload;
    }) => {
      const response = await axiosInstance.post<AssignWardBedApiResponse>(
        `/visits/${visitUuid}/ward-bed-assignment`,
        payload
      );
      return response.data;
    },
  });

export const useWardBeds = (wardId: number | null, facilityId: number | null) =>
  useQuery({
    queryKey: nursingWardBedKeys.byWard(wardId ?? 0),
    enabled: Boolean(wardId && facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: BedOption[] }>(`/wards/${wardId}/beds`, {
        params: { facility_id: facilityId },
      });
      return response.data.data;
    },
  });

export const useCreateWardBed = () =>
  useMutation({
    mutationFn: async ({
      wardId,
      facilityId,
      bedLabel,
    }: {
      wardId: number;
      facilityId: number;
      bedLabel: string;
    }) => {
      const response = await axiosInstance.post(`/wards/${wardId}/beds`, {
        facility_id: facilityId,
        bed_label: bedLabel,
      });
      return response.data;
    },
  });

export const useUpdateWardBed = () =>
  useMutation({
    mutationFn: async ({
      bedId,
      facilityId,
      wardId,
      bedLabel,
      status,
    }: {
      bedId: number;
      facilityId: number;
      wardId?: number;
      bedLabel?: string;
      status?: 'available' | 'occupied' | 'maintenance' | 'inactive';
    }) => {
      const response = await axiosInstance.patch(`/ward-beds/${bedId}`, {
        facility_id: facilityId,
        ward_id: wardId,
        bed_label: bedLabel,
        status,
      });
      return response.data;
    },
  });

