import React from 'react';
import { Search, UserPlus, ListOrdered, Microscope } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { LABORATORY_ROUTES } from '../../../../app/routes/routeConstants';

interface LaboratoryFrontDeskProps {
  theme: 'light' | 'dark';
}

const LaboratoryFrontDesk: React.FC<LaboratoryFrontDeskProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Lab queue & intake"
      icon={<Microscope className="h-6 w-6" />}
      theme={theme}
      defaultActionTo={LABORATORY_ROUTES.PATIENT_QUEUE}
      actions={[
        {
          key: 'patient_queue',
          label: 'Laboratory queue',
          icon: <ListOrdered className="h-4 w-4" />,
          to: LABORATORY_ROUTES.PATIENT_QUEUE,
          description: 'Visits ready for laboratory diagnostics and test workflow',
        },
        {
          key: 'patient_search',
          label: 'Search patient',
          icon: <Search className="h-4 w-4" />,
          to: LABORATORY_ROUTES.PATIENTS_SEARCH,
        },
        {
          key: 'patient_create',
          label: 'Register patient',
          icon: <UserPlus className="h-4 w-4" />,
          to: LABORATORY_ROUTES.PATIENTS_REGISTER,
        },
        {
          key: 'walk_in_patient',
          label: 'Walk-in visit',
          icon: <Microscope className="h-4 w-4" />,
          to: LABORATORY_ROUTES.WALKIN_PATIENT,
        },
      ]}
    />
  );
};

export default LaboratoryFrontDesk;
