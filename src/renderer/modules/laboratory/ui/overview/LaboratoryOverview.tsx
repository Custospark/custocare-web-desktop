import { useState } from 'react';
import { Activity, AlertTriangle, FlaskConical, Microscope, RefreshCw, Receipt } from 'lucide-react';
import { useLaboratoryDashboard } from '../../api/overview/useLaboratoryDashboardQueries';
import { LaboratoryRevenueTrendChart } from './LaboratoryRevenueTrendChart';
import { LaboratoryTopServicesChart } from './LaboratoryTopServicesChart';

interface LaboratoryOverviewProps {
  theme: 'light' | 'dark';
}

const LaboratoryOverview = ({ theme }: LaboratoryOverviewProps) => {
  const isDark = theme === 'dark';
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const { data, isLoading, isFetching, isError, error, refetch } = useLaboratoryDashboard(refreshKey);

  const cardClass = isDark
    ? 'border-gray-800 bg-gray-900 text-gray-100'
    : 'border-gray-200 bg-white text-gray-900';
  const mutedTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const subtleTextClass = isDark ? 'text-gray-500' : 'text-gray-500';

  const handleRefresh = (): void => {
    setRefreshKey((prev) => prev + 1);
    setLastRefreshed(new Date());
    void refetch();
  };

  const summary = data?.summary;
  const requestTotals = data?.request_activity?.totals;
  const resultFlags = data?.result_flags;
  const performance = data?.performance;

  return (
    <div className={isDark ? 'bg-gray-950 min-h-screen p-6 space-y-6' : 'bg-gray-50 min-h-screen p-6 space-y-6'}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Laboratory Intelligence</h1>
            <p className={`mt-2 text-sm ${mutedTextClass}`}>
              Diagnostic operations at a glance across requests, results, and billable throughput.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${subtleTextClass}`}>
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetching}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isFetching ? 'cursor-not-allowed opacity-60' : ''}`}
              aria-label="Refresh laboratory dashboard data"
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
            {error instanceof Error ? error.message : 'Could not load laboratory dashboard.'}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-blue-500" />
              <p className="text-sm font-semibold">Pending Requests</p>
            </div>
            <p className="mt-3 text-2xl font-bold">{isLoading ? '...' : summary?.pending_requests?.value ?? 0}</p>
          </div>
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-semibold">Completed Results</p>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {isLoading ? '...' : summary?.completed_results_today?.value ?? 0}
            </p>
          </div>
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-500" />
              <p className="text-sm font-semibold">Billable Charges</p>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {isLoading ? '...' : Number(summary?.revenue_today?.value ?? 0).toLocaleString()}
            </p>
          </div>
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-violet-500" />
              <p className="text-sm font-semibold">Turnaround Time</p>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {isLoading ? '...' : `${Number(summary?.avg_turnaround_hours?.value ?? 0).toFixed(1)}h`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <p className="text-sm font-semibold">Weekly Request Throughput</p>
            <p className="mt-3 text-2xl font-bold">
              {isLoading ? '...' : `${requestTotals?.completed_week ?? 0}/${requestTotals?.requested_week ?? 0}`}
            </p>
            <p className={`mt-2 text-xs ${mutedTextClass}`}>
              Completion rate: {isLoading ? '...' : `${requestTotals?.completion_rate_pct ?? 0}%`}
            </p>
          </div>

          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <p className="text-sm font-semibold">Result Flags (30 days)</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={mutedTextClass}>Normal</span>
                <span className="font-semibold">{isLoading ? '...' : resultFlags?.normal ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className={mutedTextClass}>Abnormal</span>
                <span className="font-semibold">{isLoading ? '...' : resultFlags?.abnormal ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className={mutedTextClass}>Critical</span>
                <span className="font-semibold">{isLoading ? '...' : resultFlags?.critical ?? 0}</span>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <p className="text-sm font-semibold">Operational Health</p>
            </div>
            <p className="mt-3 text-2xl font-bold">{isLoading ? '...' : performance?.overall_grade ?? '--'}</p>
            <p className={`mt-2 text-xs ${mutedTextClass}`}>{isLoading ? 'Loading...' : performance?.overall_label}</p>
            <p className={`mt-1 text-xs ${mutedTextClass}`}>
              Verification: {isLoading ? '...' : `${performance?.verification_rate_pct ?? 0}%`}
            </p>
            <p className={`mt-1 text-xs ${mutedTextClass}`}>
              Open critical: {isLoading ? '...' : performance?.critical_open_count ?? 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LaboratoryRevenueTrendChart
            theme={theme}
            refreshKey={refreshKey}
            trend={data?.revenue_trend}
            isLoading={isLoading}
          />
          <LaboratoryTopServicesChart
            theme={theme}
            refreshKey={refreshKey}
            services={data?.top_billed_services}
            isLoading={isLoading}
          />
        </div>

        <div className={`rounded-xl border p-5 ${cardClass}`}>
          <p className="text-sm font-semibold">Recent Laboratory Activity</p>
          <div className="mt-3 space-y-3">
            {(data?.recent_activity ?? []).slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className={`text-xs ${mutedTextClass}`}>{item.description}</p>
                </div>
                <span className={`text-xs whitespace-nowrap ${subtleTextClass}`}>
                  {item.occurred_at ? new Date(item.occurred_at).toLocaleString() : 'Now'}
                </span>
              </div>
            ))}
            {!isLoading && (data?.recent_activity?.length ?? 0) === 0 && (
              <p className={`text-sm ${mutedTextClass}`}>No recent laboratory events.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryOverview;