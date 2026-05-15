import { useLocation, useNavigate } from 'react-router-dom';
import { ForwardThemeOutlet } from '../../../../app/routes/modules/shared/routeUtils';
import { Activity, PlusCircle, Clock, Truck, Navigation } from 'lucide-react';
import { cn } from '../../../../shared/types/cn';
import { AMBULANCE_ROUTES } from '../../../../app/routes/routeConstants';
import { useState } from 'react';
import TripCreate from './views/TripCreate';

interface DispatchFrontDeskProps { theme: 'light' | 'dark'; }

const tabs = [
  { key: 'active-board', label: 'Active trips board', icon: <Activity className="w-4 h-4" />, to: AMBULANCE_ROUTES.ACTION_CENTER_ACTIVE_BOARD },
  { key: 'new-trip', label: 'New trip request', icon: <PlusCircle className="w-4 h-4" /> },
  { key: 'trip-history', label: 'Trip history', icon: <Clock className="w-4 h-4" />, to: AMBULANCE_ROUTES.ACTION_CENTER_TRIP_HISTORY },
  { key: 'fleet-view', label: 'Available fleet', icon: <Truck className="w-4 h-4" />, to: AMBULANCE_ROUTES.FLEET_VEHICLES_ALL },
];

const DispatchFrontDesk = ({ theme }: DispatchFrontDeskProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [showTripDrawer, setShowTripDrawer] = useState(false);

  const isOnTab = tabs.some(t => t.to && location.pathname.startsWith(t.to));

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.key === 'new-trip') {
      setShowTripDrawer(true);
    } else if (tab.to) {
      navigate(tab.to);
    }
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <div className={`rounded-lg p-2.5 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
            <Navigation className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dispatch & Trip Center</h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage trips, dispatch ambulances, and review history</p>
          </div>
        </div>

        <div className={`mb-6 flex flex-wrap gap-2 rounded-xl border p-2 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          {tabs.map(tab => {
            const isActive = tab.key === 'new-trip' ? false : location.pathname === tab.to;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        <div>
          {isOnTab ? <ForwardThemeOutlet /> : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {tabs.filter(t => t.to).map(tab => {
                const isActive = location.pathname === tab.to;
                return (
                  <button key={tab.key} onClick={() => handleTabClick(tab)}
                    className={cn(
                      'cursor-pointer rounded-xl border p-5 text-left transition-all hover:shadow-lg',
                      isActive ? (isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50')
                        : (isDark ? 'border-gray-800 bg-gray-900 hover:bg-gray-800' : 'border-gray-200 bg-white hover:bg-gray-50'),
                    )}
                  >
                    <div className={`mb-2 rounded-lg p-2.5 w-fit ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>{tab.icon}</div>
                    <h3 className="font-semibold">{tab.label}</h3>
                    <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {tab.key === 'active-board' && 'Live view of all in-progress trips'}
                      {tab.key === 'trip-history' && 'Review completed and cancelled trips'}
                      {tab.key === 'fleet-view' && 'Check which ambulances are available'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {showTripDrawer && <TripCreate theme={theme} onClose={() => setShowTripDrawer(false)} />}
    </div>
  );
};

export default DispatchFrontDesk;
