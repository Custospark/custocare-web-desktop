import { useQuery, useMutation, useQueryClient, type UseQueryOptions,type QueryKey } from '@tanstack/react-query';
import { visitApi } from './visitApi';
import  {
  type Visit,
  type VisitCreateData,
  type VisitTransitionData,
  type EmergencyVisitData,
  type VisitFilterParams,
  type PaginatedResponse,
  type ApiResponse,
  type PriorityLevel,
} from '../../types/visit';
import { patientQueryKeys } from '../patients/patientQueries';
import { queueQueryKeys } from '../queues/queueQueries';
import { VisitStatus } from '../../types/shared';

// Query keys
export const visitQueryKeys = {
  all: ['visits'] as const,
  lists: () => [...visitQueryKeys.all, 'list'] as const,
  list: (params: Partial<VisitFilterParams>) => 
    [...visitQueryKeys.lists(), params] as const,
  details: () => [...visitQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...visitQueryKeys.details(), id] as const,
  patientVisits: (patientId: string) => 
    [...visitQueryKeys.all, 'patient', patientId] as const,
  stats: (facilityId?: string) => {
    const base = [...visitQueryKeys.all, 'stats'] as const;
    return facilityId ? [...base, facilityId] as const : base;
  },
};

// Type for optimistic update context
interface EmergencyVisitOptimisticContext {
  previousVisits: PaginatedResponse<Visit> | undefined;
  tempId: string;
  tempPatientId: string;
}

interface TransitionVisitOptimisticContext {
  previousVisit: ApiResponse<Visit> | undefined;
}

// Query hooks
export const useVisits = (
  params: Partial<VisitFilterParams>,
  options?: UseQueryOptions<PaginatedResponse<Visit>, Error>
) => {
  return useQuery<PaginatedResponse<Visit>, Error>({
    queryKey: visitQueryKeys.list(params),
    queryFn: () => visitApi.filterVisits({ 
      ...params, 
      page: params.page || 1, 
      pageSize: params.pageSize || 50 ,
      limit:100
    }),
    ...options,
  });
};

export const useVisit = (
  id: string,
  options?: UseQueryOptions<ApiResponse<Visit>, Error>
) => {
  return useQuery<ApiResponse<Visit>, Error>({
    queryKey: visitQueryKeys.detail(id),
    queryFn: () => visitApi.getVisitById(id),
    enabled: !!id,
    ...options,
  });
};

export const usePatientVisits = (
  patientId: string,
  params?: Partial<VisitFilterParams>,
  options?: UseQueryOptions<PaginatedResponse<Visit>, Error>
) => {
  return useQuery<PaginatedResponse<Visit>, Error>({
    queryKey: [...visitQueryKeys.patientVisits(patientId), params],
    queryFn: () => visitApi.getPatientVisits(patientId, params),
    enabled: !!patientId,
    ...options,
  });
};

export const useVisitStats = (facilityId?: string) => {
  return useQuery({
    queryKey: visitQueryKeys.stats(facilityId),
    queryFn: () => visitApi.getVisitStats(facilityId),
  });
};

// Mutation hooks
export const useCreateVisit = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Visit>, Error, VisitCreateData>({
    mutationFn: visitApi.createVisit,
    onSuccess: (data, variables) => {
      // Invalidate visit lists and patient visits
      queryClient.invalidateQueries({ queryKey: visitQueryKeys.lists() });
      queryClient.invalidateQueries({ 
        queryKey: visitQueryKeys.patientVisits(variables.patientId) 
      });
      
      // Invalidate queue queries that might include this visit
      queryClient.invalidateQueries({ queryKey: queueQueryKeys.all });
      
      // Update patient's activity cache
      queryClient.invalidateQueries({ 
        queryKey: patientQueryKeys.activity(variables.patientId) 
      });
      
      // Set the new visit in cache
      queryClient.setQueryData(visitQueryKeys.detail(data.data.id), data);
    },
  });
};

