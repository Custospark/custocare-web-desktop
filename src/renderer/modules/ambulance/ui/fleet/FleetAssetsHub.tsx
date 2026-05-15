import React, { useState } from 'react';
import { Truck, Users, Wrench, PlusCircle } from 'lucide-react';
import VehicleList from '../vehicles/views/VehicleList';
import CrewList from '../crew/views/CrewList';
import VehicleServiceSchedule from '../vehicles/views/VehicleServiceSchedule';
import VehicleCreate from '../vehicles/views/VehicleCreate';
import CrewAssign from '../crew/views/CrewAssign';
import FleetDrawer from './FleetDrawer';

interface FleetAssetsHubProps {
  theme: 'light' | 'dark';
}

type AssetsTab = 'vehicles' | 'crew' | 'service';
type DrawerKind = 'vehicle-create' | 'crew-assign' | null;

const FleetAssetsHub: React.FC<FleetAssetsHubProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<AssetsTab>('vehicles');
  const [drawer, setDrawer] = useState<DrawerKind>(null);

  const tabBtn = (key: AssetsTab, label: string, icon: React.ReactNode) => {
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
          {tabBtn('vehicles', 'Vehicles', <Truck className="h-4 w-4" />)}
          {tabBtn('crew', 'Crew', <Users className="h-4 w-4" />)}
          {tabBtn('service', 'Service schedule', <Wrench className="h-4 w-4" />)}
        </div>
        {tab === 'vehicles' && (
          <button
            type="button"
            onClick={() => setDrawer('vehicle-create')}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
            Add vehicle
          </button>
        )}
        {tab === 'crew' && (
          <button
            type="button"
            onClick={() => setDrawer('crew-assign')}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
            Assign crew
          </button>
        )}
      </div>

      {tab === 'vehicles' && <VehicleList theme={theme} embedded />}
      {tab === 'crew' && <CrewList theme={theme} />}
      {tab === 'service' && <VehicleServiceSchedule theme={theme} />}

      <FleetDrawer
        open={drawer === 'vehicle-create'}
        onClose={() => setDrawer(null)}
        title="Register ambulance"
        subtitle="Add a vehicle to the facility fleet"
        theme={theme}
      >
        <VehicleCreate theme={theme} onClose={() => setDrawer(null)} embedded />
      </FleetDrawer>

      <FleetDrawer
        open={drawer === 'crew-assign'}
        onClose={() => setDrawer(null)}
        title="Assign crew member"
        subtitle="Link staff to a vehicle for transport operations"
        theme={theme}
        widthClass="sm:w-140"
      >
        <CrewAssign theme={theme} onClose={() => setDrawer(null)} embedded />
      </FleetDrawer>
    </div>
  );
};

export default FleetAssetsHub;
