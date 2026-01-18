import React from 'react';
import { BedDouble, UserPlus, Bed, DoorClosed, Ambulance, Settings } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { NURSING_ROUTES } from '../../../../app/routes/routeConstants';

interface WardProps {
  theme: 'light' | 'dark';
}

const Ward: React.FC<WardProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Ward Management"
      icon={<BedDouble className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={NURSING_ROUTES.WARDS_OVERVIEW}
      actions={[
        { 
          key: 'overview', 
          label: 'Wards Overview', 
          icon: <BedDouble className="w-4 h-4" />, 
          to: NURSING_ROUTES.WARDS_OVERVIEW 
        },
        { 
          key: 'assign', 
          label: 'Assign Patient', 
          icon: <UserPlus className="w-4 h-4" />, 
          to: NURSING_ROUTES.WARDS_ASSIGN 
        },
        { 
          key: 'transfer', 
          label: 'Transfer Patient', 
          icon: <Ambulance className="w-4 h-4" />, 
          to: NURSING_ROUTES.WARDS_TRANSFER 
        },
        { 
          key: 'capacity', 
          label: 'Ward Capacity', 
          icon: <Bed className="w-4 h-4" />, 
          to: NURSING_ROUTES.WARDS_CAPACITY 
        },
        { 
          key: 'admitted', 
          label: 'Admitted Patients', 
          icon: <Bed className="w-4 h-4" />, 
          to: `${NURSING_ROUTES.WARDS}/admitted` 
        },
        { 
          key: 'discharged', 
          label: 'Discharged Patients', 
          icon: <DoorClosed className="w-4 h-4" />, 
          to: `${NURSING_ROUTES.WARDS}/discharged` 
        },
        { 
          key: 'referred', 
          label: 'Referred Patients', 
          icon: <Ambulance className="w-4 h-4" />, 
          to: `${NURSING_ROUTES.WARDS}/referred` 
        },
        { 
          key: 'settings', 
          label: 'Ward Settings', 
          icon: <Settings className="w-4 h-4" />, 
          to: `${NURSING_ROUTES.WARDS}/settings` 
        },
      ]}
    />
  );
};

export default Ward;