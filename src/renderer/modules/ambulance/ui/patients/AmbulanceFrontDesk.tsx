import React from 'react';
import { ListOrdered, Search, Truck, UserPlus } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { AMBULANCE_ROUTES } from '../../../../app/routes/routeConstants';

interface AmbulanceFrontDeskProps {
  theme: 'light' | 'dark';
}

const AmbulanceFrontDesk: React.FC<AmbulanceFrontDeskProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Transport intake & queue"
      icon={<Truck className="h-6 w-6" />}
      theme={theme}
      defaultActionTo={AMBULANCE_ROUTES.PATIENT_QUEUE}
      actions={[
        {
          key: 'patient_queue',
          label: 'Transport queue',
          icon: <ListOrdered className="h-4 w-4" />,
          to: AMBULANCE_ROUTES.PATIENT_QUEUE,
          description: 'Patients and visits ready for ambulance dispatch workflow',
        },
        {
          key: 'patient_search',
          label: 'Search patient',
          icon: <Search className="h-4 w-4" />,
          to: AMBULANCE_ROUTES.PATIENTS_SEARCH,
        },
        {
          key: 'patient_create',
          label: 'Register patient',
          icon: <UserPlus className="h-4 w-4" />,
          to: AMBULANCE_ROUTES.PATIENTS_REGISTER,
        },
        {
          key: 'walk_in_patient',
          label: 'Walk-in visit',
          icon: <Truck className="h-4 w-4" />,
          to: AMBULANCE_ROUTES.WALKIN_PATIENT,
        },
      ]}
    />
  );
};

export default AmbulanceFrontDesk;
