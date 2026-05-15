import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type { AmbulanceTripLogCollection, CreateAmbulanceTripLogRequest } from './ambulanceTripLogTypes';

export const useTripLogs = (tripUuid: string) =>
  useQuery<AmbulanceTripLogCollection>({
    queryKey: ['ambulance-trip-logs', tripUuid],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/ambulance-trips/${tripUuid}/logs`);
      return data;
    },
    enabled: !!tripUuid,
  });

export const useCreateTripLog = (tripUuid: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAmbulanceTripLogRequest) => {
      const { data } = await axiosInstance.post(`/ambulance-trips/${tripUuid}/logs`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ambulance-trip-logs', tripUuid] }),
  });
};

export const useDeleteTripLog = (tripUuid: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (logId: number) => {
      await axiosInstance.delete(`/ambulance-trips/${tripUuid}/logs/${logId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ambulance-trip-logs', tripUuid] }),
  });
};
