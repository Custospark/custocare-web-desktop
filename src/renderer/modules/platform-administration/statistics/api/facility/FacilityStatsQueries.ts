/**
 * ============================================================================
 * FACILITY STATISTICS REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query hooks for facility statistics.
 * No caching to ensure real-time data for platform administrators.
 * 
 * @module useFacilityStatsQueries
 */

import { useQuery, useQueries } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import type {
  ApiResponse,
  ApiErrorResponse,
  FacilityStatistics,
  FacilityKeyMetric,
  FacilityTypeDistribution,
  FacilityTierDistribution,
  NatureDistribution,
  OperationalStatusDistribution,
  GeographicDistribution,
  CapacityMetrics,
  ServiceAvailability,
  SpecialtyServices,
  EmergencyCapabilities,
  AccreditationStats,
  LicenseExpiryMetrics,
  PerformanceMetrics,
  ResidencyDistribution,
  GrowthTrend,
} from './FacilityStatsTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for facility statistics - no caching
 */
export const facilityStatsKeys = {
  all: ['facility-statistics'] as const,
  dashboard: () => [...facilityStatsKeys.all, 'dashboard'] as const,
  keyMetrics: () => [...facilityStatsKeys.all, 'key-metrics'] as const,
  typeDistribution: () => [...facilityStatsKeys.all, 'type-distribution'] as const,
  tierDistribution: () => [...facilityStatsKeys.all, 'tier-distribution'] as const,
  natureDistribution: () => [...facilityStatsKeys.all, 'nature-distribution'] as const,
  statusDistribution: () => [...facilityStatsKeys.all, 'status-distribution'] as const,
  geographic: () => [...facilityStatsKeys.all, 'geographic'] as const,
  capacity: () => [...facilityStatsKeys.all, 'capacity'] as const,
  services: () => [...facilityStatsKeys.all, 'services'] as const,
  specialties: () => [...facilityStatsKeys.all, 'specialties'] as const,
  emergency: () => [...facilityStatsKeys.all, 'emergency'] as const,
  accreditations: () => [...facilityStatsKeys.all, 'accreditations'] as const,
  licenses: () => [...facilityStatsKeys.all, 'licenses'] as const,
  performance: () => [...facilityStatsKeys.all, 'performance'] as const,
  dataResidency: () => [...facilityStatsKeys.all, 'data-residency'] as const,
  growthTrends: () => [...facilityStatsKeys.all, 'growth-trends'] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetch complete facility dashboard statistics
 * 
 * @returns Query result with all facility statistics
 * 
 * @example
 * const { data, isLoading, refetch } = useFacilityDashboardStats();
 */
export const useFacilityDashboardStats = () => {
  return useQuery<ApiResponse<FacilityStatistics>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.dashboard(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<FacilityStatistics>>(
        '/admin/statistics/facilities/dashboard'
      );
      return response.data;
    },
    staleTime: 0, // No caching - always fetch fresh data
    gcTime: 0, // Don't keep in cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Refresh every 60 seconds
  });
};

/**
 * Fetch key metrics only
 * 
 * @returns Query result with key metrics
 */
export const useFacilityKeyMetrics = () => {
  return useQuery<ApiResponse<FacilityKeyMetric[]>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.keyMetrics(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<FacilityKeyMetric[]>>(
        '/admin/statistics/facilities/key-metrics'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 30000, // Refresh every 30 seconds for metrics
  });
};

/**
 * Fetch facility type distribution
 * 
 * @returns Query result with type distribution
 */
export const useFacilityTypeDistribution = () => {
  return useQuery<ApiResponse<FacilityTypeDistribution[]>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.typeDistribution(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<FacilityTypeDistribution[]>>(
        '/admin/statistics/facilities/type-distribution'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000, // Refresh every hour (changes slowly)
  });
};

/**
 * Fetch facility tier distribution
 * 
 * @returns Query result with tier distribution
 */
export const useFacilityTierDistribution = () => {
  return useQuery<ApiResponse<FacilityTierDistribution[]>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.tierDistribution(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<FacilityTierDistribution[]>>(
        '/admin/statistics/facilities/tier-distribution'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000,
  });
};

/**
 * Fetch nature distribution
 * 
 * @returns Query result with nature distribution
 */
export const useNatureDistribution = () => {
  return useQuery<ApiResponse<NatureDistribution[]>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.natureDistribution(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<NatureDistribution[]>>(
        '/admin/statistics/facilities/nature-distribution'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000,
  });
};

/**
 * Fetch operational status distribution
 * 
 * @returns Query result with status distribution
 */
