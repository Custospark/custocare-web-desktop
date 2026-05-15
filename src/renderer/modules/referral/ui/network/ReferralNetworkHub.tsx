import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../app/store/rootReducer';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import {
  usePendingReferrals,
  useReferralsFromFacility,
  useReferralsToFacility,
} from '../../api/referrals/useReferralQueries';
import ReferralListTable from './ReferralListTable';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

interface ReferralNetworkHubProps {
  theme: 'light' | 'dark';
  initialTab?: 'pending' | 'incoming' | 'outgoing';
}

const ReferralNetworkHub = ({ theme, initialTab = 'pending' }: ReferralNetworkHubProps) => {
  const isDark = theme === 'dark';
  const facilityId = useSelector((s: RootState) => getActiveFacilityId(s)) ?? 0;

  const pendingQ = usePendingReferrals({ per_page: 50 } as Record<string, unknown>, 50);
  const incomingQ = useReferralsToFacility(facilityId, { per_page: 50 });
  const outgoingQ = useReferralsFromFacility(facilityId, { per_page: 50 });

  const activeQ = initialTab === 'pending' ? pendingQ : initialTab === 'incoming' ? incomingQ : outgoingQ;
  const referrals = activeQ.data?.data ?? [];

  return (
    <div className="space-y-4">
      {activeQ.isLoading ? (
        <LoadingSkeleton variant="table" theme={theme} message="Loading referrals…" />
      ) : (
        <ReferralListTable theme={theme} referrals={referrals} showAccept={initialTab === 'incoming' || initialTab === 'pending'} />
      )}
    </div>
  );
};

export default ReferralNetworkHub;
