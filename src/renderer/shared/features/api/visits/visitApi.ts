import axiosInstance from '../configs/axiosConfig';
import { ENDPOINTS } from '../endpoints/endpoints';
import type {
  Visit,
  VisitCreateData,
  VisitTransitionData,
  EmergencyVisitData,
  VisitFilterParams,
  PaginatedResponse,
  ApiResponse,
  VisitStatsResponse,
  DateRangeParams,
  PriorityLevel,
} from '../../types/visit';

export const visitApi = {
  // Create a new visit
  createVisit: async (visitData: VisitCreateData): Promise<ApiResponse<Visit>> => {
    const response = await axiosInstance.post<ApiResponse<Visit>>(
      ENDPOINTS.VISITS.CREATE,
      visitData
    );
    return response.data;
  },

  // Create emergency visit with minimal patient data
  createEmergencyVisit: async (emergencyData: EmergencyVisitData): Promise<ApiResponse<Visit>> => {
    const response = await axiosInstance.post<ApiResponse<Visit>>(
      ENDPOINTS.VISITS.EMERGENCY,
      emergencyData
    );
    return response.data;
  },

  // Get visit by ID
  getVisitById: async (id: string): Promise<ApiResponse<Visit>> => {
    const response = await axiosInstance.get<ApiResponse<Visit>>(
      ENDPOINTS.VISITS.GET_BY_ID(id)
    );
    return response.data;
  },

  // Transition visit state
  transitionVisit: async (transitionData: VisitTransitionData): Promise<ApiResponse<Visit>> => {
    const response = await axiosInstance.put<ApiResponse<Visit>>(
      ENDPOINTS.VISITS.TRANSITION(transitionData.visitId),
      transitionData
    );
    return response.data;
  },

  // Get visits for a specific patient
  getPatientVisits: async (
    patientId: string, 
    params?: Partial<VisitFilterParams>
  ): Promise<PaginatedResponse<Visit>> => {
    const response = await axiosInstance.get<PaginatedResponse<Visit>>(
      ENDPOINTS.VISITS.GET_PATIENT_VISITS(patientId),
      { params }
    );
    return response.data;
  },

  // Update visit priority
  updateVisitPriority: async (
    visitId: string, 
    priority: PriorityLevel,  // Changed from string to PriorityLevel
    reason?: string
  ): Promise<ApiResponse<Visit>> => {
    const response = await axiosInstance.put<ApiResponse<Visit>>(
      ENDPOINTS.VISITS.UPDATE_PRIORITY(visitId),
      { priority, reason }
    );
    return response.data;
  },

  // Assign visit to staff
  assignVisit: async (
    visitId: string, 
    assignTo: string, 
    notes?: string
  ): Promise<ApiResponse<Visit>> => {
    const response = await axiosInstance.put<ApiResponse<Visit>>(
      ENDPOINTS.VISITS.UPDATE_ASSIGNMENT(visitId),
      { assignedTo: assignTo, notes }
    );
    return response.data;
  },

  // Filter visits with complex criteria
  filterVisits: async (
    filterParams: VisitFilterParams
  ): Promise<PaginatedResponse<Visit>> => {
    const response = await axiosInstance.post<PaginatedResponse<Visit>>(
      ENDPOINTS.VISITS.FILTER,
      filterParams
    );
    return response.data;
  },

  // Get visit statistics - FIXED: Removed 'any' type
  getVisitStats: async (
    facilityId?: string, 
    dateRange?: DateRangeParams
  ): Promise<VisitStatsResponse> => {
    const response = await axiosInstance.get<VisitStatsResponse>(
      ENDPOINTS.VISITS.STATS,
      { params: { facilityId, ...dateRange } }
    );
    return response.data;
  },
};