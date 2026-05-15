import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search, Activity, PlusCircle } from 'lucide-react';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { useTrips } from '../../../api/ambulance-trips/useAmbulanceTripQueries';
import type { AmbulanceTrip } from '../../../api/ambulance-trips/ambulanceTripTypes';
import TripStatusStepper from '../components/TripStatusStepper';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';

interface TripListProps { theme: 'light' | 'dark'; }

const TripList = ({ theme }: TripListProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  const { data, refetch, isFetching, isLoading } = useTrips({ search: search || undefined, per_page: 50 });
  const trips = data?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input type="text" placeholder="Search trips..." value={search} onChange={e => setSearch(e.target.value)}
            className={`w-full rounded-lg border py-2 pl-10 pr-4 text-sm outline-none ${isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`} />
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className={`cursor-pointer rounded-lg border p-2 transition-all ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} ${isFetching ? 'animate-spin' : ''}`}
          title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        {isLoading ? (
          <LoadingSkeleton variant="table" theme={theme} message="Loading trip history…" />
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center p-12">
            <Activity className={`mb-3 h-10 w-10 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`mb-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No trips found</p>
            <button onClick={() => navigate(AMBULANCE_ROUTES.FLEET_NEW_TRIP)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700">
              <PlusCircle className="h-4 w-4" /> Create New Trip
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead><tr className={`border-b text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'border-gray-800 bg-gray-800/50 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
              <th className="px-4 py-3">Type</th><th className="px-4 py-3">Progress</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Visit</th>
            </tr></thead>
            <tbody>{trips.slice(0, 20).map((t: AmbulanceTrip) => (
              <tr key={t.id} className={isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                <td className="px-4 py-3 text-sm capitalize">{t.trip_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3"><TripStatusStepper status={t.status} isDark={isDark} /></td>
                <td className="max-w-xs truncate px-4 py-3 text-sm">{t.pickup_location ?? 'N/A'} → {t.destination_location ?? 'N/A'}</td>
                <td className="px-4 py-3 text-sm capitalize">{t.priority}</td>
                <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}</td>
                <td className={`px-4 py-3 text-right text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {t.visit_id ? `Visit #${t.visit_id}` : '—'}
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TripList;
