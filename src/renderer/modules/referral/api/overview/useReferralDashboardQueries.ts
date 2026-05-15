import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type { RootState } from '../../../../app/store/store';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import type { ReferralDashboardData, ReferralDashboardResponse } from './referralDashboardTypes';

export const referralDashboardKeys = {
  all: ['referral-dashboard'] as const,
  facility: (facilityId: number, refreshToken: number) =>
    [...referralDashboardKeys.all, facilityId, refreshToken] as const,
};

export function useReferralDashboard(
  refreshToken: number,
  options?: Omit<
    UseQueryOptions<ReferralDashboardData, AxiosError, ReferralDashboardData>,
    'queryKey' | 'queryFn'
  >
) {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  return useQuery({
    queryKey: referralDashboardKeys.facility(Number(facilityId) || 0, refreshToken),
    queryFn: async (): Promise<ReferralDashboardData> => {
      const fid = Number(facilityId);
      if (!fid) {
        throw new Error('No active facility');
      }

      const res = await axiosInstance.get<ReferralDashboardResponse>(
        `referrals/facility/${fid}/dashboard`,
        {
          headers: {
            'X-Facility-Id': String(fid),
          },
        }
      );

      if (!res.data?.success || !res.data.data) {
        throw new Error(res.data?.message || 'Failed to load referral dashboard');
      }

      return res.data.data;
    },
    enabled: !!facilityId && (options?.enabled ?? true),
    staleTime: 60 * 1000,
    ...options,
  });
}
