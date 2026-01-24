// FrontDesk.tsx
/**
 * ============================================================================
 * FRONT DESK / RECEPTION WORKSPACE (ROUTER-DRIVEN)
 * ============================================================================
 */

import React from 'react';
import { Search, UserPlus, ListOrdered, PersonStanding } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';
interface FrontDeskProps {
  theme: 'light' | 'dark';
}

const FrontDesk: React.FC<FrontDeskProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Front Desk"
      icon={<PersonStanding className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH}
      actions={[
        {
          key: 'patient_search',
          label: 'Patient Search',
          icon: <Search className="w-4 h-4" />,
          to: MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH,
        },
        {
          key: 'patient_create',
          label: 'Patient Create',
          icon: <UserPlus className="w-4 h-4" />,
          to: MEDICAL_RECORDS_ROUTES.PATIENTS_REGISTER,
        },
        {
          key: 'patient_queue',
          label: 'Patient Queue',
          icon: <ListOrdered className="w-4 h-4" />,
          to: MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE,
        },
        {
          key: 'walk_in_patient',
          label: 'Walk-In Patient',
          icon: <PersonStanding className="w-4 h-4" />,
          to: MEDICAL_RECORDS_ROUTES.WALKIN_PATIENT,
        },
      ]}
    />
  );
};

export default FrontDesk;
