import axiosInstance from '../configs/axiosConfig';
import { ENDPOINTS } from '../endpoints/endpoints';
import {
  Patient,
  PatientCreateData,
  PatientSearchParams,
  PatientDuplicateCheck,
  PatientMergeData,
  EmergencyPatientData,
  PaginatedResponse,
  ApiResponse,
  PatientStats,
  PatientActivity,
} from '../../types/patient';

export const patientApi = {
  // Get all patients with pagination
  getPatients: async (params: Partial<PatientSearchParams>) => {
    const response = await axiosInstance.get<PaginatedResponse<Patient>>(
      ENDPOINTS.PATIENTS.LIST,
      { params }
    );
    return response.data;
  },

  // Get patient by ID
  getPatientById: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<Patient>>(
      ENDPOINTS.PATIENTS.GET_BY_ID(id)
    );
    return response.data;
  },

  // Create new patient
  createPatient: async (patientData: PatientCreateData) => {
    const response = await axiosInstance.post<ApiResponse<Patient>>(
      ENDPOINTS.PATIENTS.CREATE,
      patientData
    );
    return response.data;
  },

  // Update patient
  updatePatient: async (id: string, updateData: Partial<Patient>) => {
    const response = await axiosInstance.put<ApiResponse<Patient>>(
      ENDPOINTS.PATIENTS.UPDATE(id),
      updateData
    );
    return response.data;
  },

  // Search patients with advanced filters
  searchPatients: async (searchParams: PatientSearchParams) => {
    const response = await axiosInstance.post<PaginatedResponse<Patient>>(
      ENDPOINTS.PATIENTS.SEARCH,
      searchParams
    );
    return response.data;
  },

  // Check for duplicate patients
  checkDuplicates: async (patientData: PatientDuplicateCheck) => {
    const response = await axiosInstance.post<ApiResponse<Array<{
      patient: Patient;
      matchScore: number;
      matchingFields: string[];
    }>>>(
      ENDPOINTS.PATIENTS.CHECK_DUPLICATES,
      patientData
    );
    return response.data;
  },

  // Merge duplicate patients
  mergePatients: async (mergeData: PatientMergeData) => {
    const response = await axiosInstance.post<ApiResponse<Patient>>(
      ENDPOINTS.PATIENTS.MERGE,
      mergeData
    );
    return response.data;
  },

  // Create emergency patient (minimal data)
  createEmergencyPatient: async (emergencyData: EmergencyPatientData) => {
    const response = await axiosInstance.post<ApiResponse<Patient>>(
      ENDPOINTS.PATIENTS.CREATE,
      {
        ...emergencyData,
        isEmergency: true,
        requiresDataCompletion: true,
        status: 'ACTIVE',
      }
    );
    return response.data;
  },

  // Get patient statistics
 // Get patient statistics
getPatientStats: async (facilityId?: string) => {
  const response = await axiosInstance.get<ApiResponse<PatientStats>>(
    ENDPOINTS.PATIENTS.STATS,
    { params: { facilityId } }
  );
  return response.data;
},

// Get patient activity/visits
getPatientActivity: async (patientId: string) => {
  const response = await axiosInstance.get<ApiResponse<PatientActivity[]>>(
    ENDPOINTS.PATIENTS.ACTIVITY(patientId)
  );
  return response.data;
},

};