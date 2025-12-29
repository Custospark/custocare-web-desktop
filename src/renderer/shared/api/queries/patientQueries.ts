import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../app/api/axiosConfig';
import { API_ENDPOINTS } from '../endpoints/endpoints';

/* ======================================================
   Types
====================================================== */

export type Gender = 'M' | 'F' | 'Other';

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  address: string;
  medicalHistory: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PatientsResponse {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
}

export type PatientListFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

/* ======================================================
   Query Keys (STRICT & STABLE)
====================================================== */

export const patientKeys = {
  all: ['patients'] as const,

  lists: () => [...patientKeys.all, 'list'] as const,

  list: (filters: PatientListFilters = {}) =>
    [...patientKeys.lists(), filters] as const,

  details: () => [...patientKeys.all, 'detail'] as const,

  detail: (id: string) =>
    [...patientKeys.details(), id] as const,

  search: (term: string) =>
    [...patientKeys.all, 'search', term] as const,
};

/* ======================================================
   Queries
====================================================== */

/**
 * Get all patients (paginated / filtered)
 */
export const useGetPatients = (filters?: PatientListFilters) =>
  useQuery({
    queryKey: patientKeys.list(filters ?? {}),
    queryFn: async (): Promise<PatientsResponse> => {
      const { data } = await axiosInstance.get<PatientsResponse>(
        API_ENDPOINTS.PATIENTS.LIST,
        { params: filters }
      );
      return data;
    },
    // keepPreviousData: true,
  });

/**
 * Get patient by ID
 */
export const useGetPatientById = (patientId?: string) =>
  useQuery({
    queryKey: patientKeys.detail(patientId ?? ''),
    queryFn: async (): Promise<Patient> => {
      const { data } = await axiosInstance.get<Patient>(
        API_ENDPOINTS.PATIENTS.GET_BY_ID(patientId!)
      );
      return data;
    },
    enabled: Boolean(patientId),
  });

/**
 * Search patients
 */
export const useSearchPatients = (searchTerm: string) =>
  useQuery({
    queryKey: patientKeys.search(searchTerm),
    queryFn: async (): Promise<Patient[]> => {
      const { data } = await axiosInstance.get<Patient[]>(
        API_ENDPOINTS.PATIENTS.SEARCH,
        { params: { q: searchTerm } }
      );
      return data;
    },
    enabled: searchTerm.trim().length > 2,
  });

/* ======================================================
   Mutations
====================================================== */

/**
 * Create patient
 */
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<Patient> => {
      const { data } = await axiosInstance.post<Patient>(
        API_ENDPOINTS.PATIENTS.CREATE,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });
};

/**
 * Update patient
 */
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patientId,
      payload,
    }: {
      patientId: string;
      payload: Partial<Omit<Patient, 'id'>>;
    }): Promise<Patient> => {
      const { data } = await axiosInstance.put<Patient>(
        API_ENDPOINTS.PATIENTS.UPDATE(patientId),
        payload
      );
      return data;
    },
    onSuccess: (updatedPatient) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: patientKeys.detail(updatedPatient.id),
      });
    },
  });
};

/**
 * Delete patient
 */
export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: string): Promise<void> => {
      await axiosInstance.delete(
        API_ENDPOINTS.PATIENTS.DELETE(patientId)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });
};
