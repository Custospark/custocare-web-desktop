import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Share2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ListOrdered,
  Users,
} from 'lucide-react';
import { REFERRAL_ROUTES } from '../../../../app/routes/routeConstants';
import { useReferralDashboard } from '../../api/overview/useReferralDashboardQueries';

interface ReferralOverviewProps {
  theme: 'light' | 'dark';
}

const ReferralOverview = ({ theme }: ReferralOverviewProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const { data, isLoading, isFetching, isError, error, refetch } = useReferralDashboard(refreshKey);

  const cardClass = isDark
    ? 'border-gray-800 bg-gray-900 text-gray-100'
    : 'border-gray-200 bg-white text-gray-900';
  const mutedTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const subtleTextClass = isDark ? 'text-gray-500' : 'text-gray-500';

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    setLastRefreshed(new Date());
    void refetch();
  };

  const summary = data?.summary;
  const activityTotals = data?.referral_activity?.totals;
  const statusSeries = data?.status_breakdown?.series ?? [];
  const recent = data?.recent_referrals ?? [];

  const cards = [
    { label: 'Queue visits', value: summary?.queue_visits?.value ?? 0, icon: ListOrdered, color: 'text-indigo-500' },
    { label: 'Incoming pending', value: summary?.pending_incoming?.value ?? 0, icon: ArrowDownLeft, color: 'text-blue-500' },
    { label: 'Outgoing pending', value: summary?.pending_outgoing?.value ?? 0, icon: ArrowUpRight, color: 'text-violet-500' },
    { label: 'Completed today', value: summary?.completed_today?.value ?? 0, icon: CheckCircle2, color: 'text-green-500' },
  ];

  return (
    <div className={isDark ? 'min-h-screen space-y-6 bg-gray-950 p-6' : 'min-h-screen space-y-6 bg-gray-50 p-6'}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Referral intelligence</h1>
            <p className={`mt-2 text-sm ${mutedTextClass}`}>
              Referral queue, network volume, and recent coordination activity for your facility.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${subtleTextClass}`}>Last updated: {lastRefreshed.toLocaleTimeString()}</span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetching}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isFetching ? 'opacity-60' : ''}`}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {isError && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              isDark ? 'border-red-900 bg-red-950/40 text-red-200' : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {error instanceof Error ? error.message : 'Could not load referral dashboard.'}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-xl border p-5 ${cardClass}`}>
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${color}`} />
                <p className="text-sm font-semibold">{label}</p>
              </div>
              <p className="mt-3 text-2xl font-bold">{isLoading ? '…' : value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <h2 className="mb-4 text-lg font-semibold">7-day activity</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className={`text-xs ${mutedTextClass}`}>Created</p>
                <p className="text-xl font-bold">{activityTotals?.created_week ?? 0}</p>
              </div>
              <div>
                <p className={`text-xs ${mutedTextClass}`}>Completed</p>
                <p className="text-xl font-bold">{activityTotals?.completed_week ?? 0}</p>
              </div>
              <div>
                <p className={`text-xs ${mutedTextClass}`}>Rejected</p>
                <p className="text-xl font-bold">{activityTotals?.rejected_week ?? 0}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <h2 className="mb-4 text-lg font-semibold">Status breakdown</h2>
            <ul className="space-y-2">
              {statusSeries.map((s) => (
                <li key={s.status} className="flex items-center justify-between text-sm">
                  <span>{s.label}</span>
                  <span className="font-semibold">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`rounded-xl border p-5 ${cardClass}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Recent referrals</h2>
            <button
              type="button"
              onClick={() => navigate(REFERRAL_ROUTES.NETWORK_PENDING)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View network
            </button>
          </div>
          {recent.length === 0 ? (
            <p className={`text-sm ${mutedTextClass}`}>No recent referral activity.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {recent.map((r) => (
                <li key={r.referral_uuid} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium">{r.patient_name}</p>
                    <p className={`text-xs ${mutedTextClass}`}>
                      {r.referring_facility_name ?? '—'} → {r.receiving_facility_name ?? 'Same facility'}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize dark:bg-gray-800">
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`rounded-xl border p-6 ${cardClass}`}>
          <div className="flex flex-wrap items-center gap-4">
            <Share2 className="h-6 w-6 shrink-0 text-blue-500" />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">Quick actions</h2>
              <p className={`mt-1 text-sm ${mutedTextClass}`}>
                Open the referral queue or network workspace to coordinate patients.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(REFERRAL_ROUTES.PATIENT_QUEUE)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Users className="h-4 w-4" />
              Referral queue
            </button>
            <button
              type="button"
              onClick={() => navigate(REFERRAL_ROUTES.NETWORK_PENDING)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${
                isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Clock className="h-4 w-4" />
              Network
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralOverview;
