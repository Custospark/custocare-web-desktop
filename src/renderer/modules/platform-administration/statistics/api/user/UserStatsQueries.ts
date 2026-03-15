/**
 * ============================================================================
 * USER STATISTICS REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query hooks for user statistics.
 * No caching to ensure real-time data for platform administrators.
 * 
 * @module useUserStatsQueries
 */

import { useQuery, useQueries } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import type {
  ApiResponse,
  ApiErrorResponse,
  UserStatistics,
  KeyMetric,
  VerificationFunnel,
  DailyActivity,
  WeeklyTrend,
  MonthlyTrend,
  DemographicDistribution,
  MfaAdoption,
  GeographicDistribution,
  PlatformBreakdown,
  UserCohort,
  SecurityMetrics,
  StaffPerformance,
  StatisticsFilters,
}from './UserStatsType';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for statistics - no caching
 */
export const userStatsKeys = {
  all: ['user-statistics'] as const,
  dashboard: (filters?: StatisticsFilters) => [...userStatsKeys.all, 'dashboard', filters] as const,
  keyMetrics: (filters?: StatisticsFilters) => [...userStatsKeys.all, 'key-metrics', filters] as const,
  verificationFunnel: () => [...userStatsKeys.all, 'verification-funnel'] as const,
  dailyActivity: (filters?: StatisticsFilters) => [...userStatsKeys.all, 'daily-activity', filters] as const,
  weeklyTrends: (filters?: StatisticsFilters) => [...userStatsKeys.all, 'weekly-trends', filters] as const,
  monthlyTrends: () => [...userStatsKeys.all, 'monthly-trends'] as const,
  demographics: () => [...userStatsKeys.all, 'demographics'] as const,
  mfaAdoption: () => [...userStatsKeys.all, 'mfa-adoption'] as const,
  geographic: () => [...userStatsKeys.all, 'geographic'] as const,
  platform: () => [...userStatsKeys.all, 'platform'] as const,
  retention: () => [...userStatsKeys.all, 'retention'] as const,
  security: () => [...userStatsKeys.all, 'security'] as const,
  staffPerformance: () => [...userStatsKeys.all, 'staff-performance'] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetch complete dashboard statistics
 * 
 * @param filters - Optional date range filters
 * @returns Query result with all user statistics
 * 
 * @example
 * const { data, isLoading, refetch } = useDashboardStats({ date_range: '30_days' });
 */
export const useDashboardStats = (filters?: StatisticsFilters) => {
  return useQuery<ApiResponse<UserStatistics>, AxiosError<ApiErrorResponse>>({
    queryKey: userStatsKeys.dashboard(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<UserStatistics>>(
        '/admin/statistics/dashboard',
        { params: filters }
      );
      return response.data;
    },
    staleTime: 0, // No caching - always fetch fresh data
    gcTime: 0, // Don't keep in cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

/**
 * Fetch key metrics only
 * 
 * @param filters - Optional date range filters
 * @returns Query result with key metrics
 */
export const useKeyMetrics = (filters?: StatisticsFilters) => {
  return useQuery<ApiResponse<KeyMetric[]>, AxiosError<ApiErrorResponse>>({
    queryKey: userStatsKeys.keyMetrics(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<KeyMetric[]>>(
        '/admin/statistics/key-metrics',
        { params: filters }
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 15000, // Refresh every 15 seconds for metrics
  });
};

/**
 * Fetch verification funnel data
 * 
 * @returns Query result with verification funnel
 */
export const useVerificationFunnel = () => {
  return useQuery<ApiResponse<VerificationFunnel>, AxiosError<ApiErrorResponse>>({
    queryKey: userStatsKeys.verificationFunnel(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<VerificationFunnel>>(
        '/admin/statistics/verification-funnel'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 60000, // Refresh every 60 seconds
  });
};

/**
 * Fetch daily activity data
 * 
 * @param filters - Optional date range filters
 * @returns Query result with daily activity
 */
export const useDailyActivity = (filters?: StatisticsFilters) => {
  return useQuery<ApiResponse<DailyActivity[]>, AxiosError<ApiErrorResponse>>({
    queryKey: userStatsKeys.dailyActivity(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<DailyActivity[]>>(
        '/admin/statistics/daily-activity',
        { params: filters }
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

/**
 * Fetch weekly trends
 * 
 * @param filters - Optional date range filters
 * @returns Query result with weekly trends
 */
export const useWeeklyTrends = (filters?: StatisticsFilters) => {
  return useQuery<ApiResponse<WeeklyTrend[]>, AxiosError<ApiErrorResponse>>({
    queryKey: userStatsKeys.weeklyTrends(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<WeeklyTrend[]>>(
        '/admin/statistics/weekly-trends',
        { params: filters }
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 60000, // Refresh every 60 seconds
  });
};

/**
 * Fetch monthly trends
 * 
 * @returns Query result with monthly trends
 */
export const useMonthlyTrends = () => {
  return useQuery<ApiResponse<MonthlyTrend[]>, AxiosError<ApiErrorResponse>>({
    queryKey: userStatsKeys.monthlyTrends(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<MonthlyTrend[]>>(
        '/admin/statistics/monthly-trends'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 300000, // Refresh every 5 minutes (monthly data changes slowly)
  });
};

/**
 * Fetch demographic distribution
 * 
 * @returns Query result with demographics
 */
export const useDemographicDistribution = () => {
  return useQuery<ApiResponse<DemographicDistribution>, AxiosError<ApiErrorResponse>>({
    queryKey: userStatsKeys.demographics(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<DemographicDistribution>>(
        '/admin/statistics/demographics'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000, // Refresh every hour (demographics change slowly)
  });
};

/**
 * Fetch MFA adoption statistics
 * 
 * @returns Query result with MFA adoption
 */
export const useMfaAdoption = () => {
  return useQuery<ApiResponse<MfaAdoption>, AxiosError<ApiErrorResponse>>({
    queryKey: userStatsKeys.mfaAdoption(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<MfaAdoption>>(
        '/admin/statistics/mfa-adoption'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
};

/**
 * Fetch geographic distribution
 * 
 * @returns Query result with geographic data
 */
export const useGeographicDistribution = () => {
  return useQuery<ApiResponse<GeographicDistribution>, AxiosError<ApiErrorResponse>>({
    queryKey: userStatsKeys.geographic(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<GeographicDistribution>>(
        '/admin/statistics/geographic'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000, // Refresh every hour
  });
};

/**
 * Fetch platform breakdown
 * 
 * @returns Query result with platform data
 */
export const usePlatformBreakdown = () => {
  return useQuery<ApiResponse<PlatformBreakdown>, AxiosError<ApiErrorResponse>>({
    queryKey: userStatsKeys.platform(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<PlatformBreakdown>>(
        '/admin/statistics/platform'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
};

/**
 * Fetch user retention cohorts
 * 
 * @returns Query result with retention data
 */
export const useUserRetention = () => {
  return useQuery<ApiResponse<UserCohort[]>, AxiosError<ApiErrorResponse>>({
    queryKey: userStatsKeys.retention(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<UserCohort[]>>(
        '/admin/statistics/retention'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000, // Refresh every hour
  });
};

/**
 * Fetch security metrics
 * 
 * @returns Query result with security data
 */
export const useSecurityMetrics = () => {
  return useQuery<ApiResponse<SecurityMetrics>, AxiosError<ApiErrorResponse>>({
    queryKey: userStatsKeys.security(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<SecurityMetrics>>(
        '/admin/statistics/security'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
};

/**
 * Fetch staff performance metrics
 * 
 * @returns Query result with staff performance data
 */
export const useStaffPerformance = () => {
  return useQuery<ApiResponse<StaffPerformance>, AxiosError<ApiErrorResponse>>({
    queryKey: userStatsKeys.staffPerformance(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<StaffPerformance>>(
        '/admin/statistics/staff-performance'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 600000, // Refresh every 10 minutes
  });
};

/**
 * Hook to fetch all statistics in parallel
 * Useful for dashboard that needs all data at once
 * 
 * @param filters - Optional filters
 * @returns Object with all query results
 * 
 * @example
 * const { 
 *   dashboard, 
 *   demographics, 
 *   isLoading 
 * } = useAllStatistics({ date_range: '30_days' });
 */
export const useAllStatistics = (filters?: StatisticsFilters) => {
  const results = useQueries({
    queries: [
      {
        queryKey: userStatsKeys.dashboard(filters),
        queryFn: async () => {
          const response = await axiosInstance.get<ApiResponse<UserStatistics>>(
            '/admin/statistics/dashboard',
            { params: filters }
          );
          return response.data;
        },
        staleTime: 0,
        gcTime: 0,
      },
      {
        queryKey: userStatsKeys.demographics(),
        queryFn: async () => {
          const response = await axiosInstance.get<ApiResponse<DemographicDistribution>>(
            '/admin/statistics/demographics'
          );
          return response.data;
        },
        staleTime: 0,
        gcTime: 0,
      },
      {
        queryKey: userStatsKeys.mfaAdoption(),
        queryFn: async () => {
          const response = await axiosInstance.get<ApiResponse<MfaAdoption>>(
            '/admin/statistics/mfa-adoption'
          );
          return response.data;
        },
        staleTime: 0,
        gcTime: 0,
      },
      {
        queryKey: userStatsKeys.geographic(),
        queryFn: async () => {
          const response = await axiosInstance.get<ApiResponse<GeographicDistribution>>(
            '/admin/statistics/geographic'
          );
          return response.data;
        },
        staleTime: 0,
        gcTime: 0,
      },
    ],
  });

  return {
    dashboard: results[0],
    demographics: results[1],
    mfaAdoption: results[2],
    geographic: results[3],
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
    refetchAll: () => results.forEach(result => result.refetch()),
  };
};

/* -------------------------------------------------------------------------- */
/*                            UTILITY FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

/**
 * Extract error message from API error
 */
export const extractStatsErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallback = 'Failed to load statistics'
): string => {
  return error.response?.data?.message || error.message || fallback;
};

/**
 * Format large numbers for display
 */
export const formatStatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export default {
  useDashboardStats,
  useKeyMetrics,
  useVerificationFunnel,
  useDailyActivity,
  useWeeklyTrends,
  useMonthlyTrends,
  useDemographicDistribution,
  useMfaAdoption,
  useGeographicDistribution,
  usePlatformBreakdown,
  useUserRetention,
  useSecurityMetrics,
  useStaffPerformance,
  useAllStatistics,
  userStatsKeys,
  extractStatsErrorMessage,
  formatStatNumber,
};