import { useNavigate } from 'react-router-dom';
import { Wrench, Calendar, AlertTriangle, Truck } from 'lucide-react';
import { useAmbulances } from '../../../api/ambulances/useAmbulanceQueries';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';
import VehicleStatusBadge from '../components/VehicleStatusBadge';

interface VehicleServiceScheduleProps { theme: 'light' | 'dark'; }

const VehicleServiceSchedule = ({ theme }: VehicleServiceScheduleProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { data } = useAmbulances({ per_page: 100 });
  const vehicles = data?.data ?? [];

  const overdue = vehicles.filter(v => v.next_service_due_date && new Date(v.next_service_due_date) < new Date());
  const upcoming = vehicles.filter(v => v.next_service_due_date && new Date(v.next_service_due_date) >= new Date());
  const noService = vehicles.filter(v => !v.next_service_due_date);

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Service Schedule</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Upcoming and overdue ambulance maintenance</p>
        </div>

        {/* Overdue banner */}
        {overdue.length > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{overdue.length} vehicle{overdue.length > 1 ? 's' : ''} with overdue service</p>
          </div>
        )}

        <div className="space-y-4">
          {overdue.length > 0 && (
            <div>
              <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wider text-red-500`}>Overdue ({overdue.length})</h2>
              <div className="space-y-2">
                {overdue.map(v => (
                  <button key={v.id} type="button" onClick={() => navigate(`/ambulance/admin/vehicles/${v.ambulance_uuid}`)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                      isDark ? 'border-red-900/30 bg-red-900/10 hover:bg-red-900/20' : 'border-red-100 bg-red-50 hover:bg-red-100'
                    }`}>
                    <div className="flex items-center gap-3">
                      <Truck className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                      <div>
                        <p className="font-medium">{v.vehicle_identifier}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{v.vehicle_type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <VehicleStatusBadge status={v.status} isDark={isDark} />
                      <span className="flex items-center gap-1 text-sm font-medium text-red-500">
                        <Calendar className="h-3.5 w-3.5" />
                        Due {new Date(v.next_service_due_date!).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Upcoming ({upcoming.length})</h2>
              <div className="space-y-2">
                {upcoming.map(v => (
                  <button key={v.id} type="button" onClick={() => navigate(`/ambulance/admin/vehicles/${v.ambulance_uuid}`)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                      isDark ? 'border-gray-800 bg-gray-900 hover:bg-gray-800' : 'border-gray-100 bg-white hover:bg-gray-50'
                    }`}>
                    <div className="flex items-center gap-3">
                      <Truck className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className="font-medium">{v.vehicle_identifier}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{v.vehicle_type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <VehicleStatusBadge status={v.status} isDark={isDark} />
                      <span className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(v.next_service_due_date!).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {noService.length > 0 && (
            <div>
              <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No Service Date ({noService.length})</h2>
              <div className="space-y-2">
                {noService.map(v => (
                  <button key={v.id} type="button" onClick={() => navigate(`/ambulance/admin/vehicles/${v.ambulance_uuid}`)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                      isDark ? 'border-gray-800 bg-gray-900 hover:bg-gray-800' : 'border-gray-100 bg-white hover:bg-gray-50'
                    }`}>
                    <div className="flex items-center gap-3">
                      <Truck className={`h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-medium">{v.vehicle_identifier}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{v.vehicle_type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <VehicleStatusBadge status={v.status} isDark={isDark} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleServiceSchedule;
