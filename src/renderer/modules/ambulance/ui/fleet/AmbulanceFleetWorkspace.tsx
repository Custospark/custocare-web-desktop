import React from 'react';
import { Activity, BarChart3, LayoutDashboard, Truck } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { AMBULANCE_ROUTES } from '../../../../app/routes/routeConstants';

interface AmbulanceFleetWorkspaceProps {
  theme: 'light' | 'dark';
}

const AmbulanceFleetWorkspace: React.FC<AmbulanceFleetWorkspaceProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Fleet & assets"
      icon={<Truck className="h-6 w-6" />}
      theme={theme}
      defaultActionTo={AMBULANCE_ROUTES.FLEET_DISPATCH}
      additionalWorkflowPathPrefixes={[AMBULANCE_ROUTES.FLEET_ASSETS]}
      actions={[
        {
          key: 'overview',
          label: 'Fleet overview',
          icon: <LayoutDashboard className="h-4 w-4" />,
          to: AMBULANCE_ROUTES.FLEET_OVERVIEW,
          description: 'KPIs and fleet health summary',
        },
        {
          key: 'dispatch',
          label: 'Dispatch center',
          icon: <Activity className="h-4 w-4" />,
          to: AMBULANCE_ROUTES.FLEET_DISPATCH,
          description: 'Live board, trip history, and facility dispatch (drawer)',
        },
        {
          key: 'assets',
          label: 'Vehicles & crew',
          icon: <Truck className="h-4 w-4" />,
          to: AMBULANCE_ROUTES.FLEET_ASSETS,
          description: 'Fleet registry, crew assignments, and service schedule',
        },
        {
          key: 'analytics',
          label: 'Fleet analytics',
          icon: <BarChart3 className="h-4 w-4" />,
          to: AMBULANCE_ROUTES.FLEET_ANALYTICS,
          description: 'Utilization and transport performance',
        },
      ]}
    />
  );
};

export default AmbulanceFleetWorkspace;