export const useOperationalStatusDistribution = () => {
  return useQuery<ApiResponse<OperationalStatusDistribution[]>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.statusDistribution(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<OperationalStatusDistribution[]>>(
        '/admin/statistics/facilities/status-distribution'
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
export const useFacilityGeographicDistribution = () => {
  return useQuery<ApiResponse<GeographicDistribution>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.geographic(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<GeographicDistribution>>(
        '/admin/statistics/facilities/geographic'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000,
  });
};

/**
 * Fetch capacity metrics
 * 
 * @returns Query result with capacity metrics
 */
export const useCapacityMetrics = () => {
  return useQuery<ApiResponse<CapacityMetrics>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.capacity(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<CapacityMetrics>>(
        '/admin/statistics/facilities/capacity'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000,
  });
};

/**
 * Fetch service availability
 * 
 * @returns Query result with service availability
 */
export const useServiceAvailability = () => {
  return useQuery<ApiResponse<ServiceAvailability>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.services(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<ServiceAvailability>>(
        '/admin/statistics/facilities/services'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000,
  });
};

/**
 * Fetch specialty services
 * 
 * @returns Query result with specialty services
 */
export const useSpecialtyServices = () => {
  return useQuery<ApiResponse<SpecialtyServices>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.specialties(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<SpecialtyServices>>(
        '/admin/statistics/facilities/specialties'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000,
  });
};

/**
 * Fetch emergency capabilities
 * 
 * @returns Query result with emergency capabilities
 */
export const useEmergencyCapabilities = () => {
  return useQuery<ApiResponse<EmergencyCapabilities>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.emergency(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<EmergencyCapabilities>>(
        '/admin/statistics/facilities/emergency'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000,
  });
};

/**
 * Fetch accreditation statistics
 * 
 * @returns Query result with accreditation stats
 */
export const useAccreditationStats = () => {
  return useQuery<ApiResponse<AccreditationStats>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.accreditations(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<AccreditationStats>>(
        '/admin/statistics/facilities/accreditations'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 86400000, // Refresh every 24 hours (changes very slowly)
  });
};

/**
 * Fetch license expiry metrics
 * 
 * @returns Query result with license expiry metrics
 */
export const useLicenseExpiryMetrics = () => {
  return useQuery<ApiResponse<LicenseExpiryMetrics>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.licenses(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<LicenseExpiryMetrics>>(
        '/admin/statistics/facilities/licenses'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000, // Refresh every hour
  });
};

/**
 * Fetch performance metrics
 * 
 * @returns Query result with performance metrics
 */
export const usePerformanceMetrics = () => {
  return useQuery<ApiResponse<PerformanceMetrics>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.performance(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<PerformanceMetrics>>(
        '/admin/statistics/facilities/performance'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
};

/**
 * Fetch data residency distribution
 * 
 * @returns Query result with data residency distribution
 */
export const useDataResidencyDistribution = () => {
  return useQuery<ApiResponse<ResidencyDistribution[]>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.dataResidency(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<ResidencyDistribution[]>>(
        '/admin/statistics/facilities/data-residency'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000,
  });
};

/**
 * Fetch facility growth trends
 * 
 * @returns Query result with growth trends
 */
export const useFacilityGrowthTrends = () => {
  return useQuery<ApiResponse<GrowthTrend[]>, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStatsKeys.growthTrends(),
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<GrowthTrend[]>>(
        '/admin/statistics/facilities/growth-trends'
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 3600000,
  });
};

/**
 * Hook to fetch all facility statistics in parallel
 * Useful for dashboard that needs all data at once
 * 
 * @returns Object with all query results
 * 
 * @example
 * const { 
 *   dashboard, 
 *   typeDistribution, 
 *   isLoading 
 * } = useAllFacilityStatistics();
 */
export const useAllFacilityStatistics = () => {
  const results = useQueries({
    queries: [
      {
        queryKey: facilityStatsKeys.dashboard(),
        queryFn: async () => {
          const response = await axiosInstance.get<ApiResponse<FacilityStatistics>>(
            '/admin/statistics/facilities/dashboard'
          );
          return response.data;
        },
        staleTime: 0,
        gcTime: 0,
      },
      {
        queryKey: facilityStatsKeys.typeDistribution(),
        queryFn: async () => {
          const response = await axiosInstance.get<ApiResponse<FacilityTypeDistribution[]>>(
            '/admin/statistics/facilities/type-distribution'
          );
          return response.data;
        },
        staleTime: 0,
        gcTime: 0,
      },
      {
        queryKey: facilityStatsKeys.tierDistribution(),
        queryFn: async () => {
          const response = await axiosInstance.get<ApiResponse<FacilityTierDistribution[]>>(
            '/admin/statistics/facilities/tier-distribution'
          );
          return response.data;
        },
        staleTime: 0,
        gcTime: 0,
      },
      {
        queryKey: facilityStatsKeys.statusDistribution(),
        queryFn: async () => {
          const response = await axiosInstance.get<ApiResponse<OperationalStatusDistribution[]>>(
            '/admin/statistics/facilities/status-distribution'
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
    typeDistribution: results[1],
    tierDistribution: results[2],
    statusDistribution: results[3],
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
export const extractFacilityStatsErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallback = 'Failed to load facility statistics'
): string => {
  return error.response?.data?.message || error.message || fallback;
};

export default {
  useFacilityDashboardStats,
  useFacilityKeyMetrics,
  useFacilityTypeDistribution,
  useFacilityTierDistribution,
  useNatureDistribution,
  useOperationalStatusDistribution,
  useFacilityGeographicDistribution,
  useCapacityMetrics,
  useServiceAvailability,
  useSpecialtyServices,
  useEmergencyCapabilities,
  useAccreditationStats,
  useLicenseExpiryMetrics,
  usePerformanceMetrics,
  useDataResidencyDistribution,
  useFacilityGrowthTrends,
  useAllFacilityStatistics,
  facilityStatsKeys,
  extractFacilityStatsErrorMessage,
};