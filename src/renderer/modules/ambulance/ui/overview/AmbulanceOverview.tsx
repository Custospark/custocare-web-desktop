import { useState, useCallback } from 'react';
import {
  Truck,
  Activity,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Navigation,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AMBULANCE_ROUTES } from '../../../../app/routes/routeConstants';
import { useAmbulances } from '../../api/ambulances/useAmbulanceQueries';
import { useActiveTrips } from '../../api/ambulance-trips/useAmbulanceTripQueries';

interface AmbulanceOverviewProps {
  theme: 'light' | 'dark';
}

const AmbulanceOverview = ({ theme }: AmbulanceOverviewProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const { data: ambulancesData, refetch: refetchAmbs, isFetching: fetchingAmbs } = useAmbulances({ per_page: 100 });
  const { data: activeTripsData, refetch: refetchTrips, isFetching: fetchingTrips } = useActiveTrips();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const vehicles = ambulancesData?.data ?? [];
  const activeTrips = activeTripsData?.data ?? [];

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter((v) => v.status === 'available').length;
  const inServiceVehicles = vehicles.filter((v) => v.status === 'in_service').length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'maintenance').length;

  const statsCards = [
    {
      id: 'total',
      label: 'Total Vehicles',
      value: totalVehicles,
      icon: <Truck className="w-5 h-5" />,
      color: 'blue',
      route: AMBULANCE_ROUTES.VEHICLES_ALL,
    },
    {
      id: 'available',
      label: 'Available',
      value: availableVehicles,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'green',
      route: AMBULANCE_ROUTES.VEHICLES_ALL,
    },
    {
      id: 'active-trips',
      label: 'Active Trips',
      value: activeTrips.length,
      icon: <Activity className="w-5 h-5" />,
      color: 'amber',
      route: AMBULANCE_ROUTES.DISPATCH_ACTIVE_BOARD,
    },
    {
      id: 'maintenance',
      label: 'In Maintenance',
      value: maintenanceVehicles,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'red',
      route: AMBULANCE_ROUTES.VEHICLES_SERVICE_SCHEDULE,
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string; hover: string }> = {
    blue: {
      bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      text: isDark ? 'text-blue-300' : 'text-blue-700',
      border: isDark ? 'border-blue-800/30' : 'border-blue-200',
      iconBg: isDark ? 'bg-blue-800/30' : 'bg-blue-100',
      hover: isDark ? 'hover:bg-blue-900/30' : 'hover:bg-blue-100',
    },
    green: {
      bg: isDark ? 'bg-green-900/20' : 'bg-green-50',
      text: isDark ? 'text-green-300' : 'text-green-700',
      border: isDark ? 'border-green-800/30' : 'border-green-200',
      iconBg: isDark ? 'bg-green-800/30' : 'bg-green-100',
      hover: isDark ? 'hover:bg-green-900/30' : 'hover:bg-green-100',
    },
    amber: {
      bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50',
      text: isDark ? 'text-amber-300' : 'text-amber-700',
      border: isDark ? 'border-amber-800/30' : 'border-amber-200',
      iconBg: isDark ? 'bg-amber-800/30' : 'bg-amber-100',
      hover: isDark ? 'hover:bg-amber-900/30' : 'hover:bg-amber-100',
    },
    red: {
      bg: isDark ? 'bg-red-900/20' : 'bg-red-50',
      text: isDark ? 'text-red-300' : 'text-red-700',
      border: isDark ? 'border-red-800/30' : 'border-red-200',
      iconBg: isDark ? 'bg-red-800/30' : 'bg-red-100',
      hover: isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-100',
    },
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      available: 'bg-green-100 text-green-700 border-green-200',
      in_service: 'bg-blue-100 text-blue-700 border-blue-200',
      out_of_service: 'bg-gray-100 text-gray-600 border-gray-200',
      maintenance: 'bg-red-100 text-red-700 border-red-200',
      decommissioned: 'bg-gray-200 text-gray-500 border-gray-300',
    };
    const darkStyles: Record<string, string> = {
      available: 'bg-green-900/30 text-green-300 border-green-800/30',
      in_service: 'bg-blue-900/30 text-blue-300 border-blue-800/30',
      out_of_service: 'bg-gray-800 text-gray-400 border-gray-700',
      maintenance: 'bg-red-900/30 text-red-300 border-red-800/30',
      decommissioned: 'bg-gray-800 text-gray-500 border-gray-700',
    };
    return isDark ? darkStyles[status] ?? '' : styles[status] ?? '';
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Fleet Intelligence</h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Real-time overview of your ambulance fleet and active operations
              </p>
            </div>
            <button onClick={() => { refetchAmbs(); refetchTrips(); }} disabled={fetchingAmbs || fetchingTrips}
              className={`cursor-pointer rounded-lg border p-2 transition-all ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} ${(fetchingAmbs || fetchingTrips) ? 'animate-spin' : ''}`}
              title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card) => {
            const c = colorMap[card.color];
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => navigate(card.route)}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`relative cursor-pointer overflow-hidden rounded-xl border p-5 text-left transition-all ${
                  c.bg} ${c.border} ${c.hover} ${
                  hoveredCard === card.id ? 'scale-[1.02] shadow-lg' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm font-medium ${c.text}`}>{card.label}</p>
                    <p className="mt-1 text-3xl font-bold">{card.value}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${c.iconBg}`}>{card.icon}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Active Trips */}
          <div className={`rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <div className={`flex items-center justify-between border-b p-4 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Navigation className={`h-5 w-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                <h2 className="font-semibold">Active Trips</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate(AMBULANCE_ROUTES.DISPATCH_ACTIVE_BOARD)}
                className={`text-sm font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                View all
              </button>
            </div>
            <div className="p-4">
              {activeTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Activity className={`mb-2 h-8 w-8 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No active trips</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeTrips.slice(0, 5).map((trip) => (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => navigate(`/ambulance/dispatch/${trip.trip_uuid}`)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg border p-3 text-left transition-all ${
                        isDark
                          ? 'border-gray-800 bg-gray-800/50 hover:bg-gray-800'
                          : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {trip.trip_type.replace(/_/g, ' ')}
                        </p>
                        <p className={`truncate text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {trip.pickup_location ?? 'N/A'} → {trip.destination_location ?? 'N/A'}
                        </p>
                      </div>
                      <span
                        className={`ml-2 shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                          statusBadge(trip.status)
                        }`}
                      >
                        {trip.status.replace(/_/g, ' ')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Availability */}
          <div className={`rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <div className={`flex items-center justify-between border-b p-4 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Truck className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className="font-semibold">Vehicle Availability</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate(AMBULANCE_ROUTES.VEHICLES_ALL)}
                className={`text-sm font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                View all
              </button>
            </div>
            <div className="p-4">
              {/* Summary bar */}
              <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                {totalVehicles > 0 && (
                  <>
                    <div
                      style={{ width: `${(availableVehicles / totalVehicles) * 100}%` }}
                      className="bg-green-500 transition-all"
                      title={`${availableVehicles} available`}
                    />
                    <div
                      style={{ width: `${(inServiceVehicles / totalVehicles) * 100}%` }}
                      className="bg-blue-500 transition-all"
                      title={`${inServiceVehicles} in service`}
                    />
                    <div
                      style={{ width: `${(maintenanceVehicles / totalVehicles) * 100}%` }}
                      className="bg-red-500 transition-all"
                      title={`${maintenanceVehicles} in maintenance`}
                    />
                  </>
                )}
              </div>

              {/* Legend */}
              <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                    Available ({availableVehicles})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                    In Service ({inServiceVehicles})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                    Maintenance ({maintenanceVehicles})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                    Other ({totalVehicles - availableVehicles - inServiceVehicles - maintenanceVehicles})
                  </span>
                </div>
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => navigate(AMBULANCE_ROUTES.VEHICLES_CREATE)}
                  className={`cursor-pointer rounded-lg border p-3 text-sm font-medium transition-all ${
                    isDark
                      ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  + Add Vehicle
                </button>
                <button
                  type="button"
                  onClick={() => navigate(AMBULANCE_ROUTES.DISPATCH_NEW_TRIP)}
                  className={`cursor-pointer rounded-lg border p-3 text-sm font-medium transition-all ${
                    isDark
                      ? 'border-blue-800/30 bg-blue-900/20 text-blue-300 hover:bg-blue-900/30'
                      : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  + New Trip
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceOverview;
