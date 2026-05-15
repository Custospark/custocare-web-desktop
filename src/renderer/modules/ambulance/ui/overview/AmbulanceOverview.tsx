import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AMBULANCE_ROUTES } from '../../../../app/routes/routeConstants';
import { useAmbulanceDashboard } from '../../api/overview/useAmbulanceDashboardQueries';

interface AmbulanceOverviewProps {
  theme: 'light' | 'dark';
}

const AmbulanceOverview = ({ theme }: AmbulanceOverviewProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const { data, isLoading, isFetching, isError, error, refetch } = useAmbulanceDashboard(refreshKey);

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
  const tripTotals = data?.trip_activity?.totals;
  const fleetStatus = data?.fleet_status?.series ?? [];

  return (
    <div className={isDark ? 'bg-gray-950 min-h-screen p-6 space-y-6' : 'bg-gray-50 min-h-screen p-6 space-y-6'}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fleet Intelligence</h1>
            <p className={`mt-2 text-sm ${mutedTextClass}`}>
              Transport operations at a glance across fleet availability, active trips, and completions.
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
              aria-label="Refresh ambulance dashboard data"
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
            {error instanceof Error ? error.message : 'Could not load ambulance dashboard.'}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500" />
              <p className="text-sm font-semibold">Total Vehicles</p>
            </div>
            <p className="mt-3 text-2xl font-bold">{isLoading ? '...' : summary?.total_vehicles?.value ?? 0}</p>
          </div>
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-semibold">Available</p>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {isLoading ? '...' : summary?.available_vehicles?.value ?? 0}
            </p>
          </div>
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-500" />
              <p className="text-sm font-semibold">Active Trips</p>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {isLoading ? '...' : summary?.active_trips?.value ?? 0}
            </p>
          </div>
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-violet-500" />
              <p className="text-sm font-semibold">Completed Today</p>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {isLoading ? '...' : summary?.completed_trips_today?.value ?? 0}
            </p>
            {!isLoading && summary?.completed_trips_today?.change_pct != null && (
              <p className={`mt-2 text-xs ${mutedTextClass}`}>
                {summary.completed_trips_today.change_pct}% vs yesterday
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <p className="text-sm font-semibold">Weekly Trip Throughput</p>
            <p className="mt-3 text-2xl font-bold">
              {isLoading ? '...' : `${tripTotals?.completed_week ?? 0} completed`}
            </p>
            <p className={`mt-2 text-xs ${mutedTextClass}`}>
              Dispatched: {isLoading ? '...' : tripTotals?.dispatched_week ?? 0} · Cancelled:{' '}
              {isLoading ? '...' : tripTotals?.cancelled_week ?? 0}
            </p>
          </div>

          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <p className="text-sm font-semibold">Fleet Status</p>
            <div className="mt-3 space-y-2 text-sm">
              {fleetStatus.map((row) => (
                <div key={row.status} className="flex justify-between">
                  <span className={mutedTextClass}>{row.label}</span>
                  <span className="font-semibold">{isLoading ? '...' : row.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <p className="text-sm font-semibold">Maintenance</p>
            </div>
            <p className="mt-3 text-2xl font-bold">{isLoading ? '...' : summary?.maintenance_vehicles?.value ?? 0}</p>
            <p className={`mt-2 text-xs ${mutedTextClass}`}>
              {isLoading ? 'Loading...' : summary?.maintenance_vehicles?.change_label}
            </p>
          </div>
        </div>

        <div className={`rounded-xl border p-5 ${cardClass}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold">Recent Trips</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(AMBULANCE_ROUTES.FLEET_ACTIVE_BOARD)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Active board
              </button>
              <button
                type="button"
                onClick={() => navigate(AMBULANCE_ROUTES.PATIENT_QUEUE)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                New trip
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {(data?.recent_trips ?? []).slice(0, 6).map((trip) => (
              <div key={trip.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium capitalize">{trip.status.replace(/_/g, ' ')}</p>
                  <p className={`text-xs ${mutedTextClass}`}>
                    {trip.pickup_location ?? 'Pickup TBD'} → {trip.destination_location ?? 'Destination TBD'}
                  </p>
                </div>
                <span className={`text-xs whitespace-nowrap ${subtleTextClass}`}>
                  {trip.updated_at ? new Date(trip.updated_at).toLocaleString() : 'Now'}
                </span>
              </div>
            ))}
            {!isLoading && (data?.recent_trips?.length ?? 0) === 0 && (
              <p className={`text-sm ${mutedTextClass}`}>No recent trips for this facility.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceOverview;