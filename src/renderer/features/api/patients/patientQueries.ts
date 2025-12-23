import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type QueryKey } from '@tanstack/react-query';
import { patientApi } from './patientApi';
import {
  type Patient,
  type PatientCreateData,
  type PatientSearchParams,
  type PatientDuplicateCheck,
  type PatientMergeData,
  type EmergencyPatientData,
  type PaginatedResponse,
  type ApiResponse,
} from '../../types/patient';
import { Gender, PatientStatus } from '../../types/shared';

// Query keys with proper typing
export const patientQueryKeys = {
  all: ['patients'] as const,
  lists: () => [...patientQueryKeys.all, 'list'] as const,
  list: (params: Partial<PatientSearchParams>) => 
    [...patientQueryKeys.lists(), params] as const,
  details: () => [...patientQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientQueryKeys.details(), id] as const,
  search: (params: PatientSearchParams) => 
    [...patientQueryKeys.all, 'search', params] as const,
  duplicates: (params: PatientDuplicateCheck) => 
    [...patientQueryKeys.all, 'duplicates', params] as const,
  stats: (facilityId?: string) => {
    const base = [...patientQueryKeys.all, 'stats'] as const;
    return facilityId ? [...base, facilityId] as const : base;
  },
  activity: (patientId: string) => 
    [...patientQueryKeys.all, 'activity', patientId] as const,
};

// Type for optimistic update context
interface EmergencyPatientOptimisticContext {
  previousPatients: PaginatedResponse<Patient> | undefined;
  tempId: string;
}

// Query hooks
export const usePatients = (
  params: Partial<PatientSearchParams>,
  options?: UseQueryOptions<PaginatedResponse<Patient>, Error>
) => {
  return useQuery<PaginatedResponse<Patient>, Error>({
    queryKey: patientQueryKeys.list(params),
    queryFn: () => patientApi.getPatients(params),
    ...options,
  });
};

export const usePatient = (
  id: string,
  options?: UseQueryOptions<ApiResponse<Patient>, Error>
) => {
  return useQuery<ApiResponse<Patient>, Error>({
    queryKey: patientQueryKeys.detail(id),
    queryFn: () => patientApi.getPatientById(id),
    enabled: !!id,
    ...options,
  });
};

export const usePatientSearch = (
  params: PatientSearchParams,
  options?: UseQueryOptions<PaginatedResponse<Patient>, Error>
) => {
  return useQuery<PaginatedResponse<Patient>, Error>({
    queryKey: patientQueryKeys.search(params),
    queryFn: () => patientApi.searchPatients(params),
    ...options,
  });
};

export const usePatientStats = (facilityId?: string) => {
  return useQuery({
    queryKey: patientQueryKeys.stats(facilityId),
    queryFn: () => patientApi.getPatientStats(facilityId),
  });
};

export const usePatientActivity = (patientId: string) => {
  return useQuery({
    queryKey: patientQueryKeys.activity(patientId),
    queryFn: () => patientApi.getPatientActivity(patientId),
    enabled: !!patientId,
  });
};

// Mutation hooks
export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Patient>, Error, PatientCreateData>({
    mutationFn: patientApi.createPatient,
    onSuccess: (data) => {
      // Invalidate patient lists
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.lists() });
      
      // Invalidate ALL search queries using the search key prefix
      queryClient.invalidateQueries({ 
        queryKey: [...patientQueryKeys.all, 'search'] 
      });
      
      // Update cache for the new patient
      queryClient.setQueryData(
        patientQueryKeys.detail(data.data.id), 
        data
      );
    },
    onError: (error) => {
      console.error('Error creating patient:', error);
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ApiResponse<Patient>,
    Error,
    { id: string; data: Partial<Patient> }
  >({
    mutationFn: ({ id, data }) => patientApi.updatePatient(id, data),
    onSuccess: (data, variables) => {
      // Update the patient in cache
      queryClient.setQueryData(
        patientQueryKeys.detail(variables.id), 
        data
      );
      
      // Invalidate lists that might contain this patient
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.lists() });
      
      // Also invalidate search queries
      queryClient.invalidateQueries({ 
        queryKey: [...patientQueryKeys.all, 'search'] 
      });
    },
  });
};

