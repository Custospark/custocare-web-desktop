import { useState } from 'react';
import { UsersRound, Truck, XCircle, RefreshCw } from 'lucide-react';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { useCrewByAmbulance } from '../../../api/ambulance-crew/useAmbulanceCrewMemberQueries';
import { useAmbulances } from '../../../api/ambulances/useAmbulanceQueries';
import CrewRoleBadge from '../components/CrewRoleBadge';

interface CrewListProps { theme: 'light' | 'dark'; }

const CrewList = ({ theme }: CrewListProps) => {
  const isDark = theme === 'dark';
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: ambData, refetch: refetchAmbs, isFetching: fetchingAmbs, isLoading: loadingAmbs } = useAmbulances({ per_page: 100 });
  const { data: crewData, refetch: refetchCrew, isFetching: fetchingCrew } = useCrewByAmbulance(selectedId ?? 0);
  const vehicles = ambData?.data ?? [];
  const members = crewData?.data ?? [];

  const handleRefresh = () => { refetchAmbs(); if (selectedId) refetchCrew(); };

  if (loadingAmbs) {
    return <LoadingSkeleton variant="table" theme={theme} message="Loading fleet…" />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {vehicles.map(v => (
            <button key={v.id} type="button" onClick={() => setSelectedId(v.id)}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                selectedId === v.id ? (isDark ? 'border-blue-500 bg-blue-900/20 text-blue-300' : 'border-blue-500 bg-blue-50 text-blue-700')
                  : (isDark ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-white text-gray-600')
              }`}>
              <Truck className="mr-1 inline h-3 w-3" />{v.vehicle_identifier}
            </button>
          ))}
        </div>
        <button onClick={handleRefresh} disabled={fetchingAmbs || fetchingCrew}
          className={`cursor-pointer rounded-lg border p-2 transition-all ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} ${(fetchingAmbs || fetchingCrew) ? 'animate-spin' : ''}`}
          title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        {!selectedId ? (
          <div className="flex flex-col items-center p-12"><UsersRound className={`mb-3 h-10 w-10 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} /><p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Select an ambulance</p></div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center p-12"><UsersRound className={`mb-3 h-10 w-10 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} /><p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No crew assigned</p></div>
        ) : (
          <table className="w-full">
            <thead><tr className={`border-b text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'border-gray-800 bg-gray-800/50 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
              <th className="px-4 py-3">Staff</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Driver</th><th className="px-4 py-3">Status</th>
            </tr></thead>
            <tbody>{members.map(m => (
              <tr key={m.id} className={isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                <td className="px-4 py-3"><span className="font-medium">{m.staff ? `${m.staff.first_name} ${m.staff.last_name}` : `Staff #${m.staff_id}`}</span></td>
                <td className="px-4 py-3"><CrewRoleBadge role={m.role} isDark={isDark} /></td>
                <td className="px-4 py-3 text-sm">{m.is_primary_driver ? <span className="font-medium text-green-600">Yes</span> : <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>No</span>}</td>
                <td className="px-4 py-3">{m.active ? <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />Active</span> : <span className="inline-flex items-center gap-1 text-sm text-gray-400"><XCircle className="h-3.5 w-3.5" />Inactive</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CrewList;