export const useCreateEmergencyVisit = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Visit>, Error, EmergencyVisitData,EmergencyVisitOptimisticContext>({
    mutationFn: visitApi.createEmergencyVisit,
    onSuccess: (data) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: visitQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: queueQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.lists() });
      
      // Set the emergency visit in cache
      queryClient.setQueryData(visitQueryKeys.detail(data.data.id), data);
    },
    // Optimistic update for emergency cases
  onMutate: async () => {
  const tempId = `temp-visit-${Date.now()}`;
  const tempPatientId = `temp-patient-${Date.now()}`;

  await Promise.all([
    queryClient.cancelQueries({ queryKey: visitQueryKeys.lists() }),
    queryClient.cancelQueries({ queryKey: queueQueryKeys.all }),
  ]);

  const previousVisits = queryClient.getQueryData<PaginatedResponse<Visit>>(
    visitQueryKeys.lists()
  );

  // Create optimistic emergency visit
 const newVisit: Visit = {
  // BaseEntity fields
  id: tempId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  updatedBy: 'system',

  // Visit-specific fields
  patientId: tempPatientId,
  visitNumber: `EV-${Date.now()}`, // temp visit number
  status: VisitStatus.REGISTERED,
  priority: "ROUTINE" as PriorityLevel,
  facilityId: 'temp-facility',
  departmentId: 'temp-department',

  // Clinical data
  chiefComplaint: 'Emergency visit',
  symptoms: [],
  initialAssessment: '',
  triageNotes: '',
  physicianNotes: '',
  nursingNotes: [],
  diagnosis: [],
  treatmentPlan: [],
  vitalSigns: [],

  // Timing
  registrationTime: new Date().toISOString(),
  triageTime: undefined,
  physicianSeenTime: undefined,
  treatmentStartTime: undefined,
  dischargeTime: undefined,
  estimatedWaitTime: 0,
  actualWaitTime: 0,

  // Assignment
  assignedNurseId: undefined,
  assignedPhysicianId: undefined,
  assignedRoom: undefined,
  bedNumber: undefined,
  assignedAt: undefined,

  // Disposition
  disposition: undefined,

  // Billing
  billingStatus: 'PENDING',
  isEmergency: true,
  requiresInsuranceVerification: false,
  insuranceVerified: false,
  insuranceVerifiedAt: undefined,
  insuranceVerifiedBy: undefined,

  // Audit trail
  auditTrail: [],

  // Metadata
  tags: [],
  urgencyScore: 5,
  complexityScore: 1,
  isReadmitted: false,
  previousVisitId: undefined,
};


  queryClient.setQueryData<PaginatedResponse<Visit>>(
    visitQueryKeys.lists(), // ✅ Use the actual query key
    (oldData) => {
      if (!oldData) {
        return {
          success: true,
          message: 'Initialized visits',
          timestamp: new Date().toISOString(),
          data: [newVisit],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        };
      }

      return {
        ...oldData,
        data: [...oldData.data, newVisit],
        pagination: {
          ...oldData.pagination,
          total: oldData.pagination.total + 1,
          totalPages: Math.ceil(
            (oldData.pagination.total + 1) / oldData.pagination.limit
          ),
        },
      };
    }
  );

  return {
    previousVisits,
    tempId,
    tempPatientId,
  } as EmergencyVisitOptimisticContext;
},

    onError: (error, variables, context) => {
      console.log(variables)
      // Rollback on error
      if (context) {
        const typedContext = context as EmergencyVisitOptimisticContext;
        if (typedContext.previousVisits) {
          queryClient.setQueryData(
            visitQueryKeys.lists(), 
            typedContext.previousVisits
          );
        }
      }
      console.error('Error creating emergency visit:', error);
    },
  });
};

export const useTransitionVisit = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Visit>, Error, VisitTransitionData,TransitionVisitOptimisticContext >({
    mutationFn: visitApi.transitionVisit,
    onSuccess: (data, variables) => {
      // Update the visit in cache
      queryClient.setQueryData(visitQueryKeys.detail(variables.visitId), data);
      
      // Invalidate lists that might contain this visit
      queryClient.invalidateQueries({ queryKey: visitQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: queueQueryKeys.all });
      
      // If visit is discharged, update patient visits
      if (variables.newStatus === 'DISCHARGED') {
        // Get patient ID from visit cache
        const visit = queryClient.getQueryData<ApiResponse<Visit>>(
          visitQueryKeys.detail(variables.visitId)
        );
        if (visit?.data.patientId) {
          queryClient.invalidateQueries({ 
            queryKey: visitQueryKeys.patientVisits(visit.data.patientId) 
          });
        }
      }
    },
    // Optimistic update for state transitions
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ 
        queryKey: visitQueryKeys.detail(variables.visitId) 
      });
      
      const previousVisit = queryClient.getQueryData<ApiResponse<Visit>>(
        visitQueryKeys.detail(variables.visitId)
      );
      
      if (previousVisit) {
        // Optimistically update visit status
        queryClient.setQueryData<ApiResponse<Visit>>(
          visitQueryKeys.detail(variables.visitId),
          {
            ...previousVisit,
            data: {
              ...previousVisit.data,
              status: variables.newStatus,
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }
      
      const context: TransitionVisitOptimisticContext = {
        previousVisit,
      };
      
      return context;
    },
    onError: (error, variables, context) => {
      console.log(error)
      // Rollback on error
      if (context?.previousVisit) {
        const typedContext = context as TransitionVisitOptimisticContext;
        queryClient.setQueryData(
          visitQueryKeys.detail(variables.visitId),
          typedContext.previousVisit
        );
      }
    },
  });
};

export const useAssignVisit = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ApiResponse<Visit>,
    Error,
    { visitId: string; assignTo: string; notes?: string }
  >({
    mutationFn: ({ visitId, assignTo, notes }) => 
      visitApi.assignVisit(visitId, assignTo, notes),
    onSuccess: (data, variables) => {
      // Update visit cache
      queryClient.setQueryData(visitQueryKeys.detail(variables.visitId), data);
      
      // Invalidate queue queries
      queryClient.invalidateQueries({ queryKey: queueQueryKeys.all });
    },
  });
};

export const useUpdateVisitPriority = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ApiResponse<Visit>,
    Error,
    { visitId: string; priority: PriorityLevel; reason?: string }
  >({
    mutationFn: ({ visitId, priority, reason }) => 
      visitApi.updateVisitPriority(visitId, priority, reason),
    onSuccess: (data, variables) => {
      // Update visit cache
      queryClient.setQueryData(visitQueryKeys.detail(variables.visitId), data);
      
      // Invalidate queue queries
      queryClient.invalidateQueries({ queryKey: queueQueryKeys.all });
    },
  });
};

// Helper function to get all query keys for a specific visit
export const getVisitQueryKeys = (visitId: string): QueryKey[] => [
  visitQueryKeys.detail(visitId),
];

// Helper function to invalidate all visit-related queries
export const invalidateAllVisitQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: visitQueryKeys.all });
};