export const useCheckDuplicates = () => {
  return useMutation({
    mutationFn: patientApi.checkDuplicates,
    onError: (error) => {
      console.error('Error checking duplicates:', error);
    },
  });
};

export const useMergePatients = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Patient>, Error, PatientMergeData>({
    mutationFn: patientApi.mergePatients,
    onSuccess: (data, variables) => {
      // Remove the duplicate patient from cache
      queryClient.removeQueries({ 
        queryKey: patientQueryKeys.detail(variables.duplicatePatientId) 
      });
      
      // Update the master patient
      queryClient.setQueryData(
        patientQueryKeys.detail(variables.masterPatientId), 
        data
      );
      
      // Invalidate patient lists
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.lists() });
      
      // Invalidate search queries
      queryClient.invalidateQueries({ 
        queryKey: [...patientQueryKeys.all, 'search'] 
      });
    },
  });
};

export const useCreateEmergencyPatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Patient>, Error, EmergencyPatientData>({
    mutationFn: patientApi.createEmergencyPatient,
    onSuccess: (data) => {
      // Invalidate patient lists
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.lists() });
      
      // Invalidate search queries
      queryClient.invalidateQueries({ 
        queryKey: [...patientQueryKeys.all, 'search'] 
      });
      
      // Set the emergency patient in cache
      queryClient.setQueryData(
        patientQueryKeys.detail(data.data.id), 
        data
      );
    },
    // Optimistic update for emergency cases
    onMutate: async (variables) => {
      // Generate temporary ID
      const tempId = `temp-${Date.now()}`;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: patientQueryKeys.lists() 
      });
      
      // Snapshot previous value with proper typing
      const previousPatients = queryClient.getQueryData<PaginatedResponse<Patient>>(
        patientQueryKeys.lists()
      );
      
      // Optimistically update
      queryClient.setQueryData<PaginatedResponse<Patient>>(
        patientQueryKeys.lists(),
        (oldData) => {
          if (!oldData) {
            return {
              items: [],
              total: 0,
              page: 1,
              pageSize: 10,
              totalPages: 0,
            };
          }

          const newPatient: Patient = {
            id: tempId,
            medicalRecordNumber: `EMG-${Date.now()}`,
            demographics: {
              firstName: variables.demographics?.firstName || 'Emergency',
              lastName: variables.demographics?.lastName || 'Patient',
              dateOfBirth: new Date().toISOString(),
              gender: variables.demographics?.gender || Gender.UNKNOWN,
            },
            status:PatientStatus.ACTIVE,
            contactInfo: {
              phone: '',
              email: undefined,
              emergencyContact: variables.emergencyContact,
            },
            medicalInfo: {
              allergies: [],
              chronicConditions: [],
              medications: [],
              knownAllergies: [],
            },
            address: undefined,
            primaryInsurance: undefined,
            secondaryInsurance: undefined,
            dateOfDeath: undefined,
            notes: 'Emergency patient - requires completion',
            preferences: undefined,
            isEmergency: true,
            requiresDataCompletion: true,
            completionPercentage: 30,
            facilityId: 'emergency',
            linkedPatientIds: [],
            masterPatientId: undefined,
            isMasterRecord: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            updatedBy: 'system',
          };
          
          return {
            ...oldData,
            items: [newPatient, ...oldData.items],
            total: oldData.total + 1,
          };
        }
      );
      
      // Return context with proper typing
      return {
        previousPatients,
        tempId,
      } as EmergencyPatientOptimisticContext;
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context) {
        console.log(variables);
        const typedContext = context as EmergencyPatientOptimisticContext;
        if (typedContext.previousPatients) {
          queryClient.setQueryData(
            patientQueryKeys.lists(), 
            typedContext.previousPatients
          );
        }
      }
      console.error('Error creating emergency patient:', error);
    },
  });
};

// Helper function to get all query keys for a specific patient
export const getPatientQueryKeys = (patientId: string): QueryKey[] => [
  patientQueryKeys.detail(patientId),
  patientQueryKeys.activity(patientId),
];

// Helper function to invalidate all patient-related queries
export const invalidateAllPatientQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: patientQueryKeys.all });
};