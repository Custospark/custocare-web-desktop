/**
 * Pharmacy patient intake hub — mirrors Medical Records `FrontDesk` (registry layout).
 */
import React from 'react';
import { Search, UserPlus, ListOrdered, PersonStanding } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { PHARMACY_ROUTES } from '../../../../app/routes/routeConstants';

interface PharmacyFrontDeskProps {
  theme: 'light' | 'dark';
}

const PharmacyFrontDesk: React.FC<PharmacyFrontDeskProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Queue & patient intake"
      icon={<PersonStanding className="h-6 w-6" />}
      theme={theme}
      defaultActionTo={PHARMACY_ROUTES.PATIENTS_SEARCH}
      actions={[
        {
          key: 'patient_search',
          label: 'Search patient',
          icon: <Search className="h-4 w-4" />,
          to: PHARMACY_ROUTES.PATIENTS_SEARCH,
        },
        {
          key: 'patient_create',
          label: 'Register patient',
          icon: <UserPlus className="h-4 w-4" />,
          to: PHARMACY_ROUTES.PATIENTS_REGISTER,
        },
        {
          key: 'patient_queue',
          label: 'Facility queue',
          icon: <ListOrdered className="h-4 w-4" />,
          to: PHARMACY_ROUTES.PATIENT_QUEUE,
        },
        {
          key: 'walk_in_patient',
          label: 'Walk-in visit',
          icon: <PersonStanding className="h-4 w-4" />,
          to: PHARMACY_ROUTES.WALKIN_PATIENT,
        },
      ]}
    />
  );
};

export default PharmacyFrontDesk;
