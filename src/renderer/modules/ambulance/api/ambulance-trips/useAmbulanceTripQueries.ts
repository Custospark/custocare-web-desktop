import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type { RootState } from '../../../../app/store/rootReducer';
import {
  selectActiveVisitId,
  selectActiveVisitPatientId,
} from '../../../../app/store/slices/visitSlice';
import type {
  AmbulanceTrip,
  AmbulanceTripCollection,
  CreateAmbulanceTripRequest,
  UpdateAmbulanceTripRequest,
} from './ambulanceTripTypes';

export const tripKeys = {
  all: ['ambulance-trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...tripKeys.lists(), filters] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...tripKeys.details(), uuid] as const,
};

export const useTrips = (filters?: Record<string, unknown>, perPage = 15) =>
  useQuery<AmbulanceTripCollection>({
    queryKey: tripKeys.list(filters),
    queryFn: async () => {
      const { data } = await axiosInstance.get('/ambulance-trips', {
        params: { ...filters, per_page: perPage },
      });
      return data;
    },
  });

export const useTrip = (uuid: string) =>
  useQuery({
    queryKey: tripKeys.detail(uuid),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/ambulance-trips/${uuid}`);
      return data;
    },
    enabled: !!uuid,
  });

export const useActiveTrips = (filters?: Record<string, unknown>) =>
  useQuery<AmbulanceTripCollection>({
    queryKey: [...tripKeys.all, 'active', filters],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/ambulance-trips/active', {
        params: filters,
      });
      return data;
    },
    refetchInterval: 30_000,
  });

export const useTripsByPatient = (patientId: number) =>
  useQuery<AmbulanceTripCollection>({
    queryKey: [...tripKeys.all, 'patient', patientId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/ambulance-trips/patient/${patientId}`);
      return data;
    },
    enabled: !!patientId,
  });

export const useTripsFromFacility = (facilityId: number) =>
  useQuery<AmbulanceTripCollection>({
    queryKey: [...tripKeys.all, 'from-facility', facilityId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/ambulance-trips/from-facility/${facilityId}`);
      return data;
    },
    enabled: !!facilityId,
  });

export const useTripsToFacility = (facilityId: number) =>
  useQuery<AmbulanceTripCollection>({
    queryKey: [...tripKeys.all, 'to-facility', facilityId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/ambulance-trips/to-facility/${facilityId}`);
      return data;
    },
    enabled: !!facilityId,
  });

const TERMINAL_TRIP_STATUSES = new Set(['completed', 'cancelled']);

function pickVisitTrip(trips: AmbulanceTrip[], visitId: number | null): AmbulanceTrip | null {
  if (!trips.length) return null;
  const forVisit = visitId ? trips.filter((t) => t.visit_id === visitId) : trips;
  const pool = forVisit.length ? forVisit : trips;
  return (
    pool.find((t) => !TERMINAL_TRIP_STATUSES.has(t.status)) ??
    pool[0] ??
    null
  );
}

/** Trips for the visit loaded in visitSlice (transport encounter center). */
export const useActiveVisitTrip = () => {
  const visitId = useSelector((s: RootState) => selectActiveVisitId(s));
  const patientId = useSelector((s: RootState) => selectActiveVisitPatientId(s));
  const filters =
    visitId != null
      ? { visit_id: visitId }
      : patientId != null
        ? { patient_id: patientId }
        : undefined;

  const query = useTrips(filters, 25);
  const trips = query.data?.data ?? [];
  const trip = pickVisitTrip(trips, visitId);

  return {
    ...query,
    trips,
    trip,
    tripUuid: trip?.trip_uuid ?? null,
    visitId,
    patientId,
  };
};

export const useCreateTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAmbulanceTripRequest) => {
      const { data } = await axiosInstance.post('/ambulance-trips', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.lists() }),
  });
};

export const useUpdateTrip = (uuid: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateAmbulanceTripRequest) => {
      const { data } = await axiosInstance.put(`/ambulance-trips/${uuid}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.lists() });
      qc.invalidateQueries({ queryKey: tripKeys.detail(uuid) });
    },
  });
};

export const useDeleteTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (uuid: string) => {
      await axiosInstance.delete(`/ambulance-trips/${uuid}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.lists() }),
  });
};

// ─── Status Transition Mutations ───

export const useDispatchTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uuid, ambulance_id }: { uuid: string; ambulance_id?: number }) => {
      const { data } = await axiosInstance.post(`/ambulance-trips/${uuid}/dispatch`, { ambulance_id });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
};

export const useMarkEnRoute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data } = await axiosInstance.post(`/ambulance-trips/${uuid}/en-route`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
};

export const useMarkOnScene = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data } = await axiosInstance.post(`/ambulance-trips/${uuid}/on-scene`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
};

export const useMarkPatientContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data } = await axiosInstance.post(`/ambulance-trips/${uuid}/patient-contact`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
};

export const useMarkDepartScene = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data } = await axiosInstance.post(`/ambulance-trips/${uuid}/depart-scene`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
};

export const useMarkAtDestination = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data } = await axiosInstance.post(`/ambulance-trips/${uuid}/at-destination`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
};

export const useCompleteTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data } = await axiosInstance.post(`/ambulance-trips/${uuid}/complete`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
};

export const useCancelTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uuid, reason }: { uuid: string; reason?: string }) => {
      const { data } = await axiosInstance.post(`/ambulance-trips/${uuid}/cancel`, { reason });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
};
