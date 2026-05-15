import { Truck, Activity, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AMBULANCE_ROUTES } from '../../../../app/routes/routeConstants';
import { useTrips } from '../../api/ambulance-trips/useAmbulanceTripQueries';
import { useAmbulances } from '../../api/ambulances/useAmbulanceQueries';

interface AmbulanceAnalyticsProps {
  theme: 'light' | 'dark';
}

const AmbulanceAnalytics = ({ theme }: AmbulanceAnalyticsProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { data: tripsData } = useTrips({ per_page: 500 });
  const { data: ambulancesData } = useAmbulances({ per_page: 100 });

  const trips = tripsData?.data ?? [];
  const vehicles = ambulancesData?.data ?? [];

  const totalTrips = trips.length;
  const completedTrips = trips.filter((t) => t.status === 'completed').length;
  const cancelledTrips = trips.filter((t) => t.status === 'cancelled').length;
  const emergencyTrips = trips.filter((t) => t.trip_type === 'emergency').length;
  const interFacilityTrips = trips.filter((t) => t.trip_type === 'inter_facility_transfer').length;

  const totalMileage = trips.reduce((sum, t) => sum + (t.mileage ?? 0), 0);
  const avgDuration = completedTrips > 0
    ? Math.round(
        trips
          .filter((t) => t.status === 'completed' && t.dispatched_at && t.completed_at)
          .reduce((sum, t) => {
            const d = new Date(t.completed_at!).getTime() - new Date(t.dispatched_at!).getTime();
            return sum + d / 60000;
          }, 0) / completedTrips
      )
    : 0;

  const statCard = (icon: React.ReactNode, label: string, value: string | number, subtext?: string) => (
    <div className={`rounded-xl border p-5 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          {subtext && <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subtext}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Fleet Analytics</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Operational metrics and trends for your ambulance fleet
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCard(<TrendingUp className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />, 'Total Trips', totalTrips)}
          {statCard(<Activity className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />, 'Completed', completedTrips, `${((completedTrips / (totalTrips || 1)) * 100).toFixed(0)}% completion rate`)}
          {statCard(<Clock className={`h-5 w-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />, 'Avg Response Time', `${avgDuration} min`)}
          {statCard(<Truck className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />, 'Total Mileage', `${totalMileage.toLocaleString()} mi`)}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Trip Breakdown */}
          <div className={`rounded-xl border p-5 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <h2 className={`mb-4 font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Trip Type Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: 'Emergency', value: emergencyTrips, color: 'bg-red-500' },
                { label: 'Inter-Facility Transfer', value: interFacilityTrips, color: 'bg-blue-500' },
                { label: 'Non-Emergency', value: trips.filter((t) => t.trip_type === 'non_emergency').length, color: 'bg-green-500' },
                { label: 'Standby / Other', value: trips.filter((t) => !['emergency', 'inter_facility_transfer', 'non_emergency'].includes(t.trip_type)).length, color: 'bg-gray-400' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{item.value}</span>
                  </div>
                  <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div
                      className={`h-full rounded-full transition-all ${item.color}`}
                      style={{ width: `${((item.value / (totalTrips || 1)) * 100).toFixed(1)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle Status */}
          <div className={`rounded-xl border p-5 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <h2 className={`mb-4 font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Fleet Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Available', value: vehicles.filter((v) => v.status === 'available').length, color: 'bg-green-500' },
                { label: 'In Service', value: vehicles.filter((v) => v.status === 'in_service').length, color: 'bg-blue-500' },
                { label: 'Maintenance', value: vehicles.filter((v) => v.status === 'maintenance').length, color: 'bg-red-500' },
                { label: 'Out of Service', value: vehicles.filter((v) => v.status === 'out_of_service').length, color: 'bg-gray-400' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{item.value}</span>
                  </div>
                  <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div
                      className={`h-full rounded-full transition-all ${item.color}`}
                      style={{ width: `${((item.value / (vehicles.length || 1)) * 100).toFixed(1)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => navigate(AMBULANCE_ROUTES.DISPATCH_ACTIVE_BOARD)}
            className={`cursor-pointer rounded-xl border p-4 text-center text-sm font-medium transition-all ${
              isDark ? 'border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            View Active Trips
          </button>
          <button
            type="button"
            onClick={() => navigate(AMBULANCE_ROUTES.VEHICLES_ALL)}
            className={`cursor-pointer rounded-xl border p-4 text-center text-sm font-medium transition-all ${
              isDark ? 'border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            View Fleet
          </button>
          <button
            type="button"
            onClick={() => navigate(AMBULANCE_ROUTES.DISPATCH_TRIP_HISTORY)}
            className={`cursor-pointer rounded-xl border p-4 text-center text-sm font-medium transition-all ${
              isDark ? 'border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Trip History
          </button>
          <button
            type="button"
            onClick={() => navigate(AMBULANCE_ROUTES.DISPATCH_NEW_TRIP)}
            className="cursor-pointer rounded-xl border border-blue-200 bg-blue-50 p-4 text-center text-sm font-medium text-blue-700 transition-all hover:bg-blue-100"
          >
            New Trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceAnalytics;
