import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  Ambulance,
  AmbulanceCollection,
  CreateAmbulanceRequest,
  UpdateAmbulanceRequest,
} from './ambulanceTypes';

export const ambulanceKeys = {
  all: ['ambulances'] as const,
  lists: () => [...ambulanceKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...ambulanceKeys.lists(), filters] as const,
  details: () => [...ambulanceKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...ambulanceKeys.details(), uuid] as const,
};

export const useAmbulances = (filters?: Record<string, unknown>, perPage = 15) =>
  useQuery<AmbulanceCollection>({
    queryKey: ambulanceKeys.list(filters),
    queryFn: async () => {
      const { data } = await axiosInstance.get('/ambulances', {
        params: { ...filters, per_page: perPage },
      });
      return data;
    },
  });

export const useAmbulance = (uuid: string) =>
  useQuery<{ data: Ambulance }>({
    queryKey: ambulanceKeys.detail(uuid),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/ambulances/${uuid}`);
      return data;
    },
    enabled: !!uuid,
  });

export const useAvailableAmbulances = (filters?: Record<string, unknown>) =>
  useQuery<AmbulanceCollection>({
    queryKey: [...ambulanceKeys.all, 'available', filters],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/ambulances/available', {
        params: filters,
      });
      return data;
    },
  });

export const useAmbulancesByFacility = (facilityId: number, filters?: Record<string, unknown>) =>
  useQuery<AmbulanceCollection>({
    queryKey: [...ambulanceKeys.all, 'facility', facilityId, filters],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/ambulances/facility/${facilityId}`, {
        params: filters,
      });
      return data;
    },
    enabled: !!facilityId,
  });

export const useCreateAmbulance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAmbulanceRequest) => {
      const { data } = await axiosInstance.post('/ambulances', payload);
      return data;
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ambulanceKeys.lists() });
      const previous = qc.getQueriesData<AmbulanceCollection>({ queryKey: ambulanceKeys.lists() });
      qc.setQueriesData<AmbulanceCollection>({ queryKey: ambulanceKeys.lists() }, (old) => {
        if (!old) return old;
        const optimistic: Ambulance = {
          id: Date.now(),
          ambulance_uuid: `new-${Date.now()}`,
          facility_id: payload.facility_id,
          crew_team_lead_staff_id: payload.crew_team_lead_staff_id ?? null,
          vehicle_identifier: payload.vehicle_identifier,
          vehicle_type: payload.vehicle_type,
          equipment_level: payload.equipment_level ?? null,
          status: payload.status ?? 'available',
          last_service_date: payload.last_service_date ?? null,
          next_service_due_date: payload.next_service_due_date ?? null,
          current_mileage: payload.current_mileage ?? 0,
          capacity: payload.capacity ?? 1,
          features: payload.features ?? null,
          metadata: null as Record<string, unknown> | null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { ...old, data: [optimistic, ...old.data], meta: { ...old.meta, total: old.meta.total + 1 } };
      });
      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ambulanceKeys.lists() }),
  });
};

export const useUpdateAmbulance = (uuid: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateAmbulanceRequest) => {
      const { data } = await axiosInstance.put(`/ambulances/${uuid}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ambulanceKeys.lists() });
      qc.invalidateQueries({ queryKey: ambulanceKeys.detail(uuid) });
    },
  });
};

export const useDeleteAmbulance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (uuid: string) => {
      await axiosInstance.delete(`/ambulances/${uuid}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ambulanceKeys.lists() }),
  });
};
