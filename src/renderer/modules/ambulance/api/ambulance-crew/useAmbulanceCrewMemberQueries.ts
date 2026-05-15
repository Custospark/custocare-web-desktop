import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  AmbulanceCrewMemberCollection,
  CreateAmbulanceCrewMemberRequest,
  UpdateAmbulanceCrewMemberRequest,
} from './ambulanceCrewMemberTypes';

export const crewKeys = {
  all: ['ambulance-crew'] as const,
  byAmbulance: (ambulanceId: number) => [...crewKeys.all, 'ambulance', ambulanceId] as const,
  byStaff: (staffId: number) => [...crewKeys.all, 'staff', staffId] as const,
};

export const useCrewByAmbulance = (ambulanceId: number) =>
  useQuery<AmbulanceCrewMemberCollection>({
    queryKey: crewKeys.byAmbulance(ambulanceId),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/ambulance-crew/ambulance/${ambulanceId}`);
      return data;
    },
    enabled: !!ambulanceId,
  });

export const useCrewByStaff = (staffId: number) =>
  useQuery<AmbulanceCrewMemberCollection>({
    queryKey: crewKeys.byStaff(staffId),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/ambulance-crew/staff/${staffId}`);
      return data;
    },
    enabled: !!staffId,
  });

export const useCreateCrewMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAmbulanceCrewMemberRequest) => {
      const { data } = await axiosInstance.post('/ambulance-crew', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crewKeys.all }),
  });
};

export const useUpdateCrewMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number } & UpdateAmbulanceCrewMemberRequest) => {
      const { data } = await axiosInstance.put(`/ambulance-crew/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crewKeys.all }),
  });
};

export const useDeleteCrewMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await axiosInstance.delete(`/ambulance-crew/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crewKeys.all }),
  });
};
