import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Clock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
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

type NetworkTab = 'pending' | 'incoming' | 'outgoing';

const ReferralNetworkHub = ({ theme, initialTab = 'pending' }: ReferralNetworkHubProps) => {
  const isDark = theme === 'dark';
  const facilityId = useSelector((s: RootState) => getActiveFacilityId(s)) ?? 0;
  const [tab, setTab] = useState<NetworkTab>(initialTab);

  const pendingQ = usePendingReferrals({ per_page: 50 } as Record<string, unknown>, 50);
  const incomingQ = useReferralsToFacility(facilityId, { per_page: 50 });
  const outgoingQ = useReferralsFromFacility(facilityId, { per_page: 50 });

  const activeQ = tab === 'pending' ? pendingQ : tab === 'incoming' ? incomingQ : outgoingQ;
  const referrals = activeQ.data?.data ?? [];

  const tabBtn = (key: NetworkTab, label: string, icon: React.ReactNode) => {
    const active = tab === key;
    return (
      <button
        type="button"
        onClick={() => setTab(key)}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
          active
            ? 'bg-blue-600 text-white shadow-sm'
            : isDark
              ? 'text-gray-300 hover:bg-gray-800'
              : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap gap-2 rounded-xl border p-2 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        {tabBtn('pending', 'Pending', <Clock className="h-4 w-4" />)}
        {tabBtn('incoming', 'Incoming', <ArrowDownLeft className="h-4 w-4" />)}
        {tabBtn('outgoing', 'Outgoing', <ArrowUpRight className="h-4 w-4" />)}
      </div>

      {activeQ.isLoading ? (
        <LoadingSkeleton variant="table" theme={theme} message="Loading referrals…" />
      ) : (
        <ReferralListTable theme={theme} referrals={referrals} showAccept={tab === 'incoming' || tab === 'pending'} />
      )}
    </div>
  );
};

export default ReferralNetworkHub;
