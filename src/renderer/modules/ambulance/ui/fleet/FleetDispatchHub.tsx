import React, { useState } from 'react';
import { Activity, Clock, PlusCircle } from 'lucide-react';
import ActiveTripsBoard from '../dispatch/views/ActiveTripsBoard';
import TripList from '../dispatch/views/TripList';
import TripCreate from '../dispatch/views/TripCreate';

interface FleetDispatchHubProps {
  theme: 'light' | 'dark';
}

type DispatchTab = 'active' | 'history';

const FleetDispatchHub: React.FC<FleetDispatchHubProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<DispatchTab>('active');
  const [showTripDrawer, setShowTripDrawer] = useState(false);

  const tabBtn = (key: DispatchTab, label: string, icon: React.ReactNode) => {
    const active = tab === key;
    return (
      <button
        type="button"
        onClick={() => setTab(key)}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
          active
            ? 'bg-blue-600 text-white shadow-sm'
            : isDark
              ? 'text-gray-300 hover:bg-gray-800'
              : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={`flex flex-wrap gap-2 rounded-xl border p-2 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          {tabBtn('active', 'Live dispatch', <Activity className="h-4 w-4" />)}
          {tabBtn('history', 'Trip history', <Clock className="h-4 w-4" />)}
        </div>
        <button
          type="button"
          onClick={() => setShowTripDrawer(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" />
          Facility dispatch
        </button>
      </div>

      {tab === 'active' ? <ActiveTripsBoard theme={theme} /> : <TripList theme={theme} />}

      {showTripDrawer && <TripCreate theme={theme} onClose={() => setShowTripDrawer(false)} />}
    </div>
  );
};

export default FleetDispatchHub;
