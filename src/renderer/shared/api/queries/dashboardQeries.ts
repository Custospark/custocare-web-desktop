import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../app/api/axiosConfig'
import { API_ENDPOINTS } from '../endpoints/endpoints'

// Types
export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  appointmentsToday: number;
  pendingReports: number;
  totalRevenue?: number;
}

export interface AnalyticsData {
  date: string;
  value: number;
  label?: string;
}

export interface DashboardAnalytics {
  patientGrowth: AnalyticsData[];
  appointmentStatus: Array<{ status: string; count: number }>;
  departmentDistribution: Array<{ department: string; count: number }>;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

// Query Keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  analytics: () => [...dashboardKeys.all, 'analytics'] as const,
  appointments: () => [...dashboardKeys.all, 'appointments'] as const,
};

/**
 * Get Dashboard Statistics
 */
export const useGetDashboardStats = () => {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const { data } = await axiosInstance.get<DashboardStats>(
        API_ENDPOINTS.DASHBOARD.GET_STATS
      );
      return data;
    },
  });
};

/**
 * Get Dashboard Analytics
 */
export const useGetDashboardAnalytics = () => {
  return useQuery({
    queryKey: dashboardKeys.analytics(),
    queryFn: async () => {
      const { data } = await axiosInstance.get<DashboardAnalytics>(
        API_ENDPOINTS.DASHBOARD.GET_ANALYTICS
      );
      return data;
    },
  });
};

/**
 * Get Upcoming Appointments
 */
export const useGetAppointments = () => {
  return useQuery({
    queryKey: dashboardKeys.appointments(),
    queryFn: async () => {
      const { data } = await axiosInstance.get<Appointment[]>(
        API_ENDPOINTS.DASHBOARD.GET_APPOINTMENTS
      );
      return data;
    },
  });
};