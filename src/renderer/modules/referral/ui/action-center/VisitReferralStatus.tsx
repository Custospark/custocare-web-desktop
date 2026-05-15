import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PlusCircle } from 'lucide-react';
import { usePatientReferrals } from '../../api/referrals/useReferralQueries';
import { REFERRAL_ROUTES } from '../../../../app/routes/routeConstants';
import { selectActiveVisitPatientId } from '../../../../app/store/slices/visitSlice';
import { ReferralPriorityBadge, ReferralStatusBadge } from '../components/ReferralStatusBadge';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

interface VisitReferralStatusProps {
  theme: 'light' | 'dark';
}

const VisitReferralStatus = ({ theme }: VisitReferralStatusProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const patientId = useSelector(selectActiveVisitPatientId) ?? 0;
  const { data, isLoading } = usePatientReferrals(patientId);
  const referrals = data?.data ?? [];

  if (isLoading) {
    return <LoadingSkeleton variant="table" theme={theme} message="Loading patient referrals…" />;
  }

  if (referrals.length === 0) {
    return (
      <div className={`rounded-xl border p-8 text-center ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <p className={`mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No referrals recorded for this patient yet.
        </p>
        <button
          type="button"
          onClick={() => navigate(REFERRAL_ROUTES.ACTION_CENTER_CREATE_REFERRAL)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" />
          Create referral
        </button>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      <table className="w-full">
        <thead>
          <tr className={`border-b text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'border-gray-800 bg-gray-800/50 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
            <th className="px-4 py-3">Route</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r) => (
            <tr key={r.referral_uuid} className={isDark ? 'border-t border-gray-800' : 'border-t border-gray-100'}>
              <td className="px-4 py-3 text-sm">
                {r.referring_facility?.facility_name ?? '—'} → {r.receiving_facility?.facility_name ?? 'Same facility'}
              </td>
              <td className="px-4 py-3 text-sm capitalize">{r.referral_type}</td>
              <td className="px-4 py-3">
                <ReferralPriorityBadge priority={r.priority} isDark={isDark} />
              </td>
              <td className="px-4 py-3">
                <ReferralStatusBadge status={r.status} isDark={isDark} />
              </td>
              <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {r.referral_date ? new Date(r.referral_date).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VisitReferralStatus;
