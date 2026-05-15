import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Search, Edit3, Trash2, RefreshCw } from 'lucide-react';
import { useAmbulances, useDeleteAmbulance } from '../../../api/ambulances/useAmbulanceQueries';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';
import VehicleStatusBadge from '../components/VehicleStatusBadge';
import VehicleTypeIcon from '../components/VehicleTypeIcon';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import type { Ambulance } from '../../../api/ambulances/ambulanceTypes';

interface VehicleListProps {
  theme: 'light' | 'dark';
  embedded?: boolean;
}

const VehicleList = ({ theme, embedded = false }: VehicleListProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  const { data, isLoading, refetch, isFetching } = useAmbulances({ search: search || undefined });
  const deleteMutation = useDeleteAmbulance();
  const vehicles = data?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input type="text" placeholder="Search ambulances..." value={search} onChange={e => setSearch(e.target.value)}
            className={`w-full rounded-lg border py-2 pl-10 pr-4 text-sm outline-none ${isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`} />
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className={`cursor-pointer rounded-lg border p-2 transition-all ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} ${isFetching ? 'animate-spin' : ''}`} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
        {!embedded && (
          <button
            type="button"
            onClick={() => navigate(AMBULANCE_ROUTES.FLEET_ASSETS)}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add ambulance
          </button>
        )}
      </div>

      <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        {isLoading ? (
          <LoadingSkeleton variant="table" theme={theme} message="Loading vehicles…" />
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center p-12">
            <Truck className={`mb-3 h-10 w-10 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No ambulances found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className={`border-b text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'border-gray-800 bg-gray-800/50 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                <th className="px-4 py-3">Identifier</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Mileage</th>
                <th className="px-4 py-3">Service Due</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v: Ambulance) => (
                <tr key={v.id} className={`cursor-pointer ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}
                    onClick={() => navigate(`/ambulance/fleet/vehicles/${v.ambulance_uuid}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Truck className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className="font-medium">{v.vehicle_identifier}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><VehicleTypeIcon type={v.vehicle_type} isDark={isDark} /></td>
                  <td className="px-4 py-3"><VehicleStatusBadge status={v.status} isDark={isDark} /></td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{v.current_mileage?.toLocaleString() ?? 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">{v.next_service_due_date ? new Date(v.next_service_due_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={e => { e.stopPropagation(); navigate(`/ambulance/fleet/vehicles/${v.ambulance_uuid}/edit`); }}
                      className={`cursor-pointer rounded-lg p-1.5 ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); if (confirm('Delete this ambulance?')) deleteMutation.mutate(v.ambulance_uuid); }}
                      className={`cursor-pointer rounded-lg p-1.5 ${isDark ? 'text-gray-400 hover:bg-red-900/30' : 'text-gray-500 hover:bg-red-50'}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default VehicleList;